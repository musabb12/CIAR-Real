import type {
  PartnerSubscription,
  PartnerSubscriptionSettings,
  SubscriptionPlanConfig,
  SubscriptionPlanId,
} from '@/types/subscription';

export const SUBSCRIPTION_PLAN_IDS: SubscriptionPlanId[] = [
  'weekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
  'biennial',
];

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    id: 'weekly',
    days: 7,
    labelAr: 'أسبوعي',
    labelEn: 'Weekly',
    descriptionAr: 'مثالي لتجربة المنصة ونشر إعلانك الأول بسرعة.',
    descriptionEn: 'Perfect to try the platform and publish your first listing quickly.',
    featuresAr: [
      'نشر حتى 3 عقارات',
      'ظهور في نتائج البحث',
      'دعم عبر البريد الإلكتروني',
      'لوحة تحكم أساسية',
    ],
    featuresEn: [
      'Publish up to 3 listings',
      'Search results visibility',
      'Email support',
      'Basic partner dashboard',
    ],
    badgeAr: null,
    badgeEn: null,
    highlighted: false,
    price: 29,
    enabled: true,
  },
  {
    id: 'monthly',
    days: 30,
    labelAr: 'شهري',
    labelEn: 'Monthly',
    descriptionAr: 'الخيار الأنسب للوكلاء النشطين الذين ينشرون بانتظام.',
    descriptionEn: 'Best for active agents who publish listings regularly.',
    featuresAr: [
      'نشر حتى 15 عقاراً',
      'شارة «موثّق» على الملف',
      'أولوية في نتائج البحث',
      'إحصائيات المشاهدات',
      'دعم خلال 24 ساعة',
    ],
    featuresEn: [
      'Publish up to 15 listings',
      'Verified badge on profile',
      'Priority search placement',
      'View analytics',
      '24-hour support',
    ],
    badgeAr: 'الأكثر شعبية',
    badgeEn: 'Most popular',
    highlighted: true,
    price: 79,
    enabled: true,
  },
  {
    id: 'quarterly',
    days: 90,
    labelAr: 'ربع سنوي',
    labelEn: 'Quarterly',
    descriptionAr: 'وفر أكثر مع التزام ربع سنوي وميزات إضافية للنمو.',
    descriptionEn: 'Save more with a quarterly commitment and growth features.',
    featuresAr: [
      'نشر حتى 40 عقاراً',
      'عقار مميز واحد شهرياً',
      'ظهور في الصفحة الرئيسية',
      'تقارير أداء مفصّلة',
      'مدير حساب مخصص',
    ],
    featuresEn: [
      'Publish up to 40 listings',
      '1 featured listing per month',
      'Homepage exposure',
      'Detailed performance reports',
      'Dedicated account manager',
    ],
    badgeAr: 'توفير 15%',
    badgeEn: 'Save 15%',
    highlighted: false,
    price: 199,
    enabled: true,
  },
  {
    id: 'semiannual',
    days: 180,
    labelAr: 'نصف سنوي',
    labelEn: '6 months',
    descriptionAr: 'للشركات المتوسطة التي تدير محفظة عقارات متنامية.',
    descriptionEn: 'For growing firms managing an expanding property portfolio.',
    featuresAr: [
      'نشر غير محدود',
      '3 عقارات مميزة شهرياً',
      'شعار الشركة على الإعلانات',
      'تصدير التقارير PDF',
      'دعم هاتفي أولوية',
    ],
    featuresEn: [
      'Unlimited listings',
      '3 featured listings per month',
      'Company branding on ads',
      'PDF report exports',
      'Priority phone support',
    ],
    badgeAr: 'للشركات',
    badgeEn: 'For companies',
    highlighted: false,
    price: 349,
    enabled: true,
  },
  {
    id: 'annual',
    days: 365,
    labelAr: 'سنوي',
    labelEn: 'Annual',
    descriptionAr: 'أفضل قيمة للوكالات الراسخة — سنة كاملة من النمو.',
    descriptionEn: 'Best value for established agencies — a full year of growth.',
    featuresAr: [
      'كل ميزات النصف سنوي',
      '5 عقارات مميزة شهرياً',
      'حملة ترويجية ربع سنوية',
      'تدريب فريق مجاني',
      'أولوية في الدعم الفني',
    ],
    featuresEn: [
      'All semi-annual features',
      '5 featured listings per month',
      'Quarterly promotional campaign',
      'Free team training',
      'Priority technical support',
    ],
    badgeAr: 'أفضل قيمة',
    badgeEn: 'Best value',
    highlighted: false,
    price: 599,
    enabled: true,
  },
  {
    id: 'biennial',
    days: 730,
    labelAr: 'سنتان',
    labelEn: '2 years',
    descriptionAr: 'للشركات الكبرى والامتيازات العقارية — استثمار طويل الأمد.',
    descriptionEn: 'For large firms and franchises — a long-term partnership.',
    featuresAr: [
      'كل ميزات السنوي',
      '10 عقارات مميزة شهرياً',
      'صفحة شركة مخصصة',
      'تكامل API للعقارات',
      'مدير نجاح مخصص',
      'أقصى أولوية في الدعم',
    ],
    featuresEn: [
      'All annual features',
      '10 featured listings per month',
      'Dedicated company page',
      'Property API integration',
      'Dedicated success manager',
      'Highest support priority',
    ],
    badgeAr: 'مؤسسي',
    badgeEn: 'Enterprise',
    highlighted: false,
    price: 999,
    enabled: true,
  },
];

