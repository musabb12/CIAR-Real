import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getSessionUser } from '@/lib/auth-session';
import {
  appendAiUsageLog,
  countUsageSince,
  readAiAdminSettings,
} from '@/lib/ai/store';
import {
  containsBlockedWord,
  getCapabilityConfig,
} from '@/lib/ai/settings';
import { completeChat, isAiLlmConfiguredAsync } from '@/lib/ai/client';
import type { AiAdminSettings, AiCapabilityKey, AiEngineMode } from '@/types/ai-admin';
import type { ChatMessage } from 'z-ai-web-dev-sdk';

function startOfDayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateCostUsd(tokens: number): number {
  // Rough gpt-4o-mini-ish estimate
  return Number(((tokens / 1000) * 0.0003).toFixed(6));
}

export type AiRuntimeContext = {
  settings: AiAdminSettings;
  capability: AiCapabilityKey;
  engineMode: AiEngineMode;
  request: NextRequest;
};

export type AiRuntimeGateResult =
  | { ok: true; ctx: AiRuntimeContext }
  | { ok: false; response: NextResponse };

/** Gate an AI capability: feature flag, budget, rate limit, blocked words. */
export async function gateAiCapability(
  request: NextRequest,
  capability: AiCapabilityKey,
  userText?: string,
): Promise<AiRuntimeGateResult> {
  const settings = await readAiAdminSettings();
  const cap = getCapabilityConfig(settings, capability);

  if (!cap.enabled) {
    await logAiCall({
      request,
      capability,
      engine: 'blocked',
      success: false,
      latencyMs: 0,
      text: userText,
      errorCode: 'capability_disabled',
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'This AI capability is disabled by the administrator', code: 'capability_disabled' },
        { status: 403 },
      ),
    };
  }

  if (userText && containsBlockedWord(userText, settings.safety.blockedWords)) {
    await logAiCall({
      request,
      capability,
      engine: 'blocked',
      success: false,
      latencyMs: 0,
      text: userText,
      errorCode: 'blocked_content',
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Content blocked by AI safety policy', code: 'blocked_content' },
        { status: 400 },
      ),
    };
  }

  const ip = getClientIp(request);
  const perMin = checkRateLimit(
    `ai:${capability}:${ip}`,
    cap.rateLimitPerMinute,
    60_000,
  );
  if (!perMin.allowed) {
    await logAiCall({
      request,
      capability,
      engine: 'blocked',
      success: false,
      latencyMs: 0,
      text: userText,
      errorCode: 'rate_limited',
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Too many AI requests. Please try again later.', code: 'rate_limited' },
        {
          status: 429,
          headers: { 'Retry-After': String(perMin.retryAfterSec) },
        },
      ),
    };
  }

  const [daily, monthly] = await Promise.all([
    countUsageSince(startOfDayIso()),
    countUsageSince(startOfMonthIso()),
  ]);

  if (daily >= settings.budget.dailyRequestLimit) {
    await logAiCall({
      request,
      capability,
      engine: 'blocked',
      success: false,
      latencyMs: 0,
      text: userText,
      errorCode: 'daily_budget',
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Daily AI request budget exceeded', code: 'daily_budget' },
        { status: 429 },
      ),
    };
  }

  if (monthly >= settings.budget.monthlyRequestLimit) {
    await logAiCall({
      request,
      capability,
      engine: 'blocked',
      success: false,
      latencyMs: 0,
      text: userText,
      errorCode: 'monthly_budget',
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Monthly AI request budget exceeded', code: 'monthly_budget' },
        { status: 429 },
      ),
    };
  }

  return {
    ok: true,
    ctx: {
      settings,
      capability,
      engineMode: cap.engine,
      request,
    },
  };
}

export async function logAiCall(input: {
  request: NextRequest;
  capability: AiCapabilityKey | 'provider_test' | 'playground';
  engine: 'llm' | 'heuristic' | 'blocked' | 'error';
  success: boolean;
  latencyMs: number;
  text?: string;
  errorCode?: string | null;
}): Promise<void> {
  const settings = await readAiAdminSettings();
  const user = await getSessionUser(input.request).catch(() => null);
  const preview =
    settings.safety.logRawUserContent && input.text
      ? input.text.slice(0, 120)
      : input.text
        ? `[${input.text.length} chars]`
        : null;
  const tokens = estimateTokens(input.text ?? '');
  await appendAiUsageLog({
    capability: input.capability,
    engine: input.engine,
    success: input.success,
    latencyMs: input.latencyMs,
    estimatedTokens: tokens,
    estimatedCostUsd: input.engine === 'llm' ? estimateCostUsd(tokens) : 0,
    errorCode: input.errorCode ?? null,
    preview,
    actorId: user?.id ?? null,
    actorRole: user?.role ?? null,
  });
}

/**
 * Decide whether to call the LLM based on capability engine mode.
 * Returns LLM text or null (caller should use heuristic).
 */
export async function runLlmIfAllowed(
  ctx: AiRuntimeContext,
  messages: ChatMessage[],
  options?: { temperature?: number },
): Promise<{ reply: string | null; usedLlm: boolean }> {
  if (ctx.engineMode === 'heuristic') {
    return { reply: null, usedLlm: false };
  }

  const configured = await isAiLlmConfiguredAsync();
  if (!configured && ctx.engineMode === 'llm') {
    // Force LLM but none configured
    if (!ctx.settings.safety.fallbackToHeuristic) {
      return { reply: null, usedLlm: false };
    }
  }

  if (!configured && ctx.engineMode === 'hybrid') {
    return { reply: null, usedLlm: false };
  }

  const reply = await completeChat(messages, {
    temperature: options?.temperature,
    settings: ctx.settings,
  });

  if (!reply && ctx.engineMode === 'llm' && !ctx.settings.safety.fallbackToHeuristic) {
    return { reply: null, usedLlm: true };
  }

  return { reply, usedLlm: Boolean(reply) };
}

export function truncateInput(text: string, settings: AiAdminSettings): string {
  return text.slice(0, settings.provider.maxInputChars);
}
