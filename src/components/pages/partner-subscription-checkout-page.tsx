'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useSiteCurrency } from '@/hooks/use-site-currency';
import { isPartnerRole } from '@/lib/auth-roles';
import { getPaymentBrand } from '@/components/payment/payment-method-icons';
import {
  DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS,
  getPlanBadge,
  getPlanDescription,
  getPlanFeatures,
} from '@/lib/subscription-plans';
import type {
  PartnerSubscriptionSettings,
  SubscriptionPlanConfig,
} from '@/types/subscription';
import { toast } from 'sonner';

export function PartnerSubscriptionCheckoutPage() {
  const { rtl } = useTranslation();
  const isAr = rtl;
  const tx = useCallback((ar: string, en: string) => (isAr ? ar : en), [isAr]);
  const { formatPrice } = useSiteCurrency();
  const {
    currentUser,
    isAuthenticated,
    setCurrentPage,
    partnerSubscriptionCheckout,
    setPartnerSubscriptionCheckout,
    partnerPendingAddListing,
    setPartnerPendingAddListing,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<PartnerSubscriptionSettings>(
    DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS,
  );
  const [paymentMethod, setPaymentMethod] = useState(
    partnerSubscriptionCheckout?.paymentMethod ?? 'card',
  );
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(currentUser?.name ?? '');

  const isPartner = currentUser && isPartnerRole(currentUser.role);
  const planId = partnerSubscriptionCheckout?.planId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partner/subscription');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      if (json.settings) setSettings(json.settings);
      if (json.canPublish) {
        setCurrentPage('partner-subscription');
        return;
      }
    } catch {
      setSettings(DEFAULT_PARTNER_SUBSCRIPTION_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [setCurrentPage]);

  useEffect(() => {
    if (!isAuthenticated || !isPartner) {
      setCurrentPage('login');
      return;
    }
    if (!planId) {
      setCurrentPage('partner-subscription');
      return;
    }
    void load();
  }, [isAuthenticated, isPartner, planId, load, setCurrentPage]);

  const plan = useMemo(
    () => settings.plans.find((p) => p.id === planId && p.enabled) ?? null,
    [settings.plans, planId],
  );

  const enabledPayments = useMemo(
    () => settings.paymentMethods.filter((method) => method.enabled),
    [settings.paymentMethods],
  );

  const features = plan ? getPlanFeatures(plan, isAr) : [];
  const description = plan ? getPlanDescription(plan, isAr) : '';
  const badge = plan ? getPlanBadge(plan, isAr) : null;

  const goAfterSuccess = () => {
    setPartnerSubscriptionCheckout(null);
    if (partnerPendingAddListing) {
      setPartnerPendingAddListing(true);
    }
    setCurrentPage('partner-dashboard');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !paymentMethod) return;

    if (paymentMethod === 'card') {
      if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 12) {
        toast.error(tx('أكمل بيانات البطاقة', 'Complete card details'));
        return;
      }
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const res = await fetch('/api/partner/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, paymentMethod }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Failed');
      }

      toast.success(tx('تم الدفع وتفعيل الاشتراك بنجاح', 'Payment successful — subscription active'));
      setTimeout(goAfterSuccess, 800);
    } catch (error) {
      toast.error(tx('فشل الدفع', 'Payment failed'), {
        description: error instanceof Error ? error.message : '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !isPartner || !planId) return null;

  if (loading) {
    return (
      <div className="auth-page-image-bg min-h-dvh flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="auth-page-image-bg min-h-dvh flex items-center justify-center p-6">
        <div className="auth-card rounded-2xl p-8 text-center max-w-md">
          <p className="text-white/70 mb-4">{tx('الخطة غير متاحة', 'Plan not available')}</p>
          <Button className="checkout-pay-btn" onClick={() => setCurrentPage('partner-subscription')}>
            {tx('العودة للخطط', 'Back to plans')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-image-bg min-h-dvh py-6 sm:py-10 relative overflow-x-hidden">
      <div className="absolute top-16 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setCurrentPage('partner-subscription')}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className={`h-4 w-4 ${rtl ? 'rotate-180' : ''}`} />
          {tx('العودة لاختيار الخطة', 'Back to plans')}
        </button>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <CheckoutStep number={1} label={tx('اختيار الخطة', 'Choose plan')} done />
          <ArrowRight className={`h-4 w-4 text-white/30 hidden sm:block ${rtl ? 'rotate-180' : ''}`} />
          <CheckoutStep number={2} label={tx('الدفع', 'Payment')} active />
          <ArrowRight className={`h-4 w-4 text-white/30 hidden sm:block ${rtl ? 'rotate-180' : ''}`} />
          <CheckoutStep number={3} label={tx('التفعيل', 'Activation')} />
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <aside className="lg:col-span-2 order-2 lg:order-1">
            <div className="auth-card checkout-summary-card rounded-2xl overflow-hidden sticky top-6">
              <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-br from-amber-500/10 to-emerald-500/5">
                <p className="text-xs uppercase tracking-widest text-amber-300/80 mb-1">
                  {tx('ملخص الطلب', 'Order summary')}
                </p>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-white">
                      {tx(plan.labelAr, plan.labelEn)}
                    </h2>
                    {badge && (
                      <span className="inline-block mt-2 text-[10px] uppercase tracking-wider rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-amber-200">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-amber-300 tabular-nums shrink-0">
                    {formatPrice(plan.price, settings.currency)}
                  </p>
                </div>
                <p className="text-sm text-white/55 mt-3 leading-relaxed">{description}</p>
              </div>

              <div className="p-5 sm:p-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                  {tx('يشمل اشتراكك', 'Your plan includes')}
                </p>
                <ul className="space-y-2.5">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-white/75">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>{tx('المدة', 'Duration')}</span>
                    <span>{plan.days} {tx('يوم', 'days')}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-white">
                    <span className="text-amber-200/90">{tx('الإجمالي', 'Total')}</span>
                    <span className="tabular-nums">
                      {formatPrice(plan.price, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3 order-1 lg:order-2 auth-card rounded-2xl p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                <span className="text-gradient-gold">{tx('إتمام الدفع', 'Complete payment')}</span>
              </h1>
              <p className="mt-2 text-sm text-white/55">
                {tx(
                  'محاكاة دفع آمنة — أكمل بياناتك واختر طريقة الدفع.',
                  'Secure payment simulation — complete your details and choose a method.',
                )}
              </p>
            </div>

            <form onSubmit={handlePay} className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-3">
                  {tx('طريقة الدفع', 'Payment method')}
                </legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  {enabledPayments.map((method) => (
                    <PaymentOption
                      key={method.id}
                      method={method}
                      selected={paymentMethod === method.id}
                      onSelect={() => setPaymentMethod(method.id)}
                      tx={tx}
                    />
                  ))}
                </div>
              </fieldset>

              {paymentMethod === 'card' && (
                <fieldset className="space-y-4">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-1">
                    {tx('بيانات البطاقة', 'Card details')}
                  </legend>
                  <div className="space-y-2">
                    <Label htmlFor="sub-card-name" className="text-white/70 text-sm">
                      {tx('اسم حامل البطاقة', 'Cardholder name')}
                    </Label>
                    <input
                      id="sub-card-name"
                      className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder={tx('الاسم كما على البطاقة', 'Name on card')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-card-num" className="text-white/70 text-sm">
                      {tx('رقم البطاقة', 'Card number')}
                    </Label>
                    <input
                      id="sub-card-num"
                      className="auth-input w-full rounded-xl px-4 py-2.5 text-sm tabular-nums"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sub-exp" className="text-white/70 text-sm">
                        {tx('انتهاء الصلاحية', 'Expiry')}
                      </Label>
                      <input
                        id="sub-exp"
                        className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sub-cvc" className="text-white/70 text-sm">
                        CVC
                      </Label>
                      <input
                        id="sub-cvc"
                        className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </fieldset>
              )}

              {paymentMethod === 'bank' && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65 leading-relaxed">
                  {tx(
                    'سيتم عرض تفاصيل الحساب البنكي بعد التأكيد. هذه محاكاة — سيتم تفعيل اشتراكك فوراً.',
                    'Bank transfer details will appear after confirmation. This is a simulation — your subscription activates immediately.',
                  )}
                </div>
              )}

              {(paymentMethod === 'whish' || paymentMethod === 'ciar-prepaid') && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                  {tx(
                    'سيتم توجيهك لإتمام الدفع عبر المحفظة المختارة. (محاكاة)',
                    'You will complete payment via the selected wallet. (Simulation)',
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {[
                  { icon: Shield, ar: 'دفع مشفّر', en: 'Encrypted payment' },
                  { icon: Lock, ar: 'معاملة آمنة', en: 'Secure transaction' },
                  { icon: Sparkles, ar: 'تفعيل فوري', en: 'Instant activation' },
                ].map((item) => (
                  <span
                    key={item.en}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/75"
                  >
                    <item.icon className="h-3 w-3 text-amber-400" />
                    {tx(item.ar, item.en)}
                  </span>
                ))}
              </div>

              <Button
                type="submit"
                className="checkout-pay-btn w-full rounded-xl border-0 py-6 text-base font-semibold text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin me-2" />
                    {tx('جاري معالجة الدفع…', 'Processing payment…')}
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 me-2" />
                    {tx('ادفع', 'Pay')} {formatPrice(plan.price, settings.currency)}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutStep({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className={`checkout-step ${active ? 'is-active' : ''} ${done ? 'opacity-80' : ''}`}>
      <span className="checkout-step-dot">
        {done ? <Check className="h-3 w-3" /> : number}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function PaymentOption({
  method,
  selected,
  onSelect,
  tx,
}: {
  method: { id: string; labelAr: string; labelEn: string };
  selected: boolean;
  onSelect: () => void;
  tx: (ar: string, en: string) => string;
}) {
  const brand = getPaymentBrand(method.id);
  const BrandIcon = brand?.Icon;

  return (
    <label
      className={`checkout-pay-method flex items-center gap-3 cursor-pointer ${
        selected ? 'is-selected' : ''
      }`}
    >
      <input
        type="radio"
        name="subCheckoutPayment"
        className="sr-only"
        checked={selected}
        onChange={onSelect}
      />
      <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-white/8 border border-white/10 px-1.5">
        {BrandIcon ? (
          <BrandIcon className="!h-7 !w-auto max-w-[3.5rem]" />
        ) : method.id === 'bank' ? (
          <Landmark className="h-5 w-5 text-amber-300" />
        ) : (
          <CreditCard className="h-5 w-5 text-amber-300" />
        )}
      </div>
      <span className="text-sm font-medium text-white">{tx(method.labelAr, method.labelEn)}</span>
    </label>
  );
}
