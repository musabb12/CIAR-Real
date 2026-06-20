import { NextResponse } from 'next/server';
import {
  getFirebaseAdminConfigError,
  isFirebaseAdminConfigured,
} from '@/lib/firebase-admin';
import {
  createFeatureInFirestore,
  listFeaturesFromFirestore,
  updateFeatureInFirestore,
} from '@/lib/firestore-platform';
import { getDefaultFeaturesForApi } from '@/lib/demo-admin-data';
import { isFirestoreQuotaError } from '@/lib/firestore-read-cache';

export async function GET() {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(getDefaultFeaturesForApi());
  }

  try {
    const features = await listFeaturesFromFirestore();
    if (features.length === 0) {
      return NextResponse.json(getDefaultFeaturesForApi());
    }
    return NextResponse.json(features);
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      return NextResponse.json(getDefaultFeaturesForApi());
    }
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { id, isEnabled } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = await updateFeatureInFirestore(id, { isEnabled });
    if (!updated) return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { key, name, description, category, icon, isEnabled, order } = body;
    if (!key || !name) return NextResponse.json({ error: 'Key and name required' }, { status: 400 });

    const feature = await createFeatureInFirestore({
      key,
      name,
      description,
      category: category || 'general',
      icon,
      isEnabled: isEnabled ?? true,
      order: order ?? 0,
    });
    return NextResponse.json(feature, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create feature';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
