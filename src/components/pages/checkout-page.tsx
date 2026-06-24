'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useSiteCurrency } from '@/hooks/use-site-currency';
import { useLocalizedCountryName } from '@/hooks/use-localized-country-name';
import type { Property, TransactionType } from '@/types';
import { toast } from 'sonner';
import { getPaymentBrand } from '@/components/payment/payment-method-icons';

type CheckoutMode = 'purchase' | 'rent';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2400&q=85&auto=format&fit=crop';

const PAYMENT_METHODS = [
  { id: 'card', icon: CreditCard, ar: 'بطاقة بنكية', en: 'Credit / debit card' },
  { id: 'bank', icon: Landmark, ar: 'تحويل بنكي', en: 'Bank transfer' },
  { id: 'whish', ar: 'Whish Money — ويش موني', en: 'Whish Money' },
  { id: 'ciar-prepaid', ar: 'بطاقة CIAR المسبقة الدفع', en: 'CIAR Prepaid Card' },
] as const;

function propertyCoverUrl(property: Property): string {
  const cover = property.images?.find((i) => i.isCover)?.url ?? property.images?.[0]?.url;
  return cover || FALLBACK_IMAGE;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function CheckoutShell({
  style,
  children,
}: {
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <CheckoutShellInner style={style}>
      {children}
    </CheckoutShellInner>
  );
}

function CheckoutShellInner({
  style,
  children,
}: {
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className="auth-page-image-bg min-h-dvh py-6 sm:py-10 relative overflow-x-hidden"
      style={style}
    >
      <div className="absolute top-16 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      {children}
    </div>
  );
}

function CheckoutStep({
  number,
  label,
  active,
}: {
  number: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div className={`checkout-step ${active ? 'is-active' : ''}`}>
      <span className="checkout-step-dot">{number}</span>
      <span className="hidden sm:inline font-medium">{label}</span>
    </div>
  );
}

function PropertyHero({ image, title }: { image: string; title: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={title} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${highlight ? 'text-base font-semibold text-white pt-1' : ''}`}
    >
      <span className={highlight ? 'text-amber-200/90' : ''}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={htmlFor} className="text-white/70 text-sm">
        {label}
      </Label>
      {children}
    </div>
  );
}

function DateFields({
  checkIn,
  checkOut,
  onCheckIn,
  onCheckOut,
  tx,
}: {
  checkIn: string;
  checkOut: string;
  onCheckIn: (v: string) => void;
  onCheckOut: (v: string) => void;
  tx: (ar: string, en: string) => string;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <FormField label={tx('تاريخ الدخول', 'Check-in')} htmlFor="co-in">
        <input
          id="co-in"
          type="date"
          required
          className="auth-input w-full rounded-xl px-4 py-2.5 text-sm [color-scheme:dark]"
          value={checkIn}
          onChange={(e) => onCheckIn(e.target.value)}
        />
      </FormField>
      <FormField label={tx('تاريخ الخروج', 'Check-out')} htmlFor="co-out">
        <input
          id="co-out"
          type="date"
          required
          className="auth-input w-full rounded-xl px-4 py-2.5 text-sm [color-scheme:dark]"
          value={checkOut}
          onChange={(e) => onCheckOut(e.target.value)}
        />
      </FormField>
    </div>
  );
}

function PaymentGrid({
  selected,
  onSelect,
  tx,
}: {
  selected: string;
  onSelect: (id: string) => void;
  tx: (ar: string, en: string) => string;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {PAYMENT_METHODS.map((pm) => {
        const brand = getPaymentBrand(pm.id);
        const BrandIcon = brand?.Icon;
        const LucideIcon = 'icon' in pm ? pm.icon : undefined;
        return (
          <label
            key={pm.id}
            className={`checkout-pay-method flex items-center gap-3 ${
              selected === pm.id ? 'is-selected' : ''
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={pm.id}
              className="sr-only"
              checked={selected === pm.id}
              onChange={() => onSelect(pm.id)}
            />
            <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-white/8 border border-white/10 px-1.5 overflow-hidden">
              {BrandIcon ? (
                <BrandIcon className="!h-7 !w-auto max-w-[3.5rem]" />
              ) : LucideIcon ? (
                <LucideIcon className="h-5 w-5 text-amber-300 shrink-0" />
              ) : null}
            </div>
            <span className="text-sm font-medium text-white">{tx(pm.ar, pm.en)}</span>
          </label>
        );
      })}
    </div>
  );
}

