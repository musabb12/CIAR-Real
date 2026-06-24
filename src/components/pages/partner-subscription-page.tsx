'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useSiteCurrency } from '@/hooks/use-site-currency';
import { isPartnerRole } from '@/lib/auth-roles';
import {
  DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS,
  getPlanBadge,
  getPlanDescription,
  getPlanFeatures,
} from '@/lib/subscription-plans';
import type {
  PartnerSubscriptionSettings,
  PartnerSubscriptionView,
  SubscriptionPlanConfig,
  SubscriptionPlanId,
} from '@/types/subscription';
import { toast } from 'sonner';

type SubscriptionResponse = PartnerSubscriptionView & {
  agentId: string;
  canPublish: boolean;
  settings: PartnerSubscriptionSettings;
};

export function PartnerSubscriptionPage() {
  const { rtl } = useTranslation();
  const isAr = rtl;
  const { formatPrice } = useSiteCurrency();
  const {
    currentUser,
    isAuthenticated,
    setCurrentPage,
    partnerPendingAddListing,
    setPartnerPendingAddListing,
    setPartnerSubscriptionCheckout,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId | ''>('');

  const isPartner = currentUser && isPartnerRole(currentUser.role);
  const tx = useCallback((ar: string, en: string) => (isAr ? ar : en), [isAr]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partner/subscription');
      if (!res.ok) throw new Error('Failed');
      const json = (await res.json()) as SubscriptionResponse;
      setData(json);
      const highlighted = json.settings.plans.find((p) => p.enabled && p.highlighted);
      const first = highlighted ?? json.settings.plans.find((p) => p.enabled);
      if (first) setSelectedPlan(first.id);
    } catch {
      toast.error(isAr ? 'تعذّر تحميل بيانات الاشتراك' : 'Could not load subscription');
      setData({
        id: '',
        agentId: '',
        userId: currentUser?.id ?? '',
        planId: null,
        status: 'none',
        exempt: false,
        startsAt: null,
        expiresAt: null,
        amountPaid: null,
        paymentMethod: null,
        createdAt: '',
        updatedAt: '',
        isActive: false,
        canPublish: false,
        settings: DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS,
      });
      const highlighted = DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS.plans.find(
        (p) => p.enabled && p.highlighted,
      );
      if (highlighted) setSelectedPlan(highlighted.id);
    } finally {
      setLoading(false);
    }
  }, [isAr, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated || !isPartner) {
      setCurrentPage('login');
      return;
    }
    void load();
  }, [isAuthenticated, isPartner, load, setCurrentPage]);

  const settings = data?.settings ?? DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS;
  const enabledPlans = useMemo(
    () => settings.plans.filter((plan) => plan.enabled),
    [settings.plans],
  );
  const selectedPlanConfig = enabledPlans.find((plan) => plan.id === selectedPlan);

  const goAfterSuccess = () => {
    if (partnerPendingAddListing) setPartnerPendingAddListing(true);
    setCurrentPage('partner-dashboard');
  };

  const handleContinueToPayment = () => {
    if (!selectedPlan) {
      toast.error(tx('اختر باقة الاشتراك', 'Select a subscription plan'));
      return;
    }
    setPartnerSubscriptionCheckout({ planId: selectedPlan, paymentMethod: 'card' });
    setCurrentPage('partner-subscription-checkout');
  };

  if (!isAuthenticated || !isPartner) return null;

  const alreadyActive = data?.canPublish;

  return (
    <div className="auth-page-image-bg min-h-dvh py-6 sm:py-10 relative overflow-x-hidden">
      <div className="absolute top-7 -right-32 w-96 h-3 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setCurrentPage('partner-dashboard')}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className={`h-4 w-4 ${rtl ? 'rotate-180' : ''}`} />
          {tx('لوحة الشريك', 'Partner dashboard')}
        </button>

        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-200 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {tx('اشتراك نشر الإعلانات', 'Listing subscription')}
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {tx('اختر الباقة المناسبة لنمو أعمالك', 'Choose the plan that fits your growth')}
          </h1>
          <p className="text-white/55 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
            {tx(
              'باقات مرنة من أسبوع إلى سنتين — كل باقة بمزاياها الخاصة. يمكن للإدارة تخصيص الأسعار والمميزات.',
              'Flexible plans from one week to two years — each with its own benefits. Admin can customize pricing and features.',
            )}
          </p>
        </div>

        {loading ? (
          <div className="auth-card rounded-2xl max-w-lg mx-auto p-10 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-amber-400 mx-auto" />
            <p className="text-white/70 text-sm">
              {tx('جاري تحميل الباقات…', 'Loading plans…')}
            </p>
          </div>
        ) : alreadyActive ? (
          <div className="auth-card rounded-2xl max-w-lg mx-auto p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {data?.exempt
                ? tx('خدمة مجانية مفعّلة', 'Free access enabled')
                : tx('اشتراكك نشط', 'Your subscription is active')}
            </h2>
            {data?.expiresAt && !data.exempt && (
              <p className="text-white/55 text-sm mb-6">
                {tx('ينتهي في', 'Expires')}:{' '}
                {new Date(data.expiresAt).toLocaleDateString(rtl ? 'ar' : 'en')}
              </p>
            )}
            <Button
              className="checkout-pay-btn rounded-xl border-0 text-white w-full"
              onClick={goAfterSuccess}
            >
              {partnerPendingAddListing
                ? tx('متابعة إضافة العقار', 'Continue to add listing')
                : tx('العودة للوحة التحكم', 'Back to dashboard')}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
              {enabledPlans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  currency={settings.currency}
                  selected={selectedPlan === plan.id}
                  onSelect={() => setSelectedPlan(plan.id)}
                  formatPrice={(amount) => formatPrice(amount, settings.currency)}
                  isAr={isAr}
                  tx={tx}
                />
              ))}
            </div>

            {selectedPlanConfig && (
              <div className="mt-8 auth-card checkout-summary-card rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 sticky bottom-4 z-20">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-amber-300/80 mb-1">
                    {tx('الباقة المختارة', 'Selected plan')}
                  </p>
                  <p className="font-semibold text-white text-lg">
                    {tx(selectedPlanConfig.labelAr, selectedPlanConfig.labelEn)}
                    <span className="text-amber-300 ms-2 tabular-nums">
                      {formatPrice(selectedPlanConfig.price, settings.currency)}
                    </span>
                  </p>
                  <p className="text-sm text-white/50 mt-1 line-clamp-2">
                    {getPlanDescription(selectedPlanConfig, isAr)}
                  </p>
                </div>
                <Button
                  className="checkout-pay-btn rounded-xl border-0 text-white h-12 px-8 shrink-0 w-full sm:w-auto"
                  onClick={handleContinueToPayment}
                >
                  <Zap className="h-4 w-4 me-2" />
                  {tx('متابعة للدفع', 'Continue to payment')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  currency,
  selected,
  onSelect,
  formatPrice,
  isAr,
  tx,
}: {
  plan: SubscriptionPlanConfig;
  currency: string;
  selected: boolean;
  onSelect: () => void;
  formatPrice: (amount: number) => string;
  isAr: boolean;
  tx: (ar: string, en: string) => string;
}) {
  const features = getPlanFeatures(plan, isAr);
  const description = getPlanDescription(plan, isAr);
  const badge = getPlanBadge(plan, isAr);
  const isHighlighted = plan.highlighted;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative text-start rounded-2xl border p-6 sm:p-7 transition-all duration-300 flex flex-col h-full ${
        selected
          ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/20 to-black/40 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/30'
          : isHighlighted
            ? 'border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-black/35 hover:border-amber-400/60'
            : 'border-white/15 bg-black/35 hover:border-white/30 hover:bg-black/45'
      }`}
    >
      {(badge || isHighlighted) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
              isHighlighted
                ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-lg'
                : 'border border-amber-400/40 bg-amber-500/20 text-amber-200'
            }`}
          >
            {isHighlighted && <Crown className="h-3 w-3" />}
            {badge ?? tx('مميز', 'Featured')}
          </span>
        </div>
      )}

      <div className="mb-4 pt-1">
        <h3 className="font-heading text-xl font-bold text-white">
          {tx(plan.labelAr, plan.labelEn)}
        </h3>
        <p className="text-sm text-white/50 mt-2 leading-relaxed min-h-[2.5rem]">
          {description}
        </p>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-bold text-amber-300 tabular-nums">
            {formatPrice(plan.price)}
          </span>
        </div>
        <p className="text-xs text-white/40 mt-1">
          {plan.days} {tx('يوم', 'days')} · {currency}
        </p>
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-white/75">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                selected ? 'bg-amber-500/30 text-amber-200' : 'bg-white/10 text-emerald-400'
              }`}
            >
              <Check className="h-3 w-3" />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <span
        className={`mt-auto block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
          selected
            ? 'bg-amber-500/25 text-amber-100 border border-amber-400/50'
            : 'bg-white/5 text-white/70 border border-white/10 group-hover:bg-white/10'
        }`}
      >
        {selected ? tx('مختارة', 'Selected') : tx('اختر هذه الباقة', 'Choose this plan')}
      </span>
    </button>
  );
}
