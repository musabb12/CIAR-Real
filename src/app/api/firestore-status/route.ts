import { NextResponse } from 'next/server';
import {
  getFirebaseAdminConfigError,
  isFirebaseAdminConfigured,
} from '@/lib/firebase-admin';
import { isFirebaseQuotaError } from '@/lib/firebase-errors';
import { col, FIRESTORE_COLLECTIONS } from '@/lib/firestore-shared';

/** GET /api/firestore-status — minimal Firestore probe (1 doc read). */
export async function GET() {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      quotaExceeded: false,
      error: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured',
    });
  }

  try {
    const snap = await col(FIRESTORE_COLLECTIONS.countries).limit(1).get();
    const total = await col(FIRESTORE_COLLECTIONS.countries).count().get();

    return NextResponse.json({
      ok: true,
      configured: true,
      quotaExceeded: false,
      dataSource: 'firestore',
      countriesSample: snap.size,
      countriesCount: total.data().count,
    });
  } catch (error) {
    const quota = isFirebaseQuotaError(error);
    const message = error instanceof Error ? error.message : 'Firestore unreachable';
    return NextResponse.json({
      ok: false,
      configured: true,
      quotaExceeded: quota,
      dataSource: quota ? 'demo' : 'error',
      error: message,
    });
  }
}