import type { SubscriptionPaymentMethod } from '@/types/subscription';
import {
  DEFAULT_SUBSCRIPTION_PAYMENT_METHODS,
  mergePaymentMethods,
} from '@/lib/payment-method-config';

export { DEFAULT_SUBSCRIPTION_PAYMENT_METHODS, mergePaymentMethods };

export const DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS: PartnerSubscriptionSettings = {
  enabled: true,
  currency: 'USD',
  plans: DEFAULT_SUBSCRIPTION_PLANS,
  paymentMethods: DEFAULT_SUBSCRIPTION_PAYMENT_METHODS,
};

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => String(item).trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function normalizePlan(
  defaults: SubscriptionPlanConfig,
  override?: Partial<SubscriptionPlanConfig>,
): SubscriptionPlanConfig {
  const merged = { ...defaults, ...(override ?? {}) };
  return {
    ...merged,
    id: defaults.id,
    days: override?.days ?? defaults.days,
    labelAr: override?.labelAr?.trim() || defaults.labelAr,
    labelEn: override?.labelEn?.trim() || defaults.labelEn,
    descriptionAr: override?.descriptionAr?.trim() || defaults.descriptionAr,
    descriptionEn: override?.descriptionEn?.trim() || defaults.descriptionEn,
    featuresAr: normalizeStringArray(override?.featuresAr, defaults.featuresAr),
    featuresEn: normalizeStringArray(override?.featuresEn, defaults.featuresEn),
    badgeAr: override?.badgeAr?.trim() || defaults.badgeAr || null,
    badgeEn: override?.badgeEn?.trim() || defaults.badgeEn || null,
    highlighted: override?.highlighted ?? defaults.highlighted,
    price: override?.price ?? defaults.price,
    enabled: override?.enabled ?? defaults.enabled,
  };
}

export function normalizeSubscriptionSettings(
  input: unknown,
): PartnerSubscriptionSettings {
  const value = (input ?? {}) as Partial<PartnerSubscriptionSettings>;
  const planMap = new Map(
    (value.plans ?? []).map((plan) => [plan.id, plan]),
  );

  const plans = DEFAULT_SUBSCRIPTION_PLANS.map((defaults) =>
    normalizePlan(defaults, planMap.get(defaults.id)),
  );

  const methodMap = new Map(
    (value.paymentMethods ?? []).map((method) => [method.id, method]),
  );

  const paymentMethods = DEFAULT_SUBSCRIPTION_PAYMENT_METHODS.map((defaults) => {
    const override =
      methodMap.get(defaults.id) ??
      (defaults.id === 'bank-transfer' ? methodMap.get('bank') : undefined) ??
      (defaults.id === 'visa' ? methodMap.get('card') : undefined);
    return { ...defaults, ...(override ?? {}), id: defaults.id };
  });

  return {
    enabled: value.enabled ?? DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS.enabled,
    currency: value.currency?.trim() || DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS.currency,
    plans,
    paymentMethods,
  };
}

export function getPlanById(
  settings: PartnerSubscriptionSettings,
  planId: SubscriptionPlanId,
): SubscriptionPlanConfig | undefined {
  return settings.plans.find((plan) => plan.id === planId && plan.enabled);
}

export function isPartnerSubscriptionActive(
  subscription: PartnerSubscription | null | undefined,
  settings: PartnerSubscriptionSettings,
  now = new Date(),
): boolean {
  if (!settings.enabled) return true;
  if (!subscription) return false;
  if (subscription.exempt) return true;
  if (subscription.status !== 'active' || !subscription.expiresAt) return false;
  return new Date(subscription.expiresAt).getTime() > now.getTime();
}

export function computeSubscriptionExpiry(
  plan: SubscriptionPlanConfig,
  from = new Date(),
): string {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + plan.days);
  return expires.toISOString();
}

export function getPlanFeatures(
  plan: SubscriptionPlanConfig,
  isAr: boolean,
): string[] {
  return isAr ? plan.featuresAr : plan.featuresEn;
}

export function getPlanDescription(
  plan: SubscriptionPlanConfig,
  isAr: boolean,
): string {
  return isAr ? plan.descriptionAr : plan.descriptionEn;
}

export function getPlanBadge(
  plan: SubscriptionPlanConfig,
  isAr: boolean,
): string | null {
  const badge = isAr ? plan.badgeAr : plan.badgeEn;
  return badge?.trim() || null;
}
