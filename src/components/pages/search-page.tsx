'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  Home,
  Star,
  MapPin,
  Building2,
  BedDouble,
  Bath,
  Ruler,
  DollarSign,
  RotateCcw,
} from 'lucide-react';

import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import type {
  Property,
  Country,
  PropertyFilters,
  ListingType,
  PropertyType,
} from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PropertyCard } from '@/components/property/property-card';

// ============================================================
// Constants
// ============================================================

const LISTING_TYPE_OPTIONS: { value: ListingType | 'all'; label: string }[] = [
  { value: 'all', label: '__listing_all' },
  { value: 'SALE', label: '__listing_sale' },
  { value: 'RENT', label: '__listing_rent' },
  { value: 'SHORT_TERM', label: '__listing_short_term' },
];

const PROPERTY_TYPE_OPTIONS: { value: PropertyType | 'all'; label: string }[] = [
  { value: 'all', label: '__type_all' },
  { value: 'APARTMENT', label: '__type_apartment' },
  { value: 'VILLA', label: '__type_villa' },
  { value: 'HOUSE', label: '__type_house' },
  { value: 'LAND', label: '__type_land' },
  { value: 'OFFICE', label: '__type_office' },
  { value: 'COMMERCIAL', label: '__type_commercial' },
  { value: 'STUDIO', label: '__type_studio' },
  { value: 'PENTHOUSE', label: '__type_penthouse' },
  { value: 'TOWNHOUSE', label: '__type_townhouse' },
  { value: 'DUPLEX', label: '__type_duplex' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: '__sort_newest' },
  { value: 'price_asc', label: '__sort_price_asc' },
  { value: 'price_desc', label: '__sort_price_desc' },
] as const;

