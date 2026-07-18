import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  asBoolean,
  asNumber,
  asString,
  col,
  FIRESTORE_COLLECTIONS,
  makeId,
  nowIso,
  toIso,
} from '@/lib/firestore-shared';
import {
  getDefaultAiAdminSettings,
  normalizeAiAdminSettings,
} from '@/lib/ai/settings';
import type {
  AiAdminSettings,
  AiAuditLog,
  AiCapabilityKey,
  AiUsageLog,
  AiUsageSummary,
} from '@/types/ai-admin';

const SETTINGS_DOC_ID = 'global';
const STORE_KEY = '__ciar_ai_admin_store__';
const MAX_IN_MEMORY_LOGS = 500;

type AiStore = {
  settings: AiAdminSettings;
  usage: AiUsageLog[];
  audit: AiAuditLog[];
};

function getMemoryStore(): AiStore {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: AiStore };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      settings: getDefaultAiAdminSettings(),
      usage: [],
      audit: [],
    };
  }
  return g[STORE_KEY];
}

function settingsCollection() {
  return col(FIRESTORE_COLLECTIONS.aiSettings);
}

function usageCollection() {
  return col(FIRESTORE_COLLECTIONS.aiUsageLogs);
}

function auditCollection() {
  return col(FIRESTORE_COLLECTIONS.aiAuditLogs);
}

export async function readAiAdminSettings(): Promise<AiAdminSettings> {
  if (!isFirebaseAdminConfigured()) {
    return normalizeAiAdminSettings(getMemoryStore().settings);
  }

  try {
    const ref = settingsCollection().doc(SETTINGS_DOC_ID);
    const snap = await ref.get();
    if (!snap.exists) {
      const defaults = getDefaultAiAdminSettings();
      await ref.set({ value: defaults, updatedAt: nowIso() });
      getMemoryStore().settings = defaults;
      return defaults;
    }
    const raw = snap.data() as Record<string, unknown>;
    const normalized = normalizeAiAdminSettings(raw.value ?? raw);
    getMemoryStore().settings = normalized;
    return normalized;
  } catch (error) {
    console.warn('[ai] readAiAdminSettings failed, using memory:', error);
    return normalizeAiAdminSettings(getMemoryStore().settings);
  }
}

export async function saveAiAdminSettings(
  input: AiAdminSettings,
  actorId: string | null,
): Promise<AiAdminSettings> {
  const normalized = normalizeAiAdminSettings({
    ...input,
    updatedAt: nowIso(),
    updatedBy: actorId,
  });

  getMemoryStore().settings = normalized;

  if (!isFirebaseAdminConfigured()) {
    return normalized;
  }

  try {
    await settingsCollection().doc(SETTINGS_DOC_ID).set(
      { value: normalized, updatedAt: nowIso() },
      { merge: true },
    );
  } catch (error) {
    console.warn('[ai] saveAiAdminSettings Firestore failed, kept in memory:', error);
  }

  return normalized;
}

export async function appendAiUsageLog(
  entry: Omit<AiUsageLog, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<AiUsageLog> {
  const log: AiUsageLog = {
    id: makeId('aiu'),
    createdAt: entry.createdAt ?? nowIso(),
    capability: entry.capability,
    engine: entry.engine,
    success: entry.success,
    latencyMs: entry.latencyMs,
    estimatedTokens: entry.estimatedTokens,
    estimatedCostUsd: entry.estimatedCostUsd,
    errorCode: entry.errorCode,
    preview: entry.preview,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
  };

  const mem = getMemoryStore();
  mem.usage.unshift(log);
  if (mem.usage.length > MAX_IN_MEMORY_LOGS) {
    mem.usage = mem.usage.slice(0, MAX_IN_MEMORY_LOGS);
  }

  if (isFirebaseAdminConfigured()) {
    try {
      await usageCollection().doc(log.id).set(log);
    } catch (error) {
      console.warn('[ai] appendAiUsageLog Firestore failed:', error);
    }
  }

  return log;
}

export async function appendAiAuditLog(input: {
  action: string;
  actorId: string;
  actorEmail: string;
  changedFields: string[];
}): Promise<AiAuditLog> {
  const log: AiAuditLog = {
    id: makeId('aia'),
    action: input.action,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    changedFields: input.changedFields,
    createdAt: nowIso(),
  };

  const mem = getMemoryStore();
  mem.audit.unshift(log);
  if (mem.audit.length > MAX_IN_MEMORY_LOGS) {
    mem.audit = mem.audit.slice(0, MAX_IN_MEMORY_LOGS);
  }

  if (isFirebaseAdminConfigured()) {
    try {
      await auditCollection().doc(log.id).set(log);
    } catch (error) {
      console.warn('[ai] appendAiAuditLog Firestore failed:', error);
    }
  }

  return log;
}

function startOfDayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function listAiUsageLogs(options?: {
  limit?: number;
  capability?: string;
  engine?: string;
}): Promise<AiUsageLog[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);

  if (!isFirebaseAdminConfigured()) {
    return filterUsage(getMemoryStore().usage, options).slice(0, limit);
  }

  try {
    const snap = await usageCollection().orderBy('createdAt', 'desc').limit(limit * 2).get();
    const rows = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      return {
        id: asString(d.id, doc.id),
        capability: asString(d.capability, 'ai_chatbot') as AiUsageLog['capability'],
        engine: asString(d.engine, 'heuristic') as AiUsageLog['engine'],
        success: asBoolean(d.success, false),
        latencyMs: asNumber(d.latencyMs, 0),
        estimatedTokens: asNumber(d.estimatedTokens, 0),
        estimatedCostUsd: asNumber(d.estimatedCostUsd, 0),
        errorCode: typeof d.errorCode === 'string' ? d.errorCode : null,
        preview: typeof d.preview === 'string' ? d.preview : null,
        actorId: typeof d.actorId === 'string' ? d.actorId : null,
        actorRole: typeof d.actorRole === 'string' ? d.actorRole : null,
        createdAt: toIso(d.createdAt),
      } satisfies AiUsageLog;
    });
    return filterUsage(rows, options).slice(0, limit);
  } catch (error) {
    console.warn('[ai] listAiUsageLogs failed:', error);
    return filterUsage(getMemoryStore().usage, options).slice(0, limit);
  }
}

