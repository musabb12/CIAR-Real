import type { UserRole } from '@/types';

/** Client-safe role helpers (no Firebase / Node imports). */

export function isPartnerRole(role: UserRole): boolean {
  return role === 'OWNER' || role === 'COMPANY' || role === 'AGENT';
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function resolvePageAfterLogin(role: UserRole): 'admin' | 'partner-dashboard' | 'home' {
  if (isAdminRole(role)) return 'admin';
  if (isPartnerRole(role)) return 'partner-dashboard';
  return 'home';
}
