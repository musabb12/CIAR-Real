import { NextRequest, NextResponse } from 'next/server';
import {
  deleteCityFromRegion,
  updateCityInRegion,
} from '@/lib/firestore-platform';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regionId: string; cityId: string }> },
) {
  try {
    const { id: countryId, regionId, cityId } = await params;
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    }

    const city = await updateCityInRegion(countryId, regionId, cityId, { name });
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    return NextResponse.json(city);
  } catch (error) {
    console.error('Error updating city:', error);
    const message = error instanceof Error ? error.message : 'Failed to update city';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; regionId: string; cityId: string }> },
) {
  try {
    const { id: countryId, regionId, cityId } = await params;
    const ok = await deleteCityFromRegion(countryId, regionId, cityId);
    if (!ok) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting city:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete city';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
