'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Briefcase,
  MessageSquare,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Crown,
  Star,
  MapPin,
  Sparkles,
  Bell,
  Calendar,
  CheckSquare,
  Square,
  ShieldCheck,
  Zap,
  Plus,
  ChevronRight,
  Globe2,
  Heart,
  Award,
  Clock,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  Counter,
  Sparkline,
  AnimatedGrid,
  AnimatedItem,
  ProgressBar,
  useLiveTime,
} from './admin-primitives';

interface AdminStats {
  totals?: {
    properties: number;
    users: number;
    agents: number;
    inquiries: number;
    views: number;
    featuredProperties: number;
  };
  propertiesByType?: Array<{ type: string; count: number }>;
  inquiriesByStatus?: Array<{ status: string; count: number }>;
  recentInquiries?: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string;
    status: string;
  }>;
}

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

// ─── Mock data for demo charts ──────────────────────────────
const REVENUE_DATA = [
  { m: 'Jan', revenue: 42000, leads: 28000 },
  { m: 'Feb', revenue: 51000, leads: 31000 },
  { m: 'Mar', revenue: 47000, leads: 35000 },
  { m: 'Apr', revenue: 58000, leads: 38000 },
  { m: 'May', revenue: 64000, leads: 42000 },
  { m: 'Jun', revenue: 71000, leads: 48000 },
  { m: 'Jul', revenue: 79000, leads: 52000 },
  { m: 'Aug', revenue: 86000, leads: 58000 },
  { m: 'Sep', revenue: 94000, leads: 64000 },
  { m: 'Oct', revenue: 103000, leads: 71000 },
  { m: 'Nov', revenue: 112000, leads: 79000 },
  { m: 'Dec', revenue: 124000, leads: 88000 },
];

const SALES_DATA = [
  { name: 'Riyadh', sales: 42, rents: 28 },
  { name: 'Jeddah', sales: 38, rents: 22 },
  { name: 'Dubai', sales: 56, rents: 41 },
  { name: 'Abu Dhabi', sales: 33, rents: 19 },
  { name: 'Doha', sales: 27, rents: 14 },
  { name: 'Cairo', sales: 24, rents: 16 },
];

const STATUS_DATA = [
  { name: 'Available', value: 65, color: '#2dd4bf' },
  { name: 'Pending', value: 18, color: '#fbbf24' },
  { name: 'Sold', value: 12, color: '#a78bfa' },
  { name: 'Rented', value: 5, color: '#fb7185' },
];

const PERF_DATA = [{ name: 'Goal', value: 82, fill: '#f5c97b' }];

const TOP_AGENTS = [
  { name: 'محمد العتيبي', role: 'Senior Agent', listings: 42, sales: 28, rating: 4.9 },
  { name: 'سارة الزهراني', role: 'VIP Agent', listings: 38, sales: 31, rating: 4.8 },
  { name: 'فهد القحطاني', role: 'Agent', listings: 31, sales: 22, rating: 4.7 },
  { name: 'لينا أحمد', role: 'Agent', listings: 27, sales: 18, rating: 4.6 },
];

const TOP_COUNTRIES = [
  { name: 'المملكة العربية السعودية', en: 'Saudi Arabia', flag: '🇸🇦', listings: 142, growth: 28 },
  { name: 'الإمارات', en: 'UAE', flag: '🇦🇪', listings: 98, growth: 22 },
  { name: 'قطر', en: 'Qatar', flag: '🇶🇦', listings: 64, growth: 18 },
  { name: 'مصر', en: 'Egypt', flag: '🇪🇬', listings: 52, growth: 15 },
  { name: 'الكويت', en: 'Kuwait', flag: '🇰🇼', listings: 38, growth: 11 },
];

const ACTIVITY = [
  { ar: 'تم إضافة عقار جديد: فيلا فاخرة في الرياض', en: 'New property: Luxury villa in Riyadh', time: '2m', type: 'add' },
  { ar: 'استفسار جديد من العميل أحمد محمد', en: 'New inquiry from Ahmed Mohammed', time: '12m', type: 'inquiry' },
  { ar: 'تم تأكيد بيع عقار بقيمة 1.2M ريال', en: 'Property sale confirmed: 1.2M SAR', time: '38m', type: 'sale' },
  { ar: 'انضم وكيل جديد: لينا أحمد', en: 'New agent joined: Lina Ahmed', time: '1h', type: 'user' },
  { ar: 'تم تحديث 6 صور لشقة في جدة', en: '6 photos updated for Jeddah apartment', time: '2h', type: 'update' },
];

