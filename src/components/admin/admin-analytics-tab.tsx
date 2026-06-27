'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Loader2, TrendingUp, Users, Building2, MessageSquare } from 'lucide-react';
import { formatNumberEn } from '@/lib/format-numbers';

const COLORS = ['#f5c97b', '#2dd4bf', '#a78bfa', '#fb7185', '#60a5fa', '#fbbf24'];

interface StatsPayload {
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
}

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

export function AdminAnalyticsTab({ isAr }: { isAr: boolean }) {
  const [data, setData] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) throw new Error(d.error);
        setData(d);
        setErr(null);
      })
      .catch((e: unknown) =>
        setErr(
          e instanceof Error
            ? e.message
            : tx(isAr, 'تعذّر تحميل التقارير', 'Could not load reports'),
        ),
      )
      .finally(() => setLoading(false));
  }, [isAr, reloadKey]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f5c97b]" />
      </div>
    );
  }

  if (err || !data) {
    const friendly = err?.includes('Failed to fetch admin stats')
      ? tx(
          isAr,
          'تعذّر جلب الإحصائيات من قاعدة البيانات. قد تكون الحصة مؤقتاً ممتلئة — جرّب إعادة التحميل.',
          'Could not load stats from the database. Quota may be temporarily exceeded — try reloading.',
        )
      : (err ?? tx(isAr, 'لا توجد بيانات', 'No data'));

    return (
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tx(isAr, 'التقارير', 'Reports')}</h1>
        </div>
        <div className="admin-card p-8 text-center space-y-4">
          <p className="text-rose-300 text-sm">{friendly}</p>
          <button
            type="button"
            className="admin-btn-premium !text-sm mx-auto"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            {tx(isAr, 'إعادة المحاولة', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  const t = data.totals;
  const propChart = (data.propertiesByType ?? []).map((p) => ({
    name: p.type,
    value: p.count,
  }));
  const inqChart = (data.inquiriesByStatus ?? []).map((p) => ({
    name: p.status,
    count: p.count,
  }));

  const summary = [
    {
      icon: Building2,
      label: tx(isAr, 'العقارات', 'Properties'),
      value: t?.properties ?? 0,
      color: '#f5c97b',
    },
    {
      icon: Users,
      label: tx(isAr, 'المستخدمون', 'Users'),
      value: t?.users ?? 0,
      color: '#2dd4bf',
    },
    {
      icon: MessageSquare,
      label: tx(isAr, 'الاستفسارات', 'Inquiries'),
      value: t?.inquiries ?? 0,
      color: '#a78bfa',
    },
    {
      icon: TrendingUp,
      label: tx(isAr, 'المشاهدات', 'Views'),
      value: t?.views ?? 0,
      color: '#60a5fa',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tx(isAr, 'التقارير', 'Reports')}</h1>
        <p className="text-sm text-[var(--admin-text-mute)] mt-1">
          {tx(isAr, 'ملخص الأداء والتوزيع حسب النوع والحالة', 'Performance overview by type and status')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="admin-card p-5 flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}22`, color: s.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-[var(--admin-text-mute)] uppercase tracking-wider">{s.label}</div>
                <div className="text-2xl font-bold tabular-nums">{formatNumberEn(s.value)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="admin-card p-5">
          <h3 className="font-heading text-base font-bold mb-4">{tx(isAr, 'العقارات حسب النوع', 'Properties by type')}</h3>
          <div className="h-72">
            {propChart.length === 0 ? (
              <p className="text-sm text-[var(--admin-text-faint)] text-center py-12">{tx(isAr, 'لا بيانات', 'No data')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={propChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>
                    {propChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(13,20,29,0.95)',
                      border: '1px solid rgba(245,201,123,0.2)',
                      borderRadius: 10,
                      color: '#eef3f9',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-card p-5">
          <h3 className="font-heading text-base font-bold mb-4">{tx(isAr, 'الاستفسارات حسب الحالة', 'Inquiries by status')}</h3>
          <div className="h-72">
            {inqChart.length === 0 ? (
              <p className="text-sm text-[var(--admin-text-faint)] text-center py-12">{tx(isAr, 'لا بيانات', 'No data')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inqChart}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f5c97b" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(238,243,249,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(238,243,249,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(13,20,29,0.95)',
                      border: '1px solid rgba(245,201,123,0.2)',
                      borderRadius: 10,
                      color: '#eef3f9',
                    }}
                  />
                  <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
