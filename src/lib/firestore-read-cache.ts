type CacheEntry<T> = { data: T; at: number };

const store = new Map<string, CacheEntry<unknown>>();

export function isFirestoreQuotaError(err: unknown): boolean {
  const code = (err as { code?: number })?.code;
  const msg = err instanceof Error ? err.message : String(err);
  return code === 8 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded');
}

export function getCachedRead<T>(key: string, ttlMs: number): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) return null;
  return hit.data as T;
}

/** Returns cached data even if TTL expired — used when Firestore quota is hit. */
export function getStaleCachedRead<T>(key: string, maxAgeMs: number): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > maxAgeMs) return null;
  return hit.data as T;
}

export function setCachedRead<T>(key: string, data: T): void {
  store.set(key, { data, at: Date.now() });
}

export function invalidateCachedRead(key: string): void {
  store.delete(key);
}

export function invalidateCachedReadPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
