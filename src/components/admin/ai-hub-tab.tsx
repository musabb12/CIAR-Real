'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  FlaskConical,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  ScrollText,
  Settings2,
  Shield,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  AiAdminSettingsPublic,
  AiCapabilityConfig,
  AiCapabilityKey,
  AiEngineMode,
  AiProviderId,
  AiUsageLog,
  AiUsageSummary,
} from '@/types/ai-admin';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

type HubTab = 'overview' | 'provider' | 'capabilities' | 'safety' | 'usage' | 'playground';

const CAP_META: Record<
  AiCapabilityKey,
  { ar: string; en: string; descAr: string; descEn: string }
> = {
  ai_chatbot: {
    ar: 'الدردشة الذكية',
    en: 'Smart chatbot',
    descAr: 'رد فوري على الاستفسارات',
    descEn: 'Instant Q&A',
  },
  ai_sentiment: {
    ar: 'تحليل المشاعر',
    en: 'Sentiment analysis',
    descAr: 'تحليل نبرة المراجعات',
    descEn: 'Review tone analysis',
  },
  ai_recommendations: {
    ar: 'التوصيات',
    en: 'Recommendations',
    descAr: 'عقارات مشابهة',
    descEn: 'Similar listings',
  },
  ai_ad_targeting: {
    ar: 'استهداف الإعلانات',
    en: 'Ad targeting',
    descAr: 'أفضل أماكن الظهور',
    descEn: 'Best placements',
  },
  ai_inventory: {
    ar: 'توقع المخزون',
    en: 'Inventory forecast',
    descAr: 'تنبؤ الطلب',
    descEn: 'Demand forecast',
  },
  ai_fraud: {
    ar: 'كشف الاحتيال',
    en: 'Fraud detection',
    descAr: 'تقييم مخاطر الدفع',
    descEn: 'Payment risk scoring',
  },
  ai_seo: {
    ar: 'كلمات SEO',
    en: 'SEO keywords',
    descAr: 'عناوين ووصف meta',
    descEn: 'Titles & meta',
  },
};

type SettingsResponse = AiAdminSettingsPublic & {
  canManageSecrets?: boolean;
  sessionKind?: string;
};

