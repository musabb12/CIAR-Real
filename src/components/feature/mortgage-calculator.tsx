'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Percent,
  Clock,
  TrendingUp,
  Copy,
  Check,
  Home,
  ArrowDown,
  Info,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MortgageCalculatorProps {
  propertyPrice?: number;
  currency?: string;
}

interface MortgageBreakdown {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  principalRatio: number;
  interestRatio: number;
  downPaymentAmount: number;
  loanAmount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === '$' ? 'USD' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyDetailed(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === '$' ? 'USD' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumericInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function calculateMortgage(
  loanAmount: number,
  annualRate: number,
  termYears: number
): MortgageBreakdown {
  if (loanAmount <= 0 || annualRate <= 0 || termYears <= 0) {
    return {
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
      totalPrincipal: loanAmount,
      principalRatio: 1,
      interestRatio: 0,
      downPaymentAmount: 0,
      loanAmount,
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const compoundFactor = Math.pow(1 + monthlyRate, numPayments);
  const monthlyPayment = loanAmount * (monthlyRate * compoundFactor) / (compoundFactor - 1);
  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - loanAmount;

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    totalPrincipal: loanAmount,
    principalRatio: loanAmount / totalPayment,
    interestRatio: totalInterest / totalPayment,
    downPaymentAmount: 0,
    loanAmount,
  };
}

// ---------------------------------------------------------------------------
// AnimatedNumber — smooth counter using framer-motion springs
// ---------------------------------------------------------------------------

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 120, damping: 30, mass: 1 });
  const display = useTransform(spring, (v) =>
    `${prefix}${Math.round(v).toLocaleString('en-US')}${suffix}`
  );
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

  return <span ref={ref}>{`${prefix}${Math.round(value).toLocaleString('en-US')}${suffix}`}</span>;
}

// ---------------------------------------------------------------------------
// CSS Pie Chart (no external chart library)
// ---------------------------------------------------------------------------

