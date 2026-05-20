import { NextResponse } from 'next/server';
import {
  getFirebaseAdminConfigError,
  getFirebaseProjectId,
  isFirebaseAdminConfigured,
} from '@/lib/firebase-admin';
import { col, FIRESTORE_COLLECTIONS } from '@/lib/firestore-shared';

/** GET /api/health — deployment diagnostics (no secrets). */
export async function GET() {
  const firebaseError = getFirebaseAdminConfigError();
  const authSecretSet = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  );
  const firebaseOk = isFirebaseAdminConfigured();

  let firestoreStats: {
    projectId: string;
    databaseId: string;
    usersCollection: string;
    usersDocumentCount: number;
    propertiesCollection: string;
    propertiesDocumentCount: number;
  } | null = null;

  if (firebaseOk) {
    try {
      const [usersSnap, propertiesSnap] = await Promise.all([
        col(FIRESTORE_COLLECTIONS.users).count().get(),
        col(FIRESTORE_COLLECTIONS.properties).count().get(),
      ]);
      firestoreStats = {
        projectId: getFirebaseProjectId(),
        databaseId: '(default)',
        usersCollection: FIRESTORE_COLLECTIONS.users,
        usersDocumentCount: usersSnap.data().count,
        propertiesCollection: FIRESTORE_COLLECTIONS.properties,
        propertiesDocumentCount: propertiesSnap.data().count,
      };
    } catch (error) {
      console.error('Health check Firestore count failed:', error);
    }
  }

  return NextResponse.json({
    ok: firebaseOk && authSecretSet,
    firebase: firebaseOk ? 'configured' : 'missing',
    firebaseError: firebaseError ?? null,
    authSecret: authSecretSet ? 'configured' : 'missing',
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    /** Users are stored here — not in Firebase Authentication tab. */
    whereToLookInConsole:
      'Firebase Console → Firestore Database → (default) → collections "users" and "properties"',
    firestore: firestoreStats,
  });
}
