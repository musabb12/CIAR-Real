import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateAdvertiserAds } from '@/lib/advertiser-ads-store';
import { requireAdminUser } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
  const action = body.action as
    | 'approve'
    | 'reject'
    | 'pause'
    | 'resume'
    | 'expire'
    | 'delete'
    | 'feature'
    | 'unfeature';

  if (!ids.length || !action) {
    return NextResponse.json({ error: 'ids and action are required' }, { status: 400 });
  }

  const result = bulkUpdateAdvertiserAds(ids, action, body.reason ? String(body.reason) : undefined);
  return NextResponse.json(result);
}
