'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Building2,
  Globe2,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { FlagPicker, CountryFlagBadge } from '@/components/admin/flag-picker';
import { normalizeFlagStorage } from '@/lib/country-flags';
import { cn } from '@/lib/utils';

type CityRow = {
  id: string;
  name: string;
  regionId: string;
  _count?: { properties: number };
};

type RegionRow = {
  id: string;
  name: string;
  countryId: string;
  cities?: CityRow[];
  _count?: { properties: number };
};

export type CountryDetail = {
  id: string;
  name: string;
  code: string;
  flag?: string | null;
  currency?: string | null;
  currencySymbol?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  regions?: RegionRow[];
  _count?: { properties: number };
  quotaExceeded?: boolean;
  dataSource?: string;
  readOnly?: boolean;
  warning?: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-white/80 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

async function adminJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : `HTTP ${res.status}`);
  }
  return data as T;
}

function mapSettingsError(isAr: boolean, message: string): string {
  const m = message.trim();
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  if (/region still has properties/i.test(m)) {
    return tx('لا يمكن حذف المنطقة لوجود عقارات مرتبطة.', 'Cannot delete region with linked properties.');
  }
  if (/city still has properties/i.test(m)) {
    return tx('لا يمكن حذف المدينة لوجود عقارات مرتبطة.', 'Cannot delete city with linked properties.');
  }
  return m;
}

interface Props {
  countryId: string;
  isAr: boolean;
  onBack: () => void;
  onUpdated?: () => void;
}

