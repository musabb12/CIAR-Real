/**
 * Cross-component / cross-tab broadcast for admin mutations.
 * Public components subscribe and re-fetch when their resource is invalidated.
 */
export type AdminResource =
  | 'news'
  | 'banners'
  | 'features'
  | 'properties'
  | 'inquiries'
  | 'reviews'
  | 'favorites'
  | 'agents'
  | 'companies'
  | 'users'
  | 'all';

const EVENT = 'ciar:invalidate';
const STORAGE_PREFIX = 'ciar:invalidate:';

export function invalidate(resource: AdminResource): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { resource } }));
    window.localStorage.setItem(STORAGE_PREFIX + resource, String(Date.now()));
    if (resource !== 'all') {
      window.localStorage.setItem(STORAGE_PREFIX + 'all', String(Date.now()));
    }
  } catch {
    // no-op
  }
}

export function onInvalidate(
  resource: AdminResource | AdminResource[],
  handler: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const list = Array.isArray(resource) ? resource : [resource];
  const matches = (r: AdminResource) => list.includes(r) || list.includes('all') || r === 'all';

  const onEvent = (e: Event) => {
    const detail = (e as CustomEvent<{ resource: AdminResource }>).detail;
    if (detail?.resource && matches(detail.resource)) handler();
  };
  const onStorage = (e: StorageEvent) => {
    if (!e.key || !e.key.startsWith(STORAGE_PREFIX)) return;
    const r = e.key.slice(STORAGE_PREFIX.length) as AdminResource;
    if (matches(r)) handler();
  };
  window.addEventListener(EVENT, onEvent as EventListener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onEvent as EventListener);
    window.removeEventListener('storage', onStorage);
  };
}
