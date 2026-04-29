'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Eye,
  ArrowRight,
  Star,
  Building2,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Property, ListingType, PropertyStatus } from '@/types';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';

// ============================================================
// Helpers
// ============================================================

/** Format a number with commas: 12500000 → "12,500,000" */
function formatPrice(num: number): string {
  return num.toLocaleString('en-US');
}

/** Listing type to translation key mapping */
const listingTypeKeys: Record<ListingType, keyof import('@/lib/i18n/translations').Translations['property']> = {
  SALE: 'forSale',
  RENT: 'forRent',
  SHORT_TERM: 'shortTerm',
};

/** Gradient background classes per listing type badge */
const listingGradients: Record<ListingType, string> = {
  SALE: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
  RENT: 'bg-gradient-to-r from-teal-600 to-cyan-500',
  SHORT_TERM: 'bg-gradient-to-r from-amber-600 to-amber-500',
};

/** Human-readable label for property types */
function formatPropertyType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

/** Status to translation key mapping */
const statusKeys: Record<PropertyStatus, keyof import('@/lib/i18n/translations').Translations['status']> = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RENTED: 'rented',
  PENDING: 'pending',
};

/** Status color dot classes */
const statusDotColors: Record<PropertyStatus, string> = {
  AVAILABLE: 'bg-emerald-500',
  SOLD: 'bg-red-500',
  RENTED: 'bg-orange-500',
  PENDING: 'bg-yellow-500',
};

/** Get cover image from property images */
function getCoverImage(property: Property): string | null {
  if (property.images && property.images.length > 0) {
    const cover = property.images.find((img) => img.isCover);
    return cover?.url ?? property.images[0].url;
  }
  return null;
}

