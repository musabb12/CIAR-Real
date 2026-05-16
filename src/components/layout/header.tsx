'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
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
  Globe,
  Shield,
  ChevronDown,
  UserPlus,
  Phone,
  Lock,
  Loader2,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';
import type { AppPage } from '@/types';
import { useTranslation } from '@/lib/i18n/use-translation';
import { locales, type Locale } from '@/lib/i18n';

// ============================================================
// Navigation Configuration
// ============================================================

const navConfig: {
  page: AppPage;
  labelKey: 'home' | 'properties' | 'agents' | 'contact' | 'favorites' | 'admin';
  icon: React.ReactNode;
  showAdmin?: boolean;
}[] = [
  { page: 'home', labelKey: 'home', icon: <Building2 className="h-4 w-4" /> },
  { page: 'search', labelKey: 'properties', icon: <Search className="h-4 w-4" /> },
  { page: 'agents', labelKey: 'agents', icon: <Users className="h-4 w-4" /> },
  { page: 'contact', labelKey: 'contact', icon: <MessageSquare className="h-4 w-4" /> },
  { page: 'favorites', labelKey: 'favorites', icon: <Heart className="h-4 w-4" /> },
];

// ============================================================
// Notification count (visual only)
// ============================================================

const NOTIFICATION_COUNT = 3;

// ============================================================
// Demo accounts for login hint
// ============================================================

