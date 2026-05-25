'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Loader2, Plus, Search, Inbox } from 'lucide-react';
import { toast } from 'sonner';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

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
}: AdminEntityGridProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(endpoint)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          throw new Error(typeof (d as { error?: string }).error === 'string' ? (d as { error: string }).error : `HTTP ${r.status}`);
        }
        onApiResponse?.(d);
        setItems(parseItems(d));
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        setError(msg);
        setItems([]);
        toast.error(tx(isAr, 'فشل التحميل', 'Failed to load'), { description: msg });
      })
      .finally(() => setLoading(false));
  }, [endpoint, parseItems, isAr, onApiResponse]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((row) => {
      const obj = row as Record<string, unknown>;
      if (searchKeys?.length) {
        return searchKeys.some((k) => String(obj[k as string] ?? '').toLowerCase().includes(q));
      }
      return JSON.stringify(row).toLowerCase().includes(q);
    });
  }, [items, search, searchKeys]);

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
          <button type="button" onClick={load} className="admin-icon-btn !w-auto px-3 text-xs gap-1.5">
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
      ) : filtered.length === 0 ? (
        <div className="admin-card py-16 flex flex-col items-center gap-2 text-center">
          <Inbox className="h-10 w-10 text-[var(--admin-text-faint)]" />
          <p className="text-sm text-[var(--admin-text-mute)]">
            {tx(isAr, emptyAr ?? 'لا توجد بيانات', emptyEn ?? 'No data')}
          </p>
        </div>
      ) : (
        <div className={columnsClassName}>
          {filtered.map((item, i) => (
            <button
              key={item.id ?? i}
              type="button"
              onClick={() => onItemClick(item)}
              className="admin-card p-0 text-start overflow-hidden transition-all hover:border-amber-400/35 hover:shadow-lg hover:shadow-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
            >
              {renderCard(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
