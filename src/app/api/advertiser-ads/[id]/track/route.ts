import { NextRequest, NextResponse } from 'next/server';
import { incrementAdClicks, incrementAdViews } from '@/lib/advertiser-ads-store';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  let event: string | undefined;
  try {
    const body = await request.json();
    event = typeof body?.event === 'string' ? body.event : undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (event === 'view') {
    incrementAdViews(id);
    return NextResponse.json({ ok: true });
  }
  if (event === 'click') {
    incrementAdClicks(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'event must be view or click' }, { status: 400 });
}
