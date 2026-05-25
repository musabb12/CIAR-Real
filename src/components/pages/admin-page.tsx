'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { ADMIN_NAV, type AdminTabId } from '@/components/admin/admin-nav';
import {
  PropertiesTab,
  FeaturedTab,
  LocationsTab,
  UsersTab,
  AgentsTab,
  CompaniesTab,
  InquiriesTab,
  ReviewsTab,
  FavoritesTab,
  BannersTab,
  NewsTab,
  FeaturesTab,
  ContentManagerTab,
  SiteConfigTab,
  AnalyticsTab,
  SettingsTab,
} from '@/components/admin/admin-tabs-content';

interface AdminStats {
  totals?: {
    properties: number;
    users: number;
    agents: number;
    inquiries: number;
    views: number;
    featuredProperties: number;
  };
  recentInquiries?: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string;
    status: string;
  }>;
}

export function AdminPage() {
  const router = useRouter();
  const { rtl } = useTranslation();
  const { currentUser, isAuthenticated, logout, setCurrentPage, locale, setLocale } = useAppStore();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const isAr = rtl;
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  const isAdmin = isAuthenticated && currentUser?.role === 'ADMIN';

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // Ignore network issues and still clear local auth state.
    } finally {
      logout();
      router.push('/');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/admin/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, [isAdmin]);

  // Top bar title (declared before any early return to keep hook order stable)
  const activeNav = useMemo(
    () => ADMIN_NAV.find((n) => n.id === activeTab) ?? ADMIN_NAV[0],
    [activeTab],
  );

  const tabSubtitle = useMemo(() => {
    const map: Partial<Record<AdminTabId, { ar: string; en: string }>> = {
      dashboard: { ar: 'ملخص سريع', en: 'Quick overview' },
      properties: { ar: 'إدارة العقارات', en: 'Manage listings' },
      featured: { ar: 'عقارات الصفحة الرئيسية', en: 'Homepage featured' },
      locations: { ar: 'الدول والمدن', en: 'Countries & cities' },
      users: { ar: 'حسابات المستخدمين', en: 'User accounts' },
      agents: { ar: 'الوكلاء', en: 'Agents' },
      companies: { ar: 'الشركات', en: 'Companies' },
      inquiries: { ar: 'رسائل العملاء', en: 'Messages' },
      reviews: { ar: 'التقييمات', en: 'Reviews' },
      favorites: { ar: 'المفضلة', en: 'Favorites' },
      banners: { ar: 'بنرات الموقع', en: 'Banners' },
      news: { ar: 'الأخبار', en: 'News' },
      features: { ar: 'تشغيل الميزات', en: 'Features' },
      'content-manager': { ar: 'نصوص الصفحات', en: 'Page content' },
      'site-config': { ar: 'إعدادات الموقع', en: 'Site settings' },
      analytics: { ar: 'التقارير', en: 'Reports' },
      settings: { ar: 'إعدادات اللوحة', en: 'Admin settings' },
    };
    return map[activeTab];
  }, [activeTab]);

  // ── Access gate ──
  if (!isAdmin) {
    return (
      <div className="admin-shell flex items-center justify-center p-6">
        <div className="relative max-w-md w-full text-center">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="h-10 w-10 text-rose-400" />
            </div>
            <div className="inline-flex items-center gap-1.5 admin-pill admin-pill-down mb-4">
              <Lock className="h-3 w-3" />
              {tx('وصول مقيّد', 'Restricted Access')}
            </div>
            <h2 className="font-heading text-3xl font-bold mb-3 bg-gradient-to-r from-[#f5c97b] to-[#2dd4bf] bg-clip-text text-transparent">
              {tx('هذه المنطقة سرّية', 'This area is private')}
            </h2>
            <p className="text-[var(--admin-text-mute)] mb-6 leading-relaxed">
              {tx(
                'لوحة الإدارة محمية بالكامل ومخصّصة للمديرين المعتمدين فقط. الرجاء تسجيل الدخول بصلاحيات إدارية.',
                'The admin portal is fully protected and reserved for authorized administrators only.',
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="rounded-xl h-11 px-6 bg-gradient-to-r from-[#f5c97b] to-[#2dd4bf] text-[#0a1018] font-bold hover:brightness-110 border-0"
              >
                <a href="/admin">
                  {tx('تسجيل دخول الأدمن', 'Admin sign-in')}
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="rounded-xl h-11 px-6 bg-white/5 border-white/10 text-[var(--admin-text)] hover:bg-white/10"
              >
                {tx('العودة للرئيسية', 'Back home')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userName = currentUser?.name ?? 'Admin';

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <AdminDashboard
            isAr={isAr}
            stats={stats}
            userName={userName}
            onOpenProperties={() => setActiveTab('properties')}
            onOpenAnalytics={() => setActiveTab('analytics')}
            onOpenInsights={() => setActiveTab('site-config')}
          />
        );
      case 'properties':
        return <PropertiesTab isAr={isAr} />;
      case 'featured':
        return <FeaturedTab isAr={isAr} />;
      case 'locations':
        return <LocationsTab isAr={isAr} />;
      case 'users':
        return <UsersTab isAr={isAr} />;
      case 'agents':
        return <AgentsTab isAr={isAr} />;
      case 'companies':
        return <CompaniesTab isAr={isAr} />;
      case 'inquiries':
        return <InquiriesTab isAr={isAr} />;
      case 'reviews':
        return <ReviewsTab isAr={isAr} />;
      case 'favorites':
        return <FavoritesTab isAr={isAr} />;
      case 'banners':
        return <BannersTab isAr={isAr} />;
      case 'news':
        return <NewsTab isAr={isAr} />;
      case 'features':
        return <FeaturesTab isAr={isAr} />;
      case 'content-manager':
        return <ContentManagerTab isAr={isAr} />;
      case 'site-config':
        return <SiteConfigTab isAr={isAr} />;
      case 'analytics':
        return <AnalyticsTab isAr={isAr} />;
      case 'settings':
        return <SettingsTab isAr={isAr} />;
      default:
        return (
          <AdminDashboard
            isAr={isAr}
            stats={stats}
            userName={userName}
            onOpenProperties={() => setActiveTab('properties')}
            onOpenAnalytics={() => setActiveTab('analytics')}
            onOpenInsights={() => setActiveTab('site-config')}
          />
        );
    }
  };

  return (
    <div className="admin-shell flex w-full min-h-screen">
      <div className="admin-ambient-layer" aria-hidden>
        <span className="admin-glass-orb admin-glass-orb--1" />
        <span className="admin-glass-orb admin-glass-orb--2" />
        <span className="admin-glass-orb admin-glass-orb--3" />
        <span className="admin-glass-orb admin-glass-orb--4" />
      </div>
      <AdminSidebar
        active={activeTab}
        onSelect={setActiveTab}
        isAr={isAr}
        collapsed={collapsed}
        userName={userName}
        onLogout={() => {
          void handleLogout();
        }}
      />
      <div className="flex flex-1 flex-col min-w-0 w-full relative z-10">
        <AdminTopbar
          isAr={isAr}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onToggleLocale={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          userName={userName}
          pageTitle={tx(activeNav.ar, activeNav.en)}
          pageSubtitle={tabSubtitle ? tx(tabSubtitle.ar, tabSubtitle.en) : undefined}
        />
        <main className="w-full flex-1 p-4 sm:p-5 lg:p-6 pb-12">{renderTab()}</main>
      </div>
    </div>
  );
}
