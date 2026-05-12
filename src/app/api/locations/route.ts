import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseAdminConfigError,
  isFirebaseAdminConfigured,
} from '@/lib/firebase-admin';
import {
  createCountryInFirestore,
  listLocationsFromFirestore,
} from '@/lib/firestore-platform';

// GET /api/locations - Return nested countries → regions → cities
export async function GET(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeProperties = searchParams.get('includeProperties') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const countries = await listLocationsFromFirestore({
      includeProperties,
      includeInactive,
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

// POST /api/locations - create country (admin)
export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const code = String(body?.code ?? '').trim().toUpperCase();
    const flag = String(body?.flag ?? '').trim() || null;
    const currency = String(body?.currency ?? '').trim() || null;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const created = await createCountryInFirestore({
      name,
      code,
      flag,
      currency,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json({ error: 'Failed to create country' }, { status: 500 });
  }
}
