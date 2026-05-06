'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { NewsTicker } from '@/components/layout/news-ticker';
import { HomePage } from '@/components/pages/home-page';
import { SearchPage } from '@/components/pages/search-page';
import { PropertyDetailPage } from '@/components/pages/property-detail-page';
import { AgentsPage } from '@/components/pages/agents-page';
import { FavoritesPage } from '@/components/pages/favorites-page';
import { AdminPage } from '@/components/pages/admin-page';
import { AdminLoginPage } from '@/components/pages/admin-login-page';
import { ContactPage } from '@/components/pages/contact-page';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { AIChatbot } from '@/components/feature/ai-chatbot';
import { PropertyComparison } from '@/components/feature/property-comparison';
import { useAppStore } from '@/store/app-store';
import { getLocaleDirection } from '@/lib/i18n';
import { Toaster } from 'sonner';

export default function Home() {
  const { currentPage, currentUser, isAuthenticated, setFavorites, setFeatures, locale } = useAppStore();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Load favorites when user logs in
  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated && currentUser) {
      fetch(`/api/favorites?userId=${currentUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFavorites(data);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, currentUser, setFavorites, mounted]);

  // Load feature toggles from API
  useEffect(() => {
    if (!mounted) return;
    fetch('/api/features')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const featureMap: Record<string, boolean> = {};
          data.forEach((f: { key: string; isEnabled: boolean }) => {
            featureMap[f.key] = f.isEnabled;
          });
          setFeatures(featureMap);
        }
      })
      .catch(() => {});
  }, [setFeatures, mounted]);

  // Update document dir and lang for RTL support
  useEffect(() => {
    if (!mounted) return;
    const dir = getLocaleDirection(locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'search':
        return <SearchPage />;
      case 'property-detail':
        return <PropertyDetailPage />;
      case 'agents':
        return <AgentsPage />;
      case 'contact':
        return <ContactPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'admin':
        return <AdminPage />;
      case 'admin-login':
        return <AdminLoginPage />;
      default:
        return <HomePage />;
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      {currentPage !== 'admin-login' && <Header />}
      {currentPage !== 'admin-login' && <NewsTicker />}
      <main className="flex-1">
        {renderPage()}
      </main>
      {currentPage !== 'admin-login' && <Footer />}
      <AIChatbot />
      <PropertyComparison />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
