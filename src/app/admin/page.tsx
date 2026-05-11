'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { AdminToaster } from '@/components/admin/admin-toaster';
import { AdminLoginPage } from '@/components/pages/admin-login-page';
import { useAppStore } from '@/store/app-store';
import { getLocaleDirection } from '@/lib/i18n';

/**
 * Real Next.js route at `/admin`. This is now the admin sign-in page.
 */
export default function AdminRoute() {
  const router = useRouter();
  const { currentUser, locale, setCurrentPage } = useAppStore();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted) return;
    setCurrentPage('admin-login');
  }, [mounted, setCurrentPage]);

  useEffect(() => {
    if (!mounted) return;
    const dir = getLocaleDirection(locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [mounted, locale]);

  useEffect(() => {
    if (!mounted) return;
    if (currentUser?.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    }
  }, [mounted, currentUser, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <AdminLoginPage />
      <AdminToaster />
    </>
  );
}