function filterUsage(
  rows: AiUsageLog[],
  options?: { capability?: string; engine?: string },
): AiUsageLog[] {
  return rows.filter((r) => {
    if (options?.capability && r.capability !== options.capability) return false;
    if (options?.engine && r.engine !== options.engine) return false;
    return true;
  });
}

export async function listAiAuditLogs(limit = 50): Promise<AiAuditLog[]> {
  const capped = Math.min(Math.max(limit, 1), 200);
  if (!isFirebaseAdminConfigured()) {
    return getMemoryStore().audit.slice(0, capped);
  }
  try {
    const snap = await auditCollection().orderBy('createdAt', 'desc').limit(capped).get();
    return snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      return {
        id: asString(d.id, doc.id),
        action: asString(d.action),
        actorId: asString(d.actorId),
        actorEmail: asString(d.actorEmail),
        changedFields: Array.isArray(d.changedFields)
          ? d.changedFields.filter((x): x is string => typeof x === 'string')
          : [],
        createdAt: toIso(d.createdAt),
      };
    });
  } catch {
    return getMemoryStore().audit.slice(0, capped);
  }
}

export async function summarizeAiUsage(
  settings: AiAdminSettings,
): Promise<AiUsageSummary> {
  const logs = await listAiUsageLogs({ limit: 200 });
  const dayStart = startOfDayIso();
  const monthStart = startOfMonthIso();

  let successCount = 0;
  let errorCount = 0;
  let blockedCount = 0;
  let llmCount = 0;
  let heuristicCount = 0;
  let latencySum = 0;
  let costSum = 0;
  let dailyUsed = 0;
  let monthlyUsed = 0;
  const byCapability: Record<string, number> = {};

  for (const log of logs) {
    byCapability[log.capability] = (byCapability[log.capability] ?? 0) + 1;
    latencySum += log.latencyMs;
    costSum += log.estimatedCostUsd;
    if (log.success) successCount += 1;
    else if (log.engine === 'blocked') blockedCount += 1;
    else errorCount += 1;
    if (log.engine === 'llm') llmCount += 1;
    if (log.engine === 'heuristic') heuristicCount += 1;
    if (log.createdAt >= dayStart) dailyUsed += 1;
    if (log.createdAt >= monthStart) monthlyUsed += 1;
  }

  // Also count from memory store for today/month when Firestore has partial data
  for (const log of getMemoryStore().usage) {
    if (log.createdAt >= dayStart) {
      // already counted if in logs; use set uniqueness via id — skip exact dupes
    }
  }

  return {
    totalRequests: logs.length,
    successCount,
    errorCount,
    blockedCount,
    llmCount,
    heuristicCount,
    avgLatencyMs: logs.length ? Math.round(latencySum / logs.length) : 0,
    estimatedCostUsd: Number(costSum.toFixed(4)),
    byCapability,
    dailyUsed,
    monthlyUsed,
    dailyLimit: settings.budget.dailyRequestLimit,
    monthlyLimit: settings.budget.monthlyRequestLimit,
  };
}

export async function purgeOldAiLogs(retentionDays: number): Promise<number> {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const mem = getMemoryStore();
  const before = mem.usage.length;
  mem.usage = mem.usage.filter((l) => new Date(l.createdAt).getTime() >= cutoff);
  let deleted = before - mem.usage.length;

  if (!isFirebaseAdminConfigured()) return deleted;

  try {
    const snap = await usageCollection()
      .where('createdAt', '<', new Date(cutoff).toISOString())
      .limit(200)
      .get();
    const batch = snap.docs;
    await Promise.all(batch.map((d) => d.ref.delete()));
    deleted += batch.length;
  } catch (error) {
    console.warn('[ai] purgeOldAiLogs failed:', error);
  }
  return deleted;
}

export async function countUsageSince(isoStart: string): Promise<number> {
  const memCount = getMemoryStore().usage.filter((l) => l.createdAt >= isoStart).length;
  if (!isFirebaseAdminConfigured()) return memCount;
  try {
    const snap = await usageCollection().where('createdAt', '>=', isoStart).count().get();
    return snap.data().count;
  } catch {
    return memCount;
  }
}

export type { AiCapabilityKey };
