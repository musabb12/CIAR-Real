import { NextRequest, NextResponse } from 'next/server';
import { createCityInRegion } from '@/lib/firestore-platform';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regionId: string }> },
) {
  try {
    const { id: countryId, regionId } = await params;
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    }

    const city = await createCityInRegion(countryId, regionId, name);
    if (!city) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    }

    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    console.error('Error creating city:', error);
    const message = error instanceof Error ? error.message : 'Failed to create city';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
