import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentimentHeuristic, type SentimentResult } from '@/lib/ai/heuristics';
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
    const text = String(body.text ?? '').trim();
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const gate = await gateAiCapability(request, 'ai_sentiment', text);
    if (!gate.ok) return gate.response;
    const { ctx } = gate;
    const capped = truncateInput(text, ctx.settings);
    const heuristic = analyzeSentimentHeuristic(capped);

    const { reply: llm } = await runLlmIfAllowed(ctx, [
      {
        role: 'system',
        content:
          'Analyze customer review sentiment. Reply ONLY valid JSON: {"label":"positive|neutral|negative","score":number between -1 and 1,"summaryAr":"...","summaryEn":"..."}',
      },
      { role: 'user', content: capped },
    ]);

    const latencyMs = Date.now() - started;

    if (llm) {
      try {
        const jsonMatch = llm.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Partial<SentimentResult>;
          if (parsed.label && typeof parsed.score === 'number') {
            await logAiCall({
              request,
              capability: 'ai_sentiment',
              engine: 'llm',
              success: true,
              latencyMs,
              text: capped,
            });
            return NextResponse.json({
              label: parsed.label,
              score: parsed.score,
              summaryAr: parsed.summaryAr ?? heuristic.summaryAr,
              summaryEn: parsed.summaryEn ?? heuristic.summaryEn,
              engine: 'llm',
            } satisfies SentimentResult);
          }
        }
      } catch {
        // fall through
      }
    }

    await logAiCall({
      request,
      capability: 'ai_sentiment',
      engine: 'heuristic',
      success: true,
      latencyMs,
      text: capped,
    });
    return NextResponse.json(heuristic);
  } catch (error) {
    console.error('AI sentiment error:', error);
    return NextResponse.json({ error: 'Sentiment analysis failed' }, { status: 500 });
  }
}
