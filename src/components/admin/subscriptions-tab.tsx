'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  CreditCard,
  Gift,
  Loader2,
  Save,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type {
  PartnerSubscriptionSettings,
  PartnerSubscriptionView,
} from '@/types/subscription';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

type PartnersPayload = {
  settings: PartnerSubscriptionSettings;
  partners: PartnerSubscriptionView[];
};

export function SubscriptionsTab({ isAr }: { isAr: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PartnerSubscriptionSettings | null>(null);
  const [partners, setPartners] = useState<PartnerSubscriptionView[]>([]);
  const [exemptNotes, setExemptNotes] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/partners');
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as PartnersPayload;
      setSettings(data.settings);
      setPartners(data.partners);
    } catch {
      toast.error(tx(isAr, 'تعذّر تحميل الاشتراكات', 'Could not load subscriptions'));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/subscriptions/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed');
      setSettings(data);
      toast.success(tx(isAr, 'تم حفظ الإعدادات', 'Settings saved'));
      load();
    } catch (error) {
      toast.error(tx(isAr, 'فشل الحفظ', 'Save failed'), {
        description: error instanceof Error ? error.message : '',
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePartnerExempt = async (agentId: string, exempt: boolean) => {
    setUpdatingId(agentId);
    try {
      const res = await fetch(`/api/admin/subscriptions/partners/${encodeURIComponent(agentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exempt,
          exemptNote: exemptNotes[agentId]?.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed');
      setPartners((rows) =>
        rows.map((row) => (row.agentId === agentId || row.id === agentId ? { ...row, ...data } : row)),
      );
      toast.success(
        exempt
          ? tx(isAr, 'تم تفعيل الإعفاء المجاني', 'Free access granted')
          : tx(isAr, 'تم إلغاء الإعفاء', 'Exemption removed'),
      );
    } catch (error) {
      toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), {
        description: error instanceof Error ? error.message : '',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--admin-text-mute)]">
        <Loader2 className="h-6 w-6 animate-spin me-2" />
        {tx(isAr, 'جاري التحميل…', 'Loading…')}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <section className="admin-card p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#2dd4bf]" />
              {tx(isAr, 'إعدادات الاشتراك', 'Subscription settings')}
            </h2>
            <p className="text-sm text-[var(--admin-text-mute)] mt-1">
              {tx(
                isAr,
                'تحكم بتفعيل الاشتراك والأسعار والوصف والمميزات وطرق الدفع.',
                'Control subscription, pricing, descriptions, features, and payment methods.',
              )}
            </p>
          </div>
          <button
            type="button"
            className="admin-pill flex items-center gap-2"
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
          >
            {settings.enabled ? (
              <ToggleRight className="h-4 w-4 text-emerald-400" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {settings.enabled
              ? tx(isAr, 'الاشتراك مطلوب', 'Subscription required')
              : tx(isAr, 'الاشتراك معطّل', 'Subscription disabled')}
          </button>
        </div>

        <div className="space-y-6">
          {settings.plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{tx(isAr, plan.labelAr, plan.labelEn)}</h3>
                  <p className="text-xs text-[var(--admin-text-faint)]">{plan.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`text-xs admin-pill ${plan.highlighted ? 'admin-pill-up' : ''}`}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, highlighted: !p.highlighted } : p,
                        ),
                      })
                    }
                  >
                    {tx(isAr, 'باقة مميزة', 'Featured plan')}
                  </button>
                  <button
                    type="button"
                    className="text-xs admin-pill"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, enabled: !p.enabled } : p,
                        ),
                      })
                    }
                  >
                    {plan.enabled ? tx(isAr, 'مفعّل', 'On') : tx(isAr, 'معطّل', 'Off')}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'الاسم (عربي)', 'Name (Arabic)')}
                  </Label>
                  <input
                    className="admin-input w-full"
                    value={plan.labelAr}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, labelAr: e.target.value } : p,
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'الاسم (إنجليزي)', 'Name (English)')}
                  </Label>
                  <input
                    className="admin-input w-full"
                    value={plan.labelEn}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, labelEn: e.target.value } : p,
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'السعر', 'Price')} ({settings.currency})
                  </Label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="admin-input w-full"
                    value={plan.price}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, price: Number(e.target.value) || 0 } : p,
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'المدة (أيام)', 'Duration (days)')}
                  </Label>
                  <input
                    type="number"
                    min={1}
                    className="admin-input w-full"
                    value={plan.days}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, days: Number(e.target.value) || 1 } : p,
                        ),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'الوصف (عربي)', 'Description (Arabic)')}
                  </Label>
                  <textarea
                    className="admin-input w-full min-h-[72px] resize-y"
                    value={plan.descriptionAr}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, descriptionAr: e.target.value } : p,
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'الوصف (إنجليزي)', 'Description (English)')}
                  </Label>
                  <textarea
                    className="admin-input w-full min-h-[72px] resize-y"
                    value={plan.descriptionEn}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, descriptionEn: e.target.value } : p,
                        ),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'المميزات (عربي — سطر لكل ميزة)', 'Features (Arabic — one per line)')}
                  </Label>
                  <textarea
                    className="admin-input w-full min-h-[120px] resize-y font-mono text-sm"
                    value={plan.featuresAr.join('\n')}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id
                            ? {
                                ...p,
                                featuresAr: e.target.value
                                  .split('\n')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }
                            : p,
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'المميزات (إنجليزي)', 'Features (English — one per line)')}
                  </Label>
                  <textarea
                    className="admin-input w-full min-h-[120px] resize-y font-mono text-sm"
                    value={plan.featuresEn.join('\n')}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id
                            ? {
                                ...p,
                                featuresEn: e.target.value
                                  .split('\n')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }
                            : p,
                        ),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'شارة (عربي) — اختياري', 'Badge (Arabic) — optional')}
                  </Label>
                  <input
                    className="admin-input w-full"
                    placeholder={tx(isAr, 'مثال: الأكثر شعبية', 'e.g. Most popular')}
                    value={plan.badgeAr ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, badgeAr: e.target.value || null } : p,
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--admin-text-mute)]">
                    {tx(isAr, 'شارة (إنجليزي)', 'Badge (English)')}
                  </Label>
                  <input
                    className="admin-input w-full"
                    value={plan.badgeEn ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        plans: settings.plans.map((p) =>
                          p.id === plan.id ? { ...p, badgeEn: e.target.value || null } : p,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-3">{tx(isAr, 'طرق الدفع', 'Payment methods')}</h3>
          <div className="flex flex-wrap gap-2">
            {settings.paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                className={`admin-pill ${method.enabled ? 'admin-pill-up' : ''}`}
                onClick={() =>
                  setSettings({
                    ...settings,
                    paymentMethods: settings.paymentMethods.map((m) =>
                      m.id === method.id ? { ...m, enabled: !m.enabled } : m,
                    ),
                  })
                }
              >
                {tx(isAr, method.labelAr, method.labelEn)}
              </button>
            ))}
          </div>
        </div>

        <Button className="admin-btn-primary" onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
          {tx(isAr, 'حفظ الإعدادات', 'Save settings')}
        </Button>
      </section>

      <section className="admin-card p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-[#a78bfa]" />
          {tx(isAr, 'اشتراكات الشركاء', 'Partner subscriptions')}
        </h2>
        <p className="text-sm text-[var(--admin-text-mute)]">
          {tx(
            isAr,
            'يمكنك إعفاء وكيل أو شركة من الدفع وتفعيل الخدمة مجاناً.',
            'Grant free access to agents or companies without payment.',
          )}
        </p>

        {partners.length === 0 ? (
          <p className="text-sm text-[var(--admin-text-faint)] py-8 text-center">
            {tx(isAr, 'لا يوجد شركاء بعد', 'No partners yet')}
          </p>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => {
              const agentId = partner.agentId || partner.id;
              return (
                <div
                  key={agentId}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col lg:flex-row lg:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{partner.partnerName ?? '—'}</div>
                    <div className="text-xs text-[var(--admin-text-faint)] truncate">
                      {partner.partnerEmail}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {partner.isActive ? (
                        <span className="admin-pill admin-pill-up text-xs">
                          <BadgeCheck className="h-3 w-3 me-1" />
                          {partner.exempt
                            ? tx(isAr, 'مجاني', 'Free')
                            : tx(isAr, 'نشط', 'Active')}
                        </span>
                      ) : (
                        <span className="admin-pill admin-pill-down text-xs">
                          {tx(isAr, 'غير مشترك', 'Not subscribed')}
                        </span>
                      )}
                      {partner.expiresAt && !partner.exempt && (
                        <span className="text-[11px] text-[var(--admin-text-faint)]">
                          {tx(isAr, 'حتى', 'Until')}{' '}
                          {new Date(partner.expiresAt).toLocaleDateString(isAr ? 'ar' : 'en')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:w-96">
                    <input
                      type="text"
                      className="admin-input flex-1 text-sm"
                      placeholder={tx(isAr, 'ملاحظة الإعفاء (اختياري)', 'Exemption note (optional)')}
                      value={exemptNotes[agentId] ?? partner.exemptNote ?? ''}
                      onChange={(e) =>
                        setExemptNotes((prev) => ({ ...prev, [agentId]: e.target.value }))
                      }
                    />
                    <Button
                      variant="outline"
                      className="shrink-0 border-white/15"
                      disabled={updatingId === agentId}
                      onClick={() => togglePartnerExempt(agentId, !partner.exempt)}
                    >
                      {updatingId === agentId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Gift className="h-4 w-4 me-1.5" />
                          {partner.exempt
                            ? tx(isAr, 'إلغاء الإعفاء', 'Remove free')
                            : tx(isAr, 'إعفاء مجاني', 'Grant free')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
