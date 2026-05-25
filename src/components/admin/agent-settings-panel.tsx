'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Star,
  User,
  ListChecks,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Agent } from '@/types';
import {
  AGENT_ADMIN_PERMISSIONS,
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

type AgentDetail = Agent & {
  _count?: { properties: number };
  properties?: Array<{ id: string; title: string }>;
};

interface Props {
  agentId: string;
  isAr: boolean;
  onBack: () => void;
  onUpdated?: () => void;
}

export function AgentSettingsPanel({ agentId, isAr, onBack, onUpdated }: Props) {
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'profile' | 'permissions' | 'tasks'>('profile');
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [form, setForm] = useState({
    title: '',
    bio: '',
    license: '',
    phone: '',
    whatsapp: '',
    experience: '',
    verified: false,
  });
  const [permissions, setPermissions] = useState<AdminPermissionMap>(() =>
    defaultPermissionMap(AGENT_ADMIN_PERMISSIONS)
  );
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminJson<AgentDetail>(`/api/agents/${agentId}`);
      setAgent(data);
      setForm({
        title: data.title ?? '',
        bio: data.bio ?? '',
        license: data.license ?? '',
        phone: data.phone ?? '',
        whatsapp: data.whatsapp ?? '',
        experience: data.experience != null ? String(data.experience) : '',
        verified: Boolean(data.verified),
      });
      setPermissions(normalizeAdminPermissions(data.adminPermissions, AGENT_ADMIN_PERMISSIONS));
      setTasks(normalizeAdminTasks(data.adminTasks));
    } catch (e) {
      toast.error(tx('تعذر تحميل الوكيل', 'Could not load agent'), {
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setLoading(false);
    }
  }, [agentId, isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminJson<AgentDetail>(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title || null,
          bio: form.bio || null,
          license: form.license || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          experience: form.experience ? Number(form.experience) : null,
          verified: form.verified,
          adminPermissions: permissions,
          adminTasks: tasks,
        }),
      });
      setAgent(updated);
      invalidate('agents');
      onUpdated?.();
      toast.success(tx('تم الحفظ', 'Saved'));
    } catch (e) {
      toast.error(tx('فشل الحفظ', 'Save failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSaving(false);
    }
  };

  const deleteAgent = async () => {
    if (!window.confirm(tx('حذف الوكيل نهائياً؟', 'Permanently delete this agent?'))) return;
    try {
      await adminJson(`/api/agents/${agentId}`, { method: 'DELETE' });
      invalidate('agents');
      onUpdated?.();
      toast.success(tx('تم الحذف', 'Deleted'));
      onBack();
    } catch (e) {
      toast.error(tx('فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
    }
  };

  const tabs = [
    { id: 'profile' as const, label: tx('الملف', 'Profile'), icon: User },
    { id: 'permissions' as const, label: tx('الصلاحيات', 'Permissions'), icon: KeyRound },
    { id: 'tasks' as const, label: tx('المهام', 'Tasks'), icon: ListChecks },
  ];

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f5c97b]" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="admin-card p-6 text-center">
        <p className="text-sm text-[var(--admin-text-mute)]">{tx('الوكيل غير موجود', 'Agent not found')}</p>
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
          {tx('كل الوكلاء', 'All agents')}
        </button>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-lg font-bold text-[var(--admin-text)] flex items-center gap-2">
            {agent.user?.name ?? tx('وكيل', 'Agent')}
            {agent.verified ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <ShieldOff className="h-4 w-4 text-[var(--admin-text-faint)]" />
            )}
          </h2>
          <p className="text-xs text-[var(--admin-text-mute)]">{agent.user?.email}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-[#f5c97b] fill-current" />
          <span className="font-bold">{agent.rating?.toFixed(1) ?? '0.0'}</span>
          <span className="text-[var(--admin-text-faint)]">·</span>
          <span className="text-[var(--admin-text-mute)]">
            {agent._count?.properties ?? agent.totalListings ?? 0} {tx('عقار', 'listings')}
          </span>
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
          <>
            {agent.company?.name && (
              <p className="text-sm text-[var(--admin-text-mute)]">
                {tx('الشركة', 'Company')}: <span className="text-[#f5c97b]">{agent.company.name}</span>
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={tx('المسمى', 'Title')}>
                <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label={tx('الترخيص', 'License')}>
                <input className="admin-input" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
              </Field>
              <Field label={tx('الهاتف', 'Phone')}>
                <input className="admin-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label={tx('واتساب', 'WhatsApp')}>
                <input className="admin-input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </Field>
              <Field label={tx('سنوات الخبرة', 'Experience (years)')}>
                <input
                  type="number"
                  className="admin-input"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                />
              </Field>
            </div>
            <Field label={tx('نبذة', 'Bio')}>
              <textarea className="admin-input min-h-[100px]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </Field>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
              {tx('وكيل موثّق', 'Verified agent')}
            </label>
            {agent.properties && agent.properties.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white/70 mb-2">{tx('أحدث العقارات', 'Recent listings')}</p>
                <ul className="text-sm space-y-1 text-[var(--admin-text-mute)]">
                  {agent.properties.map((p) => (
                    <li key={p.id} className="line-clamp-1">
                      · {p.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {tab === 'permissions' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {AGENT_ADMIN_PERMISSIONS.map((perm) => (
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
              {tx('مهام ومتابعات مخصصة لهذا الوكيل', 'Custom tasks and follow-ups for this agent')}
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
                  <button
                    type="button"
                    className="admin-icon-btn text-rose-300"
                    onClick={() => setTasks(tasks.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                className="admin-input flex-1"
                placeholder={tx('مهمة جديدة…', 'New task…')}
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTask.trim()) {
                    setTasks([...tasks, newTask.trim()]);
                    setNewTask('');
                  }
                }}
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
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <button type="button" className="admin-icon-btn !w-auto px-4 text-xs text-rose-300 border-rose-500/30" onClick={() => void deleteAgent()}>
          <Trash2 className="h-3.5 w-3.5" />
          {tx('حذف الوكيل', 'Delete agent')}
        </button>
        <button type="button" className="admin-btn-premium" disabled={saving} onClick={() => void save()}>
          {saving ? tx('جارٍ الحفظ…', 'Saving…') : tx('حفظ التغييرات', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
