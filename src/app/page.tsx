'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
import { RegisterPage } from '@/components/pages/register-page';
import { LoginPage } from '@/components/pages/login-page';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { AIChatbot } from '@/components/feature/ai-chatbot';
import { PropertyComparison } from '@/components/feature/property-comparison';
import { useAppStore } from '@/store/app-store';
import { getLocaleDirection } from '@/lib/i18n';
import { Toaster } from 'sonner';
import { onInvalidate } from '@/lib/admin-events';

export default function Home() {
  const { currentPage, currentUser, isAuthenticated, setFavorites, setFeatures, locale, filters, setFilters } = useAppStore();
  const appliedGeoRef = useRef(false);
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

  // Load feature toggles from API + refresh when admin updates toggles
  useEffect(() => {
    if (!mounted) return;
    const loadFeatures = () => {
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
    };
    loadFeatures();
    return onInvalidate('features', loadFeatures);
  }, [setFeatures, mounted]);

  // Refresh favorites when admin removes a favorite row
  useEffect(() => {
    if (!mounted || !isAuthenticated || !currentUser) return;
    const loadFavs = () => {
      fetch(`/api/favorites?userId=${currentUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFavorites(data);
        })
        .catch(() => {});
    };
    return onInvalidate('favorites', loadFavs);
  }, [mounted, isAuthenticated, currentUser, setFavorites]);

  // Update document dir and lang for RTL support
  useEffect(() => {
    if (!mounted) return;
    const dir = getLocaleDirection(locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  // Auto-apply visitor country by IP once (without overriding manual choice).
  useEffect(() => {
    if (!mounted || appliedGeoRef.current) return;
    if (filters.countryId) {
      appliedGeoRef.current = true;
      return;
    }

    fetch('/api/geo-country')
      .then((res) => (res.ok ? res.json() : null))
      .then((geo) => {
        const code = String(geo?.countryCode ?? '').toUpperCase();
        if (!code) return null;
        return fetch('/api/locations')
          .then((res) => (res.ok ? res.json() : []))
          .then((countries) => {
            const list = Array.isArray(countries) ? countries : countries?.countries ?? [];
            const matched = list.find((c: { id: string; code?: string }) => String(c.code ?? '').toUpperCase() === code);
            if (matched) {
              setFilters({ countryId: matched.id, page: 1, limit: 30 });
            }
          });
      })
      .catch(() => {})
      .finally(() => {
        appliedGeoRef.current = true;
      });
  }, [mounted, filters.countryId, setFilters]);

  // Support legacy hash-style admin URLs by forwarding to real Next.js routes.
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const hashPath = window.location.hash.replace(/^#/, '');
    if (hashPath === '/admin' || hashPath === '/admin/' || hashPath === '/admin/login' || hashPath === '/admin/login/') {
      window.location.replace('/admin');
      return;
    }
    if (hashPath === '/admin/dashboard' || hashPath === '/admin/dashboard/') {
      window.location.replace('/admin/dashboard');
    }
  }, [mounted]);

  // Keep virtual page navigation consistent by resetting scroll position.
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentPage, mounted]);

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
      case 'register':
        return <RegisterPage />;
      case 'login':
        return <LoginPage />;
      default:
        return <HomePage />;
    }
  };

  // Pages with their own full-screen layout (no header/footer)
  const isStandalonePage =
    currentPage === 'admin' ||
    currentPage === 'admin-login' ||
    currentPage === 'register' ||
    currentPage === 'login';

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
      {!isStandalonePage && <Header />}
      {!isStandalonePage && <NewsTicker />}
      <main className={isStandalonePage ? '' : 'flex-1'}>
        {renderPage()}
      </main>
      {!isStandalonePage && <Footer />}
      {currentPage !== 'admin' && <AIChatbot />}
      {currentPage !== 'admin' && <PropertyComparison />}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
