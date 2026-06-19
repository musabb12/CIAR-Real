'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Inbox, Link2, Loader2, Palette, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { invalidate } from '@/lib/admin-events';
import { NEWS_TYPE_OPTIONS, newsTypeLabel } from '@/lib/admin-labels';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

type NewsRow = {
  id: string;
  content: string;
  type: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  link?: string | null;
};

const EMPTY_FORM = { content: '', type: 'info', link: '', order: 0, isActive: true };

function sortNews(rows: NewsRow[]): NewsRow[] {
  return [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function friendlyLoadError(isAr: boolean, msg: string): string {
  if (msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED')) {
    return tx(
      isAr,
      'حصة قاعدة البيانات ممتلئة مؤقتاً. انتظر دقيقة ثم اضغط «تحديث».',
      'Database quota is temporarily exceeded. Wait a minute then click Refresh.',
    );
  }
  return msg;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] mb-1 text-[var(--admin-text-mute)]">{label}</div>
      {children}
    </label>
  );
}

function TickerColorPicker({
  isAr,
  label,
  value,
  onChange,
  defaultHex,
}: {
  isAr: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
  defaultHex: string;
}) {
  const display = value?.trim() || defaultHex;
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          className="h-10 w-12 rounded-lg border border-white/15 cursor-pointer bg-transparent shrink-0"
          value={display.startsWith('#') ? display : defaultHex}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="text-xs text-[var(--admin-text-mute)] flex-1">
          {value?.trim() ? value : tx(isAr, 'افتراضي الموقع', 'Site default')}
        </span>
        {value?.trim() ? (
          <button type="button" className="text-xs text-amber-200/80 hover:text-amber-100" onClick={() => onChange('')}>
            {tx(isAr, 'إزالة', 'Clear')}
          </button>
        ) : null}
      </div>
    </Field>
  );
}

