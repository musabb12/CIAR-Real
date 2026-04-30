'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ArrowUpDown,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CurrencyConverterProps {
  amount?: number;
  fromCurrency?: string;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Exchange Rates (hardcoded, USD-based)
// ---------------------------------------------------------------------------

const RATES: Record<string, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
  JPY: 149.50,
  TRY: 30.25,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  BRL: 4.97,
  KRW: 1320.00,
  EGP: 30.90,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  MAD: 10.05,
  JOD: 0.71,
};

const CURRENCY_LABELS: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  SAR: 'Saudi Riyal',
  AED: 'UAE Dirham',
  JPY: 'Japanese Yen',
  TRY: 'Turkish Lira',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  BRL: 'Brazilian Real',
  KRW: 'South Korean Won',
  EGP: 'Egyptian Pound',
  QAR: 'Qatari Riyal',
  KWD: 'Kuwaiti Dinar',
  BHD: 'Bahraini Dinar',
  OMR: 'Omani Rial',
  MAD: 'Moroccan Dirham',
  JOD: 'Jordanian Dinar',
};

const CURRENCY_CODES = Object.keys(RATES);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function convert(amount: number, from: string, to: string): number {
  const fromRate = RATES[from] ?? 1;
  const toRate = RATES[to] ?? 1;
  return (amount / fromRate) * toRate;
}

function getRate(from: string, to: string): number {
  const fromRate = RATES[from] ?? 1;
  const toRate = RATES[to] ?? 1;
  return toRate / fromRate;
}

