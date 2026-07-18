import { NextRequest, NextResponse } from 'next/server';
import { seoKeywordsHeuristic, type SeoKeywordResult } from '@/lib/ai/heuristics';
import {
  gateAiCapability,
  logAiCall,
  runLlmIfAllowed,
} from '@/lib/ai/runtime';

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const gate = await gateAiCapability(request, 'ai_seo', title);
    if (!gate.ok) return gate.response;
    const { ctx } = gate;

    const input = {
      title: title.slice(0, ctx.settings.provider.maxInputChars),
      description: body.description ? String(body.description) : undefined,
      city: body.city ? String(body.city) : undefined,
      country: body.country ? String(body.country) : undefined,
      category: body.category ? String(body.category) : undefined,
      locale: body.locale === 'ar' ? 'ar' : 'en',
    };

    const heuristic = seoKeywordsHeuristic(input);
    const { reply: llm } = await runLlmIfAllowed(ctx, [
      {
        role: 'system',
        content:
          'You are an SEO expert for a real-estate & marketplace site (CIAR). Reply ONLY JSON: {"keywords":string[],"titleSuggestions":string[3],"metaDescription":string max 155 chars}',
      },
      { role: 'user', content: JSON.stringify(input) },
    ]);

    const latencyMs = Date.now() - started;

    if (llm) {
      try {
        const jsonMatch = llm.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Partial<SeoKeywordResult>;
          if (Array.isArray(parsed.keywords) && parsed.keywords.length) {
            await logAiCall({
              request,
              capability: 'ai_seo',
              engine: 'llm',
              success: true,
              latencyMs,
              text: title,
            });
            return NextResponse.json({
              keywords: parsed.keywords.slice(0, 15).map(String),
              titleSuggestions: (parsed.titleSuggestions ?? heuristic.titleSuggestions)
                .slice(0, 5)
                .map(String),
              metaDescription: String(parsed.metaDescription ?? heuristic.metaDescription).slice(0, 160),
              engine: 'llm',
            } satisfies SeoKeywordResult);
          }
        }
      } catch {
        // fall through
      }
    }

    await logAiCall({
      request,
      capability: 'ai_seo',
      engine: 'heuristic',
      success: true,
      latencyMs,
      text: title,
    });
    return NextResponse.json(heuristic);
  } catch (error) {
    console.error('AI SEO error:', error);
    return NextResponse.json({ error: 'SEO analysis failed' }, { status: 500 });
  }
}
