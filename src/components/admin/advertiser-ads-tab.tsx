'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Trash2,
  Settings2,
  Megaphone,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Eye,
  CreditCard,
  Pause,
  Play,
  Clock,
  Star,
  Search,
  RefreshCw,
  Ban,
  CalendarPlus,
  Save,
  MousePointerClick,
  BarChart3,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { invalidate } from '@/lib/admin-events';
import {
  AD_DURATION_OPTIONS,
  calcAdTotal,
  fieldLabel,
  placementLabel,
} from '@/lib/advertiser-ads-config';
import { formatNumberEn, formatDateEn } from '@/lib/format-numbers';
import type {
  AdFieldDefinition,
  AdPlacementDefinition,
  AdPlacementId,
  AdvertiserAd,
  AdvertiserAdSettings,
  AdvertiserAdStatus,
  AdvertiserAdsStats,
} from '@/types/advertiser-ads';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

async function adminFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`);
  }
  return res.json();
}

const STATUS_COLORS: Record<AdvertiserAdStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  pending_payment: 'bg-amber-500/20 text-amber-200',
  pending_review: 'bg-sky-500/20 text-sky-200',
  approved: 'bg-emerald-500/20 text-emerald-200',
  paused: 'bg-orange-500/20 text-orange-200',
  rejected: 'bg-rose-500/20 text-rose-200',
  expired: 'bg-zinc-500/20 text-zinc-300',
};

function statusLabel(status: AdvertiserAdStatus, isAr: boolean): string {
  const map: Record<AdvertiserAdStatus, { ar: string; en: string }> = {
    draft: { ar: 'مسودة', en: 'Draft' },
    pending_payment: { ar: 'بانتظار الدفع', en: 'Pending payment' },
    pending_review: { ar: 'بانتظار الموافقة', en: 'Pending review' },
    approved: { ar: 'منشور', en: 'Published' },
    paused: { ar: 'متوقف', en: 'Paused' },
    rejected: { ar: 'مرفوض', en: 'Rejected' },
    expired: { ar: 'منتهي', en: 'Expired' },
  };
  return isAr ? map[status].ar : map[status].en;
}

type SubTab = 'overview' | 'moderation' | 'published' | 'fields' | 'placements' | 'settings';

export function AdvertiserAdsTab({ isAr }: { isAr: boolean }) {
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [ads, setAds] = useState<AdvertiserAd[]>([]);
  const [stats, setStats] = useState<AdvertiserAdsStats | null>(null);
  const [settings, setSettings] = useState<AdvertiserAdSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdvertiserAd | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<AdvertiserAdStatus | 'all'>('all');
  const [placementFilter, setPlacementFilter] = useState<AdPlacementId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    placementId: 'home_featured_grid' as AdPlacementId,
    durationDays: 14,
    adminNotes: '',
    isFeatured: false,
    priority: 0,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [adsRes, settingsRes, statsRes] = await Promise.all([
        fetch('/api/advertiser-ads'),
        fetch('/api/advertiser-ads/settings'),
        fetch('/api/advertiser-ads/stats'),
      ]);
      const adsData = (await adsRes.json()) as AdvertiserAd[];
      setAds(adsData);
      setSettings((await settingsRes.json()) as AdvertiserAdSettings);
      setStats((await statsRes.json()) as AdvertiserAdsStats);
      setSelected((prev) => {
        if (!prev) return null;
        return adsData.find((a) => a.id === prev.id) ?? null;
      });
    } catch {
      toast.error(tx(isAr, 'فشل التحميل', 'Load failed'));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setEditForm({
      title: selected.title,
      description: selected.description ?? '',
      videoUrl: selected.videoUrl ?? '',
      placementId: selected.placementId,
      durationDays: selected.durationDays,
      adminNotes: selected.adminNotes ?? '',
      isFeatured: selected.isFeatured,
      priority: selected.priority,
    });
  }, [selected]);

  const filtered = useMemo(() => {
    let rows = [...ads];
    if (subTab === 'moderation') {
      rows = rows.filter((a) =>
        ['pending_review', 'pending_payment', 'rejected', 'draft'].includes(a.status),
      );
    }
    if (subTab === 'published') {
      rows = rows.filter((a) => ['approved', 'paused', 'expired'].includes(a.status));
    }
    if (statusFilter !== 'all') rows = rows.filter((a) => a.status === statusFilter);
    if (placementFilter !== 'all') rows = rows.filter((a) => a.placementId === placementFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.advertiserName ?? '').toLowerCase().includes(q) ||
          (a.advertiserEmail ?? '').toLowerCase().includes(q),
      );
    }
    return rows;
  }, [ads, subTab, statusFilter, placementFilter, search]);

  const runAction = async (id: string, action: string, extra?: Record<string, unknown>) => {
    try {
      if (action === 'approve') {
        await adminFetch(`/api/advertiser-ads/${id}/approve`, { method: 'POST' });
      } else if (action === 'reject') {
        const reason =
          (extra?.reason as string | undefined) ??
          window.prompt(tx(isAr, 'سبب الرفض (اختياري)', 'Rejection reason (optional)'));
        if (reason === null && !extra?.reason) return;
        await adminFetch(`/api/advertiser-ads/${id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason ?? '' }),
        });
      } else if (action === 'delete') {
        if (!window.confirm(tx(isAr, 'حذف هذا الإعلان؟', 'Delete this ad?'))) return;
        await adminFetch(`/api/advertiser-ads/${id}`, { method: 'DELETE' });
      } else {
        await adminFetch(`/api/advertiser-ads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...extra }),
        });
      }
      toast.success(tx(isAr, 'تم التنفيذ', 'Done'));
      invalidate('advertiser-ads');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const saveSelected = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminFetch(`/api/advertiser-ads/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          videoUrl: editForm.videoUrl.trim() || null,
          placementId: editForm.placementId,
          durationDays: editForm.durationDays,
          adminNotes: editForm.adminNotes,
          isFeatured: editForm.isFeatured,
          priority: editForm.priority,
        }),
      });
      toast.success(tx(isAr, 'تم حفظ التعديلات', 'Changes saved'));
      invalidate('advertiser-ads');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulk = async (action: string) => {
    if (selectedIds.size === 0) {
      toast.error(tx(isAr, 'اختر إعلانات أولاً', 'Select ads first'));
      return;
    }
    if (action === 'delete' && !window.confirm(tx(isAr, 'حذف المحدد؟', 'Delete selected?'))) return;
    let reason: string | undefined;
    if (action === 'reject') {
      const r = window.prompt(tx(isAr, 'سبب الرفض', 'Rejection reason'));
      if (r === null) return;
      reason = r;
    }
    try {
      await adminFetch('/api/advertiser-ads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds], action, reason }),
      });
      toast.success(tx(isAr, 'تم تنفيذ الإجراء الجماعي', 'Bulk action done'));
      setSelectedIds(new Set());
      invalidate('advertiser-ads');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const toggleField = async (field: AdFieldDefinition, patch: Partial<AdFieldDefinition>) => {
    try {
      await adminFetch('/api/advertiser-ads/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: field.id, fieldPatch: patch }),
      });
      toast.success(tx(isAr, 'تم التحديث', 'Updated'));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const patchPlacement = async (
    placement: AdPlacementDefinition,
    patch: Partial<AdPlacementDefinition>,
  ) => {
    try {
      await adminFetch('/api/advertiser-ads/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementId: placement.id, placementPatch: patch }),
      });
      toast.success(tx(isAr, 'تم التحديث', 'Updated'));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const savePlatform = async (platform: Partial<NonNullable<AdvertiserAdSettings['platform']>>) => {
    try {
      await adminFetch('/api/advertiser-ads/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      toast.success(tx(isAr, 'تم حفظ الإعدادات', 'Settings saved'));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--admin-accent)]" />
      </div>
    );
  }

  const tabs: Array<[SubTab, string, typeof Megaphone]> = [
    ['overview', tx(isAr, 'نظرة عامة', 'Overview'), BarChart3],
    ['moderation', tx(isAr, 'طلبات معلّقة', 'Pending queue'), Clock],
    ['published', tx(isAr, 'المنشورة', 'Published'), Megaphone],
    ['fields', tx(isAr, 'حقول الإعلان', 'Ad fields'), Settings2],
    ['placements', tx(isAr, 'أماكن الظهور', 'Placements'), MapPin],
    ['settings', tx(isAr, 'إعدادات عامة', 'Settings'), SlidersHorizontal],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            {tx(isAr, 'إعلانات المعلنين — لوحة التحكم الشاملة', 'Advertiser ads — full control')}
          </h2>
          <p className="text-sm text-[var(--admin-text-mute)] mt-1 max-w-3xl">
            {tx(
              isAr,
              'مراقبة الطلبات المعلقة والمنشورة، الموافقة/الرفض، الإيقاف والتمديد، الحقول، أماكن الظهور، والإعدادات العامة.',
              'Monitor pending & published ads, approve/reject, pause/extend, fields, placements, and platform settings.',
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.08]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {tx(isAr, 'تحديث', 'Refresh')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSubTab(id);
              setSelected(null);
              setSelectedIds(new Set());
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              subTab === id
                ? 'bg-[var(--admin-accent)]/20 text-[#f5c97b] border border-[#f5c97b]/30'
                : 'bg-white/[0.04] text-[var(--admin-text-mute)] border border-white/10 hover:bg-white/[0.08]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === 'moderation' && stats && stats.pendingReview > 0 && (
              <span className="rounded-full bg-sky-500/30 px-1.5 text-[10px] text-sky-100">
                {formatNumberEn(stats.pendingReview)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {subTab === 'overview' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[
              [tx(isAr, 'الإجمالي', 'Total'), stats.total, 'text-white'],
              [tx(isAr, 'بانتظار الموافقة', 'Pending review'), stats.pendingReview, 'text-sky-300'],
              [tx(isAr, 'بانتظار الدفع', 'Pending pay'), stats.pendingPayment, 'text-amber-300'],
              [tx(isAr, 'منشور', 'Published'), stats.approved, 'text-emerald-300'],
              [tx(isAr, 'متوقف', 'Paused'), stats.paused, 'text-orange-300'],
              [tx(isAr, 'منتهي/مرفوض', 'Expired/Rejected'), stats.expired + stats.rejected, 'text-zinc-300'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] text-[var(--admin-text-faint)]">{label}</p>
                <p className={`text-2xl font-bold tabular-nums mt-1 ${color}`}>{formatNumberEn(Number(value))}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatWide
              icon={CreditCard}
              label={tx(isAr, 'إيرادات مدفوعة', 'Paid revenue')}
              value={`$${formatNumberEn(stats.revenuePaid)}`}
            />
            <StatWide
              icon={Eye}
              label={tx(isAr, 'إجمالي المشاهدات', 'Total views')}
              value={formatNumberEn(stats.totalViews)}
            />
            <StatWide
              icon={MousePointerClick}
              label={tx(isAr, 'إجمالي النقرات', 'Total clicks')}
              value={formatNumberEn(stats.totalClicks)}
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white mb-3">{tx(isAr, 'أحدث الطلبات', 'Latest requests')}</p>
            <div className="space-y-2">
              {ads.slice(0, 8).map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => {
                    setSelected(ad);
                    setSubTab(
                      ['approved', 'paused', 'expired'].includes(ad.status) ? 'published' : 'moderation',
                    );
                  }}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-start hover:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{ad.title}</p>
                    <p className="text-[11px] text-[var(--admin-text-faint)] truncate">
                      {ad.advertiserName ?? ad.advertiserEmail}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[ad.status]}`}>
                    {statusLabel(ad.status, isAr)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Moderation / Published list ── */}
      {(subTab === 'moderation' || subTab === 'published') && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--admin-text-faint)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tx(isAr, 'بحث بالعنوان أو المعلن...', 'Search title or advertiser...')}
                className="admin-input w-full ps-9"
              />
            </div>
            <select
              className="admin-input w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AdvertiserAdStatus | 'all')}
            >
              <option value="all">{tx(isAr, 'كل الحالات', 'All statuses')}</option>
              {(subTab === 'moderation'
                ? (['pending_review', 'pending_payment', 'rejected', 'draft'] as AdvertiserAdStatus[])
                : (['approved', 'paused', 'expired'] as AdvertiserAdStatus[])
              ).map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s, isAr)}
                </option>
              ))}
            </select>
            <select
              className="admin-input w-auto"
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value as AdPlacementId | 'all')}
            >
              <option value="all">{tx(isAr, 'كل الأماكن', 'All placements')}</option>
              {settings?.placements.map((p) => (
                <option key={p.id} value={p.id}>
                  {placementLabel(p, isAr)}
                </option>
              ))}
            </select>
            <span className="text-xs text-[var(--admin-text-faint)] flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {formatNumberEn(filtered.length)}
            </span>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-2 rounded-xl border border-[#f5c97b]/25 bg-[#f5c97b]/5 px-3 py-2">
              <span className="text-xs text-[#f5c97b] self-center">
                {formatNumberEn(selectedIds.size)} {tx(isAr, 'محدد', 'selected')}
              </span>
              {subTab === 'moderation' && (
                <>
                  <BulkBtn onClick={() => bulk('approve')} label={tx(isAr, 'موافقة', 'Approve')} />
                  <BulkBtn onClick={() => bulk('reject')} label={tx(isAr, 'رفض', 'Reject')} />
                </>
              )}
              {subTab === 'published' && (
                <>
                  <BulkBtn onClick={() => bulk('pause')} label={tx(isAr, 'إيقاف', 'Pause')} />
                  <BulkBtn onClick={() => bulk('resume')} label={tx(isAr, 'استئناف', 'Resume')} />
                  <BulkBtn onClick={() => bulk('feature')} label={tx(isAr, 'تمييز', 'Feature')} />
                  <BulkBtn onClick={() => bulk('expire')} label={tx(isAr, 'إنهاء', 'Expire')} />
                </>
              )}
              <BulkBtn onClick={() => bulk('delete')} label={tx(isAr, 'حذف', 'Delete')} danger />
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-faint)] py-10 text-center">
                  {tx(isAr, 'لا توجد إعلانات مطابقة', 'No matching ads')}
                </p>
              ) : (
                filtered.map((ad) => (
                  <div
                    key={ad.id}
                    className={`rounded-2xl border p-3 transition-colors ${
                      selected?.id === ad.id
                        ? 'border-[#f5c97b]/40 bg-[#f5c97b]/5'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ad.id)}
                        onChange={() => toggleSelect(ad.id)}
                        className="mt-1 accent-amber-500"
                      />
                      <button type="button" className="flex-1 text-start" onClick={() => setSelected(ad)}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              {ad.isFeatured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                              <span className="truncate">{ad.title}</span>
                            </p>
                            <p className="text-xs text-[var(--admin-text-mute)] mt-0.5">
                              {ad.advertiserName ?? ad.advertiserEmail ?? ad.advertiserId}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[ad.status]}`}>
                            {statusLabel(ad.status, isAr)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--admin-text-faint)]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {(() => {
                              const p = settings?.placements.find((x) => x.id === ad.placementId);
                              return p ? placementLabel(p, isAr) : ad.placementId;
                            })()}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            ${formatNumberEn(ad.totalAmount)} · {ad.durationDays}d
                            {ad.isPaid ? ` · ${tx(isAr, 'مدفوع', 'paid')}` : ` · ${tx(isAr, 'غير مدفوع', 'unpaid')}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {formatNumberEn(ad.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3" /> {formatNumberEn(ad.clicks ?? 0)}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail panel */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 min-h-[320px] sticky top-4 self-start">
              {!selected ? (
                <p className="text-sm text-[var(--admin-text-faint)]">
                  {tx(isAr, 'اختر إعلاناً للمراجعة والتحكم', 'Select an ad to review & control')}
                </p>
              ) : (
                <div className="space-y-4">
                  {selected.videoUrl ? (
                    <video
                      src={selected.videoUrl}
                      poster={selected.images[0]}
                      controls
                      preload="metadata"
                      className="h-40 w-full rounded-xl bg-black object-cover"
                    />
                  ) : selected.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.images[0]} alt="" className="w-full h-32 object-cover rounded-xl" />
                  ) : null}

                  <div className="space-y-2">
                    <label className="text-[11px] text-[var(--admin-text-faint)]">{tx(isAr, 'العنوان', 'Title')}</label>
                    <input
                      className="admin-input"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-[var(--admin-text-faint)]">{tx(isAr, 'الوصف', 'Description')}</label>
                    <textarea
                      className="admin-input min-h-[60px]"
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-[var(--admin-text-faint)]">
                      {tx(isAr, 'رابط الفيديو', 'Video URL')}
                    </label>
                    <input
                      type="url"
                      className="admin-input"
                      value={editForm.videoUrl}
                      onChange={(e) => setEditForm((f) => ({ ...f, videoUrl: e.target.value }))}
                      placeholder="https://example.com/ad-video.mp4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-[var(--admin-text-faint)]">{tx(isAr, 'مكان الظهور', 'Placement')}</label>
                    <select
                      className="admin-input"
                      value={editForm.placementId}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, placementId: e.target.value as AdPlacementId }))
                      }
                    >
                      {settings?.placements.map((p) => (
                        <option key={p.id} value={p.id}>
                          {placementLabel(p, isAr)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[var(--admin-text-faint)]">{tx(isAr, 'المدة (يوم)', 'Days')}</label>
                      <select
                        className="admin-input"
                        value={editForm.durationDays}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, durationDays: Number(e.target.value) }))
                        }
                      >
                        {[...AD_DURATION_OPTIONS, 60, 90].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[var(--admin-text-faint)]">{tx(isAr, 'الأولوية', 'Priority')}</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={editForm.priority}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, priority: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isFeatured}
                      onChange={(e) => setEditForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                      className="accent-amber-500"
                    />
                    {tx(isAr, 'إعلان مميز (أولوية عرض)', 'Featured ad (priority display)')}
                  </label>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[var(--admin-text-faint)]">{tx(isAr, 'ملاحظات داخلية', 'Admin notes')}</label>
                    <textarea
                      className="admin-input min-h-[50px]"
                      value={editForm.adminNotes}
                      onChange={(e) => setEditForm((f) => ({ ...f, adminNotes: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-white/10 pt-3">
                    {settings?.fields
                      .filter((f) => f.enabled)
                      .map((field) => {
                        const val = selected.fields[field.key];
                        if (val == null || val === '') return null;
                        const display = Array.isArray(val) ? val.join(', ') : String(val);
                        return (
                          <div key={field.id} className="flex justify-between gap-2">
                            <span className="text-[var(--admin-text-faint)]">{fieldLabel(field, isAr)}</span>
                            <span className="text-white font-medium tabular-nums text-end">{display}</span>
                          </div>
                        );
                      })}
                    {selected.expiresAt && (
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--admin-text-faint)]">{tx(isAr, 'ينتهي', 'Expires')}</span>
                        <span className="text-white tabular-nums">
                          {formatDateEn(selected.expiresAt, isAr ? 'ar' : 'en')}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={saveSelected}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#f5c97b]/20 border border-[#f5c97b]/30 px-3 py-2 text-xs font-semibold text-[#f5c97b]"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {tx(isAr, 'حفظ التعديلات', 'Save changes')}
                  </button>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {selected.status === 'pending_review' && (
                      <>
                        <ActionBtn
                          icon={CheckCircle2}
                          label={tx(isAr, 'موافقة ونشر', 'Approve & publish')}
                          onClick={() => runAction(selected.id, 'approve')}
                          tone="emerald"
                        />
                        <ActionBtn
                          icon={XCircle}
                          label={tx(isAr, 'رفض', 'Reject')}
                          onClick={() => runAction(selected.id, 'reject')}
                          tone="rose"
                        />
                      </>
                    )}
                    {selected.status === 'pending_payment' && (
                      <ActionBtn
                        icon={CreditCard}
                        label={tx(isAr, 'تأكيد الدفع', 'Mark paid')}
                        onClick={async () => {
                          await fetch(`/api/advertiser-ads/${selected.id}/pay`, { method: 'POST' });
                          toast.success(tx(isAr, 'تم تأكيد الدفع', 'Marked paid'));
                          load();
                        }}
                        tone="amber"
                      />
                    )}
                    {selected.status === 'approved' && (
                      <ActionBtn
                        icon={Pause}
                        label={tx(isAr, 'إيقاف', 'Pause')}
                        onClick={() => runAction(selected.id, 'pause')}
                        tone="orange"
                      />
                    )}
                    {selected.status === 'paused' && (
                      <ActionBtn
                        icon={Play}
                        label={tx(isAr, 'استئناف', 'Resume')}
                        onClick={() => runAction(selected.id, 'resume')}
                        tone="emerald"
                      />
                    )}
                    {['approved', 'paused', 'expired'].includes(selected.status) && (
                      <>
                        <ActionBtn
                          icon={CalendarPlus}
                          label={tx(isAr, 'تمديد +7 أيام', 'Extend +7d')}
                          onClick={() => runAction(selected.id, 'extend', { extraDays: 7 })}
                          tone="sky"
                        />
                        <ActionBtn
                          icon={Ban}
                          label={tx(isAr, 'إنهاء', 'Expire')}
                          onClick={() => runAction(selected.id, 'expire')}
                          tone="zinc"
                        />
                      </>
                    )}
                    <ActionBtn
                      icon={Trash2}
                      label={tx(isAr, 'حذف', 'Delete')}
                      onClick={() => runAction(selected.id, 'delete')}
                      tone="rose"
                    />
                  </div>

                  {selected.rejectionReason && (
                    <p className="text-xs text-rose-300/80">
                      {tx(isAr, 'سبب الرفض:', 'Rejection:')} {selected.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Fields ── */}
      {subTab === 'fields' && settings && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--admin-text-mute)] mb-2">
            {tx(
              isAr,
              'فعّل/عطّل الحقول، واضبط كونها مطلوبة. تظهر للمعلن عند إنشاء الإعلان.',
              'Enable/disable fields and mark required. Shown to advertisers when creating ads.',
            )}
          </p>
          {settings.fields
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <div
                key={field.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{fieldLabel(field, isAr)}</p>
                  <p className="text-[10px] text-[var(--admin-text-faint)]">
                    {field.key} · {field.type} · #{field.order}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={!field.enabled}
                      onChange={(e) => toggleField(field, { required: e.target.checked })}
                      className="accent-amber-500"
                    />
                    {tx(isAr, 'مطلوب', 'Required')}
                  </label>
                  <button type="button" onClick={() => toggleField(field, { enabled: !field.enabled })}>
                    {field.enabled ? (
                      <ToggleRight className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-[var(--admin-text-faint)]" />
                    )}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Placements ── */}
      {subTab === 'placements' && settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {settings.placements.map((placement) => {
            const liveCount = ads.filter(
              (a) => a.placementId === placement.id && a.status === 'approved',
            ).length;
            return (
              <div key={placement.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{placementLabel(placement, isAr)}</p>
                    <p className="text-xs text-[var(--admin-text-mute)] mt-1">
                      {isAr ? placement.descriptionAr : placement.descriptionEn}
                    </p>
                  </div>
                  <button type="button" onClick={() => patchPlacement(placement, { enabled: !placement.enabled })}>
                    {placement.enabled ? (
                      <ToggleRight className="h-7 w-7 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-[var(--admin-text-faint)]" />
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--admin-text-faint)]">
                      {tx(isAr, 'سعر/يوم ($)', 'Price/day ($)')}
                    </label>
                    <input
                      type="number"
                      className="admin-input"
                      defaultValue={placement.pricePerDay}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v !== placement.pricePerDay) {
                          patchPlacement(placement, { pricePerDay: v });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--admin-text-faint)]">
                      {tx(isAr, 'الحد الأقصى', 'Max slots')}
                    </label>
                    <input
                      type="number"
                      className="admin-input"
                      defaultValue={placement.maxSlots}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v !== placement.maxSlots) {
                          patchPlacement(placement, { maxSlots: v });
                        }
                      }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-[var(--admin-text-faint)]">
                  {tx(isAr, 'منشور حالياً:', 'Live now:')} {formatNumberEn(liveCount)} /{' '}
                  {formatNumberEn(placement.maxSlots)}
                  {' · '}
                  {AD_DURATION_OPTIONS.map((d) => (
                    <span key={d} className="me-2">
                      {d}d=${formatNumberEn(calcAdTotal(placement.pricePerDay, d))}
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Platform settings ── */}
      {subTab === 'settings' && settings && (
        <div className="max-w-2xl space-y-3">
          {(
            [
              ['requirePaymentBeforeReview', tx(isAr, 'الدفع مطلوب قبل المراجعة', 'Payment required before review')],
              ['autoExpireEnabled', tx(isAr, 'إنهاء تلقائي عند انتهاء المدة', 'Auto-expire when duration ends')],
              ['allowAdvertiserEditPending', tx(isAr, 'السماح للمعلن بتعديل الطلبات المعلقة', 'Allow advertiser to edit pending ads')],
              ['featureOnApprove', tx(isAr, 'تمييز الإعلان تلقائياً عند الموافقة', 'Feature ad automatically on approve')],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span className="text-sm text-white">{label}</span>
              <button
                type="button"
                onClick={() =>
                  savePlatform({ [key]: !settings.platform[key] } as Partial<AdvertiserAdSettings['platform']>)
                }
              >
                {settings.platform[key] ? (
                  <ToggleRight className="h-8 w-8 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-[var(--admin-text-faint)]" />
                )}
              </button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <label className="text-[11px] text-[var(--admin-text-faint)]">
                {tx(isAr, 'المدة الافتراضية (يوم)', 'Default duration (days)')}
              </label>
              <select
                className="admin-input"
                value={settings.platform.defaultDurationDays}
                onChange={(e) => savePlatform({ defaultDurationDays: Number(e.target.value) })}
              >
                {AD_DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[var(--admin-text-faint)]">
                {tx(isAr, 'أقصى عدد صور', 'Max images')}
              </label>
              <input
                type="number"
                className="admin-input"
                defaultValue={settings.platform.maxImages}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v !== settings.platform.maxImages) {
                    savePlatform({ maxImages: v });
                  }
                }}
              />
            </div>
          </div>
          <p className="text-xs text-[var(--admin-text-faint)]">
            {tx(
              isAr,
              'الفئة الافتراضية للمعلنين:',
              'Default advertiser category:',
            )}{' '}
            <strong className="text-white">
              {isAr ? settings.defaultCategoryLabelAr : settings.defaultCategoryLabelEn}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}

function StatWide({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5c97b]/10">
        <Icon className="h-5 w-5 text-[#f5c97b]" />
      </div>
      <div>
        <p className="text-[11px] text-[var(--admin-text-faint)]">{label}</p>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function BulkBtn({
  onClick,
  label,
  danger,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
        danger
          ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
          : 'bg-white/10 text-white border border-white/15'
      }`}
    >
      {label}
    </button>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  onClick: () => void;
  tone: 'emerald' | 'rose' | 'amber' | 'orange' | 'sky' | 'zinc';
}) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-600/80 text-white',
    rose: 'bg-rose-600/80 text-white',
    amber: 'bg-amber-600/80 text-white',
    orange: 'bg-orange-600/80 text-white',
    sky: 'bg-sky-600/80 text-white',
    zinc: 'bg-zinc-600/80 text-white',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
