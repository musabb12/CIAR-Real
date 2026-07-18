import {
  LayoutDashboard,
  Building2,
  Star,
  Globe,
  Users,
  Briefcase,
  Building,
  MessageSquare,
  CreditCard,
  MessageCircle,
  Heart,
  Megaphone,
  Brain,
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
  | 'subscriptions'
  | 'inquiries'
  | 'reviews'
  | 'favorites'
  | 'banners'
  | 'advertiser-ads'
  | 'ai-hub'
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
  { id: 'dashboard', ar: 'الرئيسية', en: 'Home', icon: LayoutDashboard, group: 'main' },

  { id: 'properties', ar: 'العقارات', en: 'Properties', icon: Building2, group: 'realestate' },
  { id: 'featured', ar: 'المميزة', en: 'Featured', icon: Star, group: 'realestate' },
  { id: 'locations', ar: 'الدول', en: 'Countries', icon: Globe, group: 'realestate' },

  { id: 'users', ar: 'المستخدمون', en: 'Users', icon: Users, group: 'people' },
  { id: 'agents', ar: 'الوكلاء', en: 'Agents', icon: Briefcase, group: 'people' },
  { id: 'companies', ar: 'الشركات', en: 'Companies', icon: Building, group: 'people' },
  { id: 'subscriptions', ar: 'الاشتراكات', en: 'Subscriptions', icon: CreditCard, group: 'people' },

  { id: 'inquiries', ar: 'الاستفسارات', en: 'Inquiries', icon: MessageSquare, group: 'engagement' },
  { id: 'reviews', ar: 'التقييمات', en: 'Reviews', icon: MessageCircle, group: 'engagement' },
  { id: 'favorites', ar: 'المفضلة', en: 'Favorites', icon: Heart, group: 'engagement' },

  { id: 'banners', ar: 'البنرات', en: 'Banners', icon: ImageIcon, group: 'content' },
  { id: 'advertiser-ads', ar: 'إعلانات المعلنين', en: 'Advertiser ads', icon: Megaphone, group: 'content' },
  { id: 'ai-hub', ar: 'الذكاء الاصطناعي', en: 'AI Hub', icon: Brain, group: 'content' },
  { id: 'news', ar: 'الأخبار', en: 'News', icon: Newspaper, group: 'content' },
  { id: 'features', ar: 'الميزات', en: 'Features', icon: Sparkles, group: 'content' },
  { id: 'content-manager', ar: 'محتوى الصفحات', en: 'Page content', icon: FileText, group: 'content' },
  { id: 'site-config', ar: 'إعداد الموقع', en: 'Site setup', icon: SlidersHorizontal, group: 'content' },

  { id: 'analytics', ar: 'التقارير', en: 'Reports', icon: BarChart3, group: 'system' },
  { id: 'settings', ar: 'الإعدادات', en: 'Settings', icon: Settings, group: 'system' },
];

export const ADMIN_GROUPS: Record<AdminNavItem['group'], { ar: string; en: string }> = {
  main: { ar: 'البداية', en: 'Start' },
  realestate: { ar: 'العقارات والدول', en: 'Listings & locations' },
  people: { ar: 'المستخدمون والوكلاء', en: 'Users & agents' },
  engagement: { ar: 'الرسائل والتفاعل', en: 'Messages' },
  content: { ar: 'المحتوى والظهور', en: 'Content' },
  system: { ar: 'أدوات إضافية', en: 'More tools' },
};
