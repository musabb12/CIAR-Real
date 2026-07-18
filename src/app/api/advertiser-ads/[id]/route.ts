import { NextRequest, NextResponse } from 'next/server';
import {
  deleteAdvertiserAd,
  expireAdvertiserAd,
  extendAdvertiserAd,
  getAdvertiserAdById,
  pauseAdvertiserAd,
  resumeAdvertiserAd,
  updateAdvertiserAd,
} from '@/lib/advertiser-ads-store';
import { requireAdminUser } from '@/lib/require-admin';
import type { AdPlacementId } from '@/types/advertiser-ads';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const ad = getAdvertiserAdById(id);
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ad);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const admin = await requireAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json();

  // Named admin actions
  if (body.action === 'pause') {
    const ad = pauseAdvertiserAd(id);
    if (!ad) return NextResponse.json({ error: 'Cannot pause' }, { status: 400 });
    return NextResponse.json(ad);
  }
  if (body.action === 'resume') {
    const ad = resumeAdvertiserAd(id);
    if (!ad) return NextResponse.json({ error: 'Cannot resume' }, { status: 400 });
    return NextResponse.json(ad);
  }
  if (body.action === 'expire') {
    const ad = expireAdvertiserAd(id);
    if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(ad);
  }
  if (body.action === 'extend') {
    const ad = extendAdvertiserAd(id, Number(body.extraDays || 7));
    if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(ad);
  }

  const ad = updateAdvertiserAd(id, {
    title: body.title,
    description: body.description,
    images: body.images,
    videoUrl: body.videoUrl,
    placementId: body.placementId as AdPlacementId | undefined,
    durationDays: body.durationDays != null ? Number(body.durationDays) : undefined,
    fields: body.fields,
    status: body.status,
    rejectionReason: body.rejectionReason,
    adminNotes: body.adminNotes,
    isFeatured: body.isFeatured,
    priority: body.priority != null ? Number(body.priority) : undefined,
    isPaid: body.isPaid,
    amountPaid: body.amountPaid != null ? Number(body.amountPaid) : undefined,
    startsAt: body.startsAt,
    expiresAt: body.expiresAt,
  });

  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ad);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const admin = await requireAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const ok = deleteAdvertiserAd(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
