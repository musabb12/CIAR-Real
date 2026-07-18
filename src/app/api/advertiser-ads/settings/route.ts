import { NextRequest, NextResponse } from 'next/server';
import {
  getAdvertiserAdSettings,
  updateAdFieldDefinition,
  updateAdPlacementDefinition,
  updateAdvertiserAdSettings,
} from '@/lib/advertiser-ads-store';
import { requireAdminUser } from '@/lib/require-admin';
import type {
  AdFieldDefinition,
  AdPlacementId,
  AdvertiserAdPlatformSettings,
} from '@/types/advertiser-ads';

export async function GET() {
  return NextResponse.json(getAdvertiserAdSettings());
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (body.fieldId && body.fieldPatch) {
    const updated = updateAdFieldDefinition(
      String(body.fieldId),
      body.fieldPatch as Partial<AdFieldDefinition>,
    );
    if (!updated) return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    return NextResponse.json(getAdvertiserAdSettings());
  }

  if (body.placementId && body.placementPatch) {
    const updated = updateAdPlacementDefinition(
      body.placementId as AdPlacementId,
      body.placementPatch,
    );
    if (!updated) return NextResponse.json({ error: 'Placement not found' }, { status: 404 });
    return NextResponse.json(getAdvertiserAdSettings());
  }

  if (body.platform) {
    return NextResponse.json(
      updateAdvertiserAdSettings({
        platform: body.platform as Partial<AdvertiserAdPlatformSettings>,
      }),
    );
  }

  const settings = updateAdvertiserAdSettings(body);
  return NextResponse.json(settings);
}
