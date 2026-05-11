'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { AdminToaster } from '@/components/admin/admin-toaster';
import { AdminPage } from '@/components/pages/admin-page';
import { useAppStore } from '@/store/app-store';
import { getLocaleDirection } from '@/lib/i18n';

/**
 * Real Next.js route at `/admin/dashboard`. Gates non-admins to `/admin`.
 */
export default function AdminDashboardRoute() {
  const router = useRouter();
  const { currentUser, locale, setCurrentPage } = useAppStore();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted) return;
    setCurrentPage('admin');
  }, [mounted, setCurrentPage]);

  useEffect(() => {
    if (!mounted) return;
    const dir = getLocaleDirection(locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [mounted, locale]);

  useEffect(() => {
    if (!mounted) return;
    if (!currentUser || currentUser.role !== 'ADMIN') {
      router.replace('/admin');
    }
  }, [mounted, currentUser, router]);

  if (!mounted || !currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <AdminPage />
      <AdminToaster />
    </>
  );
}
