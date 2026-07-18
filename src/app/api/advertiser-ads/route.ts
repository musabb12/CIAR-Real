import { NextRequest, NextResponse } from 'next/server';
import {
  createAdvertiserAd,
  listAdvertiserAds,
} from '@/lib/advertiser-ads-store';
import type { AdPlacementId } from '@/types/advertiser-ads';

// GET /api/advertiser-ads
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placementId = searchParams.get('placementId') as AdPlacementId | null;
  const advertiserId = searchParams.get('advertiserId');
  const status = searchParams.get('status');
  const publicOnly = searchParams.get('public') === '1';

  const ads = listAdvertiserAds({
    placementId: placementId ?? undefined,
    advertiserId: advertiserId ?? undefined,
    status: status ? (status as never) : undefined,
    publicOnly,
  });

  return NextResponse.json(ads);
}

// POST /api/advertiser-ads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      advertiserId,
      advertiserName,
      advertiserEmail,
      categoryKey,
      title,
      description,
      images,
      videoUrl,
      placementId,
      durationDays,
      fields,
      submitForReview,
      markPaid,
    } = body;

    if (!advertiserId || !title?.trim() || !placementId || !durationDays) {
      return NextResponse.json(
        { error: 'advertiserId, title, placementId, and durationDays are required' },
        { status: 400 },
      );
    }

    const ad = createAdvertiserAd({
      advertiserId: String(advertiserId),
      advertiserName: advertiserName ?? null,
      advertiserEmail: advertiserEmail ?? null,
      categoryKey: categoryKey ?? undefined,
      title: String(title),
      description: description ?? null,
      images: Array.isArray(images) ? images : [],
      videoUrl: typeof videoUrl === 'string' ? videoUrl : null,
      placementId: placementId as AdPlacementId,
      durationDays: Number(durationDays),
      fields: fields && typeof fields === 'object' ? fields : {},
      submitForReview: Boolean(submitForReview),
      markPaid: Boolean(markPaid),
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error('Create advertiser ad:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ad' },
      { status: 500 },
    );
  }
}
