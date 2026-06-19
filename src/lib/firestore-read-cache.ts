type CacheEntry<T> = { data: T; at: number };

const GLOBAL_CACHE_KEY = '__ciar_firestore_read_cache__';

function getStore(): Map<string, CacheEntry<unknown>> {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_CACHE_KEY]?: Map<string, CacheEntry<unknown>>;
  };
  if (!g[GLOBAL_CACHE_KEY]) g[GLOBAL_CACHE_KEY] = new Map();
  return g[GLOBAL_CACHE_KEY];
}

export function isFirestoreQuotaError(err: unknown): boolean {
  const code = (err as { code?: number })?.code;
  const msg = err instanceof Error ? err.message : String(err);
  return code === 8 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded');
}

export function getCachedRead<T>(key: string, ttlMs: number): T | null {
  const hit = getStore().get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) return null;
  return hit.data as T;
}

/** Returns cached data even if TTL expired — used when Firestore quota is hit. */
export function getStaleCachedRead<T>(key: string, maxAgeMs: number): T | null {
  const hit = getStore().get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > maxAgeMs) return null;
  return hit.data as T;
}

export function setCachedRead<T>(key: string, data: T): void {
  getStore().set(key, { data, at: Date.now() });
}

export function invalidateCachedRead(key: string): void {
  getStore().delete(key);
}

export function invalidateCachedReadPrefix(prefix: string): void {
  for (const key of getStore().keys()) {
    if (key.startsWith(prefix)) getStore().delete(key);
  }
}
