'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Building2, MapPin, Bed, Bath, Maximize, ArrowUpDown,
  Home, Castle, Landmark, Briefcase, Warehouse, Layers, Grid3X3,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PropertyCard } from '@/components/property/property-card';
import { PageHero } from '@/components/layout/page-hero';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { sortCountriesByLabel } from '@/lib/localize-country';
import { CountryFlagLabel } from '@/components/ui/country-flag-label';
import type { Property, Country, PaginatedResponse, PropertyFilters } from '@/types';
import { normalizeLocationsResponse } from '@/lib/normalize-locations';

// ─── Property type icons ────────────────────────────────────────
const propertyTypeIcons: Record<string, React.ElementType> = {
  APARTMENT: Building2,
  VILLA: Castle,
  HOUSE: Home,
  LAND: Landmark,
  OFFICE: Briefcase,
  COMMERCIAL: Warehouse,
  STUDIO: Layers,
  PENTHOUSE: Building2,
  TOWNHOUSE: Home,
  DUPLEX: Grid3X3,
};

// ─── Component ──────────────────────────────────────────────────
export function SearchPage() {
  const { t, locale } = useTranslation();
  const { filters, setFilters, resetFilters, setCurrentPage } = useAppStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const sortedCountries = useMemo(
    () => sortCountriesByLabel(countries, locale),
    [countries, locale],
  );
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [listingsBackend, setListingsBackend] = useState<'unknown' | 'live' | 'stub'>('unknown');
  const visitorGeoResolved = useAppStore((s) => s.visitorGeoResolved);

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.countryId) params.set('countryId', filters.countryId);
      if (filters.listingType) params.set('listingType', filters.listingType);
      if (filters.propertyType) params.set('propertyType', filters.propertyType);
      if (filters.priceMin) params.set('priceMin', String(filters.priceMin));
      if (filters.priceMax) params.set('priceMax', String(filters.priceMax));
      if (filters.bedrooms) params.set('bedrooms', String(filters.bedrooms));
      if (filters.bathrooms) params.set('bathrooms', String(filters.bathrooms));
      if (filters.areaMin) params.set('areaMin', String(filters.areaMin));
      if (filters.areaMax) params.set('areaMax', String(filters.areaMax));
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(filters.page || 1));
      params.set('limit', String(filters.limit || 12));

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as PaginatedResponse<Property> & {
          pagination?: { total: number; totalPages: number; page: number; limit: number };
          backendConfigured?: boolean;
        };
        setListingsBackend(data.backendConfigured === false ? 'stub' : 'live');
        setProperties(data.data ?? []);
        const total = data.pagination?.total ?? data.total ?? 0;
        const totalPages = data.pagination?.totalPages ?? data.totalPages ?? 1;
        setTotalResults(total);
        setTotalPages(totalPages);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch countries for filter dropdown
  useEffect(() => {
    fetch('/api/locations?includeProperties=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCountries(normalizeLocationsResponse(data)))
      .catch(() => setCountries([]));
  }, []);

  // Fetch properties after visitor country is resolved (IP-based default filter).
  useEffect(() => {
    if (!visitorGeoResolved) return;
    fetchProperties();
  }, [fetchProperties, visitorGeoResolved]);

  // Force search page to display up to 30 per page.
  useEffect(() => {
    if ((filters.limit ?? 30) === 30) return;
    setFilters({ limit: 30, page: 1 });
  }, [filters.limit, setFilters]);

  // Handle page change
  const goToPage = (page: number) => {
    setFilters({ page: Math.max(1, Math.min(page, totalPages)) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active filter count
  const activeFilterCount = [
    filters.countryId,
    filters.listingType,
    filters.propertyType,
    filters.priceMin,
    filters.priceMax,
    filters.bedrooms,
    filters.bathrooms,
    filters.areaMin,
    filters.areaMax,
    filters.search,
  ].filter(Boolean).length;

  // Clear all filters
  const clearAll = () => {
    resetFilters();
  };

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ─── */}
      <PageHero
        variant="search"
        icon={Search}
        badgeText={t.search.title}
        title={t.nav.properties}
        subtitle={t.hero.featuredSubtitle}
      >
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-2 flex items-center gap-2 bg-white/85 dark:bg-black/40 backdrop-blur-md border border-white/20">
            <Search className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
            <input
              type="text"
              placeholder={t.hero.searchPlaceholder}
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value || undefined, page: 1 })}
              className="flex-1 bg-transparent border-0 outline-none text-sm py-2 placeholder:text-muted-foreground/60"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: undefined, page: 1 })}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div className="shrink-0 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium bg-background/70">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              {t.search.filters}
              {activeFilterCount > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full bg-primary text-primary-foreground">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4">
        {/* ─── Filters Panel ─── */}
        <div className="animate-fade-in-up -mt-4 mb-8 luxury-filter-panel luxury-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {t.search.filters}
              </h3>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground">
                  <X className="h-3.5 w-3.5 mr-1" />
                  {t.search.resetFilters}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Country */}
              <Select
                key={`search-country-${locale}`}
                value={filters.countryId || ''}
                onValueChange={(v) => setFilters({ countryId: v || undefined, page: 1 })}
              >
                <SelectTrigger className="rounded-xl">
                  <MapPin className="h-4 w-4 mr-2 text-primary/60" />
                  <SelectValue placeholder={t.search.allCountries} />
                </SelectTrigger>
                <SelectContent>
                  {sortedCountries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <CountryFlagLabel country={c} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Property Type */}
              <Select
                value={filters.propertyType || ''}
                onValueChange={(v) => setFilters({ propertyType: (v || undefined) as Property['propertyType'], page: 1 })}
              >
                <SelectTrigger className="rounded-xl">
                  <Building2 className="h-4 w-4 mr-2 text-primary/60" />
                  <SelectValue placeholder={t.search.allTypes} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.propertyTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key.toUpperCase()}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Listing Type */}
              <Select
                value={filters.listingType || ''}
                onValueChange={(v) => setFilters({ listingType: (v || undefined) as Property['listingType'], page: 1 })}
              >
                <SelectTrigger className="rounded-xl">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-primary/60" />
                  <SelectValue placeholder={t.search.allListingTypes} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.listingTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key.toUpperCase()}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Min Price */}
              <Input
                type="number"
                placeholder={t.search.minPrice}
                value={filters.priceMin || ''}
                onChange={(e) => setFilters({ priceMin: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                className="rounded-xl"
              />

              {/* Max Price */}
              <Input
                type="number"
                placeholder={t.search.maxPrice}
                value={filters.priceMax || ''}
                onChange={(e) => setFilters({ priceMax: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                className="rounded-xl"
              />

              {/* Min Bedrooms */}
              <Select
                value={filters.bedrooms ? String(filters.bedrooms) : ''}
                onValueChange={(v) => setFilters({ bedrooms: v ? Number(v) : undefined, page: 1 })}
              >
                <SelectTrigger className="rounded-xl">
                  <Bed className="h-4 w-4 mr-2 text-primary/60" />
                  <SelectValue placeholder={t.search.minBedrooms} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}+ {t.property.beds}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Min Bathrooms */}
              <Select
                value={filters.bathrooms ? String(filters.bathrooms) : ''}
                onValueChange={(v) => setFilters({ bathrooms: v ? Number(v) : undefined, page: 1 })}
              >
                <SelectTrigger className="rounded-xl">
                  <Bath className="h-4 w-4 mr-2 text-primary/60" />
                  <SelectValue placeholder={t.search.minBathrooms} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}+ {t.property.baths}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Min Area */}
              <Input
                type="number"
                placeholder={t.search.minArea}
                value={filters.areaMin || ''}
                onChange={(e) => setFilters({ areaMin: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                className="rounded-xl"
              />

              {/* Max Area */}
              <Input
                type="number"
                placeholder={t.search.maxArea}
                value={filters.areaMax || ''}
                onChange={(e) => setFilters({ areaMax: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                className="rounded-xl"
              />

              {/* Sort */}
              <Select
                value={filters.sort || 'newest'}
                onValueChange={(v) =>
                  setFilters({ sort: v as NonNullable<PropertyFilters['sort']>, page: 1 })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-primary/60" />
                  <SelectValue placeholder={t.search.sort} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t.search.sortNewest}</SelectItem>
                  <SelectItem value="price_asc">{t.search.sortPriceAsc}</SelectItem>
                  <SelectItem value="price_desc">{t.search.sortPriceDesc}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-5 flex items-center gap-3">
                <Button variant="ghost" onClick={clearAll} className="rounded-xl text-muted-foreground">
                  {t.search.resetFilters}
                </Button>
              </div>
            )}
          </div>

        {/* ─── Results Info ─── */}
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-muted-foreground">
            {t.search.showing} <span className="font-semibold text-foreground">{properties.length}</span> {t.search.of}{' '}
            <span className="font-semibold text-foreground">{totalResults}</span> {t.search.results}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden rounded-xl"
            onClick={() => setMobileFilters(!mobileFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            {t.search.filters}
          </Button>
        </div>

        {/* ─── Properties Grid ─── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          listingsBackend === 'stub' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4" role="status">
              <div className="h-20 w-20 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-5 border border-amber-500/30">
                <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">{t.search.backendUnavailableTitle}</h3>
              <p className="text-muted-foreground text-sm max-w-lg mb-6 leading-relaxed">{t.search.backendUnavailableBody}</p>
              <Button variant="outline" onClick={() => setCurrentPage('home')} className="rounded-xl">
                {t.nav.home}
              </Button>
            </div>
          ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">{t.search.noResults}</h3>
            <p className="text-muted-foreground text-sm mb-6">{t.search.tryAdjusting}</p>
            <Button variant="outline" onClick={clearAll} className="rounded-xl">
              {t.search.resetFilters}
            </Button>
          </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* ─── Pagination ─── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pb-12">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={(filters.page || 1) <= 1}
              onClick={() => goToPage((filters.page || 1) - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">{t.search.prev}</span>
            </Button>

            {generatePageNumbers(filters.page || 1, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">...</span>
              ) : (
                <Button
                  key={p}
                  variant={(filters.page || 1) === p ? 'default' : 'outline'}
                  size="sm"
                  className="w-9 h-9 rounded-xl p-0"
                  onClick={() => goToPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={(filters.page || 1) >= totalPages}
              onClick={() => goToPage((filters.page || 1) + 1)}
            >
              <span className="hidden sm:inline mr-1">{t.search.next}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper: Filter Badge ────────────────────────────────────────
function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1.5 pr-1.5 pl-2.5 py-1 text-xs">
      {label}
      <button onClick={onRemove} className="h-4 w-4 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center transition-colors">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

// ─── Helper: Generate page numbers with ellipsis ─────────────────
function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}
