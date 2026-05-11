'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronDown, LogOut, Crown, Sparkles } from 'lucide-react';
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
      animate={{ width: collapsed ? 76 : 268 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="admin-sidebar admin-scrollbar h-screen sticky top-0 flex flex-col z-30"
      style={{ width: collapsed ? 76 : 268 }}
    >
      {/* ── Brand ── */}
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#f5c97b] via-[#e0a85a] to-[#2dd4bf] flex items-center justify-center shadow-lg shadow-amber-500/30 relative">
            <Building2 className="h-5 w-5 text-[#0a1018]" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0a1018] animate-pulse" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <div className="font-heading font-bold text-xl leading-none admin-text-gradient">
              CIAR
            </div>
            <div className="text-[10px] text-[var(--admin-text-faint)] tracking-[0.22em] uppercase mt-1.5 font-semibold">
              {tx('بوابة المدير', 'Admin Portal')}
            </div>
          </motion.div>
        )}
      </div>

      <div className="admin-divider mx-4" />

      {/* ── Profile ── */}
      <div className={`px-4 py-3 ${collapsed ? 'flex justify-center' : ''}`}>
        <div
          className={`relative ${
            collapsed
              ? ''
              : 'flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/[0.06]'
          }`}
        >
          <div className="relative">
            <div className="admin-avatar-ring h-11 w-11">
              <div className="h-full w-full rounded-full bg-[#0a1018] flex items-center justify-center text-[#f5c97b] font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
            <Crown className="absolute -top-1.5 -right-1.5 h-4 w-4 text-[#f5c97b] drop-shadow-[0_0_6px_rgba(245,201,123,0.7)]" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex-1 min-w-0 flex items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{userName}</div>
                <div className="text-[10px] text-[var(--admin-text-faint)] tracking-[0.15em] uppercase mt-0.5 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-[#f5c97b]" />
                  {tx('مدير النظام', 'Super Admin')}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--admin-text-faint)]" />
            </motion.div>
          )}
        </div>
      </div>

      <div className="admin-divider mx-4" />

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 admin-scrollbar">
        {Array.from(grouped.entries()).map(([groupId, items]) => (
          <div key={groupId} className="mb-1">
            {!collapsed && (
              <div className="admin-nav-section">
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
                    onClick={() => onSelect(item.id)}
                    className={`admin-nav-item w-full ${isActive ? 'is-active' : ''} ${
                      collapsed ? 'justify-center px-2' : ''
                    }`}
                    title={tx(item.ar, item.en)}
                  >
                    <span className="nav-icon-wrap">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-start truncate text-[13px]">
                          {tx(item.ar, item.en)}
                        </span>
                        {item.badge && (
                          <span className="admin-pill admin-pill-gold">{item.badge}</span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Upgrade card (collapsed-aware) ── */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-[#f5c97b]/15 via-[#2dd4bf]/8 to-transparent border border-[#f5c97b]/20 relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-amber-500/30 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Crown className="h-3.5 w-3.5 text-[#f5c97b]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#f5c97b]">
                {tx('CIAR PRO', 'CIAR PRO')}
              </span>
            </div>
            <p className="text-[11px] text-[var(--admin-text-mute)] leading-relaxed mb-2">
              {tx('مفعّل · صلاحيات كاملة', 'Activated · Full access')}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="admin-pulse-dot scale-50" />
              <span>{tx('نشط', 'Active')}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Footer ── */}
      <div className="admin-divider mx-4" />
      <div className="p-3">
        <button
          onClick={onLogout}
          className={`admin-nav-item w-full text-rose-300/80 hover:text-rose-200 ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          style={{
            background: 'rgba(251, 113, 133, 0.06)',
            borderColor: 'rgba(251, 113, 133, 0.18)',
          }}
        >
          <span className="nav-icon-wrap" style={{ background: 'rgba(251, 113, 133, 0.1)', borderColor: 'rgba(251, 113, 133, 0.2)' }}>
            <LogOut className="h-3.5 w-3.5" />
          </span>
          {!collapsed && <span className="flex-1 text-start text-[13px]">{tx('تسجيل الخروج', 'Sign out')}</span>}
        </button>
        {!collapsed && (
          <p className="text-[10px] text-[var(--admin-text-faint)] text-center mt-3 tracking-wider">
            v1.0.0 · CIAR © {new Date().getFullYear()}
          </p>
        )}
      </div>
    </motion.aside>
  );
}
