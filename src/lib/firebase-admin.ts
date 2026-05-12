import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

let app: App | null = null;

export function getFirebaseAdminConfigError(): string | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    return 'FIREBASE_SERVICE_ACCOUNT_JSON is not set';
  }

  let cred: ServiceAccountJson;
  try {
    cred = JSON.parse(raw) as ServiceAccountJson;
  } catch {
    return 'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON';
  }

  if (!cred.project_id || !cred.client_email || !cred.private_key) {
    return 'FIREBASE_SERVICE_ACCOUNT_JSON must be a full service account JSON object';
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

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const cred = JSON.parse(raw) as ServiceAccountJson;
  return cred;
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
      privateKey: cred.private_key!.replace(/\\n/g, '\n'),
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
