import { NextRequest, NextResponse } from 'next/server';
import {
  deleteRegionFromCountry,
  updateRegionInCountry,
} from '@/lib/firestore-platform';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regionId: string }> },
) {
  try {
    const { id: countryId, regionId } = await params;
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Region name is required' }, { status: 400 });
    }

    const region = await updateRegionInCountry(countryId, regionId, { name });
    if (!region) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    }

    return NextResponse.json(region);
  } catch (error) {
    console.error('Error updating region:', error);
    const message = error instanceof Error ? error.message : 'Failed to update region';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; regionId: string }> },
) {
  try {
    const { id: countryId, regionId } = await params;
    const ok = await deleteRegionFromCountry(countryId, regionId);
    if (!ok) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting region:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete region';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
