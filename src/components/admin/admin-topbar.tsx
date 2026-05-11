'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  Maximize2,
  Settings,
  HelpCircle,
  Mail,
  Calendar,
  ChevronDown,
  ChevronRight,
  Home,
  Command,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface Props {
  isAr: boolean;
  onToggleSidebar: () => void;
  onToggleLocale: () => void;
  userName: string;
  pageTitle: string;
  pageSubtitle?: string;
}

export function AdminTopbar({
  isAr,
  onToggleSidebar,
  onToggleLocale,
  userName,
  pageTitle,
  pageSubtitle,
}: Props) {
  const { theme, setTheme } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const tx = (ar: string, en: string) => (isAr ? ar : en);

  return (
    <div className="admin-topbar sticky top-0 z-40">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5">
        {/* Hamburger */}
        <button onClick={onToggleSidebar} className="admin-icon-btn shrink-0">
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumbs + title */}
        <div className="hidden md:block min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-faint)] mb-0.5">
            <Home className="h-3 w-3" />
            <ChevronRight className={`h-3 w-3 ${isAr ? 'rotate-180' : ''}`} />
            <span>{tx('الإدارة', 'Admin')}</span>
            <ChevronRight className={`h-3 w-3 ${isAr ? 'rotate-180' : ''}`} />
            <span className="text-[#f5c97b]">{pageTitle}</span>
          </div>
          <h1 className="font-heading text-base font-bold leading-tight truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Search */}
        <motion.div
          animate={{ width: searchFocused ? 480 : 320 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden md:block"
          style={{ width: searchFocused ? 480 : 320 }}
        >
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text-faint)] pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={tx('ابحث في كل شيء — العقارات، المستخدمين، الوكلاء...', 'Search anything — properties, users, agents...')}
            className="admin-search w-full h-10 ps-10 pe-20 text-sm"
          />
          <kbd className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[var(--admin-text-faint)] border border-white/[0.08] rounded bg-white/[0.04]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </motion.div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <button
            className="admin-icon-btn hidden sm:inline-flex"
            onClick={onToggleLocale}
            title={tx('تغيير اللغة', 'Change language')}
          >
            <Globe className="h-4 w-4" />
          </button>

          <button
            className="admin-icon-btn hidden sm:inline-flex"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={tx('السمة', 'Theme')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button className="admin-icon-btn hidden lg:inline-flex" title={tx('ملء الشاشة', 'Fullscreen')}>
            <Maximize2 className="h-4 w-4" />
          </button>

          <button className="admin-icon-btn hidden lg:inline-flex" title={tx('التقويم', 'Calendar')}>
            <Calendar className="h-4 w-4" />
          </button>

          <button className="admin-icon-btn hidden lg:inline-flex" title={tx('الرسائل', 'Mail')}>
            <Mail className="h-4 w-4" />
            <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1 text-[9px] font-bold text-white shadow-md shadow-rose-500/40">
              3
            </span>
          </button>

          <button className="admin-icon-btn relative" title={tx('الإشعارات', 'Notifications')}>
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-1 text-[9px] font-bold text-[#0a1018] shadow-md shadow-amber-500/40 animate-pulse">
              7
            </span>
          </button>

          <button className="admin-icon-btn hidden lg:inline-flex" title={tx('المساعدة', 'Help')}>
            <HelpCircle className="h-4 w-4" />
          </button>

          <button className="admin-icon-btn hidden lg:inline-flex" title={tx('الإعدادات', 'Settings')}>
            <Settings className="h-4 w-4" />
          </button>

          <div className="hidden md:block w-px h-6 bg-white/[0.08] mx-1" />

          {/* User pill */}
          <button className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all">
            <div className="relative">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#f5c97b] to-[#2dd4bf] flex items-center justify-center text-[#0a1018] font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#070b11]" />
            </div>
            <div className="text-start hidden lg:block">
              <div className="text-xs font-bold leading-none">{userName}</div>
              <div className="text-[10px] text-[var(--admin-text-faint)] mt-0.5 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                {tx('متصل', 'Online')}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--admin-text-faint)]" />
          </button>
        </div>
      </div>
    </div>
  );
}
