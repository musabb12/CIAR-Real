'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HomePage } from '@/components/pages/home-page';
import { SearchPage } from '@/components/pages/search-page';
import { PropertyDetailPage } from '@/components/pages/property-detail-page';
import { AgentsPage } from '@/components/pages/agents-page';
import { FavoritesPage } from '@/components/pages/favorites-page';
import { AdminPage } from '@/components/pages/admin-page';
import { useAppStore } from '@/store/app-store';
import { Toaster } from 'sonner';

export default function Home() {
  const { currentPage, currentUser, isAuthenticated, setFavorites } = useAppStore();

  // Load favorites when user logs in
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetch(`/api/favorites?userId=${currentUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFavorites(data);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, currentUser, setFavorites]);

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
      case 'favorites':
        return <FavoritesPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
