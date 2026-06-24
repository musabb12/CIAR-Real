'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  FileText,
  Sparkles,
  Shield,
  Copy,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useSiteCurrency } from '@/hooks/use-site-currency';
import type { AppPage, Transaction } from '@/types';
import { toast } from 'sonner';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2400&q=85&auto=format&fit=crop';

function transactionCover(txn: Transaction): string {
  const images = txn.property?.images;
  const cover = images?.find((i) => i.isCover)?.url ?? images?.[0]?.url;
  return cover || FALLBACK_IMAGE;
}

export function CheckoutCompletePage() {
  const { rtl } = useTranslation();
  const { formatPrice } = useSiteCurrency();
  const { checkoutTransactionId, setCurrentPage, setCheckoutTransactionId } = useAppStore();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const isAr = rtl;
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  useEffect(() => {
    if (!checkoutTransactionId) {
      setLoading(false);
      return;
    }
    fetch(`/api/transactions/${checkoutTransactionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTxn(data))
      .finally(() => setLoading(false));
  }, [checkoutTransactionId]);

  const coverImage = txn ? transactionCover(txn) : FALLBACK_IMAGE;
  const shellStyle = { ['--auth-image' as string]: `url('${coverImage}')` };
  const sourceCurrency = txn?.property?.country?.currency;

  const copyId = () => {
    if (!txn?.id) return;
    navigator.clipboard.writeText(txn.id).then(() => {
      toast.success(tx('تم نسخ رقم المعاملة', 'Transaction ID copied'));
    });
  };

  return (
    <div
      className="auth-page-image-bg min-h-dvh py-10 sm:py-16 relative overflow-x-hidden"
      style={shellStyle}
    >
      <div className="absolute top-16 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <CompleteContent
        isAr={isAr}
        tx={tx}
        loading={loading}
        txn={txn}
        formatPrice={formatPrice}
        sourceCurrency={sourceCurrency}
        copyId={copyId}
        setCurrentPage={setCurrentPage}
        setCheckoutTransactionId={setCheckoutTransactionId}
      />
    </div>
  );
}

function CompleteContent({
  isAr,
  tx,
  loading,
  txn,
  formatPrice,
  sourceCurrency,
  copyId,
  setCurrentPage,
  setCheckoutTransactionId,
}: {
  isAr: boolean;
  tx: (ar: string, en: string) => string;
  loading: boolean;
  txn: Transaction | null;
  formatPrice: (amount: number, sourceCurrency?: string | null) => string;
  sourceCurrency?: string | null;
  copyId: () => void;
  setCurrentPage: (page: AppPage) => void;
  setCheckoutTransactionId: (id: string | null) => void;
}) {
  return (
    <div className="relative z-[1] max-w-xl mx-auto px-4 sm:px-6 text-center">
      <button
        type="button"
        onClick={() => {
          setCheckoutTransactionId(null);
          setCurrentPage('home');
        }}
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
        {tx('الرئيسية', 'Home')}
      </button>

      <div className="checkout-success-ring mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-amber-500/20 border border-emerald-400/30">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
      </div>

      <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 font-medium mb-2">
        {tx('تم بنجاح', 'Success')}
      </p>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-3">
        <span className="text-gradient-gold">{tx('تم إكمال الدفع', 'Payment completed')}</span>
      </h1>
      <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto mb-8">
        {tx(
          'شكراً لثقتك. تم تسجيل طلبك وسيتواصل معك فريقنا قريباً لتأكيد التفاصيل.',
          'Thank you for your trust. Your order is recorded and our team will contact you soon to confirm details.',
        )}
      </p>

      <ul className="flex flex-wrap justify-center gap-3 mb-8">
        {[
          { icon: Shield, ar: 'معاملة آمنة', en: 'Secure transaction' },
          { icon: Sparkles, ar: 'خدمة VIP', en: 'VIP service' },
        ].map((badge) => (
          <li
            key={badge.en}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/75"
          >
            <badge.icon className="h-3 w-3 text-amber-400" />
            {tx(badge.ar, badge.en)}
          </li>
        ))}
      </ul>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl bg-white/10" />
      ) : txn ? (
        <div className="checkout-receipt rounded-2xl p-6 sm:p-8 text-start text-white space-y-4">
          <div className="flex items-center gap-2 font-semibold text-amber-200/90 border-b border-white/10 pb-3">
            <FileText className="h-4 w-4" />
            {tx('إيصال الدفع', 'Payment receipt')}
          </div>

          <div className="space-y-3 text-sm">
            <ReceiptRow label={tx('العقار', 'Property')} value={txn.property?.title ?? '—'} />
            <ReceiptRow
              label={tx('المبلغ المدفوع', 'Amount paid')}
              value={txn.amount != null ? formatPrice(txn.amount, sourceCurrency) : '—'}
              highlight
            />
            <ReceiptRow
              label={tx('الحالة', 'Status')}
              value={txn.status === 'PAID' ? tx('مدفوع', 'Paid') : txn.status}
            />
            {txn.checkIn && (
              <ReceiptRow label={tx('تاريخ الدخول', 'Check-in')} value={txn.checkIn} />
            )}
            {txn.checkOut && (
              <ReceiptRow label={tx('تاريخ الخروج', 'Check-out')} value={txn.checkOut} />
            )}
          </div>

          <button
            type="button"
            onClick={copyId}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/50 hover:bg-white/8 transition-colors"
          >
            <span className="truncate">ID: {txn.id}</span>
            <Copy className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
          </button>
        </div>
      ) : (
        <p className="text-white/50 text-sm">{tx('لم يُعثر على المعاملة', 'Transaction not found')}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Button
          className="checkout-pay-btn rounded-xl border-0 px-8 py-5 font-semibold text-white"
          onClick={() => {
            setCheckoutTransactionId(null);
            setCurrentPage('home');
          }}
        >
          <Home className="me-2 h-4 w-4" />
          {tx('الرئيسية', 'Home')}
        </Button>
        <Button
          variant="outline"
          className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 px-8 py-5"
          onClick={() => {
            setCheckoutTransactionId(null);
            setCurrentPage('search');
          }}
        >
          <Search className="me-2 h-4 w-4" />
          {tx('تصفح المزيد', 'Browse more')}
        </Button>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${highlight ? 'text-base' : ''}`}>
      <span className="text-white/55 shrink-0">{label}</span>
      <span className={`text-end font-medium ${highlight ? 'text-amber-300 tabular-nums' : 'text-white/90'}`}>
        {value}
      </span>
    </div>
  );
}