const BEDROOM_OPTIONS = [
  { value: '', label: '__any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
];

const BATHROOM_OPTIONS = [
  { value: '', label: '__any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
];

const PAGE_SIZE = 12;

// ============================================================
// Helper: build query string from filters
// ============================================================

function buildQueryString(filters: PropertyFilters, searchQuery: string): string {
  const params = new URLSearchParams();

  if (searchQuery) params.set('search', searchQuery);
  if (filters.countryId) params.set('countryId', filters.countryId);
  if (filters.cityId) params.set('cityId', filters.cityId);
  if (filters.listingType) params.set('listingType', filters.listingType);
  if (filters.propertyType) params.set('propertyType', filters.propertyType);
  if (filters.priceMin) params.set('priceMin', String(filters.priceMin));
  if (filters.priceMax) params.set('priceMax', String(filters.priceMax));
  if (filters.bedrooms) params.set('bedrooms', String(filters.bedrooms));
  if (filters.bathrooms) params.set('bathrooms', String(filters.bathrooms));
  if (filters.areaMin) params.set('areaMin', String(filters.areaMin));
  if (filters.areaMax) params.set('areaMax', String(filters.areaMax));
  if (filters.isFeatured) params.set('isFeatured', 'true');
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  return params.toString();
}

// ============================================================
// Helper: flatten cities from countries for a given country
// ============================================================

function getCitiesForCountry(
  countries: Country[],
  countryId: string
): { id: string; name: string }[] {
  const country = countries.find((c) => c.id === countryId);
  if (!country) return [];
  const cities: { id: string; name: string }[] = [];
  country.regions?.forEach((region) => {
    region.cities?.forEach((city) => {
      cities.push({ id: city.id, name: city.name });
    });
  });
  return cities;
}

// ============================================================
// Pagination helper: compute visible page numbers with ellipsis
// ============================================================

function getVisiblePages(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

// ============================================================
// Sub-components
// ============================================================

interface FilterControlsProps {
  filters: PropertyFilters;
  onFilterChange: (key: keyof PropertyFilters, value: unknown) => void;
  onApply: () => void;
  onReset: () => void;
  countries: Country[];
}

function FilterControls({
  filters,
  onFilterChange,
  onApply,
  onReset,
  countries,
}: FilterControlsProps) {
  const { t } = useTranslation();
  const cities = useMemo(
    () =>
      filters.countryId ? getCitiesForCountry(countries, filters.countryId) : [],
    [countries, filters.countryId]
  );

  // Map placeholder labels to translations
  const resolveLabel = (label: string) => {
    const map: Record<string, string> = {
      '__listing_all': t.listingTypes.all,
      '__listing_sale': t.property.forSale,
      '__listing_rent': t.property.forRent,
      '__listing_short_term': t.property.shortTerm,
      '__type_all': t.search.allTypes,
      '__type_apartment': t.propertyTypes.apartment,
      '__type_villa': t.propertyTypes.villa,
      '__type_house': t.propertyTypes.house,
      '__type_land': t.propertyTypes.land,
      '__type_office': t.propertyTypes.office,
      '__type_commercial': t.propertyTypes.commercial,
      '__type_studio': t.propertyTypes.studio,
      '__type_penthouse': t.propertyTypes.penthouse,
      '__type_townhouse': t.propertyTypes.townhouse,
      '__type_duplex': t.propertyTypes.duplex,
      '__sort_newest': t.search.sortNewest,
      '__sort_price_asc': t.search.sortPriceAsc,
      '__sort_price_desc': t.search.sortPriceDesc,
      '__any': t.search.any,
    };
    return map[label] ?? label;
  };

  return (
    <div className="space-y-5">
      {/* Country */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Country
        </Label>
        <Select
          value={filters.countryId || 'all'}
          onValueChange={(val) => {
            onFilterChange('countryId', val === 'all' ? undefined : val);
            onFilterChange('cityId', undefined);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.search.allCountries} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.search.allCountries}</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                {country.flag ? `${country.flag} ` : ''}
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          City
        </Label>
        <Select
          value={filters.cityId || 'all'}
          onValueChange={(val) =>
            onFilterChange('cityId', val === 'all' ? undefined : val)
          }
          disabled={!filters.countryId}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={!filters.countryId ? t.search.allCountries : t.search.allCities}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.search.allCities}</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Listing Type */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Listing Type
        </Label>
        <Select
          value={filters.listingType || 'all'}
          onValueChange={(val) =>
            onFilterChange('listingType', val === 'all' ? undefined : val)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.listingTypes.all} />
          </SelectTrigger>
          <SelectContent>
            {LISTING_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {resolveLabel(opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Property Type
        </Label>
        <Select
          value={filters.propertyType || 'all'}
          onValueChange={(val) =>
            onFilterChange('propertyType', val === 'all' ? undefined : val)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.search.allTypes} />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {resolveLabel(opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Price Range
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            min={0}
            value={filters.priceMin ?? ''}
            onChange={(e) =>
              onFilterChange(
                'priceMin',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="w-full"
          />
          <span className="text-muted-foreground shrink-0 text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            min={0}
            value={filters.priceMax ?? ''}
            onChange={(e) =>
              onFilterChange(
                'priceMax',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bedrooms
        </Label>
        <Select
          value={filters.bedrooms ? String(filters.bedrooms) : 'any'}
          onValueChange={(val) =>
            onFilterChange(
              'bedrooms',
              val === 'any' ? undefined : Number(val)
            )
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.search.any} />
          </SelectTrigger>
          <SelectContent>
            {BEDROOM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || 'any'} value={opt.value || 'any'}>
                {resolveLabel(opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bathrooms */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bathrooms
        </Label>
        <Select
          value={filters.bathrooms ? String(filters.bathrooms) : 'any'}
          onValueChange={(val) =>
            onFilterChange(
              'bathrooms',
              val === 'any' ? undefined : Number(val)
            )
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.search.any} />
          </SelectTrigger>
          <SelectContent>
            {BATHROOM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || 'any'} value={opt.value || 'any'}>
                {resolveLabel(opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Area Range */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Ruler className="size-3.5" />
          {t.property.area} ({t.property.sqm})
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            min={0}
            value={filters.areaMin ?? ''}
            onChange={(e) =>
              onFilterChange(
                'areaMin',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="w-full"
          />
          <span className="text-muted-foreground shrink-0 text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            min={0}
            value={filters.areaMax ?? ''}
            onChange={(e) =>
              onFilterChange(
                'areaMax',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Featured Only */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="featured-only"
          checked={filters.isFeatured || false}
          onCheckedChange={(checked) =>
            onFilterChange('isFeatured', checked === true ? true : undefined)
          }
        />
        <Label
          htmlFor="featured-only"
          className="flex cursor-pointer items-center gap-2 text-sm font-normal"
        >
          <Star className="size-3.5 text-amber-500" />
          {t.search.featuredOnly}
        </Label>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <Button onClick={onApply} className="w-full">
          <Search className="size-4" />
          {t.search.applyFilters}
        </Button>
        <Button onClick={onReset} variant="outline" className="w-full">
          <RotateCcw className="size-4" />
          {t.search.resetFilters}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Skeleton grid for loading state
// ============================================================

function PropertyGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================

function EmptyState({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center"
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <Search className="size-7 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{t.search.noResults}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {t.search.tryAdjusting}
      </p>
      <Button variant="outline" onClick={onReset}>
        <RotateCcw className="size-4" />
        {t.search.resetFilters}
      </Button>
    </motion.div>
  );
}

// ============================================================
// Active filter badges
// ============================================================

function ActiveFilterBadges({
  filters,
  countries,
  onRemove,
}: {
  filters: PropertyFilters;
  countries: Country[];
  onRemove: (key: keyof PropertyFilters) => void;
}) {
  const { t } = useTranslation();
  const badges: { key: keyof PropertyFilters; label: string }[] = [];

  if (filters.countryId) {
    const country = countries.find((c) => c.id === filters.countryId);
    badges.push({
      key: 'countryId',
      label: country?.name || 'Country',
    });
  }

  if (filters.cityId) {
    const allCities = countries.flatMap((c) =>
      c.regions?.flatMap((r) => r.cities?.map((city) => city) || []) || []
    );
    const city = allCities.find((c) => c.id === filters.cityId);
    badges.push({
      key: 'cityId',
      label: city?.name || 'City',
    });
  }

  if (filters.listingType) {
    const label = LISTING_TYPE_OPTIONS.find((o) => o.value === filters.listingType)
      ?.label;
    if (label) badges.push({ key: 'listingType', label });
  }

  if (filters.propertyType) {
    const label = PROPERTY_TYPE_OPTIONS.find((o) => o.value === filters.propertyType)
      ?.label;
    if (label) badges.push({ key: 'propertyType', label });
  }

  if (filters.priceMin) {
    badges.push({
      key: 'priceMin',
      label: `Min: $${filters.priceMin.toLocaleString()}`,
    });
  }

  if (filters.priceMax) {
    badges.push({
      key: 'priceMax',
      label: `Max: $${filters.priceMax.toLocaleString()}`,
    });
  }

  if (filters.bedrooms) {
    badges.push({ key: 'bedrooms', label: `${filters.bedrooms}+ Beds` });
  }

  if (filters.bathrooms) {
    badges.push({ key: 'bathrooms', label: `${filters.bathrooms}+ Baths` });
  }

  if (filters.areaMin) {
    badges.push({ key: 'areaMin', label: `Min: ${filters.areaMin} sqm` });
  }

  if (filters.areaMax) {
    badges.push({ key: 'areaMax', label: `Max: ${filters.areaMax} sqm` });
  }

  if (filters.isFeatured) {
    badges.push({ key: 'isFeatured', label: t.property.featured });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        {t.search.filters}:
      </span>
      {badges.map((badge) => (
        <Badge
          key={badge.key}
          variant="secondary"
          className="cursor-pointer gap-1 pr-1 transition-colors hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(badge.key)}
        >
          {badge.label}
          <X className="size-3" />
        </Badge>
      ))}
    </div>
  );
}

// ============================================================
// Main Search Page Component
// ============================================================

export function SearchPage() {
  // ---- Store ----
  const {
    filters,
    setFilters,
    resetFilters,
    searchQuery,
  } = useAppStore();
  const { t } = useTranslation();

  // ---- Local state ----
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ---- Derived ----
  const currentPage = filters.page || 1;

  const resultsFrom = totalResults === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const resultsTo = Math.min(currentPage * PAGE_SIZE, totalResults);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.countryId) count++;
    if (filters.cityId) count++;
    if (filters.listingType) count++;
    if (filters.propertyType) count++;
    if (filters.priceMin) count++;
    if (filters.priceMax) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.areaMin) count++;
    if (filters.areaMax) count++;
    if (filters.isFeatured) count++;
    return count;
  }, [filters]);

  // ---- Fetch locations ----
  useEffect(() => {
    let cancelled = false;
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        if (!cancelled) setCountries(data);
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    }
    fetchLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Fetch properties ----
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const qs = buildQueryString({ ...filters, limit: PAGE_SIZE }, searchQuery);
      const res = await fetch(`/api/properties?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch properties');

      const json = await res.json();
      // API returns { data, pagination: { page, limit, total, totalPages } }
      const data = json.data || [];
      const pagination = json.pagination || {};

      setProperties(data);
      setTotalResults(pagination.total || 0);
      setTotalPages(pagination.totalPages || 0);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Something went wrong. Please try again.');
      setProperties([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // ---- Handlers ----
  const handleFilterChange = useCallback(
    (key: keyof PropertyFilters, value: unknown) => {
      setFilters({ [key]: value } as Partial<PropertyFilters>);
    },
    [setFilters]
  );

  const handleApplyFilters = useCallback(() => {
    setFilters({ page: 1 });
    setMobileFilterOpen(false);
  }, [setFilters]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setMobileFilterOpen(false);
  }, [resetFilters]);

  const handleRemoveFilter = useCallback(
    (key: keyof PropertyFilters) => {
      setFilters({ [key]: undefined } as Partial<PropertyFilters>);
    },
    [setFilters]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      setFilters({ sort: value as PropertyFilters['sort'], page: 1 });
    },
    [setFilters]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters({ page });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setFilters]
  );

  // ---- Render ----
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: "url('https://picsum.photos/seed/ciar-search-bg/1920/400.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl font-bold text-white sm:text-4xl"
          >
            {t.search.title}
          </motion.h1>
          <div className="mt-3 h-[3px] w-16 bg-gradient-to-r from-amber-500 to-amber-400" />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-4 max-w-xl text-sm text-white/80 sm:text-base"
          >
            {'Discover your perfect property from our extensive collection'}
          </motion.p>
        </div>
      </div>

      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b glass-nav">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Mobile filter button + Results count */}
            <div className="flex items-center gap-3">
              {/* Mobile Filter Sheet Trigger */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="size-4" />
                    {t.search.filters}
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 px-1.5 py-0 text-xs"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="w-[340px] p-0 sm:max-w-sm">
                  <SheetHeader className="border-b px-4 py-4">
                    <SheetTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="size-4" />
                      {t.search.filters}
                      {activeFilterCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 text-xs"
                        >
                          {activeFilterCount}
                        </Badge>
                      )}
                    </SheetTitle>
                    <SheetDescription>
                      {t.search.title}
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-10rem)]">
                    <div className="p-4">
                      <FilterControls
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                        countries={countries}
                      />
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              {/* Results count */}
              <div className="text-sm text-muted-foreground">
                {loading ? (
                  <Skeleton className="inline-block h-4 w-32" />
                ) : (
                  <>
                    <span className="font-semibold text-foreground">
                      {totalResults}
                    </span>{' '}
                    {totalResults === 1 ? 'property' : 'properties'} found
                    {!loading && totalResults > 0 && (
                      <span className="hidden sm:inline">
                        {' '}
                        &middot; {t.search.showing} {resultsFrom}&ndash;{resultsTo}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right: Sort + View toggle */}
            <div className="flex items-center gap-3">
              {/* Sort dropdown */}
              <Select
                value={filters.sort || 'newest'}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[180px]" size="sm">
                  <SelectValue placeholder={t.search.sort} />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label === '__sort_newest' ? t.search.sortNewest : opt.label === '__sort_price_asc' ? t.search.sortPriceAsc : t.search.sortPriceDesc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="hidden items-center rounded-md border p-0.5 sm:flex">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="size-8"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="size-8"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active filter badges */}
          {!loading && (
            <ActiveFilterBadges
              filters={filters}
              countries={countries}
              onRemove={handleRemoveFilter}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-[130px] glass-panel rounded-xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <h2 className="font-heading font-semibold">{t.search.filters}</h2>
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <ScrollArea className="max-h-[calc(100vh-220px)]">
                <FilterControls
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                  countries={countries}
                />
              </ScrollArea>
            </div>
          </aside>

          {/* Main content area */}
          <main className="min-w-0 flex-1">
            {/* Search query indicator */}
            {searchQuery && !loading && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2"
              >
                <Badge
                  variant="outline"
                  className="gap-1.5 px-3 py-1.5 text-sm"
                >
                  <Search className="size-3.5" />
                  Search: &ldquo;{searchQuery}&rdquo;
                </Badge>
              </motion.div>
            )}

            {/* Error state */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            {/* Loading state */}
            {loading && <PropertyGridSkeleton />}

            {/* Empty state */}
            {!loading && !error && properties.length === 0 && (
              <EmptyState onReset={handleResetFilters} />
            )}

            {/* Property Grid */}
            {!loading && properties.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${filters.page}-${filters.sort}-${filters.listingType}-${filters.propertyType}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid grid-cols-1 gap-4'
                  }
                >
                  {properties.map((property, idx) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-10 flex flex-col items-center gap-4"
              >
                <Pagination>
                  <PaginationContent>
                    {/* Previous */}
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1)
                            handlePageChange(currentPage - 1);
                        }}
                        className={
                          currentPage <= 1
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>

                    {/* Page numbers */}
                    {getVisiblePages(currentPage, totalPages).map((page, i) =>
                      page === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={page === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    {/* Next */}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            handlePageChange(currentPage + 1);
                        }}
                        className={
                          currentPage >= totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                {/* Page info text */}
                <p className="text-sm text-muted-foreground">
                  {t.search.showing}{' '}
                  <span className="font-medium text-foreground">{resultsFrom}</span>
                  &ndash;
                  <span className="font-medium text-foreground">{resultsTo}</span> {t.search.of}{' '}
                  <span className="font-medium text-foreground">
                    {totalResults}
                  </span>{' '}
                  {t.search.results}
                </p>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
