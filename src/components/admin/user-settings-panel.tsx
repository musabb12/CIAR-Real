'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Heart,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Agent, Property, User as AppUser } from '@/types';
import { userRoleLabel } from '@/lib/admin-labels';
import { formatNumberEn } from '@/lib/format-numbers';
import { getSeedCountryById } from '@/lib/seed-countries-catalog';
import { countryDisplayName } from '@/lib/country-flags';
import { listDemoProperties } from '@/lib/demo-properties';
import { invalidate } from '@/lib/admin-events';

async function adminJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : `HTTP ${res.status}`);
  }
  return data as T;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-white/80 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

type UserDetail = AppUser & {
  agent?: Agent;
  _count?: { favorites: number; inquiries: number };
};

interface Props {
  userId: string;
  isAr: boolean;
  onBack: () => void;
  onUpdated?: () => void;
}

export function UserSettingsPanel({ userId, isAr, onBack, onUpdated }: Props) {
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', role: 'USER', isActive: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminJson<UserDetail>(`/api/users/${userId}`);
      setUser(data);
      setForm({
        name: data.name ?? '',
        phone: data.phone ?? '',
        role: data.role,
        isActive: Boolean(data.isActive),
      });
      if (data.agent?.id) {
        try {
          const agentDetail = await adminJson<Agent & { properties?: Property[] }>(`/api/agents/${data.agent.id}`);
          setProperties(agentDetail.properties ?? []);
        } catch {
          setProperties(listDemoProperties({ agentId: data.agent.id, admin: true, limit: 80 }).data);
        }
      } else {
        setProperties([]);
      }
    } catch (e) {
      toast.error(tx('تعذر تحميل المستخدم', 'Could not load user'), {
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const countryLabel = useMemo(() => {
    const countryId = user?.agent?.countryId;
    if (!countryId) return null;
    const seed = getSeedCountryById(countryId);
    if (seed) return countryDisplayName(seed.code, isAr ? 'ar' : 'en');
    return countryId;
  }, [user?.agent?.countryId, isAr]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminJson<UserDetail>(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || null,
          phone: form.phone || null,
          role: form.role,
          isActive: form.isActive,
        }),
      });
      setUser(updated);
      invalidate('users');
      onUpdated?.();
      toast.success(tx('تم الحفظ', 'Saved'));
    } catch (e) {
      toast.error(tx('فشل الحفظ', 'Save failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f5c97b]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-card p-6 text-center">
        <p className="text-sm text-[var(--admin-text-mute)]">{tx('المستخدم غير موجود', 'User not found')}</p>
        <button type="button" className="admin-btn-premium mt-4" onClick={onBack}>
          {tx('رجوع', 'Back')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} className="admin-icon-btn !w-auto px-3 gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" />
          {tx('كل المستخدمين', 'All users')}
        </button>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-lg font-bold text-[var(--admin-text)] flex items-center gap-2">
            <User className="h-5 w-5 text-[#f5c97b]" />
            {user.name ?? user.email}
          </h2>
          <p className="text-xs text-[var(--admin-text-mute)]">{user.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="admin-card p-5 space-y-4">
          <h3 className="font-semibold text-[var(--admin-text)]">{tx('الملف الشخصي', 'Profile')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={tx('الاسم', 'Name')}>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={tx('الهاتف', 'Phone')}>
              <input className="admin-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label={tx('الدور', 'Role')}>
              <select className="admin-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {['USER', 'AGENT', 'COMPANY', 'ADMIN'].map((role) => (
                  <option key={role} value={role}>
                    {userRoleLabel(isAr, role)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                {tx('حساب نشط', 'Active account')}
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--admin-text-mute)]">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {user._count?.favorites ?? 0} {tx('مفضلة', 'favorites')}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {user._count?.inquiries ?? 0} {tx('استفسار', 'inquiries')}
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              {userRoleLabel(isAr, user.role)}
            </span>
          </div>
          <button type="button" className="admin-btn-premium" disabled={saving} onClick={() => void save()}>
            {saving ? tx('جارٍ الحفظ…', 'Saving…') : tx('حفظ', 'Save')}
          </button>
        </div>

        {user.agent ? (
          <div className="admin-card p-5 space-y-3">
            <h3 className="font-semibold text-[var(--admin-text)] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#f5c97b]" />
              {tx('ملف الوكيل المرتبط', 'Linked agent profile')}
            </h3>
            <p className="text-sm">{user.agent.title ?? tx('وكيل عقاري', 'Real estate agent')}</p>
            {countryLabel && (
              <p className="text-xs text-[var(--admin-text-mute)]">
                {tx('الدولة', 'Country')}: <span className="text-amber-200/90">{countryLabel}</span>
              </p>
            )}
            {user.agent.company?.name && (
              <p className="text-xs text-[var(--admin-text-mute)]">
                {tx('الشركة', 'Company')}: {user.agent.company.name}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-[var(--admin-text-mute)]">
              {user.agent.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {user.agent.phone}
                </span>
              )}
              {user.agent.whatsapp && <span>WhatsApp: {user.agent.whatsapp}</span>}
              {user.agent.defaultCommissionPercent != null && (
                <span>
                  {tx('العمولة', 'Commission')}: {user.agent.defaultCommissionPercent}%
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--admin-text-faint)]">{user.agent.bio}</p>
          </div>
        ) : null}
      </div>

      {properties.length > 0 ? (
        <div className="admin-card p-5 space-y-3">
          <h3 className="font-semibold text-[var(--admin-text)]">
            {tx('عقارات المستخدم', 'User listings')} ({properties.length})
          </h3>
          <ul className="divide-y divide-white/10 max-h-80 overflow-y-auto admin-scrollbar">
            {properties.map((p) => (
              <li key={p.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium line-clamp-1">{p.title}</div>
                  <div className="text-[11px] text-[var(--admin-text-faint)]">
                    {p.city?.name ?? '—'} · {p.propertyType} · {p.listingType}
                    {p.commissionPercent != null ? ` · ${p.commissionPercent}%` : ''}
                  </div>
                </div>
                <span className="text-amber-200/90 tabular-nums shrink-0">${formatNumberEn(p.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
