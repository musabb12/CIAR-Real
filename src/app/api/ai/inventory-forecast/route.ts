import { NextRequest, NextResponse } from 'next/server';
import { completeChat } from '@/lib/ai/client';
import { inventoryForecastHeuristic, type InventoryForecast } from '@/lib/ai/heuristics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const stockRemaining = Number(body.stockRemaining ?? 0);
    const heuristic = inventoryForecastHeuristic({
      stockRemaining,
      views: body.views != null ? Number(body.views) : undefined,
      discountPercent: body.discountPercent != null ? Number(body.discountPercent) : undefined,
      placementId: body.placementId ? String(body.placementId) : undefined,
      durationDays: body.durationDays != null ? Number(body.durationDays) : undefined,
    });

    const llm = await completeChat([
      {
        role: 'system',
        content:
          'You are an inventory analyst for marketplace ads. Reply ONLY JSON: {"stockRemaining":number,"daysOfCover":number,"demandLevel":"low|medium|high","reorderSuggested":boolean,"suggestionAr":"...","suggestionEn":"..."}',
      },
      { role: 'user', content: JSON.stringify(body) },
    ]);

    if (llm) {
      try {
        const jsonMatch = llm.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Partial<InventoryForecast>;
          if (parsed.demandLevel && typeof parsed.reorderSuggested === 'boolean') {
            return NextResponse.json({
              stockRemaining: Number(parsed.stockRemaining ?? heuristic.stockRemaining),
              daysOfCover: Number(parsed.daysOfCover ?? heuristic.daysOfCover),
              demandLevel: parsed.demandLevel,
              reorderSuggested: parsed.reorderSuggested,
              suggestionAr: String(parsed.suggestionAr ?? heuristic.suggestionAr),
              suggestionEn: String(parsed.suggestionEn ?? heuristic.suggestionEn),
              engine: 'llm',
            } satisfies InventoryForecast);
          }
        }
      } catch {
        // fall through
      }
    }

    return NextResponse.json(heuristic);
  } catch (error) {
    console.error('AI inventory forecast error:', error);
    return NextResponse.json({ error: 'Forecast failed' }, { status: 500 });
  }
}
