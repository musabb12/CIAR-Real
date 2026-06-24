import {
  DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS,
  normalizeSubscriptionSettings,
} from '@/lib/subscription-plans';
import type { PartnerSubscription, PartnerSubscriptionSettings } from '@/types/subscription';

const demoSettings: PartnerSubscriptionSettings = {
  ...DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS,
};

const demoSubscriptions = new Map<string, PartnerSubscription>();

export function getDemoSubscriptionSettings(): PartnerSubscriptionSettings {
  return normalizeSubscriptionSettings(demoSettings);
}

export function saveDemoSubscriptionSettings(
  input: Partial<PartnerSubscriptionSettings>,
): PartnerSubscriptionSettings {
  const next = normalizeSubscriptionSettings({ ...demoSettings, ...input });
  Object.assign(demoSettings, next);
  return next;
}

export function getDemoPartnerSubscription(agentId: string): PartnerSubscription | null {
  return demoSubscriptions.get(agentId) ?? null;
}

export function listDemoPartnerSubscriptions(): PartnerSubscription[] {
  return Array.from(demoSubscriptions.values());
}

export function upsertDemoPartnerSubscription(
  input: Omit<PartnerSubscription, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
  },
): PartnerSubscription {
  const now = new Date().toISOString();
  const existing = demoSubscriptions.get(input.agentId);
  const record: PartnerSubscription = {
    id: input.id ?? existing?.id ?? `demo-sub-${input.agentId}`,
    agentId: input.agentId,
    userId: input.userId,
    planId: input.planId,
    status: input.status,
    exempt: input.exempt,
    exemptNote: input.exemptNote ?? null,
    exemptGrantedAt: input.exemptGrantedAt ?? null,
    exemptGrantedBy: input.exemptGrantedBy ?? null,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    amountPaid: input.amountPaid,
    paymentMethod: input.paymentMethod,
    createdAt: existing?.createdAt ?? input.createdAt ?? now,
    updatedAt: now,
  };
  demoSubscriptions.set(input.agentId, record);
  return record;
}
