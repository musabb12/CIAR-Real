import type { SubscriptionPaymentMethod } from '@/types/subscription';

/** All supported checkout payment methods (matches home page showcase). */
export const DEFAULT_SUBSCRIPTION_PAYMENT_METHODS: SubscriptionPaymentMethod[] = [
  { id: 'visa', labelAr: 'فيزا', labelEn: 'Visa', enabled: true },
  { id: 'mastercard', labelAr: 'ماستركارد', labelEn: 'Mastercard', enabled: true },
  { id: 'amex', labelAr: 'أمريكان إكسبريس', labelEn: 'American Express', enabled: true },
  { id: 'paypal', labelAr: 'باي بال', labelEn: 'PayPal', enabled: true },
  { id: 'apple-pay', labelAr: 'Apple Pay', labelEn: 'Apple Pay', enabled: true },
  { id: 'google-pay', labelAr: 'Google Pay', labelEn: 'Google Pay', enabled: true },
  { id: 'mada', labelAr: 'مدى', labelEn: 'mada', enabled: true },
  { id: 'stc-pay', labelAr: 'STC Pay', labelEn: 'STC Pay', enabled: true },
  { id: 'bank-transfer', labelAr: 'تحويل بنكي', labelEn: 'Bank transfer', enabled: true },
  { id: 'whish', labelAr: 'Whish Money — ويش موني', labelEn: 'Whish Money', enabled: true },
  {
    id: 'ciar-prepaid',
    labelAr: 'بطاقة CIAR المسبقة الدفع',
    labelEn: 'CIAR Prepaid Card',
    enabled: true,
  },
];

const LEGACY_METHOD_IDS: Record<string, string> = {
  card: 'visa',
  bank: 'bank-transfer',
};

export function normalizePaymentMethodId(id: string): string {
  return LEGACY_METHOD_IDS[id] ?? id;
}

export type PaymentFieldGroup =
  | 'card'
  | 'bank'
  | 'whish'
  | 'prepaid'
  | 'paypal'
  | 'mobile-wallet'
  | 'stc';

export function getPaymentFieldGroup(methodId: string): PaymentFieldGroup {
  const id = normalizePaymentMethodId(methodId);
  if (['visa', 'mastercard', 'amex', 'mada'].includes(id)) return 'card';
  if (id === 'bank-transfer') return 'bank';
  if (id === 'whish') return 'whish';
  if (id === 'ciar-prepaid') return 'prepaid';
  if (id === 'paypal') return 'paypal';
  if (id === 'apple-pay' || id === 'google-pay') return 'mobile-wallet';
  if (id === 'stc-pay') return 'stc';
  return 'card';
}

export function mergePaymentMethods(
  configured: SubscriptionPaymentMethod[] | undefined,
): SubscriptionPaymentMethod[] {
  const map = new Map(
    DEFAULT_SUBSCRIPTION_PAYMENT_METHODS.map((method) => [method.id, { ...method }]),
  );

  for (const method of configured ?? []) {
    const id = normalizePaymentMethodId(method.id);
    const existing = map.get(id);
    if (existing) {
      map.set(id, { ...existing, ...method, id });
    }
  }

  return [...map.values()];
}

export function resolveCheckoutPaymentMethods(
  configured: SubscriptionPaymentMethod[] | undefined,
): SubscriptionPaymentMethod[] {
  return mergePaymentMethods(configured);
}

export function paymentBrandId(methodId: string): string {
  const id = normalizePaymentMethodId(methodId);
  if (id === 'bank-transfer') return 'bank-transfer';
  return id;
}
