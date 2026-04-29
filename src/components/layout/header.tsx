'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
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
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import type { AppPage } from '@/types';
import { useTranslation } from '@/lib/i18n/use-translation';
import { locales, type Locale } from '@/lib/i18n';

// ============================================================
// Navigation Configuration
// ============================================================

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

// ============================================================
// Notification count (visual only)
// ============================================================

const NOTIFICATION_COUNT = 3;

// ============================================================
// Header Component
// ============================================================

export function Header() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // ---- Scroll state ----
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // ---- UI state ----
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  // ---- Store & i18n ----
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

  // ============================================================
  // Scroll listener
  // ============================================================

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    setScrolled(scrollTop > 20);

    if (docHeight > 0) {
      setScrollProgress(Math.min((scrollTop / docHeight) * 100, 100));
    }
  }, []);

  // Attach scroll listener on mount
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Defer initial read to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      handleScroll();
    });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [handleScroll]);

  // ============================================================
  // Click outside to close dropdowns
  // ============================================================

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

  // ============================================================
  // Lock body scroll when mobile menu is open
  // ============================================================

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // ============================================================
  // Handlers
  // ============================================================

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

  // ============================================================
  // Derive header styles based on scroll state
  // ============================================================

  const isDark = theme === 'dark';
  const headerBg = scrolled
    ? isDark
      ? 'bg-gray-950/80 border-b border-white/5'
      : 'bg-white/80 border-b border-gray-200/50'
    : 'bg-transparent border-b border-transparent';
  const headerShadow = scrolled
    ? 'shadow-[0_4px_30px_rgba(0,0,0,0.08)]'
    : 'shadow-none';
  const logoColor = scrolled ? '' : isDark ? 'text-white' : 'text-gray-900';
  const navTextColor = scrolled ? '' : isDark ? 'text-white/70' : 'text-gray-700';
  const navActiveBg = scrolled
    ? 'bg-primary/10 text-primary'
    : isDark
      ? 'bg-white/10 text-white'
      : 'bg-black/10 text-gray-900';
  const searchBg = scrolled
    ? isDark
      ? 'bg-gray-800/60 border-white/10 text-white placeholder:text-gray-400 focus:border-amber-500/50'
      : 'bg-gray-100/80 border-gray-200/50 text-gray-900 placeholder:text-gray-400 focus:border-amber-500/50'
    : isDark
      ? 'bg-white/10 border-white/10 text-white placeholder:text-white/50 focus:border-white/30'
      : 'bg-white/20 border-white/20 text-gray-900 placeholder:text-gray-500 focus:border-white/40';

  // ============================================================
  // Render
  // ============================================================

  return (
    <>
      {/* ============================================================ */}
      {/* Scroll Progress Indicator                                      */}
      {/* ============================================================ */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400"
          style={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>

      {/* ============================================================ */}
      {/* Header                                                        */}
      {/* ============================================================ */}
      <header
        dir={rtl ? 'rtl' : 'ltr'}
        className={`sticky top-0 z-50 w-full transition-all duration-500 ease-out ${headerBg} ${headerShadow} backdrop-blur-xl`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ---- Logo ---- */}
          <button
            onClick={() => handleNavClick('home')}
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 shadow-lg shadow-amber-500/20 transition-shadow duration-300 group-hover:shadow-amber-500/40">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className={`bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 bg-clip-text text-transparent text-xl font-bold tracking-tight`}>
              CIAR
            </span>
          </button>

          {/* ---- Desktop Navigation ---- */}
          <nav className="hidden items-center gap-1 md:flex">
            {navConfig.map((item) => {
              if (item.showAdmin && !isAuthenticated) return null;
              const isActive =
                currentPage === item.page ||
                (item.page === 'search' && currentPage === 'property-detail');
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`nav-link relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? navActiveBg : `${navTextColor} hover:bg-black/5 dark:hover:bg-white/5`
                  }`}
                >
                  {item.icon}
                  {t.nav[item.labelKey]}
                  {item.page === 'favorites' && favoritePropertyIds.size > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 px-1.5 text-xs font-semibold text-white">
                      {favoritePropertyIds.size}
                    </span>
                  )}
                  {/* Animated underline */}
                  <motion.span
                    className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                    animate={{
                      width: isActive ? '60%' : '0%',
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                </button>
              );
            })}
          </nav>

          {/* ---- Right Side Actions ---- */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search
                  className={`absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 ${scrolled ? 'text-muted-foreground' : isDark ? 'text-white/50' : 'text-gray-400'}`}
                />
                <input
                  type="text"
                  placeholder={t.hero.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`h-9 w-48 rounded-xl border px-9 text-sm outline-none transition-all duration-300 focus:w-64 focus:ring-2 focus:ring-amber-500/20 ${searchBg}`}
                />
              </div>
            </form>

            {/* ---- Notification Bell ---- */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full"
            >
              <Bell className={`h-4 w-4 ${scrolled ? '' : isDark ? 'text-white/70' : 'text-gray-600'}`} />
              {NOTIFICATION_COUNT > 0 && (
                <span className="absolute -top-0.5 end-0.5 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1 text-[10px] font-bold leading-none text-white shadow-lg shadow-rose-500/30">
                  {NOTIFICATION_COUNT}
                </span>
              )}
            </Button>

            {/* ---- Language Switcher ---- */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangMenuOpen(!langMenuOpen);
                }}
                className="h-9 w-9 text-lg rounded-full"
              >
                {locales.find((l) => l.code === locale)?.flag}
              </Button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute end-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-gray-200/50 bg-white/90 p-1 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/90"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {locales.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLocale(l.code as Locale);
                          setLangMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          l.code === locale
                            ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 font-medium'
                            : 'hover:bg-gray-100/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="text-lg">{l.flag}</span>
                        <span className="flex-1 text-start">{l.name}</span>
                        {l.code === locale && (
                          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ---- Theme Toggle ---- */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative h-9 w-9 rounded-full overflow-hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <Sun className="h-4 w-4 text-amber-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <Moon className={`h-4 w-4 ${scrolled ? 'text-gray-600' : 'text-gray-500'}`} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            )}

            {/* ---- User Menu / Login ---- */}
            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="h-9 w-9 rounded-full"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-emerald-500 text-xs font-bold text-white">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </Button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute end-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-gray-200/50 bg-white/90 p-1 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/90"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="border-b border-gray-100 px-3 py-3 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-emerald-500 text-sm font-bold text-white">
                            {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-semibold">{currentUser?.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {currentUser?.email}
                            </p>
                          </div>
                        </div>
                        <span className="mt-2 inline-block rounded-full bg-gradient-to-r from-amber-500/10 to-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          {currentUser?.role}
                        </span>
                      </div>
                      {currentUser?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleNavClick('admin')}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-100/80 dark:hover:bg-white/5"
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          {t.admin.dashboard}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-500 transition-colors hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        {t.nav.signOut}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                onClick={() => setShowLoginDialog(true)}
                className="hidden h-9 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:brightness-110 md:flex"
                size="sm"
              >
                <LogIn className="me-1.5 h-4 w-4" />
                {t.nav.signIn}
              </Button>
            )}

            {/* ---- Mobile Menu Toggle ---- */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`relative h-9 w-9 rounded-full md:hidden ${scrolled ? '' : isDark ? 'text-white' : 'text-gray-900'}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* Mobile Menu - Full Screen Overlay                              */}
      {/* ============================================================ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col bg-white/95 backdrop-blur-2xl dark:bg-gray-950/95 md:hidden"
          >
            {/* Mobile Menu Header */}
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center gap-2.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 shadow-lg shadow-amber-500/20">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 bg-clip-text text-transparent text-xl font-bold tracking-tight">
                  CIAR
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 w-9 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Search */}
            <div className="px-4 pt-4 sm:px-6">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.hero.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200/50 bg-gray-100/60 ps-9 pe-4 text-sm outline-none transition-all focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </form>
            </div>

            {/* Mobile Nav Items */}
            <nav className="flex-1 overflow-y-auto px-4 pt-6 sm:px-6">
              <div className="space-y-1">
                {navConfig.map((item, index) => {
                  if (item.showAdmin && !isAuthenticated) return null;
                  const isActive =
                    currentPage === item.page ||
                    (item.page === 'search' && currentPage === 'property-detail');
                  return (
                    <motion.button
                      key={item.page}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleNavClick(item.page)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 text-amber-700 dark:text-amber-400'
                          : 'text-gray-600 hover:bg-gray-100/60 dark:text-gray-300 dark:hover:bg-white/5'
                      }`}
                    >
                      <span
                        className={
                          isActive
                            ? 'text-amber-500'
                            : 'text-gray-400 dark:text-gray-500'
                        }
                      >
                        {item.icon}
                      </span>
                      {t.nav[item.labelKey]}
                      {item.page === 'favorites' && favoritePropertyIds.size > 0 && (
                        <span className="ms-auto flex h-5.5 min-w-[22px] items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 px-1.5 text-xs font-semibold text-white">
                          {favoritePropertyIds.size}
                        </span>
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="mobile-active-indicator"
                          className="ms-auto h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Menu Footer */}
            <div className="border-t border-gray-200/50 px-4 py-4 dark:border-white/5 sm:px-6">
              {!isAuthenticated ? (
                <Button
                  onClick={() => {
                    setShowLoginDialog(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-white shadow-lg shadow-amber-500/25"
                >
                  <LogIn className="me-2 h-4 w-4" />
                  {t.nav.signIn}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-emerald-500 text-sm font-bold text-white">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold">{currentUser?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {currentUser?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="h-9 w-9 rounded-full text-rose-500 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* Login Dialog - Glassmorphism Style                             */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showLoginDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowLoginDialog(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md dark:bg-gray-950/70" />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-0 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-gray-900/80"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {t.auth.signIn}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t.auth.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLoginDialog(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.auth.email}
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@propertyfinder.com"
                      required
                      className="h-11 w-full rounded-xl border border-gray-200/60 bg-gray-50/50 px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10"
                    />
                  </div>

                  <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-3 dark:border-amber-500/10 dark:bg-amber-500/5">
                    <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400/80">
                      <span className="font-medium">Demo accounts:</span>
                      <br />
                      <span className="mt-1 block">
                        • admin@propertyfinder.com (Admin)
                      </span>
                      <span className="block">
                        • john.doe@email.com (User)
                      </span>
                      <span className="block">
                        • agent1@luxuryestates.com (Agent)
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl border-gray-200/60 transition-all hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
                      onClick={() => setShowLoginDialog(false)}
                    >
                      {t.admin.cancel}
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:brightness-110"
                    >
                      {t.auth.signIn}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
