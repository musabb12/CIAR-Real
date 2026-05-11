import { randomUUID } from 'crypto';
import path from 'path';
import { getFirebaseStorage, getFirebaseStorageBucketName } from '@/lib/firebase-admin';

const DEFAULT_BUCKET_FOLDER = 'uploads';

function safeExt(fileName: string, mimeType: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (ext) return ext;
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

export function buildFirebaseStorageUrl(objectPath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${getFirebaseStorageBucketName()}/o/${encodeURIComponent(
    objectPath
  )}?alt=media&token=${token}`;
}

export async function uploadBufferToFirebaseStorage(input: {
  folder?: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}): Promise<{ path: string; url: string }> {
  const bucket = getFirebaseStorage().bucket();
  const token = randomUUID();
  const folder = input.folder ? input.folder.replace(/^\/+|\/+$/g, '') : DEFAULT_BUCKET_FOLDER;
  const ext = safeExt(input.fileName, input.contentType);
  const finalName = `${Date.now()}-${randomUUID()}.${ext}`;
  const objectPath = path.posix.join(folder || DEFAULT_BUCKET_FOLDER, finalName);
  const file = bucket.file(objectPath);

  await file.save(input.buffer, {
    metadata: {
      contentType: input.contentType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
      cacheControl: 'public,max-age=31536000,immutable',
    },
    resumable: false,
  });

  return {
    path: objectPath,
    url: buildFirebaseStorageUrl(objectPath, token),
  };
}
