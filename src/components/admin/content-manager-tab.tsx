'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Search,
  Users,
  Mail,
  Heart,
  LogIn,
  UserPlus,
  Shield,
  ExternalLink,
  Trash2,
  Type,
  ImageIcon,
  Layout,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Palette,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import type { ManagedPageKey, PageContentEntry } from '@/types';
import {
  DEFAULT_PAGE_HERO_IMAGES,
  getPagePreviewImage,
  getPagePreviewImages,
} from '@/lib/page-hero-defaults';
import { ImageUrlInput } from '@/components/admin/image-url-input';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

type EditorStep = 'texts' | 'cover' | 'layout';

type PageConfig = {
  ar: string;
  en: string;
  descAr: string;
  descEn: string;
  icon: LucideIcon;
  route: string;
  defaultTitleAr: string;
  defaultTitleEn: string;
  defaultSubtitleAr: string;
  defaultSubtitleEn: string;
  defaultBadgeAr: string;
  defaultBadgeEn: string;
};

const PAGE_CONFIG: Record<ManagedPageKey, PageConfig> = {
  home: {
    ar: 'الصفحة الرئيسية',
    en: 'Home page',
    descAr: 'البانر الكبير — أول ما يراه الزائر',
    descEn: 'Main banner — first thing visitors see',
    icon: Home,
    route: '/',
    defaultTitleAr: 'CIAR',
    defaultTitleEn: 'CIAR',
    defaultSubtitleAr: 'منصة عقارية فاخرة — ابحث، قارن، وتواصل',
    defaultSubtitleEn: 'Luxury real estate — search, compare, connect',
    defaultBadgeAr: 'عقارات مميزة',
    defaultBadgeEn: 'Premium listings',
  },
  search: {
    ar: 'صفحة البحث',
    en: 'Search page',
    descAr: 'رأس صفحة البحث عن العقارات',
    descEn: 'Property search page header',
    icon: Search,
    route: '/#search',
    defaultTitleAr: 'ابحث عن عقارك',
    defaultTitleEn: 'Find your property',
    defaultSubtitleAr: 'فلترة حسب الدولة والنوع والسعر',
    defaultSubtitleEn: 'Filter by country, type, and price',
    defaultBadgeAr: 'بحث متقدم',
    defaultBadgeEn: 'Advanced search',
  },
  agents: {
    ar: 'صفحة الوكلاء',
    en: 'Agents page',
    descAr: 'مقدمة قائمة الوكلاء والشركات',
    descEn: 'Agents and companies listing intro',
    icon: Users,
    route: '/#agents',
    defaultTitleAr: 'وكلاؤنا المعتمدون',
    defaultTitleEn: 'Our trusted agents',
    defaultSubtitleAr: 'خبراء عقاريون جاهزون لمساعدتك',
    defaultSubtitleEn: 'Expert advisors ready to help',
    defaultBadgeAr: 'فريق CIAR',
    defaultBadgeEn: 'CIAR team',
  },
  contact: {
    ar: 'اتصل بنا',
    en: 'Contact us',
    descAr: 'رأس صفحة التواصل',
    descEn: 'Contact page header',
    icon: Mail,
    route: '/#contact',
    defaultTitleAr: 'تواصل معنا',
    defaultTitleEn: 'Get in touch',
    defaultSubtitleAr: 'نرد على استفساراتك في أقرب وقت',
    defaultSubtitleEn: 'We reply to your inquiries quickly',
    defaultBadgeAr: 'دعم مباشر',
    defaultBadgeEn: 'Direct support',
  },
  favorites: {
    ar: 'المفضلة',
    en: 'Favorites',
    descAr: 'رأس صفحة العقارات المحفوظة',
    descEn: 'Saved properties page header',
    icon: Heart,
    route: '/#favorites',
    defaultTitleAr: 'عقاراتك المفضلة',
    defaultTitleEn: 'Your favorites',
    defaultSubtitleAr: 'كل ما حفظته في مكان واحد',
    defaultSubtitleEn: 'Everything you saved in one place',
    defaultBadgeAr: 'محفوظاتك',
    defaultBadgeEn: 'Your saves',
  },
  login: {
    ar: 'تسجيل الدخول',
    en: 'User login',
    descAr: 'خلفية ونصوص صفحة الدخول',
    descEn: 'Login page background and texts',
    icon: LogIn,
    route: '/#login',
    defaultTitleAr: 'مرحباً بعودتك',
    defaultTitleEn: 'Welcome back',
    defaultSubtitleAr: 'سجّل دخولك لمتابعة عقاراتك',
    defaultSubtitleEn: 'Sign in to continue',
    defaultBadgeAr: 'حسابك',
    defaultBadgeEn: 'Your account',
  },
  register: {
    ar: 'إنشاء حساب',
    en: 'Registration',
    descAr: 'خلفية ونصوص صفحة التسجيل',
    descEn: 'Sign-up page background and texts',
    icon: UserPlus,
    route: '/#register',
    defaultTitleAr: 'انضم إلى CIAR',
    defaultTitleEn: 'Join CIAR',
    defaultSubtitleAr: 'أنشئ حساباً وابدأ رحلتك العقارية',
    defaultSubtitleEn: 'Create an account and get started',
    defaultBadgeAr: 'عضو جديد',
    defaultBadgeEn: 'New member',
  },
  'admin-login': {
    ar: 'دخول الإدارة',
    en: 'Admin login',
    descAr: 'مظهر صفحة دخول لوحة التحكم',
    descEn: 'Admin panel login look',
    icon: Shield,
    route: '/admin',
    defaultTitleAr: 'لوحة الإدارة',
    defaultTitleEn: 'Admin panel',
    defaultSubtitleAr: 'دخول آمن للمديرين فقط',
    defaultSubtitleEn: 'Secure access for administrators',
    defaultBadgeAr: 'CIAR Admin',
    defaultBadgeEn: 'CIAR Admin',
  },
};