export function NewsTab({ isAr }: { isAr: boolean }) {
  const designSettings = useAppStore((s) => s.designSettings);
  const updateDesignSettings = useAppStore((s) => s.updateDesignSettings);

  const [items, setItems] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const clampTickerDim = (value: number, min: number, max: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
  };

  const fetchNews = useCallback(async (fresh = true): Promise<NewsRow[]> => {
    const res = await fetch(`/api/news?all=1${fresh ? '&fresh=1' : ''}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`);
    }
    return sortNews(Array.isArray(data) ? (data as NewsRow[]) : []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let rows = await fetchNews(true);
      if (rows.length === 0) {
        const seedRes = await fetch('/api/news/seed');
        const seedData = await seedRes.json().catch(() => ({}));
        if (Array.isArray(seedData?.items) && seedData.items.length > 0) {
          rows = sortNews(seedData.items as NewsRow[]);
        } else {
          rows = await fetchNews(true);
        }
      }
      setItems(rows);
    } catch (e) {
      const msg = friendlyLoadError(isAr, e instanceof Error ? e.message : 'Failed to load');
      setError(msg);
      toast.error(tx(isAr, 'فشل التحميل', 'Failed to load'), { description: msg });
    } finally {
      setLoading(false);
    }
  }, [fetchNews, isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((row) => row.content.toLowerCase().includes(q));
  }, [items, search]);

  const previewText = useMemo(() => {
    const active = items.filter((row) => row.isActive);
    if (active.length > 0) return active[0].content;
    if (items.length > 0) return items[0].content;
    return tx(isAr, 'مثال: عروض جديدة على العقارات في دبي…', 'Sample: New listings in Dubai…');
  }, [items, isAr]);

  const newsTypePill = (type: string) => {
    const c =
      type === 'urgent' ? 'admin-pill-down' : type === 'promo' ? 'admin-pill-gold' : type === 'warning' ? 'admin-pill-down' : 'admin-pill-up';
    return <span className={`admin-pill ${c}`}>{newsTypeLabel(isAr, type)}</span>;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: items.length });
    setOpen(true);
  };

  const openEdit = (row: NewsRow) => {
    setEditingId(row.id);
    setForm({
      content: row.content,
      type: row.type,
      link: row.link ?? '',
      order: row.order,
      isActive: row.isActive,
    });
    setOpen(true);
  };

  const upsertLocal = (row: NewsRow) => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === row.id);
      if (idx < 0) return sortNews([...prev, row]);
      return sortNews(prev.map((item, i) => (i === idx ? row : item)));
    });
  };

  const submit = async () => {
    if (!form.content.trim()) {
      toast.error(tx(isAr, 'نص الخبر مطلوب', 'News text is required'));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        content: form.content.trim(),
        link: form.link.trim() || null,
        type: form.type,
        order: form.order,
        isActive: form.isActive,
      };
      const res = await fetch('/api/news', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : tx(isAr, 'فشل الحفظ', 'Could not save'));
      }
      upsertLocal(data as NewsRow);
      invalidate('news');
      toast.success(
        editingId
          ? tx(isAr, 'تم تحديث الخبر', 'News updated')
          : tx(isAr, 'تم نشر الخبر في الشريط', 'News published to ticker'),
      );
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      toast.error(tx(isAr, 'فشل الحفظ', 'Could not save'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (row: NewsRow) => {
    const next = { ...row, isActive: !row.isActive };
    setItems((prev) => sortNews(prev.map((item) => (item.id === row.id ? next : item))));
    try {
      const res = await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isActive: next.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Update failed');
      upsertLocal(data as NewsRow);
      invalidate('news');
      toast.success(tx(isAr, 'تم التحديث', 'Updated'));
    } catch (e) {
      setItems((prev) => sortNews(prev.map((item) => (item.id === row.id ? row : item))));
      toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
    }
  };

  const deleteRow = async (row: NewsRow) => {
    if (!window.confirm(tx(isAr, 'حذف هذا الخبر؟', 'Delete this news item?'))) return;
    setItems((prev) => prev.filter((item) => item.id !== row.id));
    try {
      const res = await fetch(`/api/news?id=${encodeURIComponent(row.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Delete failed');
      invalidate('news');
      toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
    } catch (e) {
      upsertLocal(row);
      toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
    }
  };

  return (
    <>
      <div className="admin-card p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#f5c97b]" />
            <div>
              <h3 className="font-heading font-bold">{tx(isAr, 'شكل الشريط الإخباري', 'Ticker look')}</h3>
              <p className="text-[12px] text-[var(--admin-text-mute)] mt-1 max-w-xl">
                {tx(
                  isAr,
                  'اضبط الارتفاع والألوان بسهولة — يُحفظ تلقائياً مع إعدادات الموقع. اترك اللون فارغاً لاستخدام مظهر الموقع الافتراضي.',
                  'Adjust height and colors easily — saves with site settings. Leave a color empty to use the site default.',
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-icon-btn !w-auto px-4"
            onClick={() => {
              updateDesignSettings({
                newsTickerBackground: '',
                newsTickerTextColor: '',
                newsTickerFontSizePx: 12,
                newsTickerHeightPx: 40,
                newsTickerLabelTextColor: '',
                newsTickerLabelBackground: '',
                newsTickerSeparatorColor: '',
              });
              toast.success(tx(isAr, 'تمت إعادة الشكل للافتراضي', 'Ticker look reset'));
            }}
          >
            {tx(isAr, 'إعادة الافتراضي', 'Reset to default')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label={tx(isAr, 'ارتفاع الشريط', 'Bar height')}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={28}
                max={80}
                className="flex-1 accent-amber-400"
                value={designSettings.newsTickerHeightPx ?? 40}
                onChange={(e) =>
                  updateDesignSettings({
                    newsTickerHeightPx: clampTickerDim(Number(e.target.value), 28, 80, 40),
                  })
                }
              />
              <span className="text-sm font-semibold w-12 text-end">{designSettings.newsTickerHeightPx ?? 40}px</span>
            </div>
          </Field>
          <Field label={tx(isAr, 'حجم الخط', 'Text size')}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={24}
                className="flex-1 accent-amber-400"
                value={designSettings.newsTickerFontSizePx ?? 12}
                onChange={(e) =>
                  updateDesignSettings({
                    newsTickerFontSizePx: clampTickerDim(Number(e.target.value), 10, 24, 12),
                  })
                }
              />
              <span className="text-sm font-semibold w-12 text-end">{designSettings.newsTickerFontSizePx ?? 12}px</span>
            </div>
          </Field>
          <TickerColorPicker
            isAr={isAr}
            label={tx(isAr, 'لون خلفية الشريط', 'Bar background color')}
            value={designSettings.newsTickerBackground}
            defaultHex="#0f172a"
            onChange={(v) => updateDesignSettings({ newsTickerBackground: v })}
          />
          <TickerColorPicker
            isAr={isAr}
            label={tx(isAr, 'لون نص الأخبار', 'News text color')}
            value={designSettings.newsTickerTextColor}
            defaultHex="#e2e8f0"
            onChange={(v) => updateDesignSettings({ newsTickerTextColor: v })}
          />
          <TickerColorPicker
            isAr={isAr}
            label={tx(isAr, 'خلفية عمود «عاجل»', 'Breaking label background')}
            value={designSettings.newsTickerLabelBackground}
            defaultHex="#1e293b"
            onChange={(v) => updateDesignSettings({ newsTickerLabelBackground: v })}
          />
          <TickerColorPicker
            isAr={isAr}
            label={tx(isAr, 'لون نص «عاجل»', 'Breaking label text')}
            value={designSettings.newsTickerLabelTextColor}
            defaultHex="#f59e0b"
            onChange={(v) => updateDesignSettings({ newsTickerLabelTextColor: v })}
          />
          <TickerColorPicker
            isAr={isAr}
            label={tx(isAr, 'لون الفاصل بين الأخبار', 'Separator color')}
            value={designSettings.newsTickerSeparatorColor}
            defaultHex="#64748b"
            onChange={(v) => updateDesignSettings({ newsTickerSeparatorColor: v })}
          />
        </div>

        <p className="text-[11px] text-[var(--admin-text-faint)] mb-2">{tx(isAr, 'معاينة مباشرة', 'Live preview')}</p>
        <div
          className="rounded-lg border border-white/10 overflow-hidden glass-nav"
          style={{
            height: designSettings.newsTickerHeightPx ?? 40,
            ...(designSettings.newsTickerBackground?.trim()
              ? { background: designSettings.newsTickerBackground }
              : {}),
          }}
        >
          <div className="flex h-full items-center">
            <div
              className={
                designSettings.newsTickerLabelBackground?.trim()
                  ? 'flex h-full items-center gap-2 border-r border-border/40 px-3'
                  : 'flex h-full items-center gap-2 border-r border-border/40 bg-gradient-to-r from-primary/10 to-transparent px-3 dark:from-primary/5'
              }
              style={
                designSettings.newsTickerLabelBackground?.trim()
                  ? { background: designSettings.newsTickerLabelBackground }
                  : undefined
              }
            >
              <Bell
                size={Math.max(12, (designSettings.newsTickerFontSizePx ?? 12) + 2)}
                className={designSettings.newsTickerLabelTextColor?.trim() ? '' : 'text-primary'}
                style={designSettings.newsTickerLabelTextColor?.trim() ? { color: designSettings.newsTickerLabelTextColor } : undefined}
              />
              <span
                className={designSettings.newsTickerLabelTextColor?.trim() ? '' : 'text-primary'}
                style={{
                  fontSize: designSettings.newsTickerFontSizePx ?? 12,
                  ...(designSettings.newsTickerLabelTextColor?.trim()
                    ? { color: designSettings.newsTickerLabelTextColor }
                    : {}),
                }}
              >
                {tx(isAr, 'عاجل', 'Breaking')}
              </span>
            </div>
            <div className="flex-1 px-3 truncate flex items-center gap-2">
              <span
                className={designSettings.newsTickerTextColor?.trim() ? '' : 'text-foreground/80'}
                style={{
                  fontSize: designSettings.newsTickerFontSizePx ?? 12,
                  ...(designSettings.newsTickerTextColor?.trim()
                    ? { color: designSettings.newsTickerTextColor }
                    : {}),
                }}
              >
                {previewText}
              </span>
              <span
                className={designSettings.newsTickerSeparatorColor?.trim() ? '' : 'text-foreground/20'}
                style={designSettings.newsTickerSeparatorColor?.trim() ? { color: designSettings.newsTickerSeparatorColor } : undefined}
              >
                |
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--admin-text-mute)]">
              {tx(isAr, 'كل سطر يظهر في الشريط أعلى الموقع — الأصغر رقم الترتيب يظهر أولاً', 'Each item scrolls in the top bar — lower order numbers appear first')}
            </p>
            <p className="text-xs text-[var(--admin-text-faint)] mt-1">
              {filtered.length} {tx(isAr, 'خبر', 'items')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => void load()} className="admin-icon-btn !w-auto px-3 text-xs gap-1.5">
              <Loader2 className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              {tx(isAr, 'تحديث', 'Refresh')}
            </button>
            <button type="button" onClick={openCreate} className="admin-btn-premium !text-xs !py-2">
              <Plus className="h-3.5 w-3.5" />
              {tx(isAr, 'إضافة خبر', 'Add news')}
            </button>
          </div>
        </div>

        <div className="admin-card p-3">
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text-faint)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tx(isAr, 'بحث في الأخبار…', 'Search news…')}
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
              {tx(isAr, 'لا توجد أخبار — أضف خبراً للشريط', 'No news — add a ticker item')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="admin-card p-0 overflow-hidden flex flex-col transition-all hover:border-amber-400/35 hover:shadow-lg hover:shadow-amber-500/10"
              >
                <div className="p-4 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {newsTypePill(row.type)}
                    {row.isActive ? (
                      <span className="admin-pill admin-pill-up">{tx(isAr, 'يعرض الآن', 'Showing now')}</span>
                    ) : (
                      <span className="admin-pill admin-pill-down">{tx(isAr, 'متوقف', 'Paused')}</span>
                    )}
                    <span className="text-[11px] text-[var(--admin-text-faint)] ms-auto">
                      {tx(isAr, 'الترتيب', 'Order')}: {row.order}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{row.content}</p>
                  {row.link?.trim() && (
                    <p className="text-[11px] text-amber-200/70 mt-2 truncate flex items-center gap-1">
                      <Link2 className="h-3 w-3 shrink-0" />
                      {row.link}
                    </p>
                  )}
                </div>
                <div className="border-t border-white/10 px-3 py-2 flex flex-wrap gap-2">
                  <button type="button" className="admin-icon-btn !w-auto px-3 text-xs" onClick={() => openEdit(row)}>
                    <Pencil className="h-3 w-3" />
                    {tx(isAr, 'تعديل', 'Edit')}
                  </button>
                  <button type="button" className="admin-icon-btn !w-auto px-3 text-xs" onClick={() => void toggleActive(row)}>
                    {row.isActive ? tx(isAr, 'إيقاف العرض', 'Pause') : tx(isAr, 'تفعيل العرض', 'Show')}
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn !w-auto px-3 text-xs text-rose-300 border-rose-400/30"
                    onClick={() => void deleteRow(row)}
                  >
                    <Trash2 className="h-3 w-3" />
                    {tx(isAr, 'حذف', 'Delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEditingId(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? tx(isAr, 'تعديل الخبر', 'Edit news') : tx(isAr, 'إضافة خبر للشريط', 'Add ticker news')}
            </DialogTitle>
            <DialogDescription>
              {tx(isAr, 'يظهر مباشرة في الشريط أعلى صفحات الموقع', 'Appears immediately in the top news bar')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={tx(isAr, 'نص الخبر', 'News text')}>
              <textarea
                className="admin-input min-h-[80px]"
                placeholder={tx(isAr, 'مثال: خصم 10% على الإيجار هذا الشهر', 'e.g. 10% off rentals this month')}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Field>
            <Field label={tx(isAr, 'رابط (اختياري)', 'Link (optional)')}>
              <input
                className="admin-input"
                placeholder={tx(isAr, 'https://example.com', 'https://example.com')}
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx(isAr, 'نوع الخبر', 'News type')}>
                <select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {NEWS_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {isAr ? opt.ar : opt.en}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tx(isAr, 'ترتيب الظهور', 'Display order')}>
                <input
                  type="number"
                  min={0}
                  className="admin-input"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                />
                <p className="text-[10px] text-[var(--admin-text-faint)] mt-1">
                  {tx(isAr, '0 = الأول في الشريط', '0 = first in the bar')}
                </p>
              </Field>
            </div>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              {tx(isAr, 'عرض في الشريط فوراً', 'Show in ticker immediately')}
            </label>
          </div>
          <DialogFooter>
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button type="button" className="admin-btn-premium" disabled={submitting} onClick={() => void submit()}>
              {submitting
                ? tx(isAr, 'جارٍ الحفظ…', 'Saving…')
                : editingId
                  ? tx(isAr, 'حفظ التعديلات', 'Save changes')
                  : tx(isAr, 'نشر في الشريط', 'Publish')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
