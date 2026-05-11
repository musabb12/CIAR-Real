'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { getPageBackgroundImages } from '@/lib/page-backgrounds';

/**
 * Curated luxurious header backdrops per page variant.
 * Each entry references high-resolution Unsplash photographs of
 * elite architecture/interiors — they pair well with a dark
 * cinematic overlay and gold/emerald accents.
 */
const HERO_IMAGES: Record<string, string[]> = {
  search: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2400&q=85&auto=format&fit=crop',
  ],
  agents: [
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=2400&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=2400&q=85&auto=format&fit=crop',
  ],
  contact: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2400&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=2400&q=80&auto=format&fit=crop',
  ],
  favorites: [
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=2400&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=2400&q=85&auto=format&fit=crop',
  ],
  property: [
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=2400&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=2400&q=85&auto=format&fit=crop',
  ],
  default: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2400&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=85&auto=format&fit=crop',
  ],
};

export type HeroVariant = keyof typeof HERO_IMAGES;

interface PageHeroProps {
  variant?: HeroVariant;
  /** Override a specific image URL */
  imageUrl?: string;
  /** Optional icon displayed in the badge */
  icon?: LucideIcon;
  /** Tag-line above the title */
  badgeText?: string;
  /** Main heading */
  title: string;
  /** Sub-heading */
  subtitle?: string;
  /** Optional content under the headings (search bar, filters, etc.) */
  children?: React.ReactNode;
  /** Tailwind padding class for vertical spacing — keep generous for luxury */
  paddingClass?: string;
}

/**
 * Cinematic page hero with rotating luxury photography, gradient sheen,
 * floating ambient orbs, and glassy gold-accented headline.
 *
 * Usage:
 *   <PageHero variant="search" badgeText={t.search.title}
 *             title={t.nav.properties} subtitle={t.hero.featuredSubtitle}>
 *     <SearchBar />
 *   </PageHero>
 */
export function PageHero({
  variant = 'default',
  imageUrl,
  icon: Icon,
  badgeText,
  title,
  subtitle,
  children,
  paddingClass = 'py-20 sm:py-24',
}: PageHeroProps) {
  const contentSettings = useAppStore((s) => s.contentSettings);
  const managedKey = variant as keyof typeof contentSettings;
  const pageOverride = contentSettings[managedKey];

  const effectiveTitle = pageOverride?.title?.trim() || title;
  const effectiveSubtitle = pageOverride?.subtitle?.trim() || subtitle;
  const effectiveBadgeText = pageOverride?.badgeText?.trim() || badgeText;
  const hideBadge = Boolean(pageOverride?.hideBadge);
  const textAlign = pageOverride?.textAlign ?? 'center';
  const titleSize = pageOverride?.titleSize ?? 'lg';
  const overlayOpacity = Math.min(Math.max(Number(pageOverride?.overlayOpacity ?? 58), 0), 95);
  const contentMaxWidth = pageOverride?.contentMaxWidth ?? 'xl';

  const alignClass = textAlign === 'start' ? 'text-start' : textAlign === 'end' ? 'text-end' : 'text-center';
  const alignItemsClass = textAlign === 'start' ? 'items-start' : textAlign === 'end' ? 'items-end' : 'items-center';
  const titleSizeClass = titleSize === 'md'
    ? 'text-3xl sm:text-4xl lg:text-5xl'
    : titleSize === 'xl'
      ? 'text-5xl sm:text-6xl lg:text-7xl'
      : 'text-4xl sm:text-5xl lg:text-6xl';
  const contentMaxWidthClass = contentMaxWidth === 'md'
    ? 'max-w-3xl'
    : contentMaxWidth === 'lg'
      ? 'max-w-5xl'
      : 'max-w-7xl';

  const images = getPageBackgroundImages(
    pageOverride,
    imageUrl ? [imageUrl] : (HERO_IMAGES[variant] ?? HERO_IMAGES.default)
  );
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % images.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <section
      className={`page-hero-luxe relative overflow-hidden px-4 ${paddingClass}`}
      aria-label={effectiveTitle}
    >
      {/* Image stack — crossfade between variants */}
      <div className="absolute inset-0">
        {images.map((src, i) => (
          <div
            key={src}
            className={`page-hero-img absolute inset-0 transition-opacity duration-[2200ms] ease-out ${
              i === activeIdx ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>

      {/* Tinted overlay so text remains readable on any photo */}
      <div className="page-hero-overlay absolute inset-0" style={{ opacity: overlayOpacity / 100 }} />
      {/* Floating gold/emerald orbs */}
      <div className="absolute top-10 -end-24 h-72 w-72 rounded-full bg-amber-500/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -start-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />

      {/* Foreground content */}
      <div className={`relative z-10 mx-auto ${contentMaxWidthClass} ${alignClass}`}>
        {effectiveBadgeText && !hideBadge && (
          <Badge
            variant="secondary"
            className="mb-4 inline-flex items-center gap-1.5 border-amber-300/30 bg-white/10 px-3 py-1.5 text-amber-100 backdrop-blur-md"
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            <span className="text-[12px] uppercase tracking-[0.18em]">{effectiveBadgeText}</span>
          </Badge>
        )}
        <h1 className={`page-hero-title font-heading ${titleSizeClass} font-bold tracking-tight text-white`}>
          {effectiveTitle}
        </h1>
        {effectiveSubtitle && (
          <p className={`mt-4 text-base leading-relaxed text-white/80 sm:text-lg ${textAlign === 'center' ? 'mx-auto max-w-2xl' : 'max-w-3xl'}`}>
            {effectiveSubtitle}
          </p>
        )}
        {children && <div className={`mt-8 flex ${alignItemsClass}`}>{children}</div>}
      </div>

    </section>
  );
}
