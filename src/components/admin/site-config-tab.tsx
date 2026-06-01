'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  Palette,
  ImageIcon,
  ChevronLeft,
  Newspaper,
  Megaphone,
  ToggleLeft,
  ToggleRight,
  LayoutTemplate,
  Pencil,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import type { ManagedPageKey } from '@/types';
import type { AdminTabId } from './admin-nav';
import { getPagePreviewImage } from '@/lib/page-hero-defaults';
import { invalidate } from '@/lib/admin-events';
import { ImageUrlInput } from './image-url-input';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

type FeatureRow = { id: string; key: string; name: string; isEnabled: boolean };

const MANAGED_PAGES: Array<{ key: ManagedPageKey; ar: string; en: string }> = [
  { key: 'home', ar: 'الرئيسية', en: 'Home' },
  { key: 'search', ar: 'البحث', en: 'Search' },
  { key: 'agents', ar: 'الوكلاء', en: 'Agents' },
  { key: 'contact', ar: 'اتصل بنا', en: 'Contact' },
  { key: 'favorites', ar: 'المفضلة', en: 'Favorites' },
  { key: 'login', ar: 'دخول المستخدم', en: 'User login' },
  { key: 'register', ar: 'تسجيل المستخدم', en: 'Register' },
  { key: 'admin-login', ar: 'دخول الأدمن', en: 'Admin login' },
];

function pageHasCustomContent(entry: {
  title?: string;
  subtitle?: string;
  badge?: string;
  backgroundImageUrl?: string;
  backgroundImageUrls?: string[];
}): boolean {
  return Boolean(
    entry.title?.trim() ||
      entry.subtitle?.trim() ||
      entry.badge?.trim() ||
      entry.backgroundImageUrl?.trim() ||
      (entry.backgroundImageUrls?.length ?? 0) > 0,
  );
}

type SiteConfigTabProps = {
  isAr: boolean;
  onNavigateTab: (tab: AdminTabId) => void;
  onEditPage: (page: ManagedPageKey) => void;
};

