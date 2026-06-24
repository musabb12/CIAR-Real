'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Loader2, Plus, Search, Inbox } from 'lucide-react';
import { toast } from 'sonner';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

/** Stable empty default — avoids infinite re-fetch when `localItems` is omitted. */
const EMPTY_LOCAL_ITEMS: never[] = [];

function friendlyLoadError(isAr: boolean, msg: string): string {
  if (msg.includes('Failed to fetch news')) {
    return tx(
      isAr,
      'تعذّر تحميل الأخبار من قاعدة البيانات. يمكنك الإضافة مباشرة — جرّب «تحديث» بعد قليل.',
      'Could not load news from the database. You can still add items — try Refresh shortly.',
    );
  }
  if (msg.includes('Failed to fetch agents')) {
    return tx(
      isAr,
      'تعذّر تحميل الوكلاء. انتظر قليلاً ثم اضغط «تحديث» — قد تكون قاعدة البيانات مشغولة.',
      'Could not load agents. Wait a moment and click Refresh — the database may be busy.',
    );
  }
  if (msg.includes('Failed to fetch companies')) {
    return tx(
      isAr,
      'تعذّر تحميل الشركات. انتظر قليلاً ثم اضغط «تحديث».',
      'Could not load companies. Wait a moment and click Refresh.',
    );
  }
  if (msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED')) {
    return tx(
      isAr,
      'حصة قاعدة البيانات ممتلئة مؤقتاً. انتظر دقيقة ثم اضغط «تحديث».',
      'Database quota is temporarily exceeded. Wait a minute then click Refresh.',
    );
  }
  return msg;
}

export interface AdminEntityGridProps<T extends { id?: string }> {
  isAr: boolean;
  subtitle?: { ar: string; en: string };
  endpoint: string;
  parseItems: (data: unknown) => T[];
  renderCard: (item: T) => ReactNode;
  onItemClick: (item: T) => void;
  searchKeys?: (keyof T | string)[];
  searchPlaceholder?: { ar: string; en: string };
  onAdd?: () => void;
  addLabel?: { ar: string; en: string };
  emptyAr?: string;
  emptyEn?: string;
  columnsClassName?: string;
  headerExtra?: ReactNode;
  refreshKey?: number;
  onApiResponse?: (payload: unknown) => void;
  /** Footer actions on each card (clicks do not open the card) */
  renderCardActions?: (item: T) => ReactNode;
  /** Items added locally (e.g. after create while list fetch is unavailable) */
  localItems?: T[];
  /** Extra text included when filtering the search box */
  getSearchText?: (item: T) => string;
  /** Optional client-side sort (e.g. localized country names) */
  sortItems?: (a: T, b: T) => number;
  /** If false, whole card is not a single click target */
  cardClickable?: boolean;
}