export function CheckoutPage({ mode }: { mode: CheckoutMode }) {
  const { rtl } = useTranslation();
  const { formatPrice } = useSiteCurrency();
  const countryLabel = useLocalizedCountryName();
  const {
    selectedPropertyId,
    currentUser,
    isAuthenticated,
    setCurrentPage,
    setCheckoutTransactionId,
  } = useAppStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: currentUser?.name ?? '',
    customerEmail: currentUser?.email ?? '',
    customerPhone: currentUser?.phone ?? '',
    checkIn: '',
    checkOut: '',
    notes: '',
    paymentMethod: 'card',
  });

  const isAr = rtl;
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  const isPurchase = mode === 'purchase';

  useEffect(() => {
    if (!selectedPropertyId) {
      setLoading(false);
      return;
    }
    fetch(`/api/properties/${selectedPropertyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProperty(data))
      .finally(() => setLoading(false));
  }, [selectedPropertyId]);

  const txnType: TransactionType = isPurchase
    ? 'PURCHASE'
    : property?.listingType === 'SHORT_TERM'
      ? 'SHORT_TERM_RENT'
      : 'RENT';

  const coverImage = property ? propertyCoverUrl(property) : FALLBACK_IMAGE;
  const sourceCurrency = property?.country?.currency;
  const nights = nightsBetween(form.checkIn, form.checkOut);
  const isShortTerm = property?.listingType === 'SHORT_TERM';

  const estimatedTotal = useMemo(() => {
    if (!property || isPurchase) return property?.price ?? 0;
    if (isShortTerm && nights > 0) return property.price * nights;
    return property.price;
  }, [property, isPurchase, isShortTerm, nights]);

  const locationLine = property
    ? [property.city?.name, property.country ? countryLabel(property.country) : null]
        .filter(Boolean)
        .join(', ')
    : '';

  const shellStyle = { ['--auth-image' as string]: `url('${coverImage}')` } as CSSProperties;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    if (!isAuthenticated) {
      toast.error(tx('سجّل الدخول أولاً', 'Please sign in first'));
      setCurrentPage('login');
      return;
    }

    if (!isPurchase && (!form.checkIn || !form.checkOut)) {
      toast.error(tx('حدد تاريخ الدخول والخروج', 'Select check-in and check-out dates'));
      return;
    }

    setSubmitting(true);
    try {
      const createRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          type: txnType,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone || null,
          checkIn: form.checkIn || null,
          checkOut: form.checkOut || null,
          notes: form.notes || null,
          paymentMethod: form.paymentMethod,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || 'Failed');

      const payRes = await fetch(`/api/transactions/${created.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      });
      const paid = await payRes.json();
      if (!payRes.ok) throw new Error(paid.error || 'Payment failed');

      setCheckoutTransactionId(created.id);
      toast.success(tx('تم الدفع بنجاح', 'Payment successful'));
      setCurrentPage('checkout-complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx('فشل الدفع', 'Payment failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <CheckoutShell style={shellStyle}>
        <div className="relative z-[1] max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-5 gap-8">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl bg-white/10" />
          <Skeleton className="h-[32rem] lg:col-span-3 rounded-2xl bg-white/10" />
        </div>
      </CheckoutShell>
    );
  }

  if (!property) {
    return (
      <CheckoutShell style={shellStyle}>
        <div className="relative z-[1] min-h-[70vh] flex flex-col items-center justify-center gap-6 p-8 text-white">
          <Building2 className="h-14 w-14 text-white/30" />
          <p className="text-white/70">{tx('العقار غير موجود', 'Property not found')}</p>
          <Button
            variant="outline"
            className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setCurrentPage('search')}
          >
            {tx('العودة للعقارات', 'Back to listings')}
          </Button>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell style={shellStyle}>
      <div className="relative z-[1] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <button
          type="button"
          onClick={() => setCurrentPage('property-detail')}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
          {tx('رجوع للعقار', 'Back to property')}
        </button>

        <StepsRow tx={tx} />

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
          <aside className="lg:col-span-2">
            <div className="checkout-summary-card rounded-2xl overflow-hidden">
              <PropertyHero image={coverImage} title={property.title} />
              <div className="p-5 sm:p-6 space-y-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-widest text-amber-300/80 font-medium mb-1">
                    {isPurchase ? tx('شراء', 'Purchase') : tx('حجز / إيجار', 'Booking / rent')}
                  </p>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold leading-snug">
                    {property.title}
                  </h2>
                  {locationLine && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-white/60">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
                      {locationLine}
                    </p>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                  <SummaryRow
                    label={tx('السعر الأساسي', 'Base price')}
                    value={`${formatPrice(property.price, sourceCurrency)}${
                      !isPurchase
                        ? isShortTerm
                          ? ` ${tx('/ليلة', '/night')}`
                          : ` ${tx('/شهر', '/month')}`
                        : ''
                    }`}
                  />
                  {!isPurchase && nights > 0 && isShortTerm && (
                    <SummaryRow
                      label={tx(`${nights} ليلة`, `${nights} nights`)}
                      value={formatPrice(estimatedTotal, sourceCurrency)}
                    />
                  )}
                  <SummaryRow
                    label={tx('الإجمالي التقديري', 'Estimated total')}
                    value={formatPrice(estimatedTotal, sourceCurrency)}
                    highlight
                  />
                </div>

                <ul className="flex flex-wrap gap-3 pt-2">
                  {[
                    { icon: Shield, ar: 'معاملة موثقة', en: 'Verified listing' },
                    { icon: Lock, ar: 'دفع مشفّر', en: 'Encrypted payment' },
                    { icon: Sparkles, ar: 'خدمة فاخرة', en: 'Premium service' },
                  ].map((badge) => (
                    <li
                      key={badge.en}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/75"
                    >
                      <badge.icon className="h-3 w-3 text-amber-400" />
                      {tx(badge.ar, badge.en)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3 auth-card rounded-2xl p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                <span className="text-gradient-gold">
                  {isPurchase
                    ? tx('إتمام الشراء', 'Complete purchase')
                    : tx('إتمام الحجز', 'Complete booking')}
                </span>
              </h1>
              <p className="mt-2 text-sm text-white/55">
                {tx(
                  'أكمل بياناتك واختر طريقة الدفع لإتمام العملية بأمان.',
                  'Complete your details and choose a payment method to finish securely.',
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-3">
                  {tx('معلومات التواصل', 'Contact information')}
                </legend>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label={tx('الاسم الكامل', 'Full name')} htmlFor="co-name">
                    <input
                      id="co-name"
                      required
                      className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    />
                  </FormField>
                  <FormField label={tx('البريد الإلكتروني', 'Email')} htmlFor="co-email">
                    <input
                      id="co-email"
                      type="email"
                      required
                      className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                      value={form.customerEmail}
                      onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    />
                  </FormField>
                  <FormField
                    label={tx('الهاتف', 'Phone')}
                    htmlFor="co-phone"
                    className="sm:col-span-2"
                  >
                    <input
                      id="co-phone"
                      className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                      value={form.customerPhone}
                      onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                    />
                  </FormField>
                </div>
              </fieldset>

              {!isPurchase && (
                <fieldset className="space-y-4">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-3">
                    {tx('تواريخ الإقامة', 'Stay dates')}
                  </legend>
                  <DateFields
                    checkIn={form.checkIn}
                    checkOut={form.checkOut}
                    onCheckIn={(v) => setForm((f) => ({ ...f, checkIn: v }))}
                    onCheckOut={(v) => setForm((f) => ({ ...f, checkOut: v }))}
                    tx={tx}
                  />
                </fieldset>
              )}

              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-3">
                  {tx('طريقة الدفع', 'Payment method')}
                </legend>
                <PaymentGrid
                  selected={form.paymentMethod}
                  onSelect={(id) => setForm((f) => ({ ...f, paymentMethod: id }))}
                  tx={tx}
                />
              </fieldset>

              <FormField label={tx('ملاحظات (اختياري)', 'Notes (optional)')} htmlFor="co-notes">
                <textarea
                  id="co-notes"
                  rows={3}
                  className="auth-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </FormField>

              <Button
                type="submit"
                disabled={submitting}
                className="checkout-pay-btn w-full rounded-xl border-0 py-6 text-base font-semibold text-white"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 me-2" />
                    {isPurchase
                      ? tx('ادفع وإتمام الشراء', 'Pay & complete purchase')
                      : tx('ادفع وأكمل الحجز', 'Pay & complete booking')}
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-white/40 flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3" />
                {tx(
                  'بياناتك محمية ولن تُشارك مع أطراف ثالثة.',
                  'Your data is protected and never shared with third parties.',
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </CheckoutShell>
  );
}

function StepsRow({ tx }: { tx: (ar: string, en: string) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-8">
      {[
        { n: 1, ar: 'مراجعة العقار', en: 'Review property' },
        { n: 2, ar: 'بياناتك', en: 'Your details' },
        { n: 3, ar: 'الدفع الآمن', en: 'Secure payment' },
      ].map((step, i) => (
        <CheckoutStep
          key={step.n}
          number={step.n}
          label={tx(step.ar, step.en)}
          active={i === 2}
        />
      ))}
    </div>
  );
}
