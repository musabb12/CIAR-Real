import type {
  AiAdminMode,
  AiAdminSettings,
  AiAdminSettingsPublic,
  AiCapabilityConfig,
  AiCapabilityKey,
  AiEngineMode,
  AiProviderId,
} from '@/types/ai-admin';
import { isAiEncryptionKeyConfigured } from '@/lib/ai/secrets';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';

export const AI_CAPABILITY_KEYS: AiCapabilityKey[] = [
  'ai_chatbot',
  'ai_sentiment',
  'ai_recommendations',
  'ai_ad_targeting',
  'ai_inventory',
  'ai_fraud',
  'ai_seo',
];

export const DEFAULT_SYSTEM_PROMPT_AR = `أنت مساعد ذكي لمنصة CIAR العقارية والتجارية.
ساعد المستخدم باختصار ووضوح بالعربية حول: البحث عن عقارات، الوكلاء، الإعلانات التجارية، الاشتراكات، الدفع، سياسة الخصوصية.
لا تختلق أسعاراً دقيقة لعقارات غير معروفة. وجّه المستخدم لصفحات: البحث، الوكلاء، تواصل معنا، لوحة الشريك.`;

export const DEFAULT_SYSTEM_PROMPT_EN = `You are the smart assistant for the CIAR real-estate & marketplace platform.
Help briefly about: property search, agents, commercial ads, subscriptions, payments, privacy.
Do not invent exact prices for unknown listings. Guide users to Search, Agents, Contact, Partner hub.`;

function defaultCapability(key: AiCapabilityKey): AiCapabilityConfig {
  const rateDefaults: Record<AiCapabilityKey, number> = {
    ai_chatbot: 30,
    ai_sentiment: 40,
    ai_recommendations: 60,
    ai_ad_targeting: 40,
    ai_inventory: 30,
    ai_fraud: 40,
    ai_seo: 30,
  };
  return {
    key,
    enabled: true,
    engine: 'hybrid',
    rateLimitPerMinute: rateDefaults[key],
    options: {},
  };
}

export function getDefaultAiAdminSettings(): AiAdminSettings {
  const now = new Date().toISOString();
  return {
    provider: {
      activeProvider: 'auto',
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1',
      temperature: 0.4,
      timeoutMs: 25_000,
      maxInputChars: 2000,
      maxHistoryMessages: 8,
      apiKeyEncrypted: null,
      apiKeyLast4: null,
      apiKeyVerifiedAt: null,
    },
    safety: {
      systemPromptAr: DEFAULT_SYSTEM_PROMPT_AR,
      systemPromptEn: DEFAULT_SYSTEM_PROMPT_EN,
      fallbackToHeuristic: true,
      logRawUserContent: false,
      blockedWords: [],
      retentionDays: 30,
    },
    budget: {
      dailyRequestLimit: getAiAdminMode() === 'demo' ? 200 : 5000,
      monthlyRequestLimit: getAiAdminMode() === 'demo' ? 2000 : 100_000,
      monthlyBudgetUsd: getAiAdminMode() === 'demo' ? 5 : 0,
    },
    capabilities: AI_CAPABILITY_KEYS.map(defaultCapability),
    updatedAt: now,
    updatedBy: null,
  };
}

export function getAiAdminMode(): AiAdminMode {
  const raw = (process.env.AI_ADMIN_MODE || 'demo').trim().toLowerCase();
  return raw === 'production' ? 'production' : 'demo';
}

export function isEnvApiKeyConfigured(): boolean {
  return Boolean(
    process.env.ZAI_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.AI_API_KEY?.trim(),
  );
}

export function isAuthSecretConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
  );
}

function asProvider(value: unknown): AiProviderId {
  if (value === 'zai' || value === 'openai' || value === 'custom' || value === 'auto') {
    return value;
  }
  return 'auto';
}