export function AdminEntityGrid<T extends { id?: string }>({
  isAr,
  subtitle,
  endpoint,
  parseItems,
  renderCard,
  onItemClick,
  searchKeys,
  searchPlaceholder,
  onAdd,
  addLabel,
  emptyAr,
  emptyEn,
  columnsClassName = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  headerExtra,
  refreshKey = 0,
  onApiResponse,
  renderCardActions,
  localItems,
  cardClickable = true,
  getSearchText,
  sortItems,
}: AdminEntityGridProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stableLocalItems = localItems ?? EMPTY_LOCAL_ITEMS;
  const parseItemsRef = useRef(parseItems);
  const onApiResponseRef = useRef(onApiResponse);
  const localItemsRef = useRef(stableLocalItems);
  const fetchGenRef = useRef(0);
  parseItemsRef.current = parseItems;
  onApiResponseRef.current = onApiResponse;
  localItemsRef.current = stableLocalItems;

  const load = useCallback(
    (options?: { silent?: boolean }) => {
      const gen = ++fetchGenRef.current;
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);
      fetch(endpoint)
        .then(async (r) => {
          const d = await r.json();
          if (gen !== fetchGenRef.current) return;
          if (!r.ok) {
            throw new Error(typeof (d as { error?: string }).error === 'string' ? (d as { error: string }).error : `HTTP ${r.status}`);
          }
          onApiResponseRef.current?.(d);
          const fetched = parseItemsRef.current(d);
          const locals = localItemsRef.current;
          const localOnly = locals.filter(
            (item) => !fetched.some((row) => row.id && item.id && row.id === item.id),
          );
          setItems([...localOnly, ...fetched]);
        })
        .catch((e: unknown) => {
          if (gen !== fetchGenRef.current) return;
          const raw = e instanceof Error ? e.message : 'Failed to load';
          const msg = friendlyLoadError(isAr, raw);
          setError(msg);
          setItems(localItemsRef.current);
          toast.error(tx(isAr, 'فشل التحميل', 'Failed to load'), { description: msg });
        })
        .finally(() => {
          if (gen === fetchGenRef.current) {
            setLoading(false);
          }
        });
    },
    [endpoint, isAr],
  );

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((row) => {
      if (getSearchText) {
        return getSearchText(row).toLowerCase().includes(q);
      }
      const obj = row as Record<string, unknown>;
      if (searchKeys?.length) {
        return searchKeys.some((k) => String(obj[k as string] ?? '').toLowerCase().includes(q));
      }
      return JSON.stringify(row).toLowerCase().includes(q);
    });
  }, [items, search, searchKeys, getSearchText]);

  const visibleItems = useMemo(() => {
    if (!sortItems) return filtered;
    return [...filtered].sort(sortItems);
  }, [filtered, sortItems]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          {subtitle && (
            <p className="text-sm text-[var(--admin-text-mute)]">{tx(isAr, subtitle.ar, subtitle.en)}</p>
          )}
          <p className="text-xs text-[var(--admin-text-faint)] mt-1">
            {filtered.length} {tx(isAr, 'عنصر', 'items')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {headerExtra}
          <button
            type="button"
            onClick={() => load({ silent: items.length > 0 })}
            className="admin-icon-btn !w-auto px-3 text-xs gap-1.5"
          >
            <Loader2 className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {tx(isAr, 'تحديث', 'Refresh')}
          </button>
          {onAdd && (
            <button type="button" onClick={onAdd} className="admin-btn-premium !text-xs !py-2">
              <Plus className="h-3.5 w-3.5" />
              {addLabel ? tx(isAr, addLabel.ar, addLabel.en) : tx(isAr, 'إضافة', 'Add')}
            </button>
          )}
        </div>
      </div>

      <div className="admin-card p-3">
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text-faint)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              searchPlaceholder
                ? tx(isAr, searchPlaceholder.ar, searchPlaceholder.en)
                : tx(isAr, 'بحث…', 'Search…')
            }
            className="admin-search w-full h-10 ps-9 pe-3 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="admin-card p-3 text-sm text-rose-200 border-rose-500/30 bg-rose-500/10">{error}</div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#f5c97b]" />
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="admin-card py-16 flex flex-col items-center gap-2 text-center">
          <Inbox className="h-10 w-10 text-[var(--admin-text-faint)]" />
          <p className="text-sm text-[var(--admin-text-mute)]">
            {tx(isAr, emptyAr ?? 'لا توجد بيانات', emptyEn ?? 'No data')}
          </p>
        </div>
      ) : (
        <div className={columnsClassName}>
          {visibleItems.map((item, i) => (
            <div
              key={item.id ?? i}
              className="admin-card p-0 overflow-hidden flex flex-col transition-all hover:border-amber-400/35 hover:shadow-lg hover:shadow-amber-500/10"
            >
              {cardClickable ? (
                <button
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="flex-1 text-start p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-inset"
                >
                  {renderCard(item)}
                </button>
              ) : (
                <div className="flex-1">{renderCard(item)}</div>
              )}
              {renderCardActions ? (
                <div
                  className="border-t border-white/10 px-3 py-2 flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderCardActions(item)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
