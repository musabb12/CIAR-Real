import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseQuotaError } from '@/lib/firebase-errors';
import { createRegionInCountry } from '@/lib/firestore-platform';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: countryId } = await params;
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Region name is required' }, { status: 400 });
    }

    const region = await createRegionInCountry(countryId, name);
    if (!region) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    return NextResponse.json(region, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    if (isFirebaseQuotaError(error)) {
      return NextResponse.json({ error: 'firebase_quota_exceeded' }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create region';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