const TASKS_INIT = [
  { ar: 'مراجعة 12 عقاراً جديداً', en: 'Review 12 new properties', done: false },
  { ar: 'الرد على 5 استفسارات معلقة', en: 'Reply to 5 pending inquiries', done: false },
  { ar: 'الموافقة على وكلاء جدد', en: 'Approve new agents', done: true },
  { ar: 'تحديث شريط الأخبار', en: 'Update news ticker', done: false },
  { ar: 'تصدير تقرير الشهر', en: 'Export monthly report', done: false },
];

// Tiny demo sparkline data
const SP = (n = 14, base = 10, jitter = 7): number[] =>
  Array.from({ length: n }, (_, i) => base + Math.sin(i / 2) * jitter + (i / n) * jitter * 1.5 + Math.random() * 3);

// ─── 1. Cinematic Welcome Hero ─────────────────────────────
function WelcomeHero({
  isAr,
  name,
  onOpenProperties,
  onOpenAnalytics,
  onOpenInsights,
}: {
  isAr: boolean;
  name: string;
  onOpenProperties: () => void;
  onOpenAnalytics: () => void;
  onOpenInsights: () => void;
}) {
  const now = useLiveTime();
  const hour = now.getHours();
  const greeting =
    hour < 5
      ? tx(isAr, 'سهرة موفقة', 'Good night')
      : hour < 12
      ? tx(isAr, 'صباح الخير', 'Good morning')
      : hour < 18
      ? tx(isAr, 'مساء النور', 'Good afternoon')
      : tx(isAr, 'مساء الخير', 'Good evening');

  const emoji = hour < 5 ? '🌙' : hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌅';

  const dateStr = now.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = now.toLocaleTimeString(isAr ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="admin-card admin-card-glow relative p-7 sm:p-9"
    >
      <div className="admin-welcome-shine absolute inset-0 pointer-events-none rounded-[18px]" />
      {/* Decorative orbs */}
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-orange-500/22 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber-500/18 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-orange-400/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
        {/* Left: greeting */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="admin-pulse-dot" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-emerald-300/80 font-bold">
              {tx(isAr, 'النظام يعمل', 'All systems operational')}
            </span>
            <span className="mx-2 admin-ribbon-divider" />
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-mute)]">
              <Clock className="h-3 w-3" />
              {timeStr} · {dateStr}
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl xl:text-5xl font-bold leading-tight">
            {greeting}،{' '}
            <span className="admin-text-gradient">{name}</span> {emoji}
          </h1>
          <p className="text-[var(--admin-text-mute)] mt-3 max-w-xl leading-relaxed text-sm sm:text-base">
            {tx(
              isAr,
              'إمبراطوريتك العقارية في حالة ممتازة. ٧ استفسارات جديدة في انتظارك، و٣ صفقات قاب قوسين أو أدنى من الإغلاق.',
              "Your real-estate empire is thriving. 7 new inquiries are waiting, and 3 deals are about to close.",
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <button type="button" className="admin-btn-premium group" onClick={onOpenProperties}>
              <Plus className="h-3.5 w-3.5" />
              {tx(isAr, 'إضافة عقار جديد', 'Add new property')}
              <ArrowRight className={`h-3 w-3 transition-transform group-hover:translate-x-0.5 ${isAr ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
            </button>
            <button type="button" className="admin-icon-btn !w-auto px-3.5 gap-1.5 text-xs h-9" onClick={onOpenAnalytics}>
              <Wand2 className="h-3.5 w-3.5" />
              {tx(isAr, 'تقرير ذكي', 'AI report')}
            </button>
            <button type="button" className="admin-icon-btn !w-auto px-3.5 gap-1.5 text-xs h-9" onClick={onOpenInsights}>
              <Sparkles className="h-3.5 w-3.5" />
              {tx(isAr, 'رؤى الأداء', 'Insights')}
            </button>
          </div>
        </div>

        {/* Right: live mini-stats */}
        <div className="grid grid-cols-3 gap-3 min-w-[280px]">
          {[
            { label: tx(isAr, 'الزوار الآن', 'Live visitors'), value: 127, color: '#2dd4bf', icon: Eye },
            { label: tx(isAr, 'صفقة اليوم', 'Today deals'), value: 8, color: '#f5c97b', icon: Award },
            { label: tx(isAr, 'النمو', 'Growth'), value: 24, suffix: '%', color: '#a78bfa', icon: TrendingUp },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                <Counter
                  value={s.value}
                  suffix={s.suffix}
                  className="admin-kpi-number text-xl font-bold"
                />
                <span className="text-[10px] text-[var(--admin-text-faint)] tracking-wide truncate">
                  {s.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── 2. Premium KPI Card ──────────────────────────────────
function KPICard({
  icon: Icon,
  label,
  value,
  prefix = '',
  suffix = '',
  delta,
  trend = 'up',
  color,
  progress,
  spark,
}: {
  icon: any;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta: number;
  trend?: 'up' | 'down';
  color: string;
  progress: number;
  spark: number[];
}) {
  return (
    <div className="admin-card p-5 group relative overflow-hidden">
      {/* hover glow */}
      <div
        className="absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none"
        style={{ background: color }}
      />

      <div className="relative">
        {/* Top: icon + delta */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg, ${color}26, ${color}10)`,
              color,
              border: `1px solid ${color}28`,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={`admin-pill ${trend === 'up' ? 'admin-pill-up' : 'admin-pill-down'}`}
          >
            {trend === 'up' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {delta}%
          </span>
        </div>

        {/* Label */}
        <div className="text-[var(--admin-text-mute)] text-[11px] font-semibold uppercase tracking-[0.14em] mb-1">
          {label}
        </div>

        {/* Number with counter */}
        <Counter
          value={value}
          prefix={prefix}
          suffix={suffix}
          className="admin-kpi-number text-3xl font-bold block mb-3"
        />

        {/* Sparkline */}
        <div className="flex items-end justify-between gap-3 mt-1">
          <Sparkline data={spark} color={color} width={110} height={32} />
          <span
            className="text-[10px] font-bold tracking-wide opacity-80 tabular-nums"
            style={{ color }}
          >
            {progress}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <ProgressBar value={progress} color1={color} color2={color} height={3} />
        </div>
      </div>
    </div>
  );
}

// ─── 3. Revenue Area Chart ────────────────────────────────
function RevenueChart({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="font-heading text-lg font-bold">
            {tx(isAr, 'الإيرادات والعملاء المحتملون', 'Revenue & Leads')}
          </h3>
          <p className="text-[11px] text-[var(--admin-text-faint)] mt-0.5">
            {tx(isAr, 'تتبع الأداء على مدار 12 شهر', 'Track 12-month performance')}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#f5c97b] shadow-[0_0_8px_#f5c97b]" />
            <span className="text-[var(--admin-text-mute)]">{tx(isAr, 'إيراد', 'Revenue')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf]" />
            <span className="text-[var(--admin-text-mute)]">{tx(isAr, 'عملاء', 'Leads')}</span>
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-3 mb-1">
        <span className="admin-kpi-number text-3xl font-bold admin-text-gradient-warm">
          $1,325,134
        </span>
        <span className="admin-pill admin-pill-up">+14.8%</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={REVENUE_DATA}>
            <defs>
              <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5c97b" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f5c97b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-leads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="m" tick={{ fill: 'rgba(238,243,249,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'rgba(238,243,249,0.45)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(13,20,29,0.95)',
                border: '1px solid rgba(245,201,123,0.18)',
                borderRadius: 10,
                color: '#eef3f9',
                fontSize: 12,
                boxShadow: '0 10px 30px -8px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
              }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#f5c97b" strokeWidth={2.5} fill="url(#grad-rev)" />
            <Area type="monotone" dataKey="leads" stroke="#2dd4bf" strokeWidth={2.5} fill="url(#grad-leads)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 4. Status Donut ──────────────────────────────────────
function StatusDonut({ isAr }: { isAr: boolean }) {
  const total = STATUS_DATA.reduce((s, x) => s + x.value, 0);
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'حالات العقارات', 'Property Status')}</h3>
        <span className="admin-pulse-dot" />
      </div>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={STATUS_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} stroke="none">
              {STATUS_DATA.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(13,20,29,0.95)',
                border: '1px solid rgba(245,201,123,0.18)',
                borderRadius: 10,
                color: '#eef3f9',
                fontSize: 12,
                backdropFilter: 'blur(12px)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Counter value={total} className="admin-kpi-number text-2xl font-bold" />
          <div className="text-[10px] text-[var(--admin-text-faint)] uppercase tracking-widest">
            {tx(isAr, 'إجمالي', 'Total')}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {STATUS_DATA.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
            <span className="text-[var(--admin-text-mute)] flex-1">{d.name}</span>
            <span className="font-bold tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Sales Bars ────────────────────────────────────────
function SalesBars({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'الصفقات حسب المدينة', 'Deals by City')}</h3>
        <span className="admin-pill admin-pill-up">+18%</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SALES_DATA}>
            <defs>
              <linearGradient id="grad-bar-sales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5c97b" />
                <stop offset="100%" stopColor="#e5b260" />
              </linearGradient>
              <linearGradient id="grad-bar-rents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'rgba(238,243,249,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(238,243,249,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                background: 'rgba(13,20,29,0.95)',
                border: '1px solid rgba(245,201,123,0.18)',
                borderRadius: 10,
                color: '#eef3f9',
                fontSize: 12,
                backdropFilter: 'blur(12px)',
              }}
            />
            <Bar dataKey="sales" fill="url(#grad-bar-sales)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="rents" fill="url(#grad-bar-rents)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 6. Performance Gauge ────────────────────────────────
function PerformanceGauge({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'هدف الشهر', 'Monthly Goal')}</h3>
        <Award className="h-4 w-4 text-[#f5c97b]" />
      </div>
      <div className="h-44 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="65%" outerRadius="100%" data={PERF_DATA} startAngle={220} endAngle={-40}>
            <defs>
              <linearGradient id="grad-radial" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f5c97b" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
            <RadialBar background={{ fill: 'rgba(255,255,255,0.04)' }} dataKey="value" cornerRadius={10} fill="url(#grad-radial)" />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Counter value={82} suffix="%" className="admin-kpi-number text-3xl font-bold admin-text-gradient" />
          <div className="text-[10px] text-[var(--admin-text-faint)] uppercase tracking-widest mt-1">
            {tx(isAr, 'منجز', 'completed')}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-[var(--admin-text-mute)] text-center">
        {tx(isAr, '8.2M / 10M ريال محقق هذا الشهر', '8.2M / 10M SAR achieved this month')}
      </p>
    </div>
  );
}

// ─── 7. Recent Inquiries ─────────────────────────────────
function RecentInquiries({ isAr, items }: { isAr: boolean; items: AdminStats['recentInquiries'] }) {
  const data = items?.slice(0, 5) ?? [];
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'أحدث الاستفسارات', 'Recent Inquiries')}</h3>
        <button className="text-[11px] text-[#f5c97b] hover:text-[#fbbf24] transition-colors flex items-center gap-1 group">
          {tx(isAr, 'الكل', 'View all')}
          <ChevronRight className={`h-3 w-3 transition-transform group-hover:translate-x-0.5 ${isAr ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
        </button>
      </div>
      {data.length === 0 ? (
        <p className="text-center text-[var(--admin-text-faint)] text-sm py-8">
          {tx(isAr, 'لا توجد استفسارات', 'No inquiries')}
        </p>
      ) : (
        <div className="space-y-1">
          {data.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: isAr ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#f5c97b]/30 to-[#2dd4bf]/20 flex items-center justify-center text-[#f5c97b] text-xs font-bold shrink-0 border border-white/5">
                {q.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-sm truncate">{q.name}</p>
                  <span className="text-[10px] text-[var(--admin-text-faint)]">
                    {new Date(q.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}
                  </span>
                </div>
                <p className="text-xs text-[var(--admin-text-mute)] truncate mt-0.5">{q.message}</p>
              </div>
              <span className="admin-pill admin-pill-gold shrink-0">{q.status}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 8. Top Agents ──────────────────────────────────────
function TopAgents({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'الوكلاء المتميزون', 'Top Agents')}</h3>
        <span className="text-[10px] text-[var(--admin-text-faint)]">{tx(isAr, 'هذا الشهر', 'this month')}</span>
      </div>
      <div className="space-y-3">
        {TOP_AGENTS.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`relative ${i === 0 ? 'admin-avatar-ring' : ''}`}>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#f5c97b] to-[#2dd4bf] p-[2px]">
                <div className="h-full w-full rounded-full bg-[#0a1018] flex items-center justify-center font-bold text-xs">
                  {a.name.charAt(0)}
                </div>
              </div>
              {i === 0 && <Crown className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-[#f5c97b] drop-shadow-[0_0_6px_rgba(245,201,123,0.7)]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{a.name}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-mute)]">
                <span>{a.role}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-[#f5c97b]">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  {a.rating}
                </span>
              </div>
            </div>
            <div className="text-end">
              <div className="text-sm font-bold tabular-nums">{a.sales}</div>
              <div className="text-[10px] text-[var(--admin-text-faint)]">{tx(isAr, 'صفقة', 'deals')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 9. Top Countries ───────────────────────────────────
function TopCountries({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'الدول الأعلى', 'Top Countries')}</h3>
        <Globe2 className="h-4 w-4 text-[var(--admin-text-faint)]" />
      </div>
      <div className="space-y-3.5">
        {TOP_COUNTRIES.map((c, i) => {
          const pct = (c.listings / TOP_COUNTRIES[0].listings) * 100;
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <span className="font-medium">{tx(isAr, c.name, c.en)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tabular-nums">{c.listings}</span>
                  <span className="admin-pill admin-pill-up !text-[10px]">+{c.growth}%</span>
                </div>
              </div>
              <ProgressBar value={pct} height={5} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 10. Activity Timeline ─────────────────────────────
function ActivityTimeline({ isAr }: { isAr: boolean }) {
  const colorMap = {
    add: '#2dd4bf',
    inquiry: '#f5c97b',
    sale: '#a78bfa',
    user: '#fb7185',
    update: '#60a5fa',
  };
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'سجل النشاط', 'Activity Feed')}</h3>
        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
          <span className="admin-pulse-dot scale-75" />
          LIVE
        </span>
      </div>
      <div className="relative space-y-4">
        <div className="absolute start-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-white/[0.02] via-white/[0.08] to-white/[0.02]" />
        {ACTIVITY.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: isAr ? 8 : -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="flex gap-3 relative"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border-2 border-[#0b1118] mt-1 shrink-0 z-10"
              style={{
                background: colorMap[a.type as keyof typeof colorMap],
                boxShadow: `0 0 8px ${colorMap[a.type as keyof typeof colorMap]}`,
              }}
            />
            <div className="flex-1">
              <p className="text-sm text-[var(--admin-text)]">{tx(isAr, a.ar, a.en)}</p>
              <p className="text-[10px] text-[var(--admin-text-faint)] mt-0.5">{a.time} {tx(isAr, 'مضت', 'ago')}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── 11. Quick Actions ─────────────────────────────
function QuickActions({ isAr }: { isAr: boolean }) {
  const actions = [
    { ar: 'إضافة عقار', en: 'Add Property', icon: Plus, color: '#f5c97b' },
    { ar: 'دعوة وكيل', en: 'Invite Agent', icon: Users, color: '#2dd4bf' },
    { ar: 'إنشاء إعلان', en: 'New Banner', icon: Sparkles, color: '#a78bfa' },
    { ar: 'تصدير تقرير', en: 'Export Report', icon: ArrowUpRight, color: '#60a5fa' },
  ];
  return (
    <div className="admin-card p-5">
      <h3 className="font-heading text-base font-bold mb-4">{tx(isAr, 'إجراءات سريعة', 'Quick Actions')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <button
              key={i}
              className="group flex flex-col items-start gap-2 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all relative overflow-hidden"
            >
              <div
                className="absolute -top-8 -right-8 h-20 w-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"
                style={{ background: a.color }}
              />
              <div
                className="relative h-9 w-9 rounded-lg flex items-center justify-center border"
                style={{ background: `${a.color}1f`, color: a.color, borderColor: `${a.color}33` }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="relative text-xs font-semibold">{tx(isAr, a.ar, a.en)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 12. Tasks Widget ─────────────────────────────
function TasksWidget({ isAr }: { isAr: boolean }) {
  const [tasks, setTasks] = useState(TASKS_INIT);
  const completed = tasks.filter((t) => t.done).length;
  const pct = (completed / tasks.length) * 100;
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'مهامك اليوم', "Today's Tasks")}</h3>
        <span className="text-[11px] text-[var(--admin-text-mute)] tabular-nums">
          {completed}/{tasks.length}
        </span>
      </div>
      <ProgressBar value={pct} height={4} className="mb-3" />
      <div className="space-y-1">
        {tasks.map((t, i) => (
          <button
            key={i}
            onClick={() => setTasks(tasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-start"
          >
            {t.done ? (
              <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-[var(--admin-text-faint)] shrink-0" />
            )}
            <span className={`text-sm flex-1 ${t.done ? 'line-through text-[var(--admin-text-faint)]' : ''}`}>
              {tx(isAr, t.ar, t.en)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 13. Notifications Center ─────────────────────────
function NotificationsCenter({ isAr }: { isAr: boolean }) {
  const items = [
    { ar: '7 استفسارات جديدة في انتظار الرد', en: '7 new inquiries awaiting reply', icon: Bell, color: '#f5c97b' },
    { ar: 'تم تجديد اشتراك CIAR Pro', en: 'CIAR Pro subscription renewed', icon: ShieldCheck, color: '#2dd4bf' },
    { ar: 'تحديث جديد متوفر للنظام', en: 'New system update available', icon: Zap, color: '#a78bfa' },
  ];
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-bold">{tx(isAr, 'الإشعارات', 'Notifications')}</h3>
        <button className="text-[11px] text-[#f5c97b] hover:text-[#fbbf24] transition-colors">{tx(isAr, 'تعليم الكل', 'Mark all')}</button>
      </div>
      <div className="space-y-2.5">
        {items.map((n, i) => {
          const Icon = n.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors"
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${n.color}1f`, color: n.color }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-[var(--admin-text)] flex-1 leading-relaxed pt-0.5">{tx(isAr, n.ar, n.en)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 14. Mini Calendar ─────────────────────────────
function MiniCalendar({ isAr }: { isAr: boolean }) {
  const today = new Date();
  const day = today.getDate();
  const monthName = today.toLocaleDateString(isAr ? 'ar' : 'en', { month: 'long', year: 'numeric' });
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const events = [3, 7, 12, 18, 22, day, 28];
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-base font-bold">{monthName}</h3>
        <Calendar className="h-4 w-4 text-[var(--admin-text-faint)]" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--admin-text-faint)] mb-2">
        {(isAr ? ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']).map(
          (d) => (
            <span key={d}>{d}</span>
          ),
        )}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const isToday = d === day;
          const hasEvent = events.includes(d);
          return (
            <button
              key={d}
              className={`relative aspect-square rounded-md text-[11px] font-medium transition-all ${
                isToday
                  ? 'bg-gradient-to-br from-[#f5c97b] to-[#2dd4bf] text-[#0a1018] font-bold shadow-lg shadow-amber-500/30'
                  : 'hover:bg-white/[0.06] text-[var(--admin-text-mute)]'
              }`}
            >
              {d}
              {hasEvent && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#f5c97b]" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-[#f5c97b] shadow-[0_0_6px_#f5c97b]" />
          <span className="text-[var(--admin-text-mute)]">{tx(isAr, '3 اجتماعات اليوم', '3 meetings today')}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 15. Storage / Limits ─────────────────────────
function StorageWidget({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-5">
      <h3 className="font-heading text-base font-bold mb-3">{tx(isAr, 'استخدام التخزين', 'Storage Usage')}</h3>
      {[
        { ar: 'صور العقارات', en: 'Property Images', val: 68, color: '#f5c97b' },
        { ar: 'الوثائق', en: 'Documents', val: 42, color: '#2dd4bf' },
        { ar: 'الفيديوهات', en: 'Videos', val: 24, color: '#a78bfa' },
      ].map((s, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[var(--admin-text-mute)]">{tx(isAr, s.ar, s.en)}</span>
            <span className="font-bold tabular-nums">{s.val}%</span>
          </div>
          <ProgressBar value={s.val} color1={s.color} color2={s.color} height={5} />
        </div>
      ))}
    </div>
  );
}

// ─── 16. Security Score ─────────────────────────
function SecurityWidget({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="font-heading text-base font-bold">{tx(isAr, 'الأمان', 'Security')}</h3>
        </div>
        <div className="admin-kpi-number text-4xl font-bold admin-text-gradient-cool">A+</div>
        <p className="text-xs text-[var(--admin-text-mute)] mt-1">
          {tx(isAr, 'نظامك آمن تماماً', 'Your system is fully secure')}
        </p>
        <div className="mt-3 space-y-1.5">
          {[
            { ar: 'شهادة SSL', en: 'SSL Certified' },
            { ar: 'نسخ احتياطي يومي', en: 'Daily Backups' },
            { ar: 'حماية 2FA', en: '2FA Protected' },
          ].map((x, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-mute)]">
              <CheckSquare className="h-3 w-3 text-emerald-400" />
              {tx(isAr, x.ar, x.en)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 17. Conversion Funnel ─────────────────────────
function ConversionFunnel({ isAr }: { isAr: boolean }) {
  const stages = [
    { ar: 'زائر', en: 'Visitors', val: 12480, color: '#60a5fa' },
    { ar: 'استفسار', en: 'Inquiries', val: 3120, color: '#a78bfa' },
    { ar: 'معاينة', en: 'Visits', val: 842, color: '#f5c97b' },
    { ar: 'صفقة', en: 'Deals', val: 184, color: '#2dd4bf' },
  ];
  const max = stages[0].val;
  return (
    <div className="admin-card p-5">
      <h3 className="font-heading text-base font-bold mb-4">{tx(isAr, 'قمع التحويل', 'Conversion Funnel')}</h3>
      <div className="space-y-2">
        {stages.map((s, i) => {
          const pct = (s.val / max) * 100;
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--admin-text-mute)]">{tx(isAr, s.ar, s.en)}</span>
                <span className="font-bold tabular-nums">{s.val.toLocaleString()}</span>
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="h-7 rounded-md flex items-center justify-end px-2 text-[10px] text-[#0a1018] font-bold relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, ${s.color}cc, ${s.color})`,
                  minWidth: '15%',
                  boxShadow: `0 4px 12px ${s.color}30`,
                }}
              >
                {pct.toFixed(1)}%
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 18. Featured Property Spotlight ─────────────────
function PropertySpotlight({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-0 overflow-hidden">
      <div
        className="h-44 relative bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1118] via-[#0b1118]/40 to-transparent" />
        <div className="absolute top-3 start-3 admin-pill admin-pill-gold backdrop-blur-md">
          <Star className="h-2.5 w-2.5 fill-current" />
          {tx(isAr, 'مميز', 'Featured')}
        </div>
        <button className="absolute top-3 end-3 admin-icon-btn !bg-black/40 backdrop-blur-md">
          <Heart className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-5">
        <h3 className="font-heading text-base font-bold mb-1">{tx(isAr, 'فيلا فاخرة في الرياض', 'Luxury Villa in Riyadh')}</h3>
        <div className="flex items-center gap-1 text-[11px] text-[var(--admin-text-mute)] mb-3">
          <MapPin className="h-3 w-3" />
          {tx(isAr, 'حي الياسمين، الرياض', 'Al Yasmin, Riyadh')}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--admin-text-faint)] uppercase tracking-wider">
              {tx(isAr, 'السعر', 'Price')}
            </div>
            <div className="admin-kpi-number text-lg font-bold admin-text-gradient">2.4M SAR</div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold flex items-center gap-1 border border-white/10 transition-colors">
            {tx(isAr, 'عرض', 'View')}
            <ChevronRight className={`h-3 w-3 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 19. Live Visitors ─────────────────────────
function LiveVisitors({ isAr }: { isAr: boolean }) {
  const [count, setCount] = useState(127);
  useEffect(() => {
    const i = setInterval(
      () => setCount((c) => Math.max(80, Math.min(180, c + Math.floor(Math.random() * 10 - 4)))),
      2500,
    );
    return () => clearInterval(i);
  }, []);
  return (
    <div className="admin-card p-5 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading text-base font-bold">{tx(isAr, 'الزوار الآن', 'Live Visitors')}</h3>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="admin-pulse-dot scale-75" />
            LIVE
          </span>
        </div>
        <Counter value={count} className="admin-kpi-number text-4xl font-bold admin-text-gradient-cool" />
        <p className="text-xs text-[var(--admin-text-mute)] mt-1">{tx(isAr, 'يتصفحون الموقع حالياً', 'currently browsing the site')}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { ar: 'سعودية', en: 'SA', val: 42 },
            { ar: 'إمارات', en: 'AE', val: 31 },
            { ar: 'قطر', en: 'QA', val: 18 },
          ].map((c, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="text-sm font-bold tabular-nums">{c.val}</div>
              <div className="text-[10px] text-[var(--admin-text-faint)]">{tx(isAr, c.ar, c.en)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 20. Insights ─────────────────────────
function InsightsCard({ isAr }: { isAr: boolean }) {
  return (
    <div className="admin-card p-5 relative overflow-hidden">
      <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 admin-pill admin-pill-gold mb-3">
          <Sparkles className="h-3 w-3" />
          {tx(isAr, 'رؤية ذكية', 'AI Insight')}
        </div>
        <h3 className="font-heading text-base font-bold mb-2">{tx(isAr, 'فرصة استثمار اليوم', "Today's Opportunity")}</h3>
        <p className="text-xs text-[var(--admin-text-mute)] leading-relaxed mb-4">
          {tx(
            isAr,
            'الطلب على الفلل في حي الياسمين ارتفع بنسبة 32% هذا الأسبوع. نوصي بزيادة الإعلانات في هذه المنطقة.',
            'Demand for villas in Al Yasmin rose by 32% this week. We recommend boosting promotions there.',
          )}
        </p>
        <button className="text-xs font-bold flex items-center gap-1 text-[#f5c97b] hover:text-[#fbbf24] transition-colors group">
          {tx(isAr, 'استكشاف الفرصة', 'Explore opportunity')}
          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────
export function AdminDashboard({
  isAr,
  stats,
  userName,
  onOpenProperties,
  onOpenAnalytics,
  onOpenInsights,
}: {
  isAr: boolean;
  stats: AdminStats | null;
  userName: string;
  onOpenProperties: () => void;
  onOpenAnalytics: () => void;
  onOpenInsights: () => void;
}) {
  const t = stats?.totals;

  const kpis = useMemo(
    () => [
      { icon: Building2, label: tx(isAr, 'العقارات', 'Properties'), value: t?.properties ?? 0, delta: 12.4, trend: 'up' as const, color: '#f5c97b', progress: 78, spark: SP(14, 12, 6) },
      { icon: Users, label: tx(isAr, 'المستخدمون', 'Users'), value: t?.users ?? 0, delta: 8.2, trend: 'up' as const, color: '#2dd4bf', progress: 62, spark: SP(14, 8, 5) },
      { icon: Briefcase, label: tx(isAr, 'الوكلاء', 'Agents'), value: t?.agents ?? 0, delta: 4.1, trend: 'up' as const, color: '#a78bfa', progress: 54, spark: SP(14, 6, 4) },
      { icon: MessageSquare, label: tx(isAr, 'الاستفسارات', 'Inquiries'), value: t?.inquiries ?? 0, delta: 18.6, trend: 'up' as const, color: '#fbbf24', progress: 87, spark: SP(14, 14, 8) },
      { icon: Eye, label: tx(isAr, 'المشاهدات', 'Views'), value: t?.views ?? 0, delta: 24.3, trend: 'up' as const, color: '#60a5fa', progress: 91, spark: SP(14, 18, 9) },
      { icon: DollarSign, label: tx(isAr, 'الإيرادات', 'Revenue'), value: 1325134, prefix: '$', delta: 14.8, trend: 'up' as const, color: '#fb7185', progress: 82, spark: SP(14, 16, 10) },
    ],
    [t, isAr],
  );

  return (
    <div className="space-y-5 relative">
      {/* Decorative orbs */}
      <div className="admin-orb admin-orb-1" />
      <div className="admin-orb admin-orb-2" />

      {/* 1. Hero Welcome */}
      <WelcomeHero
        isAr={isAr}
        name={userName}
        onOpenProperties={onOpenProperties}
        onOpenAnalytics={onOpenAnalytics}
        onOpenInsights={onOpenInsights}
      />

      {/* 2-7. KPI cards (with stagger) */}
      <AnimatedGrid className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <AnimatedItem key={i}>
            <KPICard {...k} />
          </AnimatedItem>
        ))}
      </AnimatedGrid>

      {/* 8 + 9 */}
      <AnimatedGrid className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AnimatedItem className="lg:col-span-2">
          <RevenueChart isAr={isAr} />
        </AnimatedItem>
        <AnimatedItem>
          <StatusDonut isAr={isAr} />
        </AnimatedItem>
      </AnimatedGrid>

      {/* 10 + 11 */}
      <AnimatedGrid className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AnimatedItem className="lg:col-span-2">
          <SalesBars isAr={isAr} />
        </AnimatedItem>
        <AnimatedItem>
          <PerformanceGauge isAr={isAr} />
        </AnimatedItem>
      </AnimatedGrid>

      {/* 12 + 13 + 14 */}
      <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatedItem><RecentInquiries isAr={isAr} items={stats?.recentInquiries} /></AnimatedItem>
        <AnimatedItem><TopAgents isAr={isAr} /></AnimatedItem>
        <AnimatedItem><TopCountries isAr={isAr} /></AnimatedItem>
      </AnimatedGrid>

      {/* 15-18 */}
      <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AnimatedItem><ActivityTimeline isAr={isAr} /></AnimatedItem>
        <AnimatedItem><QuickActions isAr={isAr} /></AnimatedItem>
        <AnimatedItem><TasksWidget isAr={isAr} /></AnimatedItem>
        <AnimatedItem><NotificationsCenter isAr={isAr} /></AnimatedItem>
      </AnimatedGrid>

      {/* 19-22 */}
      <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AnimatedItem><MiniCalendar isAr={isAr} /></AnimatedItem>
        <AnimatedItem><StorageWidget isAr={isAr} /></AnimatedItem>
        <AnimatedItem><SecurityWidget isAr={isAr} /></AnimatedItem>
        <AnimatedItem><ConversionFunnel isAr={isAr} /></AnimatedItem>
      </AnimatedGrid>

      {/* 23-25 */}
      <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatedItem><PropertySpotlight isAr={isAr} /></AnimatedItem>
        <AnimatedItem><LiveVisitors isAr={isAr} /></AnimatedItem>
        <AnimatedItem><InsightsCard isAr={isAr} /></AnimatedItem>
      </AnimatedGrid>
    </div>
  );
}
