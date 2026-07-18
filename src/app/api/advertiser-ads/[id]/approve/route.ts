import { NextRequest, NextResponse } from 'next/server';
import { approveAdvertiserAd } from '@/lib/advertiser-ads-store';
import { requireAdminUser } from '@/lib/require-admin';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const admin = await requireAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const ad = approveAdvertiserAd(id);
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ad);
}
