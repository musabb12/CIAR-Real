import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

let app: App | null = null;

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n').trim();
}

/** Read Firebase credentials from env (JSON blob or split vars — better for Vercel). */
function readServiceAccountFromEnv(): ServiceAccountJson | null {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonRaw) {
    try {
      const cred = JSON.parse(jsonRaw) as ServiceAccountJson;
      if (cred.private_key) {
        cred.private_key = normalizePrivateKey(cred.private_key);
      }
      return cred;
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (projectId && clientEmail && privateKeyRaw) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: normalizePrivateKey(privateKeyRaw),
    };
  }

  return null;
}

export function getFirebaseAdminConfigError(): string | null {
  const cred = readServiceAccountFromEnv();

  if (!cred) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
      return 'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON';
    }
    return 'FIREBASE_SERVICE_ACCOUNT_JSON is not set (or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY)';
  }

  if (!cred.project_id || !cred.client_email || !cred.private_key) {
    return 'Firebase service account is missing project_id, client_email, or private_key';
  }

  return null;
}

/** True when server-side Firebase Admin can be used. */
export function isFirebaseAdminConfigured(): boolean {
  return getFirebaseAdminConfigError() === null;
}

function readServiceAccount(): ServiceAccountJson {
  const configError = getFirebaseAdminConfigError();
  if (configError) {
    throw new Error(configError);
  }
  return readServiceAccountFromEnv()!;
}

export function getFirebaseProjectId(): string {
  return readServiceAccount().project_id!;
}

export function getFirebaseStorageBucketName(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    `${getFirebaseProjectId()}.appspot.com`
  );
}

export function getFirebaseAdminApp(): App {
  if (app) return app;

  const cred = readServiceAccount();

  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }

  app = initializeApp({
    credential: cert({
      projectId: cred.project_id,
      clientEmail: cred.client_email,
      privateKey: cred.private_key!,
    }),
    storageBucket: getFirebaseStorageBucketName(),
  });
  return app;
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}
