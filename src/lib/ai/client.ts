import type { ChatMessage } from 'z-ai-web-dev-sdk';
import { decryptSecret } from '@/lib/ai/secrets';
import { isEnvApiKeyConfigured } from '@/lib/ai/settings';
import { readAiAdminSettings } from '@/lib/ai/store';
import type { AiAdminSettings, AiProviderId } from '@/types/ai-admin';

export function isAiLlmConfigured(): boolean {
  return isEnvApiKeyConfigured();
}

export async function isAiLlmConfiguredAsync(): Promise<boolean> {
  if (isEnvApiKeyConfigured()) return true;
  const settings = await readAiAdminSettings();
  return Boolean(decryptSecret(settings.provider.apiKeyEncrypted));
}

type ResolvedProvider = {
  provider: Exclude<AiProviderId, 'auto'>;
  apiKey: string | null;
  model: string;
  baseUrl: string;
  temperature: number;
  timeoutMs: number;
};

function resolveProvider(settings: AiAdminSettings): ResolvedProvider {
  const storedKey = decryptSecret(settings.provider.apiKeyEncrypted);
  const envZai = process.env.ZAI_API_KEY?.trim() || '';
  const envOpenAi =
    process.env.OPENAI_API_KEY?.trim() || process.env.AI_API_KEY?.trim() || '';

  let provider: Exclude<AiProviderId, 'auto'> =
    settings.provider.activeProvider === 'auto'
      ? envZai || (storedKey && !envOpenAi)
        ? 'zai'
        : 'openai'
      : settings.provider.activeProvider;

  let apiKey: string | null = storedKey;
  if (provider === 'zai') {
    apiKey = storedKey || envZai || null;
  } else {
    apiKey = storedKey || envOpenAi || null;
  }

  return {
    provider,
    apiKey,
    model: settings.provider.model,
    baseUrl: settings.provider.baseUrl,
    temperature: settings.provider.temperature,
    timeoutMs: settings.provider.timeoutMs,
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('AI request timed out')), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Call the configured LLM using admin settings (with env fallback).
 * Returns null if unavailable.
 */
export async function completeChat(
  messages: ChatMessage[],
  options?: { temperature?: number; settings?: AiAdminSettings },
): Promise<string | null> {
  const settings = options?.settings ?? (await readAiAdminSettings());
  const resolved = resolveProvider(settings);
  const temperature = options?.temperature ?? resolved.temperature;

  if (resolved.provider === 'zai' || (!resolved.apiKey && !process.env.OPENAI_API_KEY)) {
    try {
      if (resolved.apiKey || process.env.ZAI_API_KEY?.trim()) {
        // ZAI SDK reads ZAI_API_KEY from env; temporarily set if we have a stored key
        const prev = process.env.ZAI_API_KEY;
        if (resolved.apiKey && !prev) {
          process.env.ZAI_API_KEY = resolved.apiKey;
        }
        try {
          const ZAI = (await import('z-ai-web-dev-sdk')).default;
          const zai = await ZAI.create();
          const completion = await withTimeout(
            zai.chat.completions.create({
              messages,
              temperature,
              thinking: { type: 'disabled' },
            }),
            resolved.timeoutMs,
          );
          const content =
            completion?.choices?.[0]?.message?.content ??
            completion?.choices?.[0]?.text ??
            completion?.content;
          if (typeof content === 'string' && content.trim()) return content.trim();
        } finally {
          if (resolved.apiKey && prev === undefined) {
            delete process.env.ZAI_API_KEY;
          } else if (prev !== undefined) {
            process.env.ZAI_API_KEY = prev;
          }
        }
      }
    } catch (err) {
      console.warn('[ai] ZAI chat failed, trying OpenAI fallback:', err);
    }
  }

  const openAiKey =
    resolved.provider === 'zai'
      ? process.env.OPENAI_API_KEY?.trim() || process.env.AI_API_KEY?.trim() || null
      : resolved.apiKey;

  if (!openAiKey) return null;

  try {
    const base = resolved.baseUrl.replace(/\/$/, '') || 'https://api.openai.com/v1';
    const model = resolved.model || 'gpt-4o-mini';
    const res = await withTimeout(
      fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
        }),
      }),
      resolved.timeoutMs,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() ? content.trim() : null;
  } catch (err) {
    console.warn('[ai] OpenAI fallback failed:', err);
    return null;
  }
}

/** Lightweight provider connectivity test used by admin UI. */
export async function testAiProviderConnection(
  settings?: AiAdminSettings,
): Promise<{ ok: boolean; engine: 'llm' | 'none'; message: string; latencyMs: number }> {
  const started = Date.now();
  const cfg = settings ?? (await readAiAdminSettings());
  const reply = await completeChat(
    [
      { role: 'system', content: 'Reply with exactly: OK' },
      { role: 'user', content: 'ping' },
    ],
    { temperature: 0, settings: cfg },
  );
  const latencyMs = Date.now() - started;
  if (reply) {
    return { ok: true, engine: 'llm', message: reply.slice(0, 120), latencyMs };
  }
  return {
    ok: false,
    engine: 'none',
    message: 'No LLM response. Check API key / provider settings.',
    latencyMs,
  };
}
