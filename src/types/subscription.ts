export type SubscriptionPlanId =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'biennial';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  days: number;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  featuresAr: string[];
  featuresEn: string[];
  badgeAr?: string | null;
  badgeEn?: string | null;
  highlighted: boolean;
  price: number;
  enabled: boolean;
}

export interface SubscriptionPaymentMethod {
  id: string;
  labelAr: string;
  labelEn: string;
  enabled: boolean;
}

export interface PartnerSubscriptionSettings {
  enabled: boolean;
  currency: string;
  plans: SubscriptionPlanConfig[];
  paymentMethods: SubscriptionPaymentMethod[];
}

export type PartnerSubscriptionStatus = 'active' | 'expired' | 'none';

export interface PartnerSubscription {
  id: string;
  agentId: string;
  userId: string;
  planId: SubscriptionPlanId | null;
  status: PartnerSubscriptionStatus;
  exempt: boolean;
  exemptNote?: string | null;
  exemptGrantedAt?: string | null;
  exemptGrantedBy?: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  amountPaid: number | null;
  paymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerSubscriptionView extends PartnerSubscription {
  isActive: boolean;
  partnerName?: string;
  partnerEmail?: string;
  partnerRole?: string;
}

export interface PartnerSubscriptionCheckoutState {
  planId: SubscriptionPlanId;
  paymentMethod: string;
}
