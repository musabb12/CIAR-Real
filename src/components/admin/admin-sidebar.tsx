'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, LogOut } from 'lucide-react';
import { ADMIN_NAV, ADMIN_GROUPS, type AdminTabId } from './admin-nav';

interface Props {
  active: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  isAr: boolean;
  collapsed: boolean;
  onLogout: () => void;
  userName: string;
}

export function AdminSidebar({
  active,
  onSelect,
  isAr,
  collapsed,
  onLogout,
  userName,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof ADMIN_NAV>();
    ADMIN_NAV.forEach((it) => {
      const arr = map.get(it.group) ?? [];
      arr.push(it);
      map.set(it.group, arr);
    });
    return map;
  }, []);

  const tx = (ar: string, en: string) => (isAr ? ar : en);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 252 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="admin-sidebar admin-scrollbar h-screen sticky top-0 flex flex-col z-30"
      style={{ width: collapsed ? 72 : 252 }}
    >
      <div className="px-3 py-4 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#f5c97b] to-[#2dd4bf] flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-[#0a1018]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-heading font-bold text-lg leading-none admin-text-gradient">CIAR</div>
            <div className="text-[10px] text-[var(--admin-text-faint)] mt-1">
              {tx('لوحة الإدارة', 'Admin')}
            </div>
          </div>
        )}
      </div>

      <div className="admin-divider mx-3" />

      {!collapsed && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="h-9 w-9 rounded-full bg-[#0a1018] flex items-center justify-center text-[#f5c97b] font-bold text-sm shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{userName}</div>
              <div className="text-[10px] text-[var(--admin-text-faint)]">{tx('مدير', 'Admin')}</div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-2 admin-scrollbar">
        {Array.from(grouped.entries()).map(([groupId, items]) => (
          <div key={groupId} className="mb-3">
            {!collapsed && (
              <div className="admin-nav-section px-2">
                {tx(
                  ADMIN_GROUPS[groupId as keyof typeof ADMIN_GROUPS].ar,
                  ADMIN_GROUPS[groupId as keyof typeof ADMIN_GROUPS].en,
                )}
              </div>
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`admin-nav-item w-full ${isActive ? 'is-active' : ''} ${
                      collapsed ? 'justify-center px-2' : ''
                    }`}
                    title={tx(item.ar, item.en)}
                  >
                    <span className="nav-icon-wrap">
                      <Icon className="h-4 w-4" />
                    </span>
                    {!collapsed && (
                      <span className="flex-1 text-start truncate text-[13px] font-medium">
                        {tx(item.ar, item.en)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="admin-divider mx-3" />
      <div className="p-2">
        <button
          type="button"
          onClick={onLogout}
          className={`admin-nav-item w-full text-rose-300/90 hover:text-rose-200 ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <span className="nav-icon-wrap">
            <LogOut className="h-4 w-4" />
          </span>
          {!collapsed && (
            <span className="flex-1 text-start text-[13px]">{tx('خروج', 'Sign out')}</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
