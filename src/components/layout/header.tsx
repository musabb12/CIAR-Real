'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  Heart,
  Users,
  LayoutDashboard,
  Menu,
  X,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import type { AppPage } from '@/types';
import { useTranslation } from '@/lib/i18n/use-translation';
import { locales, type Locale } from '@/lib/i18n';

const navConfig: {
  page: AppPage;
  labelKey: 'home' | 'properties' | 'agents' | 'favorites' | 'admin';
  icon: React.ReactNode;
  showAdmin?: boolean;
}[] = [
  { page: 'home', labelKey: 'home', icon: <Building2 className="h-4 w-4" /> },
  { page: 'search', labelKey: 'properties', icon: <Search className="h-4 w-4" /> },
  { page: 'agents', labelKey: 'agents', icon: <Users className="h-4 w-4" /> },
  { page: 'favorites', labelKey: 'favorites', icon: <Heart className="h-4 w-4" /> },
  { page: 'admin', labelKey: 'admin', icon: <LayoutDashboard className="h-4 w-4" />, showAdmin: true },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  const { t, locale, rtl, setLocale } = useTranslation();

  const {
    currentPage,
    setCurrentPage,
    currentUser,
    isAuthenticated,
    login,
    logout,
    searchQuery,
    setSearchQuery,
    favoritePropertyIds,
  } = useAppStore();

  useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
      setLangMenuOpen(false);
    };
    if (userMenuOpen || langMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen, langMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage('search');
    setMobileMenuOpen(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: 'any' }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user);
        setShowLoginDialog(false);
        setLoginEmail('');
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleNavClick = (page: AppPage) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <>
      <header dir={rtl ? 'rtl' : 'ltr'} className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Building2 className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              Property<span className="text-primary">Finder</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navConfig.map((item) => {
              if (item.showAdmin && !isAuthenticated) return null;
              const isActive = currentPage === item.page || (item.page === 'search' && currentPage === 'property-detail');
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {item.icon}
                  {t.nav[item.labelKey]}
                  {item.page === 'favorites' && favoritePropertyIds.size > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                      {favoritePropertyIds.size}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t.hero.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-56 rounded-lg border bg-muted/50 ps-9 pe-3 text-sm outline-none transition-all focus:w-72 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </form>

            {/* Language Switcher */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); setLangMenuOpen(!langMenuOpen); }}
                className="h-9 w-9 text-lg"
              >
                {locales.find((l) => l.code === locale)?.flag}
              </Button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute end-0 top-full mt-1 w-40 rounded-lg border bg-popover p-1 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {locales.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLocale(l.code as Locale);
                          setLangMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span>{l.flag}</span>
                        <span>{l.name}</span>
                        {l.code === locale && (
                          <span className="ms-auto text-primary">✓</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                  className="h-9 w-9"
                >
                  <User className="h-4 w-4" />
                </Button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute end-0 top-full mt-1 w-56 rounded-lg border bg-popover p-1 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="border-b px-3 py-2">
                        <p className="text-sm font-medium">{currentUser?.name}</p>
                        <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {currentUser?.role}
                        </span>
                      </div>
                      {currentUser?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleNavClick('admin')}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                        >
                          <LayoutDashboard className="h-4 w-4" /> {t.admin.dashboard}
                        </button>
                      )}
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
                      >
                        <LogOut className="h-4 w-4" /> {t.nav.signOut}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowLoginDialog(true)}
                className="hidden h-9 md:flex"
              >
                <LogIn className="me-1.5 h-4 w-4" /> {t.nav.signIn}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t bg-background md:hidden"
            >
              <div className="space-y-1 px-4 py-3">
                <form onSubmit={handleSearch} className="mb-3">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t.hero.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 w-full rounded-lg border bg-muted/50 ps-9 pe-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </form>
                {navConfig.map((item) => {
                  if (item.showAdmin && !isAuthenticated) return null;
                  const isActive = currentPage === item.page;
                  return (
                    <button
                      key={item.page}
                      onClick={() => handleNavClick(item.page)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {item.icon}
                      {t.nav[item.labelKey]}
                    </button>
                  );
                })}
                {!isAuthenticated && (
                  <Button
                    variant="default"
                    className="mt-2 w-full"
                    onClick={() => { setShowLoginDialog(true); setMobileMenuOpen(false); }}
                  >
                    <LogIn className="me-2 h-4 w-4" /> {t.nav.signIn}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Login Dialog */}
      <AnimatePresence>
        {showLoginDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLoginDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-4 w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold">{t.auth.signIn}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.auth.subtitle}</p>
              <form onSubmit={handleLogin} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">{t.auth.email}</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@propertyfinder.com"
                    required
                    className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.auth.demoAccounts}: admin@propertyfinder.com (Admin), john.doe@email.com (User), agent1@luxuryestates.com (Agent)
                </p>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowLoginDialog(false)}>
                    {t.admin.cancel}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {t.auth.signIn}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
