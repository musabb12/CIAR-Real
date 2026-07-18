import { NextRequest, NextResponse } from 'next/server';
import { adTargetingHeuristic } from '@/lib/ai/heuristics';
import { getAdvertiserAdSettings } from '@/lib/advertiser-ads-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = getAdvertiserAdSettings();
    const result = adTargetingHeuristic({
      category: typeof body.category === 'string' ? body.category : 'clothing',
      budget: body.budget != null ? Number(body.budget) : undefined,
      durationDays: body.durationDays != null ? Number(body.durationDays) : 14,
      hasVideo: Boolean(body.hasVideo),
      hasDiscount: Boolean(body.hasDiscount),
      placements: settings.placements.map((p) => ({
        id: p.id,
        pricePerDay: p.pricePerDay,
        enabled: p.enabled,
        labelAr: p.labelAr,
        labelEn: p.labelEn,
      })),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI ad-targeting error:', error);
    return NextResponse.json({ error: 'Ad targeting failed' }, { status: 500 });
  }
}
