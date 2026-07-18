import { NextRequest, NextResponse } from 'next/server';
import { rejectAdvertiserAd } from '@/lib/advertiser-ads-store';
import { requireAdminUser } from '@/lib/require-admin';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const admin = await requireAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === 'string' ? body.reason : '';

  const ad = rejectAdvertiserAd(id, reason);
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ad);
}