// ============================================================
// Component
// ============================================================

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const { setCurrentPage, setSelectedPropertyId, toggleFavorite, isFavorite } =
    useAppStore();
  const { t } = useTranslation();

  const coverUrl = getCoverImage(property);
  const favorited = isFavorite(property.id);
  const currency = property.country?.currencySymbol ?? '$';
  const imageCount = property.images?.length ?? 0;
  const agentName = property.agent?.user?.name ?? null;
  const agentAvatar = property.agent?.user?.avatar ?? null;
  const isAvailable = property.status === 'AVAILABLE';
  const isRent =
    property.listingType === 'RENT' || property.listingType === 'SHORT_TERM';

  // ---- 3D Tilt Handlers ----
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const card = cardRef.current;
    card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    card.style.transform =
      'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';

    setTimeout(() => {
      if (card) card.style.transition = '';
    }, 500);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = 'none';
  }, []);

  // ---- Handlers ----
  const handleCardClick = () => {
    setSelectedPropertyId(property.id);
    setCurrentPage('property-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(property.id);
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 400);
  };

  // ---- Render ----
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="perspective-container"
    >
      <div
        ref={cardRef}
        className="card-3d"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <Card
          className="group glass-card cursor-pointer overflow-hidden rounded-xl border-0 py-0 shadow-md dark:shadow-gray-900/40"
          onClick={handleCardClick}
        >
          {/* ================================================================
              IMAGE SECTION
          ================================================================ */}
          <div className="relative h-56 w-full overflow-hidden bg-muted sm:h-60">
            {/* Shimmer loading skeleton */}
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 shimmer" />
            )}

            {/* Property image */}
            {coverUrl && !imgError ? (
              <img
                src={coverUrl}
                alt={property.title}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Building2 className="h-14 w-14 text-muted-foreground/30" />
              </div>
            )}

            {/* Gradient overlay — bottom heavy for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* ------ TOP-LEFT: Listing type + Property type badges ------ */}
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              <Badge className={`${listingGradients[property.listingType]} border-0 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg`}>
                {t.property[listingTypeKeys[property.listingType]]}
              </Badge>
              <Badge className="border border-white/25 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                {formatPropertyType(property.propertyType)}
              </Badge>
            </div>

            {/* ------ TOP-LEFT (below badges): Status indicator ------ */}
            {property.status !== 'AVAILABLE' && (
              <div className="absolute left-3 top-[72px] flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${statusDotColors[property.status]} animate-pulse`} />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90 drop-shadow-md">
                  {t.status[statusKeys[property.status]]}
                </span>
              </div>
            )}

            {/* ------ AVAILABLE status pulsing dot (subtle) ------ */}
            {isAvailable && (
              <div className="absolute left-3 bottom-[72px] flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80 drop-shadow-md">
                  {t.status.available}
                </span>
              </div>
            )}

            {/* ------ Featured star badge with shimmer ------ */}
            {property.isFeatured && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                className="absolute left-1/2 top-3 -translate-x-1/2"
              >
                <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-3 py-1 shadow-lg shadow-amber-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmerSlide_2.5s_ease-in-out_infinite]" />
                  <span className="relative flex items-center gap-1 text-[11px] font-bold text-amber-900">
                    <Star className="h-3 w-3 fill-current" />
                    {t.property.featured}
                  </span>
                </div>
              </motion.div>
            )}

            {/* ------ TOP-RIGHT: Favorite heart button ------ */}
            <motion.button
              onClick={handleFavoriteClick}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center glass-badge rounded-full transition-colors hover:bg-black/50"
              whileTap={{ scale: 0.8 }}
              animate={heartBurst ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`h-[18px] w-[18px] transition-colors duration-200 ${
                  favorited
                    ? 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                    : 'fill-none text-white'
                }`}
              />
            </motion.button>

            {/* ------ BOTTOM-RIGHT: Price tag with glass + Image counter ------ */}
            <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1.5">
              {/* Glass price tag */}
              <div className="glass-badge rounded-xl px-3 py-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white drop-shadow-sm">
                  {currency}
                  {formatPrice(property.price)}
                </span>
                {isRent && (
                  <span className="ml-1 text-[11px] font-medium text-white/60">
                    {t.property.perMonth}
                  </span>
                )}
              </div>

              {/* Image counter */}
              {imageCount > 1 && (
                <div className="flex items-center gap-1 glass-badge rounded-lg px-2 py-0.5">
                  <Eye className="h-3 w-3 text-white/70" />
                  <span className="text-[10px] font-medium text-white/70">
                    {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ================================================================
              CONTENT SECTION
          ================================================================ */}
          <CardContent className="relative space-y-2.5 p-4 pt-3.5">
            {/* Title with gradient hover effect */}
            <h3 className="property-card-title line-clamp-1 text-sm font-bold leading-snug tracking-tight text-foreground">
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate text-xs font-medium">
                {[property.city?.name, property.region?.name, property.country?.name]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>

            {/* Gradient separator */}
            <div className="gradient-divider" />

            {/* Stats row: beds, baths, area */}
            <div className="flex items-center gap-4 text-muted-foreground">
              {property.bedrooms != null && property.bedrooms > 0 && (
                <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1">
                  <Bed className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs font-semibold tabular-nums">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms != null && property.bathrooms > 0 && (
                <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1">
                  <Bath className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs font-semibold tabular-nums">{property.bathrooms}</span>
                </div>
              )}
              {property.area > 0 && (
                <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1">
                  <Maximize className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs font-semibold tabular-nums">
                    {formatPrice(property.area)} {t.property.sqm}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom row: Agent avatar + "View Details" CTA */}
            <div className="flex items-center justify-between pt-1">
              {/* Agent info */}
              <div className="flex items-center gap-2">
                {agentAvatar ? (
                  <img
                    src={agentAvatar}
                    alt={agentName ?? 'Agent'}
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <span className="max-w-[100px] truncate text-[11px] font-medium text-muted-foreground">
                  {agentName ?? 'Agent'}
                </span>
              </div>

              {/* View Details — slides in on hover */}
              <motion.span
                className="flex items-center gap-1 text-xs font-semibold text-primary"
                initial={{ opacity: 0, x: 12 }}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.25 }}
              >
                <span className="hidden opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:inline">
                  {t.property.viewDetails}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.span>
            </div>

            {/* Subtle hover glow overlay */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