export function SiteConfigTab({ isAr, onNavigateTab, onEditPage }: SiteConfigTabProps) {
  const { designSettings, updateDesignSettings, resetDesignSettings, contentSettings } = useAppStore();
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  const loadFeatures = useCallback(() => {
    setLoadingFeatures(true);
    fetch('/api/features')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) throw new Error('Failed');
        setFeatures(
          data.map((f) => ({
            id: String(f?.id ?? ''),
            key: String(f?.key ?? ''),
            name: String(f?.name ?? f?.key ?? ''),
            isEnabled: Boolean(f?.isEnabled),
          })),
        );
      })
      .catch(() => setFeatures([]))
      .finally(() => setLoadingFeatures(false));
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const toggleFeature = async (row: FeatureRow) => {
    try {
      const res = await fetch('/api/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isEnabled: !row.isEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed');
      setFeatures((prev) => prev.map((r) => (r.id === data.id ? { ...r, ...data } : r)));
      invalidate('features');
      toast.success(tx(isAr, 'تم حفظ الإعداد', 'Saved'));
    } catch {
      toast.error(tx(isAr, 'تعذّر التحديث', 'Update failed'));
    }
  };

  const quickLinks: Array<{ tab: AdminTabId; ar: string; en: string; icon: typeof Megaphone; descAr: string; descEn: string }> = [
    {
      tab: 'banners',
      ar: 'البنرات',
      en: 'Banners',
      icon: Megaphone,
      descAr: 'إعلانات وشريط الأخبار',
      descEn: 'Ads and news ticker',
    },
    {
      tab: 'news',
      ar: 'الأخبار',
      en: 'News',
      icon: Newspaper,
      descAr: 'مقالات وتحديثات الموقع',
      descEn: 'Articles and site updates',
    },
    {
      tab: 'features',
      ar: 'المميزات',
      en: 'Features',
      icon: ToggleRight,
      descAr: 'تفعيل وإيقاف خصائص المنصة',
      descEn: 'Enable or disable platform modules',
    },
    {
      tab: 'content-manager',
      ar: 'محتوى الصفحات',
      en: 'Page content',
      icon: LayoutTemplate,
      descAr: 'عناوين وصور كل صفحة',
      descEn: 'Titles and images per page',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="admin-card p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c97b]/30 bg-[#f5c97b]/10 px-3 py-1 text-[11px] font-semibold text-[#f5c97b] mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          {tx(isAr, 'مركز التحكم', 'Control center')}
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tx(isAr, 'إعداد الموقع', 'Site setup')}</h1>
        <p className="text-sm text-[var(--admin-text-mute)] mt-2 max-w-2xl">
          {tx(
            isAr,
            'عدّل ألوان الهوية، صورة الهيرو، ومحتوى الصفحات من هنا. كل تغيير يُطبَّق على الموقع مباشرة — اضغط «تعديل» على أي صفحة لفتح محرّرها.',
            'Edit brand colors, hero image, and page content here. Changes apply to the live site — click Edit on any page to open its editor.',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-4 w-4 text-[#f5c97b]" />
            <h3 className="font-heading font-bold">{tx(isAr, 'ألوان الهوية', 'Brand colors')}</h3>
          </div>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs text-[var(--admin-text-mute)]">{tx(isAr, 'اللون الأساسي', 'Primary')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={designSettings.primaryColor}
                  onChange={(e) => updateDesignSettings({ primaryColor: e.target.value })}
                  className="h-10 w-12 rounded-lg border border-white/10 bg-transparent cursor-pointer shrink-0"
                />
                <input
                  className="admin-input flex-1"
                  value={designSettings.primaryColor}
                  onChange={(e) => updateDesignSettings({ primaryColor: e.target.value })}
                />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-xs text-[var(--admin-text-mute)]">{tx(isAr, 'لون التمييز', 'Accent')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={designSettings.accentColor}
                  onChange={(e) => updateDesignSettings({ accentColor: e.target.value })}
                  className="h-10 w-12 rounded-lg border border-white/10 bg-transparent cursor-pointer shrink-0"
                />
                <input
                  className="admin-input flex-1"
                  value={designSettings.accentColor}
                  onChange={(e) => updateDesignSettings({ accentColor: e.target.value })}
                />
              </div>
            </label>
            <button
              type="button"
              className="admin-icon-btn !w-full !text-xs"
              onClick={() => {
                resetDesignSettings();
                toast.success(tx(isAr, 'تمت استعادة الألوان الافتراضية', 'Default colors restored'));
              }}
            >
              {tx(isAr, 'استعادة الألوان الافتراضية', 'Reset colors')}
            </button>
          </div>
        </div>

        <div className="admin-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-4 w-4 text-[#2dd4bf]" />
            <h3 className="font-heading font-bold">{tx(isAr, 'صورة الهيرو الرئيسية', 'Main hero image')}</h3>
          </div>
          <div className="h-36 rounded-xl overflow-hidden border border-white/10 bg-white/[0.04] mb-4">
            {designSettings.heroImageUrl ? (
              <img src={designSettings.heroImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[var(--admin-text-faint)]">
                {tx(isAr, 'لا توجد صورة', 'No image')}
              </div>
            )}
          </div>
          <label className="block space-y-2">
            <span className="text-xs text-[var(--admin-text-mute)]">{tx(isAr, 'رابط الصورة', 'Image URL')}</span>
            <ImageUrlInput
              isAr={isAr}
              value={designSettings.heroImageUrl}
              onChange={(url) => updateDesignSettings({ heroImageUrl: url })}
              uploadLabel={tx(isAr, 'رفع', 'Upload')}
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="font-heading font-bold mb-3">{tx(isAr, 'اختصارات سريعة', 'Quick links')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.tab}
                type="button"
                onClick={() => onNavigateTab(link.tab)}
                className="admin-card p-4 text-start transition-all hover:border-[#f5c97b]/40 hover:shadow-[0_8px_32px_rgba(245,201,123,0.1)] group"
              >
                <Icon className="h-5 w-5 text-[#f5c97b] mb-2" />
                <div className="font-semibold text-sm">{tx(isAr, link.ar, link.en)}</div>
                <div className="text-[11px] text-[var(--admin-text-mute)] mt-1">{tx(isAr, link.descAr, link.descEn)}</div>
                <ChevronLeft className="h-4 w-4 mt-2 opacity-0 group-hover:opacity-60 transition-opacity rtl:rotate-180" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h3 className="font-heading font-bold">{tx(isAr, 'محتوى الصفحات', 'Page content')}</h3>
            <p className="text-xs text-[var(--admin-text-mute)] mt-1">
              {tx(isAr, 'اضغط «تعديل» على أي صفحة لتغيير العناوين والصور', 'Click Edit on any page to change titles and images')}
            </p>
          </div>
          <button type="button" className="admin-btn-premium !text-sm" onClick={() => onNavigateTab('content-manager')}>
            <LayoutTemplate className="h-4 w-4" />
            {tx(isAr, 'فتح كل الصفحات', 'Open all pages')}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MANAGED_PAGES.map((page) => {
            const entry = contentSettings[page.key];
            const custom = pageHasCustomContent(entry);
            const thumb = getPagePreviewImage(page.key, entry);
            const title = entry.title?.trim() || tx(isAr, 'افتراضي', 'Default');
            const subtitle =
              entry.subtitle?.trim() ||
              tx(isAr, 'اضغط تعديل لتخصيص النص', 'Click edit to customize text');

            return (
              <div
                key={page.key}
                className="admin-card p-0 overflow-hidden flex flex-col"
              >
                <div className="h-24 bg-cover bg-center relative" style={{ backgroundImage: `url('${thumb}')` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className={`absolute top-2 end-2 admin-pill text-[9px] ${custom ? 'admin-pill-up' : 'admin-pill-down'}`}>
                    {custom ? tx(isAr, 'مخصص', 'Custom') : tx(isAr, 'افتراضي', 'Default')}
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-[10px] text-[var(--admin-text-faint)] mb-0.5">{tx(isAr, page.ar, page.en)}</div>
                  <div className="text-sm font-semibold truncate">{title}</div>
                  <div className="text-[11px] text-[var(--admin-text-mute)] truncate mt-0.5 flex-1">{subtitle}</div>
                  <button
                    type="button"
                    onClick={() => onEditPage(page.key)}
                    className="mt-3 admin-icon-btn !w-full !text-xs gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {tx(isAr, 'تعديل', 'Edit')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-heading font-bold">{tx(isAr, 'المميزات', 'Features')}</h3>
            <p className="text-xs text-[var(--admin-text-mute)] mt-1">
              {tx(isAr, 'فعّل أو أوقف ميزات المنصة بنقرة واحدة', 'Toggle platform features with one click')}
            </p>
          </div>
          <button type="button" className="admin-icon-btn !w-auto px-4 !text-xs" onClick={() => onNavigateTab('features')}>
            {tx(isAr, 'إدارة كاملة', 'Full manager')}
          </button>
        </div>
        {loadingFeatures ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#f5c97b]" />
          </div>
        ) : features.length === 0 ? (
          <p className="text-sm text-[var(--admin-text-mute)] py-6 text-center">
            {tx(isAr, 'لا توجد مميزات مسجّلة — انتقل إلى تبويب المميزات', 'No features yet — open the Features tab')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {features.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => void toggleFeature(feature)}
                className="rounded-xl border border-white/10 px-4 py-3 flex items-center justify-between gap-3 text-start hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-sm font-medium">{feature.name}</span>
                {feature.isEnabled ? (
                  <ToggleRight className="h-6 w-6 text-[#2dd4bf] shrink-0" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-[var(--admin-text-faint)] shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