function formatConvertedValue(value: number, currency: string): string {
  const isZeroDecimal =
    currency === 'JPY' || currency === 'KRW';
  if (isZeroDecimal) {
    return Math.round(value).toLocaleString('en-US');
  }
  // For very large or very small rates, show more decimals
  if (value >= 1000000) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  if (value >= 100) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatRate(rate: number): string {
  if (rate >= 100) return rate.toFixed(2);
  if (rate >= 1) return rate.toFixed(4);
  return rate.toFixed(6);
}

function parseNumericInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

: {
  value: number;
  currency: string;
}) {
  const spring = useSpring(0, { stiffness: 100, damping: 30, mass: 1 });
  const display = useTransform(spring, (v) => formatConvertedValue(v, currency));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [display]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatConvertedValue(value, currency)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compact Mode
// ---------------------------------------------------------------------------

function CompactConverter({
  amount: initialAmount,
  fromCurrency: initialFrom,
}: {
  amount: number;
  fromCurrency: string;
}) {
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(
    initialFrom === 'USD' ? 'EUR' : 'USD'
  );
  const [amount, setAmount] = useState(initialAmount);

  const convertedAmount = useMemo(
    () => convert(amount, fromCurrency, toCurrency),
    [amount, fromCurrency, toCurrency]
  );

  const rate = useMemo(
    () => getRate(fromCurrency, toCurrency),
    [fromCurrency, toCurrency]
  );

  return (
    <div className="flex items-center gap-2">
          >
      <Select value={fromCurrency} onValueChange={setFromCurrency}>
        <SelectTrigger size="sm" className="w-[110px] text-xs font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_CODES.map((code) => (
            <SelectItem key={code} value={code} className="text-xs">
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="text"
        inputMode="numeric"
        value={amount === 0 ? '' : amount.toLocaleString('en-US')}
        onChange={(e) => setAmount(parseNumericInput(e.target.value))}
        className="h-8 w-[120px] text-xs font-semibold tabular-nums px-2"
      />

      <span className="text-muted-foreground text-xs">→</span>

      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-foreground tabular-nums truncate">
          {toCurrency} {formatConvertedValue(convertedAmount, toCurrency)}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          1 {fromCurrency} = {formatRate(rate)} {toCurrency}
        </span>
      </div>

      <Select value={toCurrency} onValueChange={setToCurrency}>
        <SelectTrigger size="sm" className="w-[90px] text-xs font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_CODES.map((code) => (
            <SelectItem key={code} value={code} className="text-xs">
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CurrencyConverter({
  amount: initialAmount = 500000,
  fromCurrency: initialFrom = 'SAR',
  compact = false,
}: CurrencyConverterProps) {
  // ---- state ----
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(
    initialFrom === 'USD' ? 'EUR' : 'USD'
  );
  const [amountInput, setAmountInput] = useState(
    initialAmount.toLocaleString('en-US')
  );
  const [amount, setAmount] = useState(initialAmount);
  const [swapRotation, setSwapRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  // ---- derived ----
  const convertedAmount = useMemo(
    () => convert(amount, fromCurrency, toCurrency),
    [amount, fromCurrency, toCurrency]
  );

  const rate = useMemo(
    () => getRate(fromCurrency, toCurrency),
    [fromCurrency, toCurrency]
  );

  const inverseRate = useMemo(
    () => getRate(toCurrency, fromCurrency),
    [toCurrency, fromCurrency]
  );

  // ---- handlers ----
  const handleAmountChange = useCallback((raw: string) => {
    setAmountInput(raw);
    setAmount(parseNumericInput(raw));
  }, []);

  const handleAmountBlur = useCallback(() => {
    if (amount <= 0) {
      setAmount(initialAmount);
      setAmountInput(initialAmount.toLocaleString('en-US'));
    } else {
      setAmountInput(amount.toLocaleString('en-US'));
    }
  }, [amount, initialAmount]);

  const handleSwap = useCallback(() => {
    setSwapRotation((prev) => prev + 180);
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    // Also convert the amount so the "from" value stays consistent
    const newAmount = convert(amount, fromCurrency, toCurrency);
    setAmount(newAmount);
    setAmountInput(newAmount.toLocaleString('en-US'));
  }, [fromCurrency, toCurrency, amount]);

  const handleCopy = useCallback(async () => {
    const summary = [
      `${amount.toLocaleString('en-US')} ${fromCurrency} =`,
      `${formatConvertedValue(convertedAmount, toCurrency)} ${toCurrency}`,
      `Rate: 1 ${fromCurrency} = ${formatRate(rate)} ${toCurrency}`,
    ].join(' | ');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [amount, fromCurrency, convertedAmount, toCurrency, rate]);

  // ---- compact mode ----
  if (compact) {
    return (
      <CompactConverter
        amount={initialAmount}
        fromCurrency={initialFrom}
      />
    );
  }

  // ---- full mode ----
  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="glass-card overflow-hidden rounded-2xl">
        {/* ── Gradient Accent ── */}
        <div className="h-1 w-full">
          style={{
            background:
              'linear-gradient(90deg, #0D9488 0%, #14B8A6 30%, #F59E0B 70%, #D97706 100%)',
          }}
        />

        {/* ── Header ── */}
        <CardHeader className="relative px-6 pb-0 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <DollarSign className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">
                  Currency Converter
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Property price in any currency
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs shrink-0"
            >
              <>
                {copied ? (
                  <span
                    key="check"
                                        className="flex items-center gap-1.5"
                  >
                    <Check className="size-3.5 text-emerald-600" />
                    Copied
                  </span>
                ) : (
                  <span
                    key="copy"
                                        className="flex items-center gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    Copy
                  </span>
                )}
              </>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <div className="flex flex-col gap-5">
            {/* ── From: Amount + Currency ── */}
            <div className="space-y-2.5">
                          >
              <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-emerald-500" />
                You Send
              </label>
              <div className="flex gap-2">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-[140px] font-semibold shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {CURRENCY_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {CURRENCY_LABELS[code] ?? code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={handleAmountBlur}
                  placeholder="500,000"
                  className="flex-1 h-11 text-base font-semibold tabular-nums"
                />
              </div>
            </div>

            {/* ── Swap Button ── */}
            <div className="flex justify-center -my-1">
                          >
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="rounded-full size-10 border-2 border-dashed border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                aria-label="Swap currencies"
              >
                <div
                                    <ArrowUpDown className="size-4 text-muted-foreground" />
                </div>
              </Button>
            </div>

            {/* ── To: Currency ── */}
            <div className="space-y-2.5">
                          >
              <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-amber-500" />
                They Receive
              </label>
              <div className="flex gap-2">
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-[140px] font-semibold shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {CURRENCY_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {CURRENCY_LABELS[code] ?? code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 h-11 rounded-md border bg-muted/40 px-3 flex items-center">
                  <span className="text-base font-bold text-foreground tabular-nums truncate">
                    {formatConvertedValue(convertedAmount, toCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Result Display ── */}
            <div className="relative overflow-hidden rounded-2xl p-5 text-center">
              style={{
                background:
                  'linear-gradient(135deg, #0D9488 0%, #0F766E 50%, #065F46 100%)',
              }}
                          >
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-6 -left-6 size-24 rounded-full bg-white/5" />

              <p className="relative text-xs font-medium text-emerald-100 mb-1 flex items-center justify-center gap-1.5">
                <TrendingUp className="size-3.5" />
                Converted Amount
              </p>

              <div className="relative mt-2 mb-1">
                <>
                  <div
                    key={`${fromCurrency}-${toCurrency}-${amount}`}
                                        className="flex items-baseline justify-center gap-1.5"
                    <span className="text-base font-medium text-emerald-200">
                      {toCurrency}
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                      <AnimatedNumber
                        value={convertedAmount}
                        currency={toCurrency}
                      />
                    </span>
                  </div>
                </>
              </div>

              <div className="relative flex items-center justify-center gap-2 mt-3">
                <Badge
                  variant="secondary"
                  className="bg-white/15 text-emerald-100 hover:bg-white/20 border-0 text-[11px] font-medium"
                >
                  <RefreshCw className="size-3 mr-1" />
                  1 {fromCurrency} = {formatRate(rate)} {toCurrency}
                </Badge>
              </div>

              <p className="relative text-[11px] text-emerald-200/60 mt-2">
                1 {toCurrency} = {formatRate(inverseRate)} {fromCurrency}
              </p>
            </div>

            {/* ── Quick Reference ── */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                          >
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-emerald-600" />
                Quick Reference — {fromCurrency}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {CURRENCY_CODES.filter(
                  (c) => c !== fromCurrency
                )
                  .slice(0, 8)
                  .map((code) => {
                    const quickRate = getRate(fromCurrency, code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setToCurrency(code)}
                        className="rounded-lg border bg-background px-2 py-1.5 text-center hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                      >
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {code}
                        </p>
                        <p className="text-xs font-bold tabular-nums text-foreground">
                          {formatRate(quickRate)}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