function asEngine(value: unknown): AiEngineMode {
  if (value === 'llm' || value === 'heuristic' || value === 'hybrid') return value;
  return 'hybrid';
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeAiAdminSettings(input: unknown): AiAdminSettings {
  const defaults = getDefaultAiAdminSettings();
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const providerRaw = (raw.provider && typeof raw.provider === 'object'
    ? raw.provider
    : {}) as Record<string, unknown>;
  const safetyRaw = (raw.safety && typeof raw.safety === 'object'
    ? raw.safety
    : {}) as Record<string, unknown>;
  const budgetRaw = (raw.budget && typeof raw.budget === 'object'
    ? raw.budget
    : {}) as Record<string, unknown>;

  const capsRaw = Array.isArray(raw.capabilities) ? raw.capabilities : [];
  const byKey = new Map<string, Record<string, unknown>>();
  for (const item of capsRaw) {
    if (item && typeof item === 'object' && 'key' in item) {
      byKey.set(String((item as { key: string }).key), item as Record<string, unknown>);
    }
  }

  const capabilities = AI_CAPABILITY_KEYS.map((key) => {
    const existing = byKey.get(key) ?? {};
    const base = defaultCapability(key);
    return {
      key,
      enabled: typeof existing.enabled === 'boolean' ? existing.enabled : base.enabled,
      engine: asEngine(existing.engine ?? base.engine),
      rateLimitPerMinute: clampNumber(
        existing.rateLimitPerMinute,
        base.rateLimitPerMinute,
        1,
        1000,
      ),
      options:
        existing.options && typeof existing.options === 'object'
          ? (existing.options as Record<string, number | string | boolean>)
          : {},
    };
  });

  return {
    provider: {
      activeProvider: asProvider(providerRaw.activeProvider),
      model:
        typeof providerRaw.model === 'string' && providerRaw.model.trim()
          ? providerRaw.model.trim()
          : defaults.provider.model,
      baseUrl:
        typeof providerRaw.baseUrl === 'string' && providerRaw.baseUrl.trim()
          ? providerRaw.baseUrl.trim()
          : defaults.provider.baseUrl,
      temperature: clampNumber(providerRaw.temperature, defaults.provider.temperature, 0, 2),
      timeoutMs: clampNumber(providerRaw.timeoutMs, defaults.provider.timeoutMs, 3000, 120_000),
      maxInputChars: clampNumber(
        providerRaw.maxInputChars,
        defaults.provider.maxInputChars,
        200,
        8000,
      ),
      maxHistoryMessages: clampNumber(
        providerRaw.maxHistoryMessages,
        defaults.provider.maxHistoryMessages,
        0,
        40,
      ),
      apiKeyEncrypted:
        typeof providerRaw.apiKeyEncrypted === 'string'
          ? providerRaw.apiKeyEncrypted
          : defaults.provider.apiKeyEncrypted,
      apiKeyLast4:
        typeof providerRaw.apiKeyLast4 === 'string'
          ? providerRaw.apiKeyLast4
          : defaults.provider.apiKeyLast4,
      apiKeyVerifiedAt:
        typeof providerRaw.apiKeyVerifiedAt === 'string'
          ? providerRaw.apiKeyVerifiedAt
          : defaults.provider.apiKeyVerifiedAt,
    },
    safety: {
      systemPromptAr:
        typeof safetyRaw.systemPromptAr === 'string' && safetyRaw.systemPromptAr.trim()
          ? safetyRaw.systemPromptAr
          : defaults.safety.systemPromptAr,
      systemPromptEn:
        typeof safetyRaw.systemPromptEn === 'string' && safetyRaw.systemPromptEn.trim()
          ? safetyRaw.systemPromptEn
          : defaults.safety.systemPromptEn,
      fallbackToHeuristic:
        typeof safetyRaw.fallbackToHeuristic === 'boolean'
          ? safetyRaw.fallbackToHeuristic
          : defaults.safety.fallbackToHeuristic,
      logRawUserContent:
        typeof safetyRaw.logRawUserContent === 'boolean'
          ? safetyRaw.logRawUserContent
          : defaults.safety.logRawUserContent,
      blockedWords: Array.isArray(safetyRaw.blockedWords)
        ? safetyRaw.blockedWords
            .filter((w): w is string => typeof w === 'string')
            .map((w) => w.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 200)
        : defaults.safety.blockedWords,
      retentionDays: clampNumber(
        safetyRaw.retentionDays,
        defaults.safety.retentionDays,
        1,
        365,
      ),
    },
    budget: {
      dailyRequestLimit: clampNumber(
        budgetRaw.dailyRequestLimit,
        defaults.budget.dailyRequestLimit,
        10,
        1_000_000,
      ),
      monthlyRequestLimit: clampNumber(
        budgetRaw.monthlyRequestLimit,
        defaults.budget.monthlyRequestLimit,
        50,
        10_000_000,
      ),
      monthlyBudgetUsd: clampNumber(
        budgetRaw.monthlyBudgetUsd,
        defaults.budget.monthlyBudgetUsd,
        0,
        100_000,
      ),
    },
    capabilities,
    updatedAt:
      typeof raw.updatedAt === 'string' ? raw.updatedAt : defaults.updatedAt,
    updatedBy:
      typeof raw.updatedBy === 'string' || raw.updatedBy === null
        ? (raw.updatedBy as string | null)
        : null,
  };
}

export function toPublicAiSettings(settings: AiAdminSettings): AiAdminSettingsPublic {
  const { apiKeyEncrypted: _drop, ...providerSafe } = settings.provider;
  return {
    provider: {
      ...providerSafe,
      hasApiKey: Boolean(settings.provider.apiKeyEncrypted) || isEnvApiKeyConfigured(),
    },
    safety: settings.safety,
    budget: settings.budget,
    capabilities: settings.capabilities,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
    adminMode: getAiAdminMode(),
    env: {
      authSecretConfigured: isAuthSecretConfigured(),
      encryptionKeyConfigured: isAiEncryptionKeyConfigured(),
      envApiKeyConfigured: isEnvApiKeyConfigured(),
      firestoreConfigured: isFirebaseAdminConfigured(),
    },
  };
}

export function getCapabilityConfig(
  settings: AiAdminSettings,
  key: AiCapabilityKey,
): AiCapabilityConfig {
  return (
    settings.capabilities.find((c) => c.key === key) ?? defaultCapability(key)
  );
}

export function containsBlockedWord(text: string, blocked: string[]): boolean {
  if (!blocked.length) return false;
  const lower = text.toLowerCase();
  return blocked.some((w) => w && lower.includes(w));
}