const demoAccounts = [
  { email: 'admin@realtyhub.com', role: 'Admin', icon: <Shield className="h-3.5 w-3.5" /> },
  { email: 'john.doe@example.com', role: 'User', icon: <User className="h-3.5 w-3.5" /> },
  { email: 'sarah.johnson@globalrealty.com', role: 'Agent', icon: <Building2 className="h-3.5 w-3.5" /> },
];

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
  const [loginPassword, setLoginPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const registerFormRef = useRef(registerForm);
  registerFormRef.current = registerForm;

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

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = registerFormRef.current;
    setRegisterError('');
    setRegisterSuccess(false);
    setRegisterLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegisterSuccess(true);
        setRegisterForm({ name: '', email: '', password: '', phone: '' });
        setTimeout(() => {
          login(data.user);
          setShowLoginDialog(false);
          setRegisterSuccess(false);
        }, 1200);
      } else {
        setRegisterError(data.error || 'Registration failed');
      }
    } catch {
      setRegisterError('Network error. Please check your connection and try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user);
        setShowLoginDialog(false);
        setLoginEmail('');
        setLoginPassword('');
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

  const handleLogout = async (options?: { closeMenus?: boolean }) => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // Ignore network issues; still clear local auth state.
    } finally {
      logout();
      if (options?.closeMenus) {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
  };

  // ============================================================
  // Derive header styles based on scroll state
  // ============================================================

  const isDark = theme === 'dark';

  const headerShadow = scrolled
    ? 'shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_8px_40px_rgba(0,0,0,0.06)]'
    : 'shadow-none';

  const navTextColor = scrolled
    ? ''
    : isDark
      ? 'text-white/70'
      : 'text-gray-600';

  const searchBg = scrolled
    ? isDark
      ? 'bg-gray-800/60 border-white/10 text-white placeholder:text-gray-400 focus:border-amber-500/50'
      : 'bg-gray-100/80 border-gray-200/50 text-gray-900 placeholder:text-gray-400 focus:border-amber-500/50'
    : isDark
      ? 'bg-white/10 border-white/10 text-white placeholder:text-white/50 focus:border-white/30'
      : 'bg-white/20 border-white/20 text-gray-900 placeholder:text-gray-500 focus:border-white/40';

  const currentLocaleName = locales.find((l) => l.code === locale)?.name || 'EN';

  // ============================================================
  // Render
  // ============================================================

  return (
    <>
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header
        dir={rtl ? 'rtl' : 'ltr'}
        className={`sticky top-0 z-50 w-full transition-all duration-500 ease-out glass-nav ${headerShadow}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ---- Logo ---- */}
          <button
            onClick={() => handleNavClick('home')}
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <img
              src="/logo-transparent.png"
              alt="CIAR"
              className="h-14 sm:h-16 lg:h-20 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
            />
          </button>

          {/* ---- Desktop Navigation ---- */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navConfig.map((item) => {
              if (item.showAdmin && currentUser?.role !== 'ADMIN') return null;
              const isActive =
                currentPage === item.page ||
                (item.page === 'search' && currentPage === 'property-detail');
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-amber-700 dark:text-amber-400'
                      : `${navTextColor} hover:text-gray-900 dark:hover:text-white`
                  }`}
                >
                  <span className={isActive ? 'text-amber-600 dark:text-amber-500' : ''}>
                    {item.icon}
                  </span>
                  <span>{t.nav[item.labelKey]}</span>
                  {item.page === 'favorites' && favoritePropertyIds.size > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 px-1 text-[10px] font-bold leading-none text-white">
                      {favoritePropertyIds.size}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ---- Right Side Actions ---- */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden lg:block">
              <div className="relative">
                <Search
                  className={`absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
                    scrolled ? 'text-muted-foreground' : isDark ? 'text-white/50' : 'text-gray-400'
                  }`}
                />
                <input
                  type="text"
                  placeholder={t.hero.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`h-8 w-44 rounded-lg border px-8 text-[13px] outline-none transition-all duration-300 focus:w-56 focus:ring-2 focus:ring-amber-500/20 ${searchBg}`}
                />
              </div>
            </form>

            {/* ---- Notification Bell ---- */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-full"
            >
              <Bell
                className={`h-4 w-4 ${
                  scrolled ? '' : isDark ? 'text-white/70' : 'text-gray-600'
                }`}
              />
              {NOTIFICATION_COUNT > 0 && (
                <span className="absolute -top-0.5 end-0.5 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm shadow-rose-500/30">
                  {NOTIFICATION_COUNT}
                </span>
              )}
            </Button>

            {/* ---- Language Switcher ---- */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangMenuOpen(!langMenuOpen);
                }}
                className="h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-medium"
              >
                <Globe
                  className={`h-3.5 w-3.5 ${
                    scrolled ? 'text-muted-foreground' : isDark ? 'text-white/70' : 'text-gray-500'
                  }`}
                />
                <span className={`hidden sm:inline ${
                    scrolled ? '' : isDark ? 'text-white/70' : 'text-gray-600'
                  }`}
                >
                  {currentLocaleName}
                </span>
              </Button>
              {langMenuOpen && (
                <div className="absolute end-0 top-full mt-2 w-44 overflow-hidden glass-deep rounded-xl p-1">
                  {locales.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLocale(l.code as Locale);
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                        l.code === locale
                          ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 font-semibold text-amber-700 dark:text-amber-400'
                          : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white'
                      }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          l.code === locale
                            ? 'bg-gradient-to-br from-amber-500 to-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                        }`}
                      >
                        {l.code}
                      </span>
                      <span className="flex-1 text-start">{l.name}</span>
                      {l.code === locale && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ---- Theme Toggle ---- */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative h-8 w-8 rounded-full overflow-hidden"
              >
                {theme === 'dark' ? (
                  <Sun className={`h-4 w-4 ${scrolled ? 'text-gray-500' : 'text-gray-500'}`} />
                ) : (
                  <Moon className={`h-4 w-4 ${scrolled ? 'text-gray-500' : 'text-gray-500'}`} />
                )}
              </Button>
            )}

            {/* ---- User Menu / Login / Register ---- */}
            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="h-8 w-8 rounded-full"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-emerald-600 text-[11px] font-bold tracking-wide text-white shadow-sm shadow-amber-500/20">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </Button>
                {userMenuOpen && (
                  <div className="absolute end-0 top-full mt-2 w-60 overflow-hidden glass-deep rounded-xl p-1">
                    <div className="border-b border-gray-100 px-3 py-3 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-emerald-600 text-sm font-bold text-white">
                          {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {currentUser?.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {currentUser?.email}
                          </p>
                        </div>
                      </div>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/10 to-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-700 dark:text-amber-400">
                        {currentUser?.role === 'ADMIN' && (
                          <Shield className="h-3 w-3" />
                        )}
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
                    {(currentUser?.role === 'OWNER' || currentUser?.role === 'COMPANY' || currentUser?.role === 'AGENT') && (
                      <button
                        onClick={() => handleNavClick('partner-dashboard')}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-100/80 dark:hover:bg-white/5"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        {rtl ? 'لوحة العقارات' : 'My properties'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        void handleLogout({ closeMenus: true });
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-500 transition-colors hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      {t.nav.signOut}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  onClick={() => handleNavClick('login')}
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-[13px] font-medium"
                >
                  <LogIn className="me-1.5 h-3.5 w-3.5" />
                  {t.nav.signIn}
                </Button>
                <Button
                  onClick={() => handleNavClick('register')}
                  className="h-8 rounded-lg bg-gradient-to-r from-amber-600 to-emerald-600 px-4 text-[13px] font-semibold tracking-wide text-white shadow-md shadow-amber-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 hover:brightness-105"
                  size="sm"
                >
                  <UserPlus className="me-1.5 h-3.5 w-3.5" />
                  {t.auth.signUp}
                </Button>
              </div>
            )}

            {/* ---- Mobile Menu Toggle ---- */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`relative h-8 w-8 rounded-full lg:hidden ${
                scrolled ? '' : isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Full Screen Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col glass-deep lg:hidden">
          {/* Mobile Menu Header */}
          <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4 sm:px-6 dark:border-white/5">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5"
            >
              <img
                src="/logo-transparent.png"
                alt="CIAR"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
              />
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="h-8 w-8 rounded-full"
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
                  className="h-11 w-full rounded-xl border border-gray-200/50 bg-gray-50/60 ps-9 pe-4 text-sm outline-none transition-all focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </form>
          </div>

          {/* Mobile Nav Items */}
          <nav className="flex-1 overflow-y-auto px-4 pt-6 sm:px-6">
            <div className="space-y-1">
              {navConfig.map((item) => {
                if (item.showAdmin && currentUser?.role !== 'ADMIN') return null;
                const isActive =
                  currentPage === item.page ||
                  (item.page === 'search' && currentPage === 'property-detail');
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNavClick(item.page)}
                    className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/[0.08] to-emerald-500/[0.08] text-amber-700 dark:text-amber-400'
                        : 'text-gray-600 hover:bg-gray-100/60 dark:text-gray-300 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className={
                        isActive
                          ? 'text-amber-600 dark:text-amber-500'
                          : 'text-gray-400 dark:text-gray-500'
                      }
                    >
                      {item.icon}
                    </span>
                    <span>{t.nav[item.labelKey]}</span>
                    {item.page === 'favorites' && favoritePropertyIds.size > 0 && (
                      <span className="ms-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 px-1.5 text-[10px] font-bold text-white">
                        {favoritePropertyIds.size}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute start-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Mobile Menu Footer */}
          <div className="border-t border-gray-100 px-4 py-4 dark:border-white/5 sm:px-6">
            {!isAuthenticated ? (
              <div className="space-y-2">
                <Button
                  onClick={() => handleNavClick('register')}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 text-[13px] font-semibold tracking-wide text-white shadow-lg shadow-amber-500/20"
                >
                  <UserPlus className="me-2 h-4 w-4" />
                  {t.auth.signUp}
                </Button>
                <Button
                  onClick={() => handleNavClick('login')}
                  variant="outline"
                  className="w-full rounded-xl text-[13px] font-semibold"
                >
                  <LogIn className="me-2 h-4 w-4" />
                  {t.nav.signIn}
                </Button>
                <a
                  href="/admin"
                  className="w-full text-center text-[12px] text-muted-foreground hover:text-amber-600 transition-colors py-2 inline-flex items-center justify-center gap-1.5"
                >
                  <Shield className="h-3 w-3" />
                  {locale === 'ar' ? 'دخول الأدمن' : 'Admin login'}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-emerald-600 text-sm font-bold text-white">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {currentUser?.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    void handleLogout({ closeMenus: true });
                  }}
                  className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Dialog - Login / Register Tabs */}
      {showLoginDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm dark:bg-gray-950/60"
            onClick={() => setShowLoginDialog(false)}
          />

          {/* Dialog Content */}
          <div className="relative w-full max-w-md overflow-hidden glass-deep rounded-2xl shadow-2xl shadow-black/[0.12]">
            {/* Decorative gradient top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="mb-5 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 shadow-lg shadow-amber-500/25">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <h2 className="font-heading text-2xl font-bold tracking-wide text-gray-900 dark:text-white">
                  {t.auth.welcome}
                </h2>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="mx-auto grid w-full grid-cols-2">
                  <TabsTrigger
                    value="login"
                    className="gap-1.5 text-[13px] font-medium"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    {t.auth.signIn}
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="gap-1.5 text-[13px] font-medium"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {t.auth.signUp}
                  </TabsTrigger>
                </TabsList>

                {/* ---- Login Tab ---- */}
                <TabsContent value="login">
                  <p className="mb-4 mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t.auth.subtitle}
                  </p>
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold tracking-wide text-gray-600 dark:text-gray-300">
                        {t.auth.email}
                      </label>
                      <div className="relative">
                        <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="admin@ciar.com"
                          required
                          className="h-11 w-full rounded-xl border border-gray-200/60 bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[13px] font-semibold tracking-wide text-gray-600 dark:text-gray-300">
                        {t.auth.password}
                      </label>
                      <div className="relative">
                        <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="h-11 w-full rounded-xl border border-gray-200/60 bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10"
                        />
                      </div>
                    </div>

                    {/* Demo accounts section */}
                    <div className="rounded-xl border border-gray-200/50 bg-gray-50/50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                      <p className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                        <Shield className="h-3.5 w-3.5 text-amber-500" />
                        {t.auth.demoAccounts}
                      </p>
                      <div className="space-y-2">
                        {demoAccounts.map((account) => (
                          <button
                            key={account.email}
                            type="button"
                            onClick={() => setLoginEmail(account.email)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all hover:bg-white hover:shadow-sm dark:hover:bg-white/5"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-500/10 to-emerald-500/10 text-amber-600 dark:text-amber-400">
                              {account.icon}
                            </span>
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate text-[12px] font-medium text-gray-800 dark:text-gray-200">
                                {account.email}
                              </p>
                              <p className="text-[11px] text-gray-400">{account.role}</p>
                            </div>
                            <ChevronDown className="-rotate-90 h-3 w-3 text-gray-300 dark:text-gray-600" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-xl border-gray-200/60 text-[13px] font-medium transition-all hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
                        onClick={() => setShowLoginDialog(false)}
                      >
                        {t.admin.cancel}
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 px-4 text-[13px] font-semibold tracking-wide text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-105"
                      >
                        <LogIn className="me-1.5 h-3.5 w-3.5" />
                        {t.auth.signIn}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* ---- Register Tab ---- */}
                <TabsContent value="register">
                  <p className="mb-4 mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t.auth.registerSubtitle}
                  </p>
                  <form onSubmit={handleRegister} className={`space-y-4 ${registerSuccess ? 'pointer-events-none opacity-60' : ''}`}>
                    {/* Error message */}
                    {registerError && (
                      <div className="rounded-lg border border-rose-200/60 bg-rose-50/80 px-3 py-2.5 text-[13px] font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                        {registerError}
                      </div>
                    )}

                    {/* Success message */}
                    {registerSuccess && (
                      <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 text-center text-[13px] font-medium text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                        {t.auth.registerSuccess || 'Account created successfully! Logging you in...'}
                      </div>
                    )}

                    {/* Name field */}
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold tracking-wide text-gray-600 dark:text-gray-300">
                        {t.auth.name}
                      </label>
                      <div className="relative">
                        <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          placeholder="John Doe"
                          required
                          className="h-11 w-full rounded-xl border border-gray-200/60 bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10"
                        />
                      </div>
                    </div>

                    {/* Email field */}
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold tracking-wide text-gray-600 dark:text-gray-300">
                        {t.auth.email}
                      </label>
                      <div className="relative">
                        <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          placeholder="you@example.com"
                          required
                          className="h-11 w-full rounded-xl border border-gray-200/60 bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10"
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold tracking-wide text-gray-600 dark:text-gray-300">
                        {t.auth.password}
                      </label>
                      <div className="relative">
                        <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="h-11 w-full rounded-xl border border-gray-200/60 bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10"
                        />
                      </div>
                    </div>

                    {/* Phone field */}
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold tracking-wide text-gray-600 dark:text-gray-300">
                        {t.auth.phone}
                      </label>
                      <div className="relative">
                        <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="h-11 w-full rounded-xl border border-gray-200/60 bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10"
                        />
                      </div>
                    </div>

                    {/* Register button */}
                    <Button
                      type="submit"
                      disabled={registerLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 px-4 text-[13px] font-semibold tracking-wide text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-105 disabled:opacity-50"
                    >
                      {registerLoading ? (
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="me-2 h-4 w-4" />
                      )}
                      {t.auth.signUp}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