function AdminField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-[var(--admin-text)] mb-1">{label}</div>
      {hint ? <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">{hint}</p> : null}
      {children}
    </label>
  );
}

function ChoiceRow<T extends string>({
  isAr,
  value,
  options,
  onChange,
}: {
  isAr: boolean;
  value: T;
  options: Array<{ value: T; ar: string; en: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            value === opt.value
              ? 'bg-[#f5c97b]/20 border-[#f5c97b]/45 text-[#f5c97b] shadow-[0_0_20px_rgba(245,201,123,0.12)]'
              : 'border-white/10 text-[var(--admin-text-mute)] hover:bg-white/[0.04] hover:text-[var(--admin-text)]'
          }`}
        >
          {tx(isAr, opt.ar, opt.en)}
        </button>
      ))}
    </div>
  );
}

function pageHasCustomContent(entry: PageContentEntry): boolean {
  return Boolean(
    entry.title?.trim() ||
      entry.subtitle?.trim() ||
      entry.badgeText?.trim() ||
      entry.backgroundImageUrl?.trim() ||
      (entry.backgroundImageUrls?.length ?? 0) > 0 ||
      entry.hideBadge ||
      (entry.textAlign && entry.textAlign !== 'center') ||
      (entry.titleSize && entry.titleSize !== 'lg') ||
      (typeof entry.overlayOpacity === 'number' && entry.overlayOpacity !== 58) ||
      (entry.contentMaxWidth && entry.contentMaxWidth !== 'xl')
  );
}

/** Matches the public PageHero / home banner as closely as possible. */
function SiteHeroPreview({
  isAr,
  config,
  entry,
  pageKey,
}: {
  isAr: boolean;
  config: PageConfig;
  entry: PageContentEntry;
  pageKey: ManagedPageKey;
}) {
  const images = getPagePreviewImages(pageKey, entry);
  const activeImage = getPagePreviewImage(pageKey, entry);
  const textAlign = entry.textAlign ?? 'center';
  const titleSize = entry.titleSize ?? 'lg';
  const overlayOpacity = Math.min(Math.max(Number(entry.overlayOpacity ?? 58), 0), 95);
  const contentMaxWidth = entry.contentMaxWidth ?? 'xl';

  const title = entry.title?.trim() || tx(isAr, config.defaultTitleAr, config.defaultTitleEn);
  const subtitle = entry.subtitle?.trim() || tx(isAr, config.defaultSubtitleAr, config.defaultSubtitleEn);
  const badge = entry.hideBadge
    ? null
    : entry.badgeText?.trim() || tx(isAr, config.defaultBadgeAr, config.defaultBadgeEn);

  const alignClass = textAlign === 'start' ? 'text-start items-start' : textAlign === 'end' ? 'text-end items-end' : 'text-center items-center';
  const titleSizeClass =
    titleSize === 'md' ? 'text-2xl sm:text-3xl' : titleSize === 'xl' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl lg:text-4xl';
  const maxWClass =
    contentMaxWidth === 'md' ? 'max-w-md' : contentMaxWidth === 'lg' ? 'max-w-2xl' : 'max-w-4xl';

  return (
    <div className="rounded-2xl overflow-hidden border border-[#f5c97b]/20 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <section className={`page-hero-luxe relative overflow-hidden px-4 py-16 sm:py-20 ${alignClass.includes('start') ? '' : ''}`}>
        <div className="absolute inset-0">
          <div className="page-hero-img absolute inset-0 opacity-100" style={{ backgroundImage: `url(${activeImage})` }} />
        </div>
        <div className="page-hero-overlay absolute inset-0" style={{ opacity: overlayOpacity / 100 }} />
        <div className="absolute top-6 -end-16 h-48 w-48 rounded-full bg-amber-500/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-6 -start-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className={`relative z-10 mx-auto w-full ${maxWClass} flex flex-col ${alignClass}`}>
          {badge && (
            <span className="estate-hero-badge mb-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em]">
              {badge}
            </span>
          )}
          <h3 className={`page-hero-title font-heading font-bold ${titleSizeClass}`}>{title}</h3>
          {subtitle && (
            <p className={`mt-3 text-sm sm:text-base leading-relaxed text-white/80 ${textAlign === 'center' ? 'max-w-xl mx-auto' : 'max-w-2xl'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </section>
      {images.length > 1 && (
        <div className="px-3 py-2 bg-black/40 border-t border-white/10 flex gap-1.5 overflow-x-auto">
          {images.slice(0, 5).map((src, i) => (
            <div
              key={src}
              className={`h-10 w-14 shrink-0 rounded-md bg-cover bg-center border ${src === activeImage ? 'border-[#f5c97b]' : 'border-white/15'}`}
              style={{ backgroundImage: `url(${src})` }}
              title={tx(isAr, `صورة ${i + 1}`, `Image ${i + 1}`)}
            />
          ))}
          {images.length > 5 && (
            <span className="text-[10px] text-white/50 self-center px-1">+{images.length - 5}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentManagerTab({ isAr }: { isAr: boolean }) {
  const router = useRouter();
  const { contentSettings, updatePageContent, resetPageContent, designSettings } = useAppStore();
  const contentManagerTargetPage = useAppStore((s) => s.contentManagerTargetPage);
  const setContentManagerTargetPage = useAppStore((s) => s.setContentManagerTargetPage);
  const [editingPage, setEditingPage] = useState<ManagedPageKey | null>(null);
  const [editorStep, setEditorStep] = useState<EditorStep>('texts');
  const [backgroundUrlDraft, setBackgroundUrlDraft] = useState('');

  useEffect(() => {
    if (!contentManagerTargetPage) return;
    setEditingPage(contentManagerTargetPage);
    setEditorStep('texts');
    setContentManagerTargetPage(null);
  }, [contentManagerTargetPage, setContentManagerTargetPage]);

  const pageKey = editingPage ?? 'home';
  const config = PAGE_CONFIG[pageKey];
  const entry = contentSettings[pageKey];
  const stockImages = DEFAULT_PAGE_HERO_IMAGES[pageKey];
  const userImages = getPagePreviewImages(pageKey, entry).filter(
    (url) => !stockImages.includes(url) || entry.backgroundImageUrl === url || entry.backgroundImageUrls?.includes(url)
  );
  const galleryImages = getPagePreviewImages(pageKey, entry);
  const isCustom = pageHasCustomContent(entry);
  const PageIcon = config.icon;

  const update = (partial: Partial<PageContentEntry>) => updatePageContent(pageKey, partial);

  const handleSetPrimary = (url: string) => {
    update({ backgroundImageUrl: url, backgroundImageUrls: galleryImages.includes(url) ? galleryImages : [...galleryImages, url] });
    toast.success(tx(isAr, 'تم تعيين الغلاف', 'Cover updated'));
  };

  const handleRemoveImage = (url: string) => {
    const next = galleryImages.filter((item) => item !== url);
    update({
      backgroundImageUrls: next,
      backgroundImageUrl: entry.backgroundImageUrl?.trim() === url ? next[0] ?? '' : entry.backgroundImageUrl ?? '',
    });
  };

  const addImageToGallery = (nextUrl: string) => {
    const next = Array.from(new Set([...galleryImages, nextUrl]));
    update({
      backgroundImageUrl: entry.backgroundImageUrl?.trim() || nextUrl,
      backgroundImageUrls: next,
    });
    setBackgroundUrlDraft('');
    toast.success(tx(isAr, 'تمت إضافة الصورة', 'Image added'));
  };

  const handleAddUrl = () => {
    const nextUrl = backgroundUrlDraft.trim();
    if (!nextUrl) return;
    addImageToGallery(nextUrl);
  };

  const steps: Array<{ id: EditorStep; ar: string; en: string; icon: LucideIcon }> = [
    { id: 'texts', ar: 'النصوص والعناوين', en: 'Texts & headings', icon: Type },
    { id: 'cover', ar: 'صور الغلاف', en: 'Cover images', icon: ImageIcon },
    { id: 'layout', ar: 'الشكل والمقاسات', en: 'Layout & sizing', icon: Layout },
  ];

  /* ─── Page grid (landing) ─── */
  if (!editingPage) {
    return (
      <div className="space-y-5">
        <div className="admin-card p-5 sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c97b]/30 bg-[#f5c97b]/10 px-3 py-1 text-[11px] font-semibold text-[#f5c97b] mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            {tx(isAr, 'إدارة مظهر الموقع', 'Manage site appearance')}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tx(isAr, 'محتوى الصفحات', 'Page content')}</h1>
          <p className="text-sm text-[var(--admin-text-mute)] mt-2 max-w-2xl">
            {tx(
              isAr,
              'كل بطاقة تمثل صفحة حقيقية على موقعك. اضغط على أي بطاقة لفتح محرّرها الكامل — بنر، خلفيات، نصوص، وأحجام.',
              'Each card is a real page on your site. Click any card to open its full editor — banner, backgrounds, text, and sizes.',
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(Object.keys(PAGE_CONFIG) as ManagedPageKey[]).map((page) => {
            const cfg = PAGE_CONFIG[page];
            const pageEntry = contentSettings[page];
            const Icon = cfg.icon;
            const thumb = getPagePreviewImage(page, pageEntry);
            const custom = pageHasCustomContent(pageEntry);

            return (
              <button
                key={page}
                type="button"
                onClick={() => {
                  setEditingPage(page);
                  setEditorStep('texts');
                }}
                className="group admin-card p-0 text-start overflow-hidden transition-all hover:border-[#f5c97b]/40 hover:shadow-[0_12px_40px_rgba(245,201,123,0.12)]"
              >
                <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url('${thumb}')` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                  <div className="absolute top-2 end-2">
                    <span className={`admin-pill text-[9px] ${custom ? 'admin-pill-up' : 'admin-pill-down'}`}>
                      {custom ? tx(isAr, 'مخصص', 'Custom') : tx(isAr, 'افتراضي', 'Default')}
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-black/50 border border-[#f5c97b]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="h-4 w-4 text-[#f5c97b]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate">{tx(isAr, cfg.ar, cfg.en)}</div>
                        <div className="text-[10px] text-white/70 truncate">
                          {pageEntry.title?.trim() || tx(isAr, cfg.defaultTitleAr, cfg.defaultTitleEn)}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#f5c97b]/80 shrink-0 group-hover:translate-x-[-2px] transition-transform rtl:rotate-180" />
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-white/5">
                  <p className="text-[11px] text-[var(--admin-text-faint)] line-clamp-2">{tx(isAr, cfg.descAr, cfg.descEn)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─── Full page editor ─── */
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setEditingPage(null)}
        className="inline-flex items-center gap-2 text-sm text-[#f5c97b] hover:text-[#fde9bd] transition-colors"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {tx(isAr, 'العودة لكل الصفحات', 'Back to all pages')}
      </button>

      <div className="admin-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#f5c97b]/15 border border-[#f5c97b]/35 flex items-center justify-center">
              <PageIcon className="h-6 w-6 text-[#f5c97b]" />
            </div>
            <div>
              <p className="text-xs text-[var(--admin-text-faint)]">{tx(isAr, 'محرّر الصفحة', 'Page editor')}</p>
              <h1 className="font-heading text-2xl font-bold">{tx(isAr, config.ar, config.en)}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="admin-icon-btn !w-auto px-4 text-xs gap-1.5" onClick={() => router.push(config.route)}>
              <ExternalLink className="h-3.5 w-3.5" />
              {tx(isAr, 'فتح على الموقع', 'Open on site')}
            </button>
            <button
              type="button"
              className="admin-icon-btn !w-auto px-4 text-xs gap-1.5"
              onClick={() => {
                resetPageContent(pageKey);
                toast.success(tx(isAr, 'عادت للوضع الافتراضي', 'Restored to defaults'));
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {tx(isAr, 'استعادة الافتراضي', 'Restore defaults')}
            </button>
          </div>
        </div>

        {/* Live preview — top, full width, exactly like site */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--admin-text-faint)] mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#f5c97b]" />
            {tx(isAr, 'معاينة — كما يظهر على الموقع', 'Preview — exactly as on the site')}
          </p>
          <SiteHeroPreview isAr={isAr} config={config} entry={entry} pageKey={pageKey} />
        </div>

        {/* Step tabs */}
        <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-white/10">
          {steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setEditorStep(step.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  editorStep === step.id
                    ? 'bg-[#f5c97b]/20 border-[#f5c97b]/40 text-[#f5c97b]'
                    : 'border-white/10 text-[var(--admin-text-mute)] hover:bg-white/[0.04]'
                }`}
              >
                <StepIcon className="h-4 w-4" />
                {tx(isAr, step.ar, step.en)}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {editorStep === 'texts' && (
              <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <AdminField
                  label={tx(isAr, 'العنوان الرئيسي', 'Main heading')}
                  hint={tx(isAr, 'الخط الذهبي الكبير في أعلى الصفحة', 'The large gold heading at the top')}
                >
                  <input
                    className="admin-input text-lg"
                    value={entry.title ?? ''}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder={tx(isAr, config.defaultTitleAr, config.defaultTitleEn)}
                  />
                </AdminField>
                <AdminField
                  label={tx(isAr, 'النص التوضيحي', 'Description')}
                  hint={tx(isAr, 'سطر أو سطران تحت العنوان', 'One or two lines under the heading')}
                >
                  <textarea
                    className="admin-input min-h-[80px]"
                    value={entry.subtitle ?? ''}
                    onChange={(e) => update({ subtitle: e.target.value })}
                    placeholder={tx(isAr, config.defaultSubtitleAr, config.defaultSubtitleEn)}
                  />
                </AdminField>
                <AdminField
                  label={tx(isAr, 'الشارة الصغيرة', 'Small badge')}
                  hint={tx(isAr, 'نص صغير فوق العنوان — اختياري', 'Tiny label above title — optional')}
                >
                  <input
                    className="admin-input"
                    value={entry.badgeText ?? ''}
                    onChange={(e) => update({ badgeText: e.target.value })}
                    placeholder={tx(isAr, config.defaultBadgeAr, config.defaultBadgeEn)}
                  />
                </AdminField>
                <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-white/10 px-4 py-3 hover:bg-white/[0.03]">
                  <input type="checkbox" checked={Boolean(entry.hideBadge)} onChange={(e) => update({ hideBadge: e.target.checked })} />
                  <span className="text-sm">{tx(isAr, 'إخفاء الشارة الصغيرة', 'Hide small badge')}</span>
                </label>
              </div>
            )}

            {editorStep === 'cover' && (
              <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div>
                  <h3 className="font-semibold mb-1">{tx(isAr, 'صور جاهزة لهذه الصفحة', 'Ready-made covers for this page')}</h3>
                  <p className="text-xs text-[var(--admin-text-faint)] mb-3">
                    {tx(isAr, 'اضغط على أي صورة لتعيينها كغلاف — كل صفحة لها صور مختلفة', 'Click any image to set as cover — each page has unique photos')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {stockImages.map((url) => {
                      const isActive = getPagePreviewImage(pageKey, entry) === url;
                      return (
                        <button
                          key={url}
                          type="button"
                          onClick={() => handleSetPrimary(url)}
                          className={`relative h-24 rounded-xl bg-cover bg-center border-2 overflow-hidden transition-all hover:scale-[1.02] ${
                            isActive ? 'border-[#f5c97b] ring-2 ring-[#f5c97b]/30' : 'border-white/10'
                          }`}
                          style={{ backgroundImage: `url('${url}')` }}
                        >
                          {isActive && (
                            <span className="absolute bottom-1 inset-x-1 text-[9px] font-bold text-center bg-black/60 rounded py-0.5 text-[#f5c97b]">
                              {tx(isAr, 'الغلاف الحالي', 'Current cover')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="font-semibold mb-2">{tx(isAr, 'صورك الخاصة', 'Your own images')}</h3>
                  <p className="text-[11px] text-[var(--admin-text-faint)] mb-3">
                    {tx(isAr, 'الصق رابطاً أو ارفع من جهازك — ثم اضغط «إضافة»', 'Paste a link or upload from device — then click Add')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <ImageUrlInput
                        isAr={isAr}
                        value={backgroundUrlDraft}
                        onChange={setBackgroundUrlDraft}
                        placeholder={tx(isAr, 'الصق رابط الصورة', 'Paste image URL')}
                        onUploadSuccess={addImageToGallery}
                        uploadLabel={tx(isAr, 'رفع', 'Upload')}
                      />
                    </div>
                    <button type="button" className="admin-btn-premium !text-xs !py-2 shrink-0" onClick={handleAddUrl}>
                      {tx(isAr, 'إضافة', 'Add')}
                    </button>
                  </div>
                  {userImages.filter((u) => !stockImages.includes(u) || entry.backgroundImageUrls?.includes(u)).length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {galleryImages
                        .filter((url) => !stockImages.includes(url) || entry.backgroundImageUrls?.includes(url))
                        .map((url) => (
                          <div key={url} className="relative h-20 rounded-lg bg-cover bg-center border border-white/10" style={{ backgroundImage: `url('${url}')` }}>
                            <button type="button" className="absolute top-1 end-1 admin-icon-btn !h-7 !w-7 text-rose-300" onClick={() => handleRemoveImage(url)}>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--admin-text-faint)]">{tx(isAr, 'لم ترفع صوراً إضافية بعد', 'No extra uploads yet')}</p>
                  )}
                </div>
              </div>
            )}

            {editorStep === 'layout' && (
              <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <AdminField label={tx(isAr, 'محاذاة النص', 'Text alignment')} hint={tx(isAr, 'أين يظهر العنوان على البanner', 'Where the heading sits on the banner')}>
                  <ChoiceRow
                    isAr={isAr}
                    value={entry.textAlign ?? 'center'}
                    onChange={(v) => update({ textAlign: v })}
                    options={[
                      { value: 'start', ar: 'يمين', en: 'Right' },
                      { value: 'center', ar: 'وسط', en: 'Center' },
                      { value: 'end', ar: 'يسار', en: 'Left' },
                    ]}
                  />
                </AdminField>
                <AdminField label={tx(isAr, 'حجم العنوان', 'Heading size')}>
                  <ChoiceRow
                    isAr={isAr}
                    value={entry.titleSize ?? 'lg'}
                    onChange={(v) => update({ titleSize: v })}
                    options={[
                      { value: 'md', ar: 'متوسط', en: 'Medium' },
                      { value: 'lg', ar: 'كبير', en: 'Large' },
                      { value: 'xl', ar: 'ضخم', en: 'Extra large' },
                    ]}
                  />
                </AdminField>
                <AdminField label={tx(isAr, 'عرض منطقة النص', 'Text width')}>
                  <ChoiceRow
                    isAr={isAr}
                    value={entry.contentMaxWidth ?? 'xl'}
                    onChange={(v) => update({ contentMaxWidth: v })}
                    options={[
                      { value: 'md', ar: 'ضيق', en: 'Narrow' },
                      { value: 'lg', ar: 'متوسط', en: 'Medium' },
                      { value: 'xl', ar: 'واسع', en: 'Wide' },
                    ]}
                  />
                </AdminField>
                <AdminField label={tx(isAr, 'تعتيم الخلفية', 'Background dimming')} hint={tx(isAr, 'أكثر = نص أوضح فوق الصورة', 'Higher = clearer text on photo')}>
                  <input type="range" min={20} max={90} className="w-full accent-[#f5c97b]" value={Math.min(Math.max(Number(entry.overlayOpacity ?? 58), 20), 90)} onChange={(e) => update({ overlayOpacity: Number(e.target.value) })} />
                  <p className="text-xs text-end text-[var(--admin-text-faint)] mt-1">{entry.overlayOpacity ?? 58}%</p>
                </AdminField>

                <div className="rounded-xl border border-white/10 p-4 flex items-center gap-3">
                  <Palette className="h-5 w-5 text-[#f5c97b] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tx(isAr, 'ألوان الهوية العامة', 'Global brand colors')}</p>
                    <p className="text-[11px] text-[var(--admin-text-faint)]">{tx(isAr, 'الذهبي والأساسي يُعدّلان من الإعدادات', 'Gold & primary colors are in Settings')}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className="h-8 w-8 rounded-lg border border-white/20" style={{ backgroundColor: designSettings.primaryColor }} title={designSettings.primaryColor} />
                    <span className="h-8 w-8 rounded-lg border border-white/20" style={{ backgroundColor: designSettings.accentColor }} title={designSettings.accentColor} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 h-fit lg:sticky lg:top-4">
            <h3 className="font-semibold text-sm">{tx(isAr, 'ملخص التغييرات', 'Changes summary')}</h3>
            <ul className="text-sm space-y-2 text-[var(--admin-text-mute)]">
              <li className="flex justify-between gap-2">
                <span>{tx(isAr, 'العنوان', 'Title')}</span>
                <span className="font-medium text-[var(--admin-text)] truncate max-w-[55%]">{entry.title?.trim() || tx(isAr, 'افتراضي', 'Default')}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>{tx(isAr, 'الغلاف', 'Cover')}</span>
                <span className={`admin-pill text-[10px] ${entry.backgroundImageUrl?.trim() ? 'admin-pill-up' : 'admin-pill-down'}`}>
                  {entry.backgroundImageUrl?.trim() ? tx(isAr, 'مخصص', 'Custom') : tx(isAr, 'جاهز', 'Stock')}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>{tx(isAr, 'حالة الصفحة', 'Page status')}</span>
                <span className={`admin-pill text-[10px] ${isCustom ? 'admin-pill-up' : 'admin-pill-down'}`}>
                  {isCustom ? tx(isAr, 'معدّلة', 'Modified') : tx(isAr, 'افتراضية', 'Default')}
                </span>
              </li>
            </ul>
            <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 pt-2 border-t border-white/10">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {tx(isAr, 'يُحفظ تلقائياً فور التعديل', 'Saves automatically as you edit')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
