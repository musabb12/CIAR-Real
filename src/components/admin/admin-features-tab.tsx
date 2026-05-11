'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { invalidate } from '@/lib/admin-events';

type Row = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category: string;
  isEnabled: boolean;
};

export function AdminFeaturesTab({ isAr }: { isAr: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/features')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Failed');
        setRows(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setRows([]);
        toast.error(isAr ? 'فشل تحميل المميزات' : 'Failed to load features');
      })
      .finally(() => setLoading(false));
  }, [isAr]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (row: Row) => {
    try {
      const res = await fetch('/api/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isEnabled: !row.isEnabled }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Failed');
      setRows((prev) => prev.map((r) => (r.id === d.id ? { ...r, ...d } : r)));
      invalidate('features');
      toast.success(tx('تم حفظ الإعداد', 'Saved'));
    } catch {
      toast.error(tx('تعذّر التحديث', 'Update failed'));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tx('إدارة المميزات', 'Manage Features')}</h1>
        <p className="text-sm text-[var(--admin-text-mute)] mt-1">
          {tx('تفعيل أو تعطيل ميزات المنصة فوراً', 'Toggle platform features instantly')}
        </p>
      </div>

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#f5c97b]" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-[var(--admin-text-mute)]">{tx('لا توجد مميزات', 'No features')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{tx('الميزة', 'Feature')}</th>
                <th>{tx('المفتاح', 'Key')}</th>
                <th>{tx('الفئة', 'Category')}</th>
                <th>{tx('مفعّل', 'Enabled')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="font-semibold">{r.name}</div>
                    {r.description && (
                      <div className="text-[11px] text-[var(--admin-text-faint)] mt-0.5 max-w-md">{r.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-[11px] text-[var(--admin-text-mute)]">{r.key}</span>
                  </td>
                  <td>
                    <span className="admin-tag bg-white/[0.05] text-[var(--admin-text-mute)]">{r.category}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      className="flex items-center gap-2 text-sm hover:opacity-90 transition-opacity"
                      aria-pressed={r.isEnabled}
                    >
                      {r.isEnabled ? (
                        <ToggleRight className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-[var(--admin-text-faint)]" />
                      )}
                      <span className="text-[var(--admin-text-mute)]">{r.isEnabled ? tx('نعم', 'On') : tx('لا', 'Off')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
