'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building,
  Loader2,
  ListChecks,
  KeyRound,
  Mail,
  Phone,
  Globe,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Agent, Company } from '@/types';
import {
  COMPANY_ADMIN_PERMISSIONS,
  defaultPermissionMap,
  normalizeAdminPermissions,
  normalizeAdminTasks,
  type AdminPermissionMap,
} from '@/lib/admin-entity-permissions';
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

type CompanyDetail = Company & {
  agents?: Agent[];
  _count?: { agents: number };
};

interface Props {
  companyId: string;
  isAr: boolean;
  onBack: () => void;
  onUpdated?: () => void;
}

export function CompanySettingsPanel({ companyId, isAr, onBack, onUpdated }: Props) {
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'profile' | 'permissions' | 'tasks' | 'team'>('profile');
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    logo: '',
    founded: '',
    defaultCommissionPercent: '',
  });
  const [permissions, setPermissions] = useState<AdminPermissionMap>(() =>
    defaultPermissionMap(COMPANY_ADMIN_PERMISSIONS)
  );
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminJson<CompanyDetail>(`/api/companies/${companyId}`);
      setCompany(data);
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        website: data.website ?? '',
        address: data.address ?? '',
        logo: data.logo ?? '',
        founded: data.founded != null ? String(data.founded) : '',
        defaultCommissionPercent:
          data.defaultCommissionPercent != null ? String(data.defaultCommissionPercent) : '',
      });
      setPermissions(normalizeAdminPermissions(data.adminPermissions, COMPANY_ADMIN_PERMISSIONS));
      setTasks(normalizeAdminTasks(data.adminTasks));
    } catch (e) {
      toast.error(tx('تعذر تحميل الشركة', 'Could not load company'), {
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminJson<CompanyDetail>(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          email: form.email || null,
          phone: form.phone || null,
          website: form.website || null,
          address: form.address || null,
          logo: form.logo || null,
          founded: form.founded ? Number(form.founded) : null,
          defaultCommissionPercent: form.defaultCommissionPercent.trim()
            ? Number(form.defaultCommissionPercent)
            : null,
          adminPermissions: permissions,
          adminTasks: tasks,
        }),
      });
      setCompany(updated);
      invalidate('agents');
      onUpdated?.();
      toast.success(tx('تم الحفظ', 'Saved'));
    } catch (e) {
      toast.error(tx('فشل الحفظ', 'Save failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: tx('الملف', 'Profile'), icon: Building },
    { id: 'permissions' as const, label: tx('الصلاحيات', 'Permissions'), icon: KeyRound },
    { id: 'tasks' as const, label: tx('المهام', 'Tasks'), icon: ListChecks },
    { id: 'team' as const, label: tx('الفريق', 'Team'), icon: Users },
  ];

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f5c97b]" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="admin-card p-6 text-center">
        <p className="text-sm text-[var(--admin-text-mute)]">{tx('الشركة غير موجودة', 'Company not found')}</p>
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
          {tx('كل الشركات', 'All companies')}
        </button>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-lg font-bold text-[var(--admin-text)] flex items-center gap-2">
            <Building className="h-5 w-5 text-[#f5c97b]" />
            {company.name}
          </h2>
          <p className="text-xs text-[var(--admin-text-mute)]">
            {company._count?.agents ?? company.agentCount ?? 0} {tx('وكيل', 'agents')} ·{' '}
            {company.listingCount ?? 0} {tx('إعلان', 'listings')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-amber-500/20 text-amber-100 border border-amber-400/30'
                : 'text-[var(--admin-text-mute)] hover:bg-white/5'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-card p-5 space-y-4">
        {tab === 'profile' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={tx('اسم الشركة', 'Company name')}>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={tx('سنة التأسيس', 'Founded')}>
              <input
                type="number"
                className="admin-input"
                value={form.founded}
                onChange={(e) => setForm({ ...form, founded: e.target.value })}
              />
            </Field>
            <Field label={tx('العمولة الافتراضية (%)', 'Default commission (%)')}>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                className="admin-input"
                value={form.defaultCommissionPercent}
                onChange={(e) => setForm({ ...form, defaultCommissionPercent: e.target.value })}
                placeholder="3.0"
              />
            </Field>
            <Field label={tx('البريد', 'Email')}>
              <input className="admin-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label={tx('الهاتف', 'Phone')}>
              <input className="admin-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label={tx('الموقع', 'Website')}>
              <input className="admin-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </Field>
            <Field label={tx('الشعار (رابط)', 'Logo URL')}>
              <input className="admin-input" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={tx('العنوان', 'Address')}>
                <input className="admin-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label={tx('الوصف', 'Description')}>
                <textarea
                  className="admin-input min-h-[100px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
            {(form.email || form.phone || form.website) && (
              <div className="sm:col-span-2 flex flex-wrap gap-4 text-sm text-[var(--admin-text-mute)]">
                {form.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {form.email}
                  </span>
                )}
                {form.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {form.phone}
                  </span>
                )}
                {form.website && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {form.website}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'permissions' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {COMPANY_ADMIN_PERMISSIONS.map((perm) => (
              <label
                key={perm.key}
                className="flex items-start gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.03] cursor-pointer hover:border-amber-400/25"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(permissions[perm.key])}
                  onChange={(e) => setPermissions((p) => ({ ...p, [perm.key]: e.target.checked }))}
                />
                <span className="text-sm">{tx(perm.ar, perm.en)}</span>
              </label>
            ))}
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--admin-text-mute)]">
              {tx('مهام إدارية ومتابعات للشركة', 'Admin tasks and follow-ups for the company')}
            </p>
            <ul className="space-y-2">
              {tasks.map((task, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    className="admin-input flex-1"
                    value={task}
                    onChange={(e) => {
                      const next = [...tasks];
                      next[i] = e.target.value;
                      setTasks(next);
                    }}
                  />
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                className="admin-input flex-1"
                placeholder={tx('مهمة جديدة…', 'New task…')}
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <button
                type="button"
                className="admin-btn-premium !text-xs"
                onClick={() => {
                  if (!newTask.trim()) return;
                  setTasks([...tasks, newTask.trim()]);
                  setNewTask('');
                }}
              >
                {tx('إضافة', 'Add')}
              </button>
            </div>
          </div>
        )}

        {tab === 'team' && (
          <div>
            {company.agents && company.agents.length > 0 ? (
              <ul className="space-y-2">
                {company.agents.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.03]"
                  >
                    <div>
                      <div className="font-medium">{a.user?.name ?? '—'}</div>
                      <div className="text-[11px] text-[var(--admin-text-faint)]">{a.user?.email}</div>
                    </div>
                    <span className="text-xs text-[var(--admin-text-mute)]">
                      {a.verified ? tx('موثّق', 'Verified') : tx('غير موثّق', 'Unverified')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--admin-text-mute)]">{tx('لا يوجد وكلاء مرتبطون', 'No linked agents')}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="button" className="admin-btn-premium" disabled={saving} onClick={() => void save()}>
          {saving ? tx('جارٍ الحفظ…', 'Saving…') : tx('حفظ التغييرات', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
