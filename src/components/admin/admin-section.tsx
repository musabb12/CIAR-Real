'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminRowMenu, type RowAction } from '@/components/admin/admin-row-menu';

export interface ColumnDef<T> {
  key: string;
  header: { ar: string; en: string };
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  isAr: boolean;
  title: { ar: string; en: string };
  subtitle?: { ar: string; en: string };
  endpoint: string;
  parseRows: (data: unknown) => T[];
  columns: ColumnDef<T>[];
  searchKeys?: (keyof T | string)[];
  emptyAr?: string;
  emptyEn?: string;
  toolbarActions?: React.ReactNode;
  /** Called when user clicks "Add new" */
  onAdd?: () => void;
  /** Row-level actions (⋯ menu) */
  rowActions?: (row: T) => RowAction[];
  pageSize?: number;
  /** When false, the table and its pagination are hidden (same fetch still runs for toolbar/search). */
  showTable?: boolean;
  /** Current filtered row set (e.g. sync card layouts with search). */
  onFilteredRows?: (rows: T[]) => void;
}

export function AdminSection<T extends { id?: string }>({
  isAr,
  title,
  subtitle,
  endpoint,
  parseRows,
  columns,
  searchKeys,
  emptyAr,
  emptyEn,
  toolbarActions,
  onAdd,
  rowActions,
  pageSize = 8,
  showTable = true,
  onFilteredRows,
}: Props<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const load = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    fetch(endpoint)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          const msg = typeof d?.error === 'string' ? d.error : `HTTP ${r.status}`;
          throw new Error(msg);
        }
        if (
          d &&
          typeof d === 'object' &&
          !Array.isArray(d) &&
          'error' in d &&
          typeof (d as { error: unknown }).error === 'string' &&
          !('data' in d)
        ) {
          throw new Error((d as { error: string }).error);
        }
        setRows(parseRows(d));
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        setFetchError(msg);
        setRows([]);
        toast.error(isAr ? 'فشل تحميل البيانات' : 'Failed to load data', { description: msg });
      })
      .finally(() => setLoading(false));
  }, [endpoint, parseRows, isAr]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r) => {
      const obj = r as Record<string, unknown>;
      if (searchKeys) {
        return searchKeys.some((k) => String(obj[k as string] ?? '').toLowerCase().includes(s));
      }
      return JSON.stringify(r).toLowerCase().includes(s);
    });
  }, [rows, search, searchKeys]);

  useEffect(() => {
    onFilteredRows?.(filtered);
  }, [filtered, onFilteredRows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ciar-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(tx('تم تصدير البيانات', 'Export complete'));
    } catch {
      toast.error(tx('تعذّر التصدير', 'Export failed'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tx(title.ar, title.en)}</h1>
          {subtitle && (
            <p className="text-sm text-[var(--admin-text-mute)] mt-1">
              {tx(subtitle.ar, subtitle.en)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--admin-text-faint)]">
            <span>{filtered.length}</span>
            <span>{tx('سجل', 'records')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {toolbarActions}
          <button type="button" onClick={load} className="admin-icon-btn !w-auto px-3 gap-1.5 text-xs" title={tx('تحديث', 'Refresh')}>
            <Loader2 className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {tx('تحديث', 'Refresh')}
          </button>
          <button type="button" onClick={handleExport} className="admin-icon-btn !w-auto px-3 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            {tx('تصدير JSON', 'Export JSON')}
          </button>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="!w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f5c97b] to-[#2dd4bf] text-[#0a1018] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              {tx('إضافة', 'Add new')}
            </button>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="admin-card p-3 flex items-center gap-2 border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-card p-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text-faint)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tx('ابحث...', 'Search...')}
            className="admin-search w-full h-9 ps-9 pe-3 text-sm"
          />
        </div>
        <button type="button" className="admin-icon-btn !w-auto px-3 gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5" />
          {tx('تصفية', 'Filter')}
        </button>
      </div>

      {/* Table */}
      {showTable ? (
        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#f5c97b]" />
            </div>
          ) : paged.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <Inbox className="h-10 w-10 text-[var(--admin-text-faint)]" />
              <p className="text-sm text-[var(--admin-text-mute)]">
                {tx(emptyAr ?? 'لا توجد بيانات', emptyEn ?? 'No data')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto admin-scrollbar">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th key={c.key} className={c.className}>
                          {tx(c.header.ar, c.header.en)}
                        </th>
                      ))}
                      <th className="!w-10 text-end">{tx('إجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((row, ri) => (
                      <tr key={row.id ?? ri}>
                        {columns.map((c) => (
                          <td key={c.key} className={c.className}>
                            {c.render(row)}
                          </td>
                        ))}
                        <td className="text-end">
                          {rowActions ? (
                            <AdminRowMenu actions={rowActions(row)} ariaLabel={tx('إجراءات السجل', 'Row actions')} />
                          ) : (
                            <span className="inline-block w-8" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <p className="text-[11px] text-[var(--admin-text-faint)]">
                  {tx('عرض', 'Showing')} {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}{' '}
                  {tx('من', 'of')} {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="admin-icon-btn !h-8 !w-8 disabled:opacity-40"
                  >
                    <ChevronLeft className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                  <span className="text-xs px-3 font-bold">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="admin-icon-btn !h-8 !w-8 disabled:opacity-40"
                  >
                    <ChevronRight className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
