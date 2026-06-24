'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Heart, HeartOff, LogIn, Search, ArrowRight, Building2,
  Trash2, MapPin, Bed, Bath, Maximize,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useLocalizedCountryName } from '@/hooks/use-localized-country-name';
import { useSiteCurrency } from '@/hooks/use-site-currency';
import { PageHero } from '@/components/layout/page-hero';
import type { Favorite, Property } from '@/types';

// ─── Component ──────────────────────────────────────────────────
export function FavoritesPage() {
  const { t } = useTranslation();
  const countryLabel = useLocalizedCountryName();
  const { formatPrice } = useSiteCurrency();
  const {
    isAuthenticated,
    currentUser,
    favorites,
    setFavorites,
    removeFavorite,
    setCurrentPage,
    setSelectedPropertyId,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [favoritesWithProperties, setFavoritesWithProperties] = useState<Favorite[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Fetch favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setFavoritesWithProperties(Array.isArray(data) ? data : []);
        if (Array.isArray(data)) setFavorites(data);
      }
    } catch {
      // Use store favorites as fallback
    } finally {
      setLoading(false);
    }
  }, [currentUser, setFavorites]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser, fetchFavorites]);

  // Handle remove favorite
  const handleRemove = async (favorite: Favorite) => {
    if (!currentUser) return;
    setRemovingId(favorite.id);

    try {
      await fetch(`/api/favorites?userId=${currentUser.id}&propertyId=${favorite.propertyId}`, {
        method: 'DELETE',
      });
    } catch {
      // Optimistic removal
    }

    removeFavorite(favorite.propertyId);
    setFavoritesWithProperties((prev) => prev.filter((f) => f.id !== favorite.id));
    setRemovingId(null);
  };

  // Navigate to property
  const handlePropertyClick = (property: Property) => {
    setSelectedPropertyId(property.id);
    setCurrentPage('property-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Not Authenticated ───
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-8 sm:p-12 max-w-md w-full text-center animate-scale-in">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-900/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">{t.favorites.signInToView}</h2>
          <p className="text-muted-foreground text-sm mb-8">{t.favorites.signInMessage}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => setCurrentPage('home')} className="rounded-xl bg-gradient-to-r from-primary to-primary/80">
              <LogIn className="h-4 w-4 mr-2" />
              {t.auth.signIn}
            </Button>
            <Button variant="outline" onClick={() => setCurrentPage('search')} className="rounded-xl">
              {t.favorites.browseProperties}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Authenticated ───
  return (
    <div className="min-h-screen">
      <PageHero
        variant="favorites"
        icon={Heart}
        badgeText={t.favorites.myFavorites}
        title={t.favorites.title}
        subtitle={`${favoritesWithProperties.length} ${t.property.viewDetails}`}
      />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ─── Loading ─── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : favoritesWithProperties.length === 0 ? (
          /* ─── Empty State ─── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <HeartOff className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">{t.favorites.noFavorites}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t.favorites.signInMessage}
            </p>
            <Button onClick={() => setCurrentPage('search')} className="rounded-xl">
              {t.favorites.browseProperties}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          /* ─── Favorites Grid ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritesWithProperties.map((favorite) => {
              const property = favorite.property;
              if (!property) return null;

              const coverUrl = property.images?.[0]?.url;
              const isRemoving = removingId === favorite.id;
              const isRent = property.listingType === 'RENT' || property.listingType === 'SHORT_TERM';

              return (
                <Card
                  key={favorite.id}
                  className={`glass-card rounded-2xl overflow-hidden border-0 group hover-lift-glow transition-all duration-300 ${
                    isRemoving ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  {/* Image */}
                  <div
                    className="relative h-48 w-full overflow-hidden cursor-pointer"
                    onClick={() => handlePropertyClick(property)}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Building2 className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Price */}
                    <div className="absolute bottom-3 right-3 glass-badge rounded-xl px-3 py-1.5">
                      <span className="text-base font-extrabold text-white">
                        {formatPrice(property.price, property.country?.currency)}
                      </span>
                      {isRent && (
                        <span className="ml-1 text-[10px] text-white/60">{t.property.perMonth}</span>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(favorite); }}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </button>

                    {/* Listing type badge */}
                    <Badge className={`absolute top-3 left-3 border-0 text-[10px] font-bold uppercase ${
                      property.listingType === 'SALE'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white'
                        : property.listingType === 'RENT'
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white'
                        : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white'
                    }`}>
                      {property.listingType === 'SALE' ? t.property.forSale : property.listingType === 'RENT' ? t.property.forRent : t.property.shortTerm}
                    </Badge>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4">
                    <h3
                      className="font-bold text-sm mb-1.5 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                      onClick={() => handlePropertyClick(property)}
                    >
                      {property.title}
                    </h3>

                    <div className="flex items-center gap-1 text-muted-foreground mb-3">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                      <span className="text-xs truncate">
                        {[property.city?.name, property.country ? countryLabel(property.country) : null]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>

                    <div className="gradient-divider mb-3" />

                    <div className="flex items-center gap-4 text-muted-foreground">
                      {property.bedrooms && (
                        <div className="flex items-center gap-1 text-xs">
                          <Bed className="h-3.5 w-3.5 text-primary/70" />
                          <span className="font-semibold">{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-1 text-xs">
                          <Bath className="h-3.5 w-3.5 text-primary/70" />
                          <span className="font-semibold">{property.bathrooms}</span>
                        </div>
                      )}
                      {property.area > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Maximize className="h-3.5 w-3.5 text-primary/70" />
                          <span className="font-semibold">{property.area} {t.property.sqm}</span>
                        </div>
                      )}
                    </div>

                    {/* Saved date */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(favorite.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handlePropertyClick(property)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        {t.property.viewDetails}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
