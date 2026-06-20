import { NextRequest, NextResponse } from 'next/server';
import { getDemoCountryDetailForApi } from '@/lib/demo-properties';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { isFirebaseQuotaError } from '@/lib/firebase-errors';
import { normalizeFlagStorage } from '@/lib/country-flags';
import {
  deleteCountryInFirestore,
  listLocationsFromFirestore,
  updateCountryInFirestore,
} from '@/lib/firestore-platform';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isFirebaseAdminConfigured()) {
    const demo = getDemoCountryDetailForApi(id);
    if (!demo) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }
    return NextResponse.json(demo);
  }

  try {
    const countries = await listLocationsFromFirestore({
      includeProperties: true,
      includeInactive: true,
    });
    const country = countries.find((c) => c.id === id);
    if (country) {
      return NextResponse.json(country);
    }

    const demo = getDemoCountryDetailForApi(id);
    if (demo) {
      return NextResponse.json(demo);
    }

    return NextResponse.json({ error: 'Country not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching country:', error);

    const demo = getDemoCountryDetailForApi(id);
    if (demo) {
      return NextResponse.json(demo);
    }

    if (isFirebaseQuotaError(error)) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to fetch country' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const code =
      body?.code !== undefined ? String(body.code).trim().toUpperCase() : undefined;

    const updated = await updateCountryInFirestore(id, {
      name: body?.name !== undefined ? String(body.name).trim() : undefined,
      code,
      flag:
        body?.flag !== undefined
          ? normalizeFlagStorage(String(body.flag).trim() || null, code)
          : undefined,
      currency:
        body?.currency !== undefined
          ? String(body.currency).trim() || null
          : undefined,
      currencySymbol:
        body?.currencySymbol !== undefined
          ? String(body.currencySymbol).trim() || null
          : undefined,
      isActive: typeof body?.isActive === 'boolean' ? body.isActive : undefined,
      isFeatured: typeof body?.isFeatured === 'boolean' ? body.isFeatured : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating country:', error);
    const message = error instanceof Error ? error.message : 'Failed to update country';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteCountryInFirestore(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting country:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete country';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