export function CountrySettingsPanel({ countryId, isAr, onBack, onUpdated }: Props) {
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [country, setCountry] = useState<CountryDetail | null>(null);
  const [tab, setTab] = useState<'general' | 'regions' | 'display'>('general');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    name: '',
    code: '',
    flag: '',
    currency: '',
    currencySymbol: '',
    isActive: true,
    isFeatured: false,
  });

  const [newRegionName, setNewRegionName] = useState('');
  const [newCityByRegion, setNewCityByRegion] = useState<Record<string, string>>({});
  const [editingRegion, setEditingRegion] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [editNames, setEditNames] = useState<Record<string, string>>({});
  const [readOnly, setReadOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminJson<CountryDetail>(`/api/locations/${countryId}`);
      setCountry(data);
      setReadOnly(Boolean(data.readOnly || data.quotaExceeded || data.dataSource === 'demo'));
      if (data.quotaExceeded || data.dataSource === 'demo') {
        toast.warning(
          tx(
            'وضع العرض التجريبي: حصة Firebase منتهية. يمكنك استعراض المناطق والمدن لكن لا يمكن الحفظ حتى إعادة التعيين.',
            'Demo view: Firebase quota exceeded. You can browse regions and cities but cannot save until quota resets.',
          ),
          { duration: 10000 },
        );
      }
      setForm({
        name: data.name,
        code: data.code,
        flag: normalizeFlagStorage(data.flag, data.code) ?? data.code,
        currency: data.currency ?? '',
        currencySymbol: data.currencySymbol ?? '',
        isActive: data.isActive !== false,
        isFeatured: Boolean(data.isFeatured),
      });
    } catch (e) {
      toast.error(tx('تعذر تحميل الدولة', 'Failed to load country'), {
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setLoading(false);
    }
  }, [countryId, isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const blockIfReadOnly = () => {
    if (!readOnly) return false;
    toast.error(
      tx(
        'لا يمكن الحفظ: قاعدة البيانات غير متاحة (حصة Firebase).',
        'Cannot save: database unavailable (Firebase quota).',
      ),
    );
    return true;
  };

  const saveGeneral = async () => {
    if (blockIfReadOnly()) return;
    if (!form.name.trim() || !form.code.trim()) {
      toast.error(tx('الاسم والرمز مطلوبان', 'Name and code are required'));
      return;
    }
    setSaving(true);
    try {
      const updated = await adminJson<CountryDetail>(`/api/locations/${countryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          flag: normalizeFlagStorage(form.flag, form.code),
          currency: form.currency.trim() || null,
          currencySymbol: form.currencySymbol.trim() || null,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
        }),
      });
      setCountry(updated);
      toast.success(tx('تم حفظ الإعدادات', 'Settings saved'));
      onUpdated?.();
    } catch (e) {
      toast.error(tx('فشل الحفظ', 'Save failed'), {
        description: e instanceof Error ? mapSettingsError(isAr, e.message) : '',
      });
    } finally {
      setSaving(false);
    }
  };

  const addRegion = async () => {
    const name = newRegionName.trim();
    if (!name) return;
    try {
      await adminJson(`/api/locations/${countryId}/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setNewRegionName('');
      toast.success(tx('تمت إضافة المنطقة', 'Region added'));
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(tx('فشل الإضافة', 'Add failed'), {
        description: e instanceof Error ? mapSettingsError(isAr, e.message) : '',
      });
    }
  };

  const addCity = async (regionId: string) => {
    if (blockIfReadOnly()) return;
    const name = (newCityByRegion[regionId] ?? '').trim();
    if (!name) return;
    try {
      await adminJson(`/api/locations/${countryId}/regions/${regionId}/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setNewCityByRegion((p) => ({ ...p, [regionId]: '' }));
      toast.success(tx('تمت إضافة المدينة', 'City added'));
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(tx('فشل الإضافة', 'Add failed'), {
        description: e instanceof Error ? mapSettingsError(isAr, e.message) : '',
      });
    }
  };

  const saveRegionName = async (regionId: string) => {
    if (blockIfReadOnly()) return;
    const name = (editNames[`r-${regionId}`] ?? '').trim();
    if (!name) return;
    try {
      await adminJson(`/api/locations/${countryId}/regions/${regionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setEditingRegion(null);
      toast.success(tx('تم التحديث', 'Updated'));
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(tx('فشل التحديث', 'Update failed'), {
        description: e instanceof Error ? mapSettingsError(isAr, e.message) : '',
      });
    }
  };

  const saveCityName = async (regionId: string, cityId: string) => {
    if (blockIfReadOnly()) return;
    const name = (editNames[`c-${cityId}`] ?? '').trim();
    if (!name) return;
    try {
      await adminJson(`/api/locations/${countryId}/regions/${regionId}/cities/${cityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setEditingCity(null);
      toast.success(tx('تم التحديث', 'Updated'));
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(tx('فشل التحديث', 'Update failed'), {
        description: e instanceof Error ? mapSettingsError(isAr, e.message) : '',
      });
    }
  };

  const deleteRegion = async (regionId: string) => {
    if (!window.confirm(tx('حذف المنطقة وجميع مدنها؟', 'Delete this region and its cities?'))) return;
    try {
      await adminJson(`/api/locations/${countryId}/regions/${regionId}`, { method: 'DELETE' });
      toast.success(tx('تم الحذف', 'Deleted'));
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(tx('تعذر الحذف', 'Delete failed'), {
        description: e instanceof Error ? mapSettingsError(isAr, e.message) : '',
      });
    }
  };

  const deleteCity = async (regionId: string, cityId: string) => {
    if (blockIfReadOnly()) return;
    if (!window.confirm(tx('حذف المدينة؟', 'Delete this city?'))) return;
    try {
      await adminJson(`/api/locations/${countryId}/regions/${regionId}/cities/${cityId}`, {
        method: 'DELETE',
      });
      toast.success(tx('تم الحذف', 'Deleted'));
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(tx('تعذر الحذف', 'Delete failed'), {
        description: e instanceof Error ? mapSettingsError(isAr, e.message) : '',
      });
    }
  };

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!country) {
    return (
      <div className="admin-card p-8 text-center">
        <p className="text-[var(--admin-text-mute)]">{tx('الدولة غير موجودة', 'Country not found')}</p>
        <button type="button" className="admin-btn-premium mt-4" onClick={onBack}>
          {tx('رجوع', 'Back')}
        </button>
      </div>
    );
  }

  const regions = country.regions ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="admin-icon-btn" onClick={onBack} aria-label={tx('رجوع', 'Back')}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <CountryFlagBadge flag={form.flag} code={form.code} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-bold truncate">{country.name}</h2>
          <p className="text-xs text-[var(--admin-text-faint)]">
            {tx('إعدادات الدولة', 'Country settings')} · {form.code} ·{' '}
            {country._count?.properties ?? 0} {tx('عقار', 'listings')}
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-premium"
          disabled={saving || readOnly}
          onClick={() => void saveGeneral()}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tx('حفظ الكل', 'Save all')}
        </button>
      </div>

      {readOnly && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {tx(
            'عرض تجريبي فقط — حصة Firebase منتهية. انتظر إعادة التعيين أو رقِّ الخطة في Firebase Console لحفظ التعديلات.',
            'Read-only demo — Firebase quota exceeded. Wait for reset or upgrade Firebase to save changes.',
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {(
          [
            ['general', tx('عام', 'General'), Settings2],
            ['regions', tx('المناطق والمدن', 'Regions & cities'), MapPin],
            ['display', tx('العرض', 'Display'), Globe2],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
              tab === id
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                : 'text-[var(--admin-text-mute)] hover:bg-white/5',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="admin-card p-5 grid gap-4 lg:grid-cols-2">
          <Field label={tx('اسم الدولة', 'Country name')}>
            <input
              className="admin-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label={tx('الرمز (ISO)', 'ISO code')}>
            <input
              className="admin-input font-mono"
              value={form.code}
              onChange={(e) => {
                const code = e.target.value.toUpperCase().slice(0, 2);
                setForm((f) => ({
                  ...f,
                  code,
                  flag: f.flag || code,
                }));
              }}
            />
          </Field>
          <Field label={tx('العملة', 'Currency')}>
            <input
              className="admin-input"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              placeholder="SAR"
            />
          </Field>
          <Field label={tx('رمز العملة', 'Currency symbol')}>
            <input
              className="admin-input"
              value={form.currencySymbol}
              onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
              placeholder="ر.س"
            />
          </Field>
          <div className="lg:col-span-2">
            <Field label={tx('علم الدولة', 'Country flag')}>
              <FlagPicker
                value={form.flag}
                countryCode={form.code}
                isAr={isAr}
                onChange={(code) => setForm({ ...form, flag: code })}
              />
            </Field>
          </div>
        </div>
      )}

      {tab === 'regions' && (
        <div className="space-y-4">
          <div className="admin-card p-4 flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <Field label={tx('إضافة ولاية / محافظة / منطقة', 'Add state / province / region')}>
                <input
                  className="admin-input"
                  value={newRegionName}
                  onChange={(e) => setNewRegionName(e.target.value)}
                  placeholder={tx('مثال: الرياض', 'e.g. Riyadh Province')}
                  onKeyDown={(e) => e.key === 'Enter' && void addRegion()}
                />
              </Field>
            </div>
            <button type="button" className="admin-btn-premium shrink-0" onClick={() => void addRegion()}>
              <Plus className="h-4 w-4 me-1" />
              {tx('إضافة منطقة', 'Add region')}
            </button>
          </div>

          {regions.length === 0 ? (
            <div className="admin-card p-8 text-center text-sm text-[var(--admin-text-faint)]">
              {tx('لا توجد مناطق بعد. أضف أول منطقة أعلاه.', 'No regions yet. Add your first region above.')}
            </div>
          ) : (
            regions.map((region) => {
              const open = expandedRegions.has(region.id);
              const cities = region.cities ?? [];
              return (
                <div key={region.id} className="admin-card overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-white/5">
                    <button
                      type="button"
                      className="admin-icon-btn !h-8 !w-8"
                      onClick={() => toggleRegion(region.id)}
                    >
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {editingRegion === region.id ? (
                      <input
                        className="admin-input flex-1 h-9"
                        value={editNames[`r-${region.id}`] ?? region.name}
                        onChange={(e) =>
                          setEditNames((p) => ({ ...p, [`r-${region.id}`]: e.target.value }))
                        }
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{region.name}</p>
                        <p className="text-[11px] text-[var(--admin-text-faint)]">
                          {cities.length} {tx('مدينة', 'cities')} · {region._count?.properties ?? 0}{' '}
                          {tx('عقار', 'listings')}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {editingRegion === region.id ? (
                        <button
                          type="button"
                          className="admin-icon-btn !h-8 !w-8 text-emerald-400"
                          onClick={() => void saveRegionName(region.id)}
                        >
                          <CheckIcon />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-icon-btn !h-8 !w-8"
                          onClick={() => {
                            setEditingRegion(region.id);
                            setEditNames((p) => ({ ...p, [`r-${region.id}`]: region.name }));
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="admin-icon-btn !h-8 !w-8 text-rose-400"
                        onClick={() => void deleteRegion(region.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="p-4 space-y-3 bg-black/10">
                      <div className="flex flex-wrap gap-2">
                        <input
                          className="admin-input flex-1 min-w-[160px] h-9"
                          value={newCityByRegion[region.id] ?? ''}
                          onChange={(e) =>
                            setNewCityByRegion((p) => ({ ...p, [region.id]: e.target.value }))
                          }
                          placeholder={tx('اسم المدينة', 'City name')}
                          onKeyDown={(e) => e.key === 'Enter' && void addCity(region.id)}
                        />
                        <button
                          type="button"
                          className="admin-icon-btn !w-auto px-3 text-xs"
                          onClick={() => void addCity(region.id)}
                        >
                          <Plus className="h-3.5 w-3.5 me-1" />
                          {tx('مدينة', 'City')}
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {cities.map((city) => (
                          <li
                            key={city.id}
                            className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                          >
                            <Building2 className="h-3.5 w-3.5 text-[var(--admin-text-faint)] shrink-0" />
                            {editingCity === city.id ? (
                              <input
                                className="admin-input flex-1 h-8 text-sm"
                                value={editNames[`c-${city.id}`] ?? city.name}
                                onChange={(e) =>
                                  setEditNames((p) => ({ ...p, [`c-${city.id}`]: e.target.value }))
                                }
                              />
                            ) : (
                              <span className="flex-1 text-sm font-medium">{city.name}</span>
                            )}
                            <span className="text-[10px] text-[var(--admin-text-faint)] tabular-nums">
                              {city._count?.properties ?? 0}
                            </span>
                            {editingCity === city.id ? (
                              <button
                                type="button"
                                className="admin-icon-btn !h-7 !w-7 text-emerald-400"
                                onClick={() => void saveCityName(region.id, city.id)}
                              >
                                <CheckIcon />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="admin-icon-btn !h-7 !w-7"
                                onClick={() => {
                                  setEditingCity(city.id);
                                  setEditNames((p) => ({ ...p, [`c-${city.id}`]: city.name }));
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              className="admin-icon-btn !h-7 !w-7 text-rose-400"
                              onClick={() => void deleteCity(region.id, city.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                        {cities.length === 0 && (
                          <li className="text-xs text-[var(--admin-text-faint)] py-2 text-center">
                            {tx('لا مدن في هذه المنطقة', 'No cities in this region')}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'display' && (
        <div className="admin-card p-5 space-y-4 max-w-lg">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-semibold text-sm">{tx('دولة نشطة', 'Active country')}</p>
              <p className="text-xs text-[var(--admin-text-faint)]">
                {tx('تظهر في البحث والقوائم العامة', 'Visible in search and public lists')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-5 w-5 rounded accent-amber-500"
            />
          </label>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-semibold text-sm">{tx('دولة مميزة', 'Featured country')}</p>
              <p className="text-xs text-[var(--admin-text-faint)]">
                {tx('تُبرز في الصفحة الرئيسية', 'Highlighted on the homepage')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="h-5 w-5 rounded accent-amber-500"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
