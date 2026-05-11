'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAppStore } from '@/store/app-store';
import { getLocaleDirection } from '@/lib/i18n';

/**
 * Backward-compatible alias route at `/admin/login`.
 * Redirects visitors to the canonical `/admin` sign-in route.
 */
export default function AdminLoginRoute() {
  const { locale, setCurrentPage } = useAppStore();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Keep store in sync so the SPA-style logic (admin tabs, etc.) still works.
  useEffect(() => {
    if (!mounted) return;
    setCurrentPage('admin-login');
  }, [mounted, setCurrentPage]);

  // Mirror RTL direction from the user's locale preference.
  useEffect(() => {
    if (!mounted) return;
    const dir = getLocaleDirection(locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [mounted, locale]);

  useEffect(() => {
    if (!mounted) return;
    window.location.replace('/admin');
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return null;
}
