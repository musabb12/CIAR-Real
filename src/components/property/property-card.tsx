'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Property, ListingType, PropertyStatus } from '@/types';
import { useAppStore } from '@/store/app-store';

// ============================================================
// Helpers
// ============================================================

/** Format a number with commas: 12500000 → "12,500,000" */
function formatPrice(num: number): string {
  return num.toLocaleString('en-US');
}

/** Human-readable label for listing types */
const listingLabels: Record<ListingType, string> = {
  SALE: 'For Sale',
  RENT: 'For Rent',
  SHORT_TERM: 'Short-term',
};

/** Color classes per listing type */
const listingColors: Record<ListingType, string> = {
  SALE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  RENT: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  SHORT_TERM: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
};

/** Human-readable label for property types */
function formatPropertyType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

/** Status color map */
const statusConfig: Record<PropertyStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: 'Available',
    className: 'bg-emerald-500/90 text-white',
  },
  SOLD: {
    label: 'Sold',
    className: 'bg-red-500/90 text-white',
  },
  RENTED: {
    label: 'Rented',
    className: 'bg-orange-500/90 text-white',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-500/90 text-white',
  },
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

  const { setCurrentPage, setSelectedPropertyId, toggleFavorite, isFavorite } =
    useAppStore();

  const coverUrl = getCoverImage(property);
  const favorited = isFavorite(property.id);
  const currency = property.country?.currencySymbol ?? '$';
  const statusInfo = statusConfig[property.status];

  // ---- Handlers ----
  const handleCardClick = () => {
    setSelectedPropertyId(property.id);
    setCurrentPage('property-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  // ---- Render ----
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden rounded-xl border-0 py-0 shadow-md transition-shadow duration-300 hover:shadow-xl dark:shadow-gray-900/40"
        onClick={handleCardClick}
      >
        {/* ---- Image Section ---- */}
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          {/* Lazy-loaded image */}
          {coverUrl && !imgError ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 animate-pulse bg-muted" />
              )}
              <img
                src={coverUrl}
                alt={property.title}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            /* Fallback */
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Building2 className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Top badges row */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {/* Listing type badge */}
            <Badge
              className={`${listingColors[property.listingType]} border text-xs font-semibold`}
            >
              {listingLabels[property.listingType]}
            </Badge>

            {/* Property type badge */}
            <Badge variant="secondary" className="border text-xs font-medium">
              {formatPropertyType(property.propertyType)}
            </Badge>
          </div>

          {/* Featured badge */}
          {property.isFeatured && (
            <div className="absolute left-3 bottom-3">
              <Badge className="border-0 bg-amber-500/90 text-xs font-semibold text-white">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Featured
              </Badge>
            </div>
          )}

          {/* Status badge */}
          {property.status !== 'AVAILABLE' && (
            <div className="absolute left-3 top-[60px] sm:top-[52px]">
              <Badge className={`border-0 text-xs font-semibold ${statusInfo.className}`}>
                {statusInfo.label}
              </Badge>
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50 hover:scale-110"
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                favorited
                  ? 'fill-red-500 text-red-500'
                  : 'fill-none text-white'
              }`}
            />
          </button>

          {/* Price tag at bottom of image */}
          <div className="absolute right-3 bottom-3">
            <div className="rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-base font-bold text-white">
                {currency}
                {formatPrice(property.price)}
              </span>
              {property.listingType === 'RENT' && (
                <span className="ml-1 text-xs text-white/70">/mo</span>
              )}
              {property.listingType === 'SHORT_TERM' && (
                <span className="ml-1 text-xs text-white/70">/mo</span>
              )}
            </div>
          </div>
        </div>

        {/* ---- Content Section ---- */}
        <CardContent className="space-y-3 p-4">
          {/* Title */}
          <h3 className="line-clamp-1 text-sm font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs">
              {[property.city?.name, property.region?.name, property.country?.name]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>

          {/* Stats row: beds, baths, area */}
          <div className="flex items-center gap-3 text-muted-foreground">
            {property.bedrooms != null && property.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms != null && property.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{property.bathrooms}</span>
              </div>
            )}
            {property.area > 0 && (
              <div className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{property.area} m²</span>
              </div>
            )}
          </div>

          {/* Bottom row: views + CTA */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs">{property.views}</span>
            </div>

            <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View Details
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
