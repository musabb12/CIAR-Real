import {
  LayoutDashboard,
  Building2,
  Star,
  Globe,
  Users,
  Briefcase,
  Building,
  MessageSquare,
  MessageCircle,
  Heart,
  Image as ImageIcon,
  Newspaper,
  Sparkles,
  FileText,
  SlidersHorizontal,
  BarChart3,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminTabId =
  | 'dashboard'
  | 'properties'
  | 'featured'
  | 'locations'
  | 'users'
  | 'agents'
  | 'companies'
  | 'inquiries'
  | 'reviews'
  | 'favorites'
  | 'banners'
  | 'news'
  | 'features'
  | 'content-manager'
  | 'site-config'
  | 'analytics'
  | 'settings';

export interface AdminNavItem {
  id: AdminTabId;
  ar: string;
  en: string;
  icon: LucideIcon;
  badge?: string;
  group: 'main' | 'realestate' | 'people' | 'engagement' | 'content' | 'system';
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', ar: 'لوحة التحكم', en: 'Dashboard', icon: LayoutDashboard, group: 'main' },

  { id: 'properties', ar: 'العقارات', en: 'Properties', icon: Building2, group: 'realestate' },
  { id: 'featured', ar: 'المميزة', en: 'Featured', icon: Star, group: 'realestate' },
  { id: 'locations', ar: 'الدول والمدن', en: 'Locations', icon: Globe, group: 'realestate' },

  { id: 'users', ar: 'المستخدمون', en: 'Users', icon: Users, group: 'people' },
  { id: 'agents', ar: 'الوكلاء', en: 'Agents', icon: Briefcase, group: 'people' },
  { id: 'companies', ar: 'الشركات', en: 'Companies', icon: Building, group: 'people' },

  { id: 'inquiries', ar: 'الاستفسارات', en: 'Inquiries', icon: MessageSquare, group: 'engagement', badge: 'NEW' },
  { id: 'reviews', ar: 'التقييمات', en: 'Reviews', icon: MessageCircle, group: 'engagement' },
  { id: 'favorites', ar: 'المفضلة', en: 'Favorites', icon: Heart, group: 'engagement' },

  { id: 'banners', ar: 'الإعلانات', en: 'Banners', icon: ImageIcon, group: 'content' },
  { id: 'news', ar: 'الأخبار والشريط', en: 'News & Ticker', icon: Newspaper, group: 'content' },
  { id: 'features', ar: 'المميزات', en: 'Features', icon: Sparkles, group: 'content' },
  { id: 'content-manager', ar: 'محتوى الصفحات', en: 'Pages Content', icon: FileText, group: 'content' },
  { id: 'site-config', ar: 'الحالة الحالية للموقع', en: 'Current Site Setup', icon: SlidersHorizontal, group: 'content' },

  { id: 'analytics', ar: 'التحليلات', en: 'Analytics', icon: BarChart3, group: 'system' },
  { id: 'settings', ar: 'الإعدادات', en: 'Settings', icon: Settings, group: 'system' },
];

export const ADMIN_GROUPS: Record<AdminNavItem['group'], { ar: string; en: string }> = {
  main: { ar: 'الرئيسية', en: 'Main' },
  realestate: { ar: 'العقارات', en: 'Real Estate' },
  people: { ar: 'الأشخاص', en: 'People' },
  engagement: { ar: 'التفاعل', en: 'Engagement' },
  content: { ar: 'المحتوى', en: 'Content' },
  system: { ar: 'النظام', en: 'System' },
};
