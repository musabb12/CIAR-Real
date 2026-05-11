import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';

let app: App | null = null;

/** True when Netlify/production can read listings from Firestore (service account JSON in env). */
export function isFirebaseAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
}

export function getFirebaseAdminApp(): App {
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
  }
  const cred = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string };
  if (!cred.project_id || !cred.client_email || !cred.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be a full service account JSON object');
  }
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }
  app = initializeApp({
    credential: cert({
      projectId: cred.project_id,
      clientEmail: cred.client_email,
      privateKey: cred.private_key.replace(/\\n/g, '\n'),
    }),
  });
  return app;
}
