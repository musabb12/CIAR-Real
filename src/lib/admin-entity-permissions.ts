export type AdminPermissionMap = Record<string, boolean>;

export type AdminPermissionDef = {
  key: string;
  ar: string;
  en: string;
};

export const AGENT_ADMIN_PERMISSIONS: AdminPermissionDef[] = [
  { key: 'manageListings', ar: 'إدارة العقارات والإعلانات', en: 'Manage listings' },
  { key: 'manageInquiries', ar: 'الرد على الاستفسارات', en: 'Manage inquiries' },
  { key: 'manageReviews', ar: 'إدارة التقييمات', en: 'Manage reviews' },
  { key: 'publishWithoutApproval', ar: 'نشر بدون موافقة الإدارة', en: 'Publish without admin approval' },
  { key: 'editProfile', ar: 'تعديل الملف العام', en: 'Edit public profile' },
  { key: 'viewAnalytics', ar: 'عرض التحليلات', en: 'View analytics' },
  { key: 'manageMedia', ar: 'رفع الصور والوسائط', en: 'Upload media' },
  { key: 'exportLeads', ar: 'تصدير العملاء المحتملين', en: 'Export leads' },
];

export const COMPANY_ADMIN_PERMISSIONS: AdminPermissionDef[] = [
  { key: 'manageAgents', ar: 'إدارة الوكلاء التابعين', en: 'Manage team agents' },
  { key: 'manageListings', ar: 'إدارة كل إعلانات الشركة', en: 'Manage all company listings' },
  { key: 'manageInquiries', ar: 'إدارة الاستفسارات', en: 'Manage inquiries' },
  { key: 'manageReviews', ar: 'إدارة التقييمات', en: 'Manage reviews' },
  { key: 'publishWithoutApproval', ar: 'نشر بدون موافقة', en: 'Publish without approval' },
  { key: 'viewAnalytics', ar: 'تحليلات الشركة', en: 'Company analytics' },
  { key: 'manageBranding', ar: 'الشعار والهوية', en: 'Branding & logo' },
  { key: 'manageBilling', ar: 'الفوترة والاشتراكات', en: 'Billing & subscriptions' },
];

export function defaultPermissionMap(defs: AdminPermissionDef[]): AdminPermissionMap {
  return Object.fromEntries(defs.map((d) => [d.key, false]));
}

export function normalizeAdminPermissions(
  raw: unknown,
  defs: AdminPermissionDef[]
): AdminPermissionMap {
  const base = defaultPermissionMap(defs);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  for (const d of defs) {
    if (typeof (raw as Record<string, unknown>)[d.key] === 'boolean') {
      base[d.key] = (raw as Record<string, boolean>)[d.key];
    }
  }
  return base;
}

export function normalizeAdminTasks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
}
