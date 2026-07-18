import { NextRequest, NextResponse } from 'next/server';
import { chatFallbackReply } from '@/lib/ai/heuristics';
import {
  gateAiCapability,
  logAiCall,
  runLlmIfAllowed,
  truncateInput,
} from '@/lib/ai/runtime';

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const body = await request.json();
    const message = String(body.message ?? '').trim();
    const locale = body.locale === 'ar' ? 'ar' : 'en';
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const gate = await gateAiCapability(request, 'ai_chatbot', message);
    if (!gate.ok) return gate.response;
    const { ctx } = gate;
    const capped = truncateInput(message, ctx.settings);

    const messages = [
      {
        role: 'system' as const,
        content:
          locale === 'ar'
            ? ctx.settings.safety.systemPromptAr
            : ctx.settings.safety.systemPromptEn,
      },
      ...history
        .filter(
          (m: { role?: string; content?: string }) =>
            (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
        )
        .slice(-ctx.settings.provider.maxHistoryMessages)
        .map((m: { role: 'user' | 'assistant'; content: string }) => ({
          role: m.role,
          content: m.content.slice(0, ctx.settings.provider.maxInputChars),
        })),
      { role: 'user' as const, content: capped },
    ];

    const { reply: llmReply, usedLlm } = await runLlmIfAllowed(ctx, messages);
    const latencyMs = Date.now() - started;

    if (llmReply) {
      await logAiCall({
        request,
        capability: 'ai_chatbot',
        engine: 'llm',
        success: true,
        latencyMs,
        text: capped,
      });
      return NextResponse.json({
        reply: llmReply,
        engine: 'llm',
        llmConfigured: true,
      });
    }

    if (ctx.engineMode === 'llm' && !ctx.settings.safety.fallbackToHeuristic) {
      await logAiCall({
        request,
        capability: 'ai_chatbot',
        engine: 'error',
        success: false,
        latencyMs,
        text: capped,
        errorCode: 'llm_unavailable',
      });
      return NextResponse.json({ error: 'LLM unavailable', code: 'llm_unavailable' }, { status: 503 });
    }

    const reply = chatFallbackReply(capped, locale === 'ar');
    await logAiCall({
      request,
      capability: 'ai_chatbot',
      engine: 'heuristic',
      success: true,
      latencyMs,
      text: capped,
    });

    return NextResponse.json({
      reply,
      engine: 'heuristic',
      llmConfigured: usedLlm || false,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    await logAiCall({
      request,
      capability: 'ai_chatbot',
      engine: 'error',
      success: false,
      latencyMs: Date.now() - started,
      errorCode: 'chat_failed',
    });
    return NextResponse.json({ error: 'AI chat failed' }, { status: 500 });
  }
}
