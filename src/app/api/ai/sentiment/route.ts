import { NextRequest, NextResponse } from 'next/server';
import { completeChat } from '@/lib/ai/client';
import { analyzeSentimentHeuristic, type SentimentResult } from '@/lib/ai/heuristics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = String(body.text ?? '').trim();
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const heuristic = analyzeSentimentHeuristic(text);

    const llm = await completeChat([
      {
        role: 'system',
        content:
          'Analyze customer review sentiment. Reply ONLY valid JSON: {"label":"positive|neutral|negative","score":number between -1 and 1,"summaryAr":"...","summaryEn":"..."}',
      },
      { role: 'user', content: text.slice(0, 3000) },
    ]);

    if (llm) {
      try {
        const jsonMatch = llm.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Partial<SentimentResult>;
          if (parsed.label && typeof parsed.score === 'number') {
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

    return NextResponse.json(heuristic);
  } catch (error) {
    console.error('AI sentiment error:', error);
    return NextResponse.json({ error: 'Sentiment analysis failed' }, { status: 500 });
  }
}
