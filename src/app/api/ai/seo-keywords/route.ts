import { NextRequest, NextResponse } from 'next/server';
import { completeChat } from '@/lib/ai/client';
import { seoKeywordsHeuristic, type SeoKeywordResult } from '@/lib/ai/heuristics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const input = {
      title,
      description: body.description ? String(body.description) : undefined,
      city: body.city ? String(body.city) : undefined,
      country: body.country ? String(body.country) : undefined,
      category: body.category ? String(body.category) : undefined,
      locale: body.locale === 'ar' ? 'ar' : 'en',
    };

    const heuristic = seoKeywordsHeuristic(input);

    const llm = await completeChat([
      {
        role: 'system',
        content:
          'You are an SEO expert for a real-estate & marketplace site (CIAR). Reply ONLY JSON: {"keywords":string[],"titleSuggestions":string[3],"metaDescription":string max 155 chars}',
      },
      {
        role: 'user',
        content: JSON.stringify(input),
      },
    ]);

    if (llm) {
      try {
        const jsonMatch = llm.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Partial<SeoKeywordResult>;
          if (Array.isArray(parsed.keywords) && parsed.keywords.length) {
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

    return NextResponse.json(heuristic);
  } catch (error) {
    console.error('AI SEO error:', error);
    return NextResponse.json({ error: 'SEO analysis failed' }, { status: 500 });
  }
}
