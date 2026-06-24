import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  getDemoPartnerSubscription,
  getDemoSubscriptionSettings,
  listDemoPartnerSubscriptions,
  saveDemoSubscriptionSettings,
  upsertDemoPartnerSubscription,
} from '@/lib/demo-subscriptions';
import {
  asBoolean,
  asNullableString,
  asNumber,
  asString,
  col,
  makeId,
  nowIso,
  toIso,
} from '@/lib/firestore-shared';
import {
  computeSubscriptionExpiry,
  DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS,
  getPlanById,
  isPartnerSubscriptionActive,
  normalizeSubscriptionSettings,
} from '@/lib/subscription-plans';
import type {
  PartnerSubscription,
  PartnerSubscriptionSettings,
  PartnerSubscriptionView,
  SubscriptionPlanId,
} from '@/types/subscription';

const SETTINGS_DOC_ID = 'global';

function settingsCollection() {
  return col('subscriptionSettings');
}

function subscriptionCollection() {
  return col('partnerSubscriptions');
}

function subscriptionDocToRecord(
  agentId: string,
  data: Record<string, unknown>,
): PartnerSubscription {
  return {
    id: asString(data.id, agentId),
    agentId,
    userId: asString(data.userId),
    planId: (data.planId as SubscriptionPlanId | null) ?? null,
    status: (data.status as PartnerSubscription['status']) ?? 'none',
    exempt: asBoolean(data.exempt, false),
    exemptNote: asNullableString(data.exemptNote),
    exemptGrantedAt: asNullableString(data.exemptGrantedAt),
    exemptGrantedBy: asNullableString(data.exemptGrantedBy),
    startsAt: asNullableString(data.startsAt),
    expiresAt: asNullableString(data.expiresAt),
    amountPaid: data.amountPaid == null ? null : asNumber(data.amountPaid, 0),
    paymentMethod: asNullableString(data.paymentMethod),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function readSubscriptionSettings(): Promise<PartnerSubscriptionSettings> {
  if (!isFirebaseAdminConfigured()) {
    return getDemoSubscriptionSettings();
  }

  const ref = settingsCollection().doc(SETTINGS_DOC_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    const defaults = DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS;
    await ref.set({ value: defaults, updatedAt: nowIso() });
    return defaults;
  }

  const raw = snap.data() as Record<string, unknown>;
  return normalizeSubscriptionSettings(raw.value ?? raw);
}

export async function saveSubscriptionSettings(
  input: unknown,
): Promise<PartnerSubscriptionSettings> {
  const normalized = normalizeSubscriptionSettings(input);

  if (!isFirebaseAdminConfigured()) {
    return saveDemoSubscriptionSettings(normalized);
  }

  await settingsCollection().doc(SETTINGS_DOC_ID).set(
    { value: normalized, updatedAt: nowIso() },
    { merge: true },
  );
  return normalized;
}

export async function getPartnerSubscription(
  agentId: string,
): Promise<PartnerSubscription | null> {
  if (!agentId) return null;

  if (!isFirebaseAdminConfigured()) {
    return getDemoPartnerSubscription(agentId);
  }

  const snap = await subscriptionCollection().doc(agentId).get();
  if (!snap.exists) return null;
  return subscriptionDocToRecord(agentId, snap.data() as Record<string, unknown>);
}

export async function listPartnerSubscriptions(): Promise<PartnerSubscription[]> {
  if (!isFirebaseAdminConfigured()) {
    return listDemoPartnerSubscriptions();
  }

  const snap = await subscriptionCollection().get();
  return snap.docs.map((doc) =>
    subscriptionDocToRecord(doc.id, doc.data() as Record<string, unknown>),
  );
}

async function writePartnerSubscription(
  agentId: string,
  payload: Record<string, unknown>,
): Promise<PartnerSubscription> {
  if (!isFirebaseAdminConfigured()) {
    const existing = getDemoPartnerSubscription(agentId);
    return upsertDemoPartnerSubscription({
      id: existing?.id,
      agentId,
      userId: asString(payload.userId),
      planId: (payload.planId as SubscriptionPlanId | null) ?? null,
      status: (payload.status as PartnerSubscription['status']) ?? 'none',
      exempt: asBoolean(payload.exempt, false),
      exemptNote: asNullableString(payload.exemptNote),
      exemptGrantedAt: asNullableString(payload.exemptGrantedAt),
      exemptGrantedBy: asNullableString(payload.exemptGrantedBy),
      startsAt: asNullableString(payload.startsAt),
      expiresAt: asNullableString(payload.expiresAt),
      amountPaid: payload.amountPaid == null ? null : asNumber(payload.amountPaid, 0),
      paymentMethod: asNullableString(payload.paymentMethod),
      createdAt: existing?.createdAt,
    });
  }

  const ref = subscriptionCollection().doc(agentId);
  const existing = await ref.get();
  const now = nowIso();
  const merged = {
    ...payload,
    id: existing.exists
      ? asString((existing.data() as Record<string, unknown>).id, agentId)
      : makeId('sub'),
    agentId,
    updatedAt: now,
    createdAt: existing.exists
      ? toIso((existing.data() as Record<string, unknown>).createdAt)
      : now,
  };
  await ref.set(merged, { merge: true });
  const updated = await ref.get();
  return subscriptionDocToRecord(agentId, updated.data() as Record<string, unknown>);
}

export async function partnerCanPublishListings(agentId: string): Promise<{
  allowed: boolean;
  settings: PartnerSubscriptionSettings;
  subscription: PartnerSubscription | null;
}> {
  const settings = await readSubscriptionSettings();
  const subscription = await getPartnerSubscription(agentId);
  const allowed = isPartnerSubscriptionActive(subscription, settings);
  return { allowed, settings, subscription };
}

export async function activatePartnerSubscription(input: {
  agentId: string;
  userId: string;
  planId: SubscriptionPlanId;
  paymentMethod: string;
}): Promise<PartnerSubscription> {
  const settings = await readSubscriptionSettings();
  const plan = getPlanById(settings, input.planId);
  if (!plan) {
    throw new Error('Selected plan is not available');
  }

  const enabledMethod = settings.paymentMethods.find(
    (method) => method.id === input.paymentMethod && method.enabled,
  );
  if (!enabledMethod) {
    throw new Error('Selected payment method is not available');
  }

  const existing = await getPartnerSubscription(input.agentId);
  const now = new Date();
  const baseDate =
    existing?.expiresAt && new Date(existing.expiresAt).getTime() > now.getTime()
      ? new Date(existing.expiresAt)
      : now;

  const startsAt = baseDate === now ? now.toISOString() : existing!.expiresAt!;
  const expiresAt = computeSubscriptionExpiry(plan, baseDate);

  return writePartnerSubscription(input.agentId, {
    userId: input.userId,
    planId: input.planId,
    status: 'active',
    exempt: false,
    exemptNote: null,
    exemptGrantedAt: null,
    exemptGrantedBy: null,
    startsAt: existing?.status === 'active' && existing.expiresAt && new Date(existing.expiresAt) > now
      ? existing.startsAt
      : now.toISOString(),
    expiresAt,
    amountPaid: plan.price,
    paymentMethod: input.paymentMethod,
  });
}

export async function setPartnerSubscriptionExempt(input: {
  agentId: string;
  userId: string;
  exempt: boolean;
  exemptNote?: string | null;
  grantedBy?: string | null;
}): Promise<PartnerSubscription> {
  const existing = await getPartnerSubscription(input.agentId);
  const now = nowIso();

  if (input.exempt) {
    return writePartnerSubscription(input.agentId, {
      userId: input.userId,
      planId: existing?.planId ?? null,
      status: 'active',
      exempt: true,
      exemptNote: input.exemptNote?.trim() || null,
      exemptGrantedAt: now,
      exemptGrantedBy: input.grantedBy ?? null,
      startsAt: existing?.startsAt ?? now,
      expiresAt: null,
      amountPaid: existing?.amountPaid ?? null,
      paymentMethod: existing?.paymentMethod ?? null,
    });
  }

  const settings = await readSubscriptionSettings();
  const stillActive = isPartnerSubscriptionActive(existing, settings);

  return writePartnerSubscription(input.agentId, {
    userId: input.userId,
    planId: existing?.planId ?? null,
    status: stillActive ? 'active' : 'expired',
    exempt: false,
    exemptNote: null,
    exemptGrantedAt: null,
    exemptGrantedBy: null,
    startsAt: existing?.startsAt ?? null,
    expiresAt: existing?.expiresAt ?? null,
    amountPaid: existing?.amountPaid ?? null,
    paymentMethod: existing?.paymentMethod ?? null,
  });
}

export function toSubscriptionView(
  subscription: PartnerSubscription | null,
  settings: PartnerSubscriptionSettings,
  meta?: { partnerName?: string; partnerEmail?: string; partnerRole?: string },
): PartnerSubscriptionView {
  const base: PartnerSubscription = subscription ?? {
    id: '',
    agentId: meta?.partnerName ? '' : '',
    userId: '',
    planId: null,
    status: 'none',
    exempt: false,
    startsAt: null,
    expiresAt: null,
    amountPaid: null,
    paymentMethod: null,
    createdAt: '',
    updatedAt: '',
  };

  return {
    ...base,
    isActive: isPartnerSubscriptionActive(subscription, settings),
    partnerName: meta?.partnerName,
    partnerEmail: meta?.partnerEmail,
    partnerRole: meta?.partnerRole,
  };
}
