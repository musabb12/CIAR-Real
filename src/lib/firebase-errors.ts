/** Detect Firestore / Firebase Admin quota exhaustion (common in free tier). */
export function isFirebaseQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: number | string; message?: string; details?: string };
  const code = String(e.code ?? '');
  const text = `${e.message ?? ''} ${e.details ?? ''}`.toLowerCase();
  return (
    code === '8' ||
    code === 'RESOURCE_EXHAUSTED' ||
    text.includes('quota exceeded') ||
    text.includes('resource_exhausted')
  );
}
