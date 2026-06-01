/** Arabic/English labels for admin UI — no raw codes shown to users */

export function userRoleLabel(isAr: boolean, role: string): string {
  const map: Record<string, [string, string]> = {
    ADMIN: ['مدير النظام', 'Administrator'],
    USER: ['مستخدم', 'User'],
    AGENT: ['وكيل عقاري', 'Agent'],
    OWNER: ['مالك عقار', 'Property owner'],
    COMPANY: ['شركة عقارية', 'Company'],
    GUEST: ['زائر', 'Guest'],
  };
  const pair = map[role] ?? [role, role];
  return isAr ? pair[0] : pair[1];
}

export function inquiryStatusLabel(isAr: boolean, status: string): string {
  const map: Record<string, [string, string]> = {
    NEW: ['جديد', 'New'],
    READ: ['مقروء', 'Read'],
    REPLIED: ['تم الرد', 'Replied'],
    CLOSED: ['مغلق', 'Closed'],
  };
  const pair = map[status] ?? [status, status];
  return isAr ? pair[0] : pair[1];
}

export function newsTypeLabel(isAr: boolean, type: string): string {
  const map: Record<string, [string, string]> = {
    info: ['خبر عادي', 'General news'],
    warning: ['تنبيه', 'Warning'],
    urgent: ['عاجل', 'Breaking'],
    promo: ['عرض / ترويج', 'Promotion'],
  };
  const pair = map[type] ?? [type, type];
  return isAr ? pair[0] : pair[1];
}

export function propertyStatusLabel(isAr: boolean, status: string): string {
  const map: Record<string, [string, string]> = {
    AVAILABLE: ['متاح', 'Available'],
    SOLD: ['مباع', 'Sold'],
    RENTED: ['مؤجّر', 'Rented'],
    PENDING: ['قيد المراجعة', 'Pending'],
  };
  const pair = map[status] ?? [status, status];
  return isAr ? pair[0] : pair[1];
}

export function listingTypeLabel(isAr: boolean, type: string): string {
  const map: Record<string, [string, string]> = {
    SALE: ['بيع', 'Sale'],
    RENT: ['إيجار', 'Rent'],
    SHORT_TERM: ['إيجار قصير', 'Short stay'],
  };
  const pair = map[type] ?? [type, type];
  return isAr ? pair[0] : pair[1];
}

export const NEWS_TYPE_OPTIONS = [
  { value: 'info', ar: 'خبر عادي', en: 'General news' },
  { value: 'warning', ar: 'تنبيه', en: 'Warning' },
  { value: 'urgent', ar: 'عاجل', en: 'Breaking' },
  { value: 'promo', ar: 'عرض / ترويج', en: 'Promotion' },
] as const;
