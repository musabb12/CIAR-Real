import { NextResponse } from 'next/server';
import { getAdvertiserAdsStats } from '@/lib/advertiser-ads-store';

export async function GET() {
  return NextResponse.json(getAdvertiserAdsStats());
}