export function AiHubTab({ isAr }: { isAr: boolean }) {
  const [tab, setTab] = useState<HubTab>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [summary, setSummary] = useState<AiUsageSummary | null>(null);
  const [logs, setLogs] = useState<AiUsageLog[]>([]);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [playgroundCap, setPlaygroundCap] = useState<AiCapabilityKey>('ai_chatbot');
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundResult, setPlaygroundResult] = useState<string>('');
  const [playgroundBusy, setPlaygroundBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [settingsRes, usageRes] = await Promise.all([
        fetch('/api/admin/ai/settings'),
        fetch('/api/admin/ai/usage?limit=40'),
      ]);
      if (settingsRes.status === 401) {
        setError(tx(isAr, 'يلزم تسجيل دخول الأدمن', 'Admin sign-in required'));
        setSettings(null);
        return;
      }
      const settingsJson = (await settingsRes.json()) as SettingsResponse;
      const usageJson = (await usageRes.json()) as {
        summary?: AiUsageSummary;
        logs?: AiUsageLog[];
        error?: string;
      };
      if (!settingsRes.ok) {
        setError(settingsJson && 'error' in settingsJson ? String((settingsJson as { error?: string }).error) : 'Failed');
        return;
      }
      setSettings(settingsJson);
      if (usageRes.ok) {
        setSummary(usageJson.summary ?? null);
        setLogs(usageJson.logs ?? []);
      }
    } catch {
      setError(tx(isAr, 'تعذر تحميل إعدادات الذكاء الاصطناعي', 'Failed to load AI settings'));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs = useMemo(
    () =>
      [
        { id: 'overview' as const, ar: 'نظرة عامة', en: 'Overview', icon: Sparkles },
        { id: 'provider' as const, ar: 'المزود والمفاتيح', en: 'Provider & keys', icon: KeyRound },
        { id: 'capabilities' as const, ar: 'القدرات', en: 'Capabilities', icon: Zap },
        { id: 'safety' as const, ar: 'التعليمات والأمان', en: 'Prompts & safety', icon: Shield },
        { id: 'usage' as const, ar: 'الاستخدام والسجلات', en: 'Usage & logs', icon: ScrollText },
        { id: 'playground' as const, ar: 'مختبر', en: 'Playground', icon: FlaskConical },
      ] as const,
    [],
  );

  const patchSettings = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/ai/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed');
        return;
      }
      setSettings(data);
      setApiKeyDraft('');
      setSuccess(tx(isAr, 'تم الحفظ بنجاح', 'Saved successfully'));
      void load();
    } catch {
      setError(tx(isAr, 'فشل الحفظ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async () => {
    setTesting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/ai/providers/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setSuccess(
          tx(
            isAr,
            `الاتصال ناجح (${data.latencyMs}ms): ${data.message}`,
            `Connection OK (${data.latencyMs}ms): ${data.message}`,
          ),
        );
      } else {
        setError(data.message || 'Provider test failed');
      }
      void load();
    } catch {
      setError(tx(isAr, 'فشل اختبار المزود', 'Provider test failed'));
    } finally {
      setTesting(false);
    }
  };

  const updateCapability = (key: AiCapabilityKey, patch: Partial<AiCapabilityConfig>) => {
    if (!settings) return;
    const capabilities = settings.capabilities.map((c) =>
      c.key === key ? { ...c, ...patch } : c,
    );
    setSettings({ ...settings, capabilities });
  };

  const saveCapabilities = () => {
    if (!settings) return;
    void patchSettings({ capabilities: settings.capabilities });
  };

  const runPlayground = async () => {
    setPlaygroundBusy(true);
    setPlaygroundResult('');
    try {
      const res = await fetch('/api/admin/ai/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capability: playgroundCap,
          input: playgroundInput || undefined,
          locale: isAr ? 'ar' : 'en',
        }),
      });
      const data = await res.json();
      setPlaygroundResult(JSON.stringify(data, null, 2));
      void load();
    } catch {
      setPlaygroundResult(tx(isAr, 'فشل الاختبار', 'Playground failed'));
    } finally {
      setPlaygroundBusy(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center gap-2 text-[var(--admin-text-mute)] py-12 justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tx(isAr, 'جارٍ التحميل...', 'Loading...')}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error || tx(isAr, 'تعذر تحميل المركز', 'Unable to load AI hub')}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#f5c97b]" />
            {tx(isAr, 'مركز الذكاء الاصطناعي', 'AI Control Center')}
          </h2>
          <p className="text-sm text-[var(--admin-text-mute)] mt-1 max-w-3xl">
            {tx(
              isAr,
              'إدارة المزودات والمفاتيح والقدرات والحدود والسجلات والاختبارات من مكان واحد.',
              'Manage providers, keys, capabilities, budgets, logs, and tests in one place.',
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-3.5 w-3.5 me-1.5" />
          {tx(isAr, 'تحديث', 'Refresh')}
        </Button>
      </div>

      {(error || success) && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm flex items-start gap-2 ${
            error
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          {error ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span>{error || success}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-[#f5c97b] border border-amber-500/30'
                  : 'text-[var(--admin-text-mute)] hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {isAr ? t.ar : t.en}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label={tx(isAr, 'وضع الإدارة', 'Admin mode')}
              value={settings.adminMode}
            />
            <StatCard
              label={tx(isAr, 'طلبات اليوم', 'Today')}
              value={`${summary?.dailyUsed ?? 0} / ${summary?.dailyLimit ?? '—'}`}
            />
            <StatCard
              label={tx(isAr, 'هذا الشهر', 'This month')}
              value={`${summary?.monthlyUsed ?? 0} / ${summary?.monthlyLimit ?? '—'}`}
            />
            <StatCard
              label={tx(isAr, 'متوسط الاستجابة', 'Avg latency')}
              value={`${summary?.avgLatencyMs ?? 0} ms`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#f5c97b]" />
                {tx(isAr, 'حالة البيئة', 'Environment status')}
              </p>
              <EnvRow
                ok={settings.env.authSecretConfigured}
                label="AUTH_SECRET"
              />
              <EnvRow
                ok={settings.env.encryptionKeyConfigured}
                label="AI_SETTINGS_ENCRYPTION_KEY / AUTH_SECRET"
              />
              <EnvRow
                ok={settings.env.envApiKeyConfigured || settings.provider.hasApiKey}
                label={tx(isAr, 'مفتاح API (env أو مخزّن)', 'API key (env or stored)')}
              />
              <EnvRow
                ok={settings.env.firestoreConfigured}
                label={tx(isAr, 'Firestore', 'Firestore')}
              />
              <p className="text-[11px] text-[var(--admin-text-faint)] pt-1">
                {tx(
                  isAr,
                  `جلسة: ${settings.sessionKind || '—'} · إدارة المفاتيح: ${settings.canManageSecrets ? 'مسموحة' : 'مقيّدة'}`,
                  `Session: ${settings.sessionKind || '—'} · Secrets: ${settings.canManageSecrets ? 'allowed' : 'restricted'}`,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <p className="text-sm font-semibold text-white">
                {tx(isAr, 'القدرات المفعّلة', 'Enabled capabilities')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {settings.capabilities.map((c) => (
                  <span
                    key={c.key}
                    className={`rounded-full px-2.5 py-1 text-[11px] border ${
                      c.enabled
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-white/10 text-[var(--admin-text-faint)]'
                    }`}
                  >
                    {isAr ? CAP_META[c.key].ar : CAP_META[c.key].en}
                    {' · '}
                    {c.engine}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[var(--admin-text-mute)] pt-2">
                {tx(
                  isAr,
                  `تكلفة تقديرية (عينة السجلات): $${(summary?.estimatedCostUsd ?? 0).toFixed(4)}`,
                  `Estimated cost (sample): $${(summary?.estimatedCostUsd ?? 0).toFixed(4)}`,
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'provider' && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tx(isAr, 'المزود', 'Provider')}>
              <select
                className="admin-input w-full"
                value={settings.provider.activeProvider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: {
                      ...settings.provider,
                      activeProvider: e.target.value as AiProviderId,
                    },
                  })
                }
              >
                <option value="auto">auto</option>
                <option value="zai">ZAI</option>
                <option value="openai">OpenAI</option>
                <option value="custom">custom</option>
              </select>
            </Field>
            <Field label={tx(isAr, 'النموذج', 'Model')}>
              <input
                className="admin-input w-full"
                value={settings.provider.model}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: { ...settings.provider, model: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Base URL">
              <input
                className="admin-input w-full"
                value={settings.provider.baseUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: { ...settings.provider, baseUrl: e.target.value },
                  })
                }
              />
            </Field>
            <Field label={tx(isAr, 'الحرارة', 'Temperature')}>
              <input
                type="number"
                step="0.1"
                min={0}
                max={2}
                className="admin-input w-full"
                value={settings.provider.temperature}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: {
                      ...settings.provider,
                      temperature: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
            <Field label={tx(isAr, 'المهلة (ms)', 'Timeout (ms)')}>
              <input
                type="number"
                className="admin-input w-full"
                value={settings.provider.timeoutMs}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: {
                      ...settings.provider,
                      timeoutMs: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
            <Field label={tx(isAr, 'أقصى طول إدخال', 'Max input chars')}>
              <input
                type="number"
                className="admin-input w-full"
                value={settings.provider.maxInputChars}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: {
                      ...settings.provider,
                      maxInputChars: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
          </div>

          <div className="rounded-xl border border-white/10 p-3 space-y-2">
            <p className="text-sm font-medium text-white">
              {tx(isAr, 'مفتاح API (مشفّر عند الحفظ)', 'API key (encrypted on save)')}
            </p>
            <p className="text-xs text-[var(--admin-text-mute)]">
              {settings.provider.hasApiKey
                ? tx(
                    isAr,
                    `مفتاح محفوظ${settings.provider.apiKeyLast4 ? ` (••••${settings.provider.apiKeyLast4})` : ''}${settings.provider.apiKeyVerifiedAt ? ` · تم التحقق ${new Date(settings.provider.apiKeyVerifiedAt).toLocaleString()}` : ''}`,
                    `Key on file${settings.provider.apiKeyLast4 ? ` (••••${settings.provider.apiKeyLast4})` : ''}${settings.provider.apiKeyVerifiedAt ? ` · verified ${new Date(settings.provider.apiKeyVerifiedAt).toLocaleString()}` : ''}`,
                  )
                : tx(isAr, 'لا يوجد مفتاح مخزّن — يمكن الاعتماد على متغيرات البيئة', 'No stored key — env vars can still be used')}
            </p>
            <input
              type="password"
              className="admin-input w-full"
              placeholder={
                settings.canManageSecrets
                  ? tx(isAr, 'الصق مفتاحاً جديداً للتدوير', 'Paste a new key to rotate')
                  : tx(isAr, 'إدارة المفاتيح غير متاحة لهذه الجلسة', 'Key management unavailable for this session')
              }
              disabled={!settings.canManageSecrets}
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={saving}
              onClick={() =>
                void patchSettings({
                  provider: {
                    activeProvider: settings.provider.activeProvider,
                    model: settings.provider.model,
                    baseUrl: settings.provider.baseUrl,
                    temperature: settings.provider.temperature,
                    timeoutMs: settings.provider.timeoutMs,
                    maxInputChars: settings.provider.maxInputChars,
                    maxHistoryMessages: settings.provider.maxHistoryMessages,
                    ...(apiKeyDraft.trim() ? { apiKey: apiKeyDraft.trim() } : {}),
                  },
                })
              }
              className="bg-gradient-to-r from-amber-600 to-emerald-600 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Save className="h-4 w-4 me-1.5" />}
              {tx(isAr, 'حفظ المزود', 'Save provider')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={testing}
              onClick={() => void testProvider()}
              className="border-white/15 bg-white/5 text-white"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Zap className="h-4 w-4 me-1.5" />}
              {tx(isAr, 'اختبار الاتصال', 'Test connection')}
            </Button>
            {settings.canManageSecrets && settings.provider.hasApiKey && (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void patchSettings({ provider: { clearApiKey: true } })}
                className="border-rose-500/30 text-rose-200"
              >
                <Trash2 className="h-4 w-4 me-1.5" />
                {tx(isAr, 'مسح المفتاح المخزّن', 'Clear stored key')}
              </Button>
            )}
          </div>
        </div>
      )}

      {tab === 'capabilities' && (
        <div className="space-y-3">
          {settings.capabilities.map((cap) => (
            <div
              key={cap.key}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center"
            >
              <div>
                <p className="font-semibold text-white">
                  {isAr ? CAP_META[cap.key].ar : CAP_META[cap.key].en}
                </p>
                <p className="text-xs text-[var(--admin-text-mute)]">
                  {isAr ? CAP_META[cap.key].descAr : CAP_META[cap.key].descEn}
                </p>
                <code className="text-[10px] text-[var(--admin-text-faint)]">{cap.key}</code>
              </div>
              <label className="flex items-center gap-2 text-xs text-[var(--admin-text-mute)]">
                <input
                  type="checkbox"
                  checked={cap.enabled}
                  onChange={(e) => updateCapability(cap.key, { enabled: e.target.checked })}
                />
                {tx(isAr, 'مفعّل', 'Enabled')}
              </label>
              <select
                className="admin-input"
                value={cap.engine}
                onChange={(e) =>
                  updateCapability(cap.key, { engine: e.target.value as AiEngineMode })
                }
              >
                <option value="hybrid">hybrid</option>
                <option value="llm">llm</option>
                <option value="heuristic">heuristic</option>
              </select>
              <input
                type="number"
                className="admin-input w-24"
                title={tx(isAr, 'حد الطلبات/دقيقة', 'Rate / minute')}
                value={cap.rateLimitPerMinute}
                onChange={(e) =>
                  updateCapability(cap.key, {
                    rateLimitPerMinute: Number(e.target.value),
                  })
                }
              />
            </div>
          ))}
          <Button
            type="button"
            disabled={saving}
            onClick={saveCapabilities}
            className="bg-gradient-to-r from-amber-600 to-emerald-600 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Save className="h-4 w-4 me-1.5" />}
            {tx(isAr, 'حفظ القدرات', 'Save capabilities')}
          </Button>
        </div>
      )}

      {tab === 'safety' && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Field label={tx(isAr, 'تعليمات النظام (عربي)', 'System prompt (AR)')}>
            <textarea
              className="admin-input w-full min-h-[120px]"
              value={settings.safety.systemPromptAr}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  safety: { ...settings.safety, systemPromptAr: e.target.value },
                })
              }
            />
          </Field>
          <Field label={tx(isAr, 'تعليمات النظام (إنجليزي)', 'System prompt (EN)')}>
            <textarea
              className="admin-input w-full min-h-[120px]"
              value={settings.safety.systemPromptEn}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  safety: { ...settings.safety, systemPromptEn: e.target.value },
                })
              }
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--admin-text-mute)]">
              <input
                type="checkbox"
                checked={settings.safety.fallbackToHeuristic}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safety: {
                      ...settings.safety,
                      fallbackToHeuristic: e.target.checked,
                    },
                  })
                }
              />
              {tx(isAr, 'الرجوع للخوارزميات المحلية', 'Fallback to heuristics')}
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--admin-text-mute)]">
              <input
                type="checkbox"
                checked={settings.safety.logRawUserContent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safety: {
                      ...settings.safety,
                      logRawUserContent: e.target.checked,
                    },
                  })
                }
              />
              {tx(isAr, 'تسجيل نص المستخدم (حساس)', 'Log raw user text (sensitive)')}
            </label>
            <Field label={tx(isAr, 'أيام الاحتفاظ', 'Retention days')}>
              <input
                type="number"
                className="admin-input w-full"
                value={settings.safety.retentionDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safety: {
                      ...settings.safety,
                      retentionDays: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
          </div>
          <Field label={tx(isAr, 'كلمات محظورة (مفصولة بفاصلة)', 'Blocked words (comma-separated)')}>
            <input
              className="admin-input w-full"
              value={settings.safety.blockedWords.join(', ')}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  safety: {
                    ...settings.safety,
                    blockedWords: e.target.value
                      .split(',')
                      .map((w) => w.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={tx(isAr, 'حد يومي', 'Daily limit')}>
              <input
                type="number"
                className="admin-input w-full"
                value={settings.budget.dailyRequestLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    budget: {
                      ...settings.budget,
                      dailyRequestLimit: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
            <Field label={tx(isAr, 'حد شهري', 'Monthly limit')}>
              <input
                type="number"
                className="admin-input w-full"
                value={settings.budget.monthlyRequestLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    budget: {
                      ...settings.budget,
                      monthlyRequestLimit: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
            <Field label={tx(isAr, 'ميزانية شهرية USD (0=بلا حد)', 'Monthly USD budget (0=unlimited)')}>
              <input
                type="number"
                className="admin-input w-full"
                value={settings.budget.monthlyBudgetUsd}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    budget: {
                      ...settings.budget,
                      monthlyBudgetUsd: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
          </div>
          <Button
            type="button"
            disabled={saving}
            onClick={() =>
              void patchSettings({
                safety: settings.safety,
                budget: settings.budget,
                provider: {
                  maxHistoryMessages: settings.provider.maxHistoryMessages,
                },
              })
            }
            className="bg-gradient-to-r from-amber-600 to-emerald-600 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Save className="h-4 w-4 me-1.5" />}
            {tx(isAr, 'حفظ الأمان والحدود', 'Save safety & budgets')}
          </Button>
        </div>
      )}

      {tab === 'usage' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={tx(isAr, 'نجاح', 'Success')} value={String(summary?.successCount ?? 0)} />
            <StatCard label={tx(isAr, 'أخطاء', 'Errors')} value={String(summary?.errorCount ?? 0)} />
            <StatCard label="LLM" value={String(summary?.llmCount ?? 0)} />
            <StatCard label={tx(isAr, 'محظور', 'Blocked')} value={String(summary?.blockedCount ?? 0)} />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-white/5 text-white"
              onClick={async () => {
                await fetch('/api/admin/ai/usage', { method: 'DELETE' });
                void load();
              }}
            >
              <Trash2 className="h-4 w-4 me-1.5" />
              {tx(isAr, 'تنظيف حسب سياسة الاحتفاظ', 'Purge by retention policy')}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-xs text-start">
              <thead className="bg-white/5 text-[var(--admin-text-mute)]">
                <tr>
                  <th className="px-3 py-2 font-medium">{tx(isAr, 'الوقت', 'Time')}</th>
                  <th className="px-3 py-2 font-medium">{tx(isAr, 'القدرة', 'Capability')}</th>
                  <th className="px-3 py-2 font-medium">{tx(isAr, 'المحرك', 'Engine')}</th>
                  <th className="px-3 py-2 font-medium">ms</th>
                  <th className="px-3 py-2 font-medium">{tx(isAr, 'الحالة', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-white/5">
                    <td className="px-3 py-2 text-[var(--admin-text-mute)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-white">{log.capability}</td>
                    <td className="px-3 py-2 text-[var(--admin-text-mute)]">{log.engine}</td>
                    <td className="px-3 py-2 text-[var(--admin-text-mute)]">{log.latencyMs}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          log.success ? 'text-emerald-300' : 'text-rose-300'
                        }
                      >
                        {log.success ? 'ok' : log.errorCode || 'fail'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-[var(--admin-text-faint)]">
                      {tx(isAr, 'لا سجلات بعد', 'No logs yet')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'playground' && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tx(isAr, 'القدرة', 'Capability')}>
              <select
                className="admin-input w-full"
                value={playgroundCap}
                onChange={(e) => setPlaygroundCap(e.target.value as AiCapabilityKey)}
              >
                {settings.capabilities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {isAr ? CAP_META[c.key].ar : CAP_META[c.key].en}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tx(isAr, 'إدخال تجريبي', 'Test input')}>
              <input
                className="admin-input w-full"
                value={playgroundInput}
                onChange={(e) => setPlaygroundInput(e.target.value)}
                placeholder={tx(isAr, 'نص الاختبار...', 'Test text...')}
              />
            </Field>
          </div>
          <Button
            type="button"
            disabled={playgroundBusy}
            onClick={() => void runPlayground()}
            className="bg-gradient-to-r from-amber-600 to-emerald-600 text-white"
          >
            {playgroundBusy ? (
              <Loader2 className="h-4 w-4 animate-spin me-1.5" />
            ) : (
              <FlaskConical className="h-4 w-4 me-1.5" />
            )}
            {tx(isAr, 'تشغيل الاختبار', 'Run test')}
          </Button>
          {playgroundResult && (
            <pre className="rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-[var(--admin-text-mute)] overflow-x-auto whitespace-pre-wrap">
              {playgroundResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-[var(--admin-text-mute)]">{label}</span>
      {children}
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] text-[var(--admin-text-mute)]">{label}</p>
      <p className="text-lg font-semibold text-white mt-1 break-all">{value}</p>
    </div>
  );
}

function EnvRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
      )}
      <span className="text-[var(--admin-text-mute)]">{label}</span>
    </div>
  );
}
