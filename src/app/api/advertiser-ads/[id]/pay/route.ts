import { NextRequest, NextResponse } from 'next/server';
import { markAdvertiserAdPaid } from '@/lib/advertiser-ads-store';

type Ctx = { params: Promise<{ id: string }> };

/** Mark ad as paid — moves pending_payment → pending_review */
export async function POST(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const ad = markAdvertiserAdPaid(id);
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ad);
}
