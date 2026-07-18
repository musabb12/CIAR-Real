/** Admin-configurable AI capability keys. */
export type AiCapabilityKey =
  | 'ai_chatbot'
  | 'ai_sentiment'
  | 'ai_recommendations'
  | 'ai_ad_targeting'
  | 'ai_inventory'
  | 'ai_fraud'
  | 'ai_seo';

export type AiProviderId = 'auto' | 'zai' | 'openai' | 'custom';

export type AiEngineMode = 'llm' | 'heuristic' | 'hybrid';

export type AiAdminMode = 'demo' | 'production';

export interface AiCapabilityConfig {
  key: AiCapabilityKey;
  enabled: boolean;
  engine: AiEngineMode;
  /** Soft per-minute request limit for this capability (server-side). */
  rateLimitPerMinute: number;
  /** Optional capability-specific knobs. */
  options: Record<string, number | string | boolean>;
}

export interface AiProviderSettings {
  activeProvider: AiProviderId;
  model: string;
  baseUrl: string;
  temperature: number;
  timeoutMs: number;
  maxInputChars: number;
  maxHistoryMessages: number;
  /** Encrypted ciphertext — never returned to the client. */
  apiKeyEncrypted: string | null;
  /** Last 4 chars of the stored key for UI display. */
  apiKeyLast4: string | null;
  /** When the stored key was last verified successfully. */
  apiKeyVerifiedAt: string | null;
}

export interface AiSafetySettings {
  systemPromptAr: string;
  systemPromptEn: string;
  fallbackToHeuristic: boolean;
  logRawUserContent: boolean;
  blockedWords: string[];
  retentionDays: number;
}

export interface AiBudgetSettings {
  dailyRequestLimit: number;
  monthlyRequestLimit: number;
  /** Soft cost estimate ceiling in USD (0 = unlimited). */
  monthlyBudgetUsd: number;
}

export interface AiAdminSettings {
  provider: AiProviderSettings;
  safety: AiSafetySettings;
  budget: AiBudgetSettings;
  capabilities: AiCapabilityConfig[];
  updatedAt: string;
  updatedBy: string | null;
}

/** Safe public view — never includes ciphertext. */
export interface AiAdminSettingsPublic {
  provider: Omit<AiProviderSettings, 'apiKeyEncrypted'> & {
    hasApiKey: boolean;
  };
  safety: AiSafetySettings;
  budget: AiBudgetSettings;
  capabilities: AiCapabilityConfig[];
  updatedAt: string;
  updatedBy: string | null;
  adminMode: AiAdminMode;
  env: {
    authSecretConfigured: boolean;
    encryptionKeyConfigured: boolean;
    envApiKeyConfigured: boolean;
    firestoreConfigured: boolean;
  };
}

export interface AiUsageLog {
  id: string;
  capability: AiCapabilityKey | 'provider_test' | 'playground';
  engine: 'llm' | 'heuristic' | 'blocked' | 'error';
  success: boolean;
  latencyMs: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
  errorCode: string | null;
  /** Truncated/redacted preview — never full secrets. */
  preview: string | null;
  actorId: string | null;
  actorRole: string | null;
  createdAt: string;
}

export interface AiAuditLog {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  /** Field names changed — never secret values. */
  changedFields: string[];
  createdAt: string;
}

export interface AiUsageSummary {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  blockedCount: number;
  llmCount: number;
  heuristicCount: number;
  avgLatencyMs: number;
  estimatedCostUsd: number;
  byCapability: Record<string, number>;
  dailyUsed: number;
  monthlyUsed: number;
  dailyLimit: number;
  monthlyLimit: number;
}