function PieChart({
  principalRatio,
  interestRatio,
}: {
  principalRatio: number;
  interestRatio: number;
}) {
  const total = principalRatio + interestRatio;
  const principalPercent = total > 0 ? (principalRatio / total) * 100 : 50;
  const interestPercent = total > 0 ? (interestRatio / total) * 100 : 50;

  // conic-gradient for the pie slices
  const gradient = `conic-gradient(
    #0D9488 0deg ${principalPercent * 3.6}deg,
    #D97706 ${principalPercent * 3.6}deg 360deg
  )`;

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Pie circle */}
      <div className="relative">
        <motion.div
          className="size-44 sm:size-52 rounded-full shadow-lg"
          style={{ background: gradient }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.2 }}
        >
          {/* Donut hole */}
          <div className="absolute inset-4 sm:inset-5 rounded-full bg-background flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium">Total Cost</p>
              <p className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                {principalPercent.toFixed(0)}% P + {interestPercent.toFixed(0)}% I
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-full bg-emerald-600" />
          <span className="text-muted-foreground">Principal</span>
          <span className="font-semibold text-foreground">{principalPercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-full bg-amber-600" />
          <span className="text-muted-foreground">Interest</span>
          <span className="font-semibold text-foreground">{interestPercent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MortgageCalculator({
  propertyPrice = 500000,
  currency = '$',
}: MortgageCalculatorProps) {
  // ---- state ----
  const [homePrice, setHomePrice] = useState<number>(propertyPrice);
  const [homePriceInput, setHomePriceInput] = useState<string>(
    formatCurrency(propertyPrice, currency).replace(/[^0-9]/g, '')
  );
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [interestRateInput, setInterestRateInput] = useState<string>('6.5');
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [copied, setCopied] = useState<boolean>(false);

  // ---- derived ----
  const loanAmount = useMemo(() => homePrice * (1 - downPaymentPercent / 100), [homePrice, downPaymentPercent]);
  const downPaymentAmount = useMemo(() => homePrice * (downPaymentPercent / 100), [homePrice, downPaymentPercent]);

  const breakdown = useMemo<MortgageBreakdown>(() => {
    const base = calculateMortgage(loanAmount, interestRate, loanTerm);
    return { ...base, downPaymentAmount, loanAmount };
  }, [loanAmount, interestRate, loanTerm, downPaymentAmount]);

  // ---- handlers ----
  const handleHomePriceChange = useCallback(
    (raw: string) => {
      setHomePriceInput(raw);
      const num = parseNumericInput(raw);
      setHomePrice(num);
    },
    []
  );

  const handleHomePriceBlur = useCallback(() => {
    if (homePrice <= 0) {
      setHomePrice(propertyPrice);
      setHomePriceInput(formatCurrency(propertyPrice, currency).replace(/[^0-9]/g, ''));
    }
  }, [homePrice, propertyPrice, currency]);

  const handleInterestRateChange = useCallback((raw: string) => {
    setInterestRateInput(raw);
    const num = parseNumericInput(raw);
    if (num >= 0 && num <= 15) setInterestRate(num);
  }, []);

  const handleInterestRateBlur = useCallback(() => {
    if (interestRate <= 0) {
      setInterestRate(6.5);
      setInterestRateInput('6.5');
    }
    if (interestRate > 15) {
      setInterestRate(15);
      setInterestRateInput('15');
    }
  }, [interestRate]);

  const handleCopy = useCallback(async () => {
    const summary = [
      `Mortgage Calculator Summary`,
      `───────────────────────`,
      `Home Price:        ${formatCurrencyDetailed(homePrice, currency)}`,
      `Down Payment:      ${downPaymentPercent}% (${formatCurrencyDetailed(downPaymentAmount, currency)})`,
      `Loan Amount:       ${formatCurrencyDetailed(loanAmount, currency)}`,
      `Interest Rate:     ${interestRate}%`,
      `Loan Term:         ${loanTerm} years`,
      `───────────────────────`,
      `Monthly Payment:   ${formatCurrencyDetailed(breakdown.monthlyPayment, currency)}`,
      `Total Payment:     ${formatCurrencyDetailed(breakdown.totalPayment, currency)}`,
      `Total Interest:    ${formatCurrencyDetailed(breakdown.totalInterest, currency)}`,
      `Total Principal:   ${formatCurrencyDetailed(breakdown.totalPrincipal, currency)}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: no-op in restricted environments
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [homePrice, downPaymentPercent, downPaymentAmount, loanAmount, interestRate, loanTerm, breakdown, currency]);

  // ---- render ----
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="glass-card overflow-hidden rounded-2xl">
        {/* ── Header ── */}
        <CardHeader className="relative px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
          {/* Decorative gradient bar */}
          <div
            className="absolute top-0 inset-x-0 h-1"
            style={{
              background:
                'linear-gradient(90deg, #0D9488 0%, #14B8A6 35%, #F59E0B 65%, #D97706 100%)',
            }}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Calculator className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
                  Mortgage Calculator
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Estimate your monthly payments
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs shrink-0"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="size-3.5 text-emerald-600" />
                    Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    Export
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* ══════════════════════════════════════════════
                LEFT — Inputs (3 cols on lg)
                ══════════════════════════════════════════════ */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* ── Home Price ── */}
              <motion.div
                className="space-y-2.5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Home className="size-4 text-emerald-600" />
                  Home Price
                </Label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={homePriceInput}
                    onChange={(e) => handleHomePriceChange(e.target.value)}
                    onBlur={handleHomePriceBlur}
                    placeholder="500,000"
                    className="pl-8 h-11 text-base font-semibold tabular-nums"
                  />
                </div>
              </motion.div>

              {/* ── Down Payment Slider ── */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <ArrowDown className="size-4 text-emerald-600" />
                    Down Payment
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-bold tabular-nums">
                      {downPaymentPercent}%
                    </Badge>
                    <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                      ({formatCurrency(downPaymentAmount, currency)})
                    </span>
                  </div>
                </div>
                <Slider
                  min={0}
                  max={50}
                  step={1}
                  value={[downPaymentPercent]}
                  onValueChange={(v) => setDownPaymentPercent(v[0])}
                  className="py-1"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums px-0.5">
                  <span>0%</span>
                  <span>10%</span>
                  <span>20%</span>
                  <span>30%</span>
                  <span>40%</span>
                  <span>50%</span>
                </div>
              </motion.div>

              {/* ── Interest Rate + Loan Term (side-by-side) ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Interest Rate */}
                <motion.div
                  className="space-y-2.5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Percent className="size-4 text-amber-500" />
                    Interest Rate
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={interestRateInput}
                      onChange={(e) => handleInterestRateChange(e.target.value)}
                      onBlur={handleInterestRateBlur}
                      placeholder="6.5"
                      className="pr-8 h-11 text-base font-semibold tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info className="size-3" />
                    Annual rate (1 – 15%)
                  </p>
                </motion.div>

                {/* Loan Term */}
                <motion.div
                  className="space-y-2.5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="size-4 text-amber-500" />
                    Loan Term
                  </Label>
                  <Select value={String(loanTerm)} onValueChange={(v) => setLoanTerm(Number(v))}>
                    <SelectTrigger className="h-11 w-full font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Years</SelectItem>
                      <SelectItem value="15">15 Years</SelectItem>
                      <SelectItem value="20">20 Years</SelectItem>
                      <SelectItem value="25">25 Years</SelectItem>
                      <SelectItem value="30">30 Years</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info className="size-3" />
                    {loanTerm * 12} monthly payments
                  </p>
                </motion.div>
              </div>

              {/* ── Loan Amount Info ── */}
              <motion.div
                className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="size-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Loan Amount
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                  {formatCurrency(loanAmount, currency)}
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-1">
                  {currency}{homePrice.toLocaleString()} &times; {(100 - downPaymentPercent) / 100}
                </p>
              </motion.div>
            </div>

            {/* ══════════════════════════════════════════════
                RIGHT — Results (2 cols on lg)
                ══════════════════════════════════════════════ */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* ── Monthly Payment Hero ── */}
              <motion.div
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{
                  background:
                    'linear-gradient(135deg, #0D9488 0%, #0F766E 50%, #065F46 100%)',
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.15 }}
              >
                {/* Decorative circles */}
                <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-6 -left-6 size-24 rounded-full bg-white/5" />

                <p className="relative text-sm font-medium text-emerald-100 mb-1 flex items-center justify-center gap-1.5">
                  <TrendingUp className="size-4" />
                  Your Monthly Payment
                </p>

                <div className="relative mt-2 mb-1">
                  <span className="text-lg font-medium text-emerald-100">{currency}</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={breakdown.monthlyPayment.toFixed(2)}
                      className="text-4xl sm:text-5xl font-extrabold text-white tabular-nums tracking-tight"
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {breakdown.monthlyPayment.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-sm text-emerald-200 ml-1">/mo</span>
                </div>

                <p className="relative text-xs text-emerald-200/70 mt-2">
                  For {loanTerm} years at {interestRate}% APR
                </p>
              </motion.div>

              {/* ── Pie Chart ── */}
              <motion.div
                className="glass-card rounded-xl p-5 flex flex-col items-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <PieIcon className="size-4 text-emerald-600" />
                  Cost Breakdown
                </p>
                <PieChart
                  principalRatio={breakdown.principalRatio}
                  interestRatio={breakdown.interestRatio}
                />
              </motion.div>

              {/* ── Amortization Summary ── */}
              <motion.div
                className="space-y-0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="size-4 text-amber-500" />
                  Loan Summary
                </p>
                <Separator className="mb-3" />
                <div className="grid grid-cols-1 gap-0">
                  <SummaryRow
                    label="Total Payment"
                    value={formatCurrencyDetailed(breakdown.totalPayment, currency)}
                    accent="emerald"
                    delay={0.45}
                  />
                  <SummaryRow
                    label="Total Interest"
                    value={formatCurrencyDetailed(breakdown.totalInterest, currency)}
                    accent="amber"
                    delay={0.5}
                    subtext={`${((breakdown.interestRatio || 0) * 100).toFixed(1)}% of total`}
                  />
                  <SummaryRow
                    label="Total Principal"
                    value={formatCurrencyDetailed(breakdown.totalPrincipal, currency)}
                    accent="emerald"
                    delay={0.55}
                    subtext={`${((breakdown.principalRatio || 0) * 100).toFixed(1)}% of total`}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryRow({
  label,
  value,
  subtext,
  accent,
  delay,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent: 'emerald' | 'amber';
  delay: number;
}) {
  const dotColor =
    accent === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';
  const textColor =
    accent === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-amber-700 dark:text-amber-400';

  return (
    <motion.div
      className="flex items-center justify-between py-3 gap-4"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`inline-block size-2 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-sm text-muted-foreground truncate">{label}</span>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold tabular-nums ${textColor}`}>{value}</p>
        {subtext && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>
        )}
      </div>
    </motion.div>
  );
}

function PieIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
