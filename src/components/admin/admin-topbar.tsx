'use client';

import { Menu, Globe, Sun, Moon } from 'lucide-react';
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
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  return (
    <div className="admin-topbar sticky top-0 z-40">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="admin-icon-btn shrink-0"
          aria-label={tx('القائمة', 'Menu')}
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg sm:text-xl font-bold leading-tight truncate">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-xs text-[var(--admin-text-mute)] mt-0.5 truncate">{pageSubtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onToggleLocale}
            title={tx('اللغة', 'Language')}
          >
            <Globe className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={tx('الوضع', 'Theme')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div
            className="hidden sm:flex items-center gap-2 ps-2 ms-1 border-s border-white/10"
            title={userName}
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#f5c97b] to-[#2dd4bf] flex items-center justify-center text-[#0a1018] font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold max-w-[100px] truncate hidden md:inline">{userName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
