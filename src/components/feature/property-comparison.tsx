'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompareArrows,
  X,
  Check,
  ArrowUpDown,
  Trash2,
  BarChart3,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Tag,
  Home,
  Building2,
  AlertCircle,
  TrendingUp,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { Property } from '@/types';

// ============================================================
// Constants
// ============================================================

const MAX_COMPARISON = 3;

// ============================================================
// Comparison Event Bus (Global State via Custom Events)
// ============================================================

const COMPARISON_ADD_EVENT = 'add-comparison';
const COMPARISON_REMOVE_EVENT = 'remove-comparison';
const COMPARISON_CLEAR_EVENT = 'clear-comparison';
const COMPARISON_CHANGE_EVENT = 'comparison-changed';

/** Hook to interact with the comparison system from any component */
export function useComparison() {
  const addToComparison = useCallback((propertyId: string) => {
    window.dispatchEvent(
      new CustomEvent(COMPARISON_ADD_EVENT, { detail: propertyId })
    );
  }, []);

  const removeFromComparison = useCallback((propertyId: string) => {
    window.dispatchEvent(
      new CustomEvent(COMPARISON_REMOVE_EVENT, { detail: propertyId })
    );
  }, []);

  const clearComparison = useCallback(() => {
    window.dispatchEvent(new CustomEvent(COMPARISON_CLEAR_EVENT));
  }, []);

  return { addToComparison, removeFromComparison, clearComparison };
}

// ============================================================
// Helpers
// ============================================================

function formatPrice(num: number): string {
  return num.toLocaleString('en-US');
}

function formatPropertyType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function getCoverImage(property: Property): string | null {
  if (property.images && property.images.length > 0) {
    const cover = property.images.find((img) => img.isCover);
    return cover?.url ?? property.images[0].url;
  }
  return null;
}

/** Get all unique amenity names across properties for the comparison table */
function getAllAmenities(properties: Property[]): string[] {
  const amenitySet = new Set<string>();
  properties.forEach((p) => {
    p.amenities?.forEach((a) => {
      if (a.amenity?.name) amenitySet.add(a.amenity.name);
    });
  });
  return Array.from(amenitySet).sort();
}

type ComparisonRank = 'best' | 'worst' | 'neutral';

/** Compare a numeric value across properties. Returns rank for each. */
function rankValues(
  values: (number | null | undefined)[],
  lowerIsBetter: boolean
): ComparisonRank[] {
  const validValues = values.filter(
    (v): v is number => v !== null && v !== undefined
  );
  if (validValues.length < 2) {
    return values.map(() => 'neutral');
  }

  const best = lowerIsBetter
    ? Math.min(...validValues)
    : Math.max(...validValues);
  const worst = lowerIsBetter
    ? Math.max(...validValues)
    : Math.min(...validValues);

  // Only mark as best/worst if there's a meaningful difference
  const range = worst - best;
  const hasMeaningfulDifference = range > 0;

  if (!hasMeaningfulDifference) {
    return values.map(() => 'neutral');
  }

  return values.map((v) => {
    if (v === null || v === undefined) return 'neutral';
    if (v === best) return 'best';
    if (v === worst) return 'worst';
    return 'neutral';
  });
}

// ============================================================
// Sub-components
// ============================================================

/** Value cell with best/worst highlighting */
function ComparisonValueCell({
  value,
  rank,
  children,
}: {
  value?: string;
  rank: ComparisonRank;
  children?: React.ReactNode;
}) {
  if (rank === 'best') {
    return (
      <div className="relative flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-center">
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {value ?? children}
        </span>
      </div>
    );
  }

  if (rank === 'worst') {
    return (
      <div className="relative flex items-center justify-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2 text-center">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500 dark:text-red-400" />
        <span className="text-sm font-medium text-red-600 dark:text-red-400">
          {value ?? children}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-3 py-2 text-center">
      <span className="text-sm font-medium text-muted-foreground">
        {value ?? children}
      </span>
    </div>
  );
}

/** Row icon with label */
function RowLabel({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" />
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

/** Skeleton for loading state */
function ThumbnailSkeleton() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
      <div className="shimmer h-full w-full rounded-lg" />
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function PropertyComparison() {
  // ---- State ----
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // ---- Fetch properties when IDs change ----
  const fetchProperties = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setProperties([]);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/properties/${id}`)
            .then((res) => {
              if (!res.ok) throw new Error(`Property ${id} not found`);
              return res.json();
            })
            .catch(() => null)
        )
      );

      // Filter out failed fetches and maintain order
      const validResults = results
        .filter((r): r is Property => r !== null)
        .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

      setProperties(validResults);

      // Clean up invalid IDs
      const validIds = validResults.map((p) => p.id);
      const invalidIds = ids.filter((id) => !validIds.includes(id));
      if (invalidIds.length > 0) {
        setComparisonIds((prev) =>
          prev.filter((id) => validIds.includes(id))
        );
      }
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Event Listeners ----
  useEffect(() => {
    const handleAdd = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      setComparisonIds((prev) => {
        if (prev.includes(id) || prev.length >= MAX_COMPARISON) return prev;
        return [...prev, id];
      });
    };

    const handleRemove = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      setComparisonIds((prev) => prev.filter((pid) => pid !== id));
    };

    const handleClear = () => {
      setComparisonIds([]);
    };

    window.addEventListener(COMPARISON_ADD_EVENT, handleAdd);
    window.addEventListener(COMPARISON_REMOVE_EVENT, handleRemove);
    window.addEventListener(COMPARISON_CLEAR_EVENT, handleClear);

    return () => {
      window.removeEventListener(COMPARISON_ADD_EVENT, handleAdd);
      window.removeEventListener(COMPARISON_REMOVE_EVENT, handleRemove);
      window.removeEventListener(COMPARISON_CLEAR_EVENT, handleClear);
    };
  }, []);

  // ---- Sync fetch with IDs ----
  useEffect(() => {
    fetchProperties(comparisonIds);
  }, [comparisonIds, fetchProperties]);

  // ---- Dispatch change events for other listeners ----
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(COMPARISON_CHANGE_EVENT, {
        detail: { ids: comparisonIds, count: comparisonIds.length },
      })
    );
  }, [comparisonIds]);

  // ---- Handlers ----
  const handleRemove = useCallback(
    (id: string) => {
      setComparisonIds((prev) => prev.filter((pid) => pid !== id));
    },
    []
  );

  const handleClearAll = useCallback(() => {
    setComparisonIds([]);
    setIsOpen(false);
  }, []);

  // ---- Computed ----
  const isVisible = comparisonIds.length >= 2;

  const priceRanks = useMemo(
    () =>
      rankValues(
        properties.map((p) => p.price),
        true // lower price is better
      ),
    [properties]
  );
  const bedroomsRanks = useMemo(
    () =>
      rankValues(
        properties.map((p) => p.bedrooms),
        false // more bedrooms is better
      ),
    [properties]
  );
  const bathroomsRanks = useMemo(
    () =>
      rankValues(
        properties.map((p) => p.bathrooms),
        false
      ),
    [properties]
  );
  const areaRanks = useMemo(
    () =>
      rankValues(
        properties.map((p) => p.area),
        false // larger area is better
      ),
    [properties]
  );
  const yearBuiltRanks = useMemo(
    () =>
      rankValues(
        properties.map((p) => p.yearBuilt),
        false // newer is better
      ),
    [properties]
  );

  const allAmenities = useMemo(() => getAllAmenities(properties), [properties]);

  // ---- Don't render if nothing selected ----
  if (comparisonIds.length === 0) return null;

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      {/* ════════════════════════════════════════════════════════
          FLOATING COMPARISON BAR
          ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl"
          >
            <div className="glass-card gradient-border-animated flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl">
              {/* Compare icon + count */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <GitCompareArrows className="h-5 w-5" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-foreground leading-tight">
                    Compare
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {comparisonIds.length} of {MAX_COMPARISON} properties
                  </p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-10 shrink-0" />

              {/* Property thumbnails */}
              <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                <AnimatePresence mode="popLayout">
                  {properties.map((property) => {
                    const coverUrl = getCoverImage(property);
                    return (
                      <motion.div
                        key={property.id}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="group relative shrink-0"
                      >
                        <div className="h-14 w-14 overflow-hidden rounded-xl border-2 border-border shadow-sm transition-all group-hover:border-primary/50 group-hover:shadow-md">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={property.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <Building2 className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(property.id);
                          }}
                          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md opacity-0 transition-all hover:scale-110 group-hover:opacity-100 focus:opacity-100"
                          aria-label={`Remove ${property.title} from comparison`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {/* Price label */}
                        <div className="mt-1 text-center">
                          <span className="text-[10px] font-bold text-foreground tabular-nums leading-tight">
                            {property.country?.currencySymbol ?? '$'}
                            {formatPrice(property.price)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {loading && <ThumbnailSkeleton />}
              </div>

              <Separator orientation="vertical" className="h-10 shrink-0" />

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => setIsOpen(true)}
                  className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg transition-all hover:from-emerald-500 hover:to-teal-500"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Compare Now</span>
                  <span className="sm:hidden">Compare</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearAll}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          SINGLE ITEM — Small floating add hint
          ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isVisible && comparisonIds.length === 1 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-5 right-5 z-50"
          >
            <div className="glass-card flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 shadow-lg">
              <div className="flex items-center gap-2">
                {properties[0] && (
                  <div className="h-8 w-8 overflow-hidden rounded-lg border border-border">
                    {getCoverImage(properties[0]) ? (
                      <img
                        src={getCoverImage(properties[0])!}
                        alt={properties[0].title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Building2 className="h-3 w-3 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  Add {MAX_COMPARISON - comparisonIds.length} more to compare
                </span>
              </div>
              <button
                onClick={() => handleClearAll()}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Remove from comparison"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          COMPARISON DIALOG (Full-Width Table)
          ════════════════════════════════════════════════════════ */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-[calc(100%-2rem)] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
          {/* ── Header ── */}
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight">
                    Property Comparison
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Comparing {properties.length} properties side by side
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Legend */}
                <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground mr-2">
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>Best Value</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span>Higher Cost</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearAll}
                  className="gap-1.5 text-xs"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          {/* ── Scrollable content ── */}
          <ScrollArea className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">
                    Loading properties...
                  </span>
                </div>
              </div>
            ) : properties.length < 2 ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3 text-center">
                  <GitCompareArrows className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Select at least 2 properties to compare
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {comparisonIds.length} property{comparisonIds.length !== 1 ? 'ies' : 'y'} selected
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-w-[600px]">
                {/* ── Property Headers ── */}
                <div className="grid gap-0" style={{ gridTemplateColumns: `200px repeat(${properties.length}, 1fr)` }}>
                  {/* Empty corner */}
                  <div className="p-4" />

                  {/* Property columns */}
                  {properties.map((property, idx) => {
                    const coverUrl = getCoverImage(property);
                    const currency = property.country?.currencySymbol ?? '$';
                    return (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="relative p-4 text-center"
                      >
                        {/* Remove button */}
                        <button
                          onClick={() => handleRemove(property.id)}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                          aria-label={`Remove ${property.title}`}
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {/* Property image */}
                        <div className="mx-auto mb-3 h-32 w-full max-w-[200px] overflow-hidden rounded-xl border border-border shadow-sm">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={property.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <Building2 className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-foreground leading-snug mb-1 line-clamp-2">
                          {property.title}
                        </h4>

                        {/* Location */}
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {[property.city?.name, property.country?.name]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>

                        {/* Price */}
                        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 px-3 py-1 shadow-sm">
                          {currency}{formatPrice(property.price)}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>

                <Separator />

                {/* ── Comparison Rows ── */}
                <div className="grid gap-0" style={{ gridTemplateColumns: `200px repeat(${properties.length}, 1fr)` }}>
                  {/* Price */}
                  <RowLabel icon={Tag} label="Price" />
                  {properties.map((p, i) => (
                    <ComparisonValueCell
                      key={`price-${p.id}`}
                      rank={priceRanks[i]}
                      value={`${p.country?.currencySymbol ?? '$'}${formatPrice(p.price)}`}
                    />
                  ))}

                  {/* Listing Type */}
                  <RowLabel icon={ArrowUpDown} label="Listing Type" />
                  {properties.map((p) => (
                    <ComparisonValueCell key={`type-${p.id}`} rank="neutral">
                      <Badge variant="secondary" className="text-xs">
                        {p.listingType === 'SALE'
                          ? 'For Sale'
                          : p.listingType === 'RENT'
                            ? 'For Rent'
                            : 'Short Term'}
                      </Badge>
                    </ComparisonValueCell>
                  ))}

                  {/* Property Type */}
                  <RowLabel icon={Home} label="Property Type" />
                  {properties.map((p) => (
                    <ComparisonValueCell
                      key={`ptype-${p.id}`}
                      rank="neutral"
                      value={formatPropertyType(p.propertyType)}
                    />
                  ))}

                  {/* Location */}
                  <RowLabel icon={MapPin} label="Location" />
                  {properties.map((p) => (
                    <ComparisonValueCell
                      key={`location-${p.id}`}
                      rank="neutral"
                      value={[p.city?.name, p.region?.name, p.country?.name]
                        .filter(Boolean)
                        .join(', ') || 'N/A'}
                    />
                  ))}

                  <Separator className="col-span-full" />

                  {/* Bedrooms */}
                  <RowLabel icon={Bed} label="Bedrooms" />
                  {properties.map((p, i) => (
                    <ComparisonValueCell
                      key={`beds-${p.id}`}
                      rank={bedroomsRanks[i]}
                      value={p.bedrooms != null ? String(p.bedrooms) : 'N/A'}
                    />
                  ))}

                  {/* Bathrooms */}
                  <RowLabel icon={Bath} label="Bathrooms" />
                  {properties.map((p, i) => (
                    <ComparisonValueCell
                      key={`baths-${p.id}`}
                      rank={bathroomsRanks[i]}
                      value={p.bathrooms != null ? String(p.bathrooms) : 'N/A'}
                    />
                  ))}

                  {/* Area */}
                  <RowLabel icon={Maximize} label="Area (sqm)" />
                  {properties.map((p, i) => (
                    <ComparisonValueCell
                      key={`area-${p.id}`}
                      rank={areaRanks[i]}
                      value={p.area > 0 ? `${formatPrice(p.area)} sqm` : 'N/A'}
                    />
                  ))}

                  {/* Year Built */}
                  <RowLabel icon={Calendar} label="Year Built" />
                  {properties.map((p, i) => (
                    <ComparisonValueCell
                      key={`year-${p.id}`}
                      rank={yearBuiltRanks[i]}
                      value={p.yearBuilt != null ? String(p.yearBuilt) : 'N/A'}
                    />
                  ))}

                  {/* Status */}
                  <RowLabel icon={TrendingUp} label="Status" />
                  {properties.map((p) => (
                    <ComparisonValueCell key={`status-${p.id}`} rank="neutral">
                      <Badge
                        variant={
                          p.status === 'AVAILABLE'
                            ? 'default'
                            : 'secondary'
                        }
                        className={`text-xs border-0 ${
                          p.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : p.status === 'SOLD'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                              : p.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                        }`}
                      >
                        {p.status === 'AVAILABLE'
                          ? 'Available'
                          : p.status === 'SOLD'
                            ? 'Sold'
                            : p.status === 'PENDING'
                              ? 'Pending'
                              : 'Rented'}
                      </Badge>
                    </ComparisonValueCell>
                  ))}

                  <Separator className="col-span-full" />

                  {/* Amenities */}
                  <RowLabel icon={Crown} label="Amenities" />
                  {properties.map((p) => (
                    <ComparisonValueCell key={`amenities-${p.id}`} rank="neutral">
                      <div className="flex flex-wrap items-center justify-center gap-1 py-1 max-w-[200px]">
                        {p.amenities && p.amenities.length > 0 ? (
                          p.amenities.slice(0, 4).map((a) => (
                            <Badge
                              key={a.amenityId}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {a.amenity?.name ?? 'Amenity'}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No amenities
                          </span>
                        )}
                        {p.amenities && p.amenities.length > 4 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                            +{p.amenities.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </ComparisonValueCell>
                  ))}

                  {/* ── Amenity Matrix (only if shared amenities exist) ── */}
                  {allAmenities.length > 0 && (
                    <>
                      <Separator className="col-span-full" />
                      <div className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-muted-foreground/70" />
                          <span className="text-sm font-medium text-foreground whitespace-nowrap">
                            Amenity Details
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 ml-6">
                          Checkmarks show which features each property has
                        </p>
                      </div>
                      {allAmenities.map((amenityName) => (
                        <React.Fragment key={amenityName}>
                          <div className="flex items-center px-3 py-1.5">
                            <span className="text-xs text-muted-foreground truncate">
                              {amenityName}
                            </span>
                          </div>
                          {properties.map((p) => {
                            const hasAmenity = p.amenities?.some(
                              (a) => a.amenity?.name === amenityName
                            );
                            return (
                              <div
                                key={`amenity-${p.id}-${amenityName}`}
                                className="flex items-center justify-center px-3 py-1.5"
                              >
                                {hasAmenity ? (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  </div>
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                    <span className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </div>

                {/* ── Price per sqm analysis ── */}
                <Separator />
                <div className="p-4">
                  <div className="rounded-xl bg-muted/50 border border-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-foreground">
                        Price per sqm Analysis
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {properties.map((p, idx) => {
                        const pricePerSqm =
                          p.area > 0 ? p.price / p.area : null;
                        const allPricesPerSqm = properties
                          .map((prop) =>
                            prop.area > 0 ? prop.price / prop.area : null
                          )
                          .filter((v): v is number => v !== null);
                        const ranks = rankValues(allPricesPerSqm, true);
                        const rank = ranks[idx];
                        const isBest = rank === 'best';

                        return (
                          <div
                            key={`pps-${p.id}`}
                            className={`rounded-lg p-3 text-center transition-all ${
                              isBest
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-background border border-border'
                            }`}
                          >
                            <p className="text-[11px] text-muted-foreground mb-1 truncate">
                              {p.title}
                            </p>
                            <p
                              className={`text-lg font-bold tabular-nums ${
                                isBest
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-foreground'
                              }`}
                            >
                              {pricePerSqm
                                ? `$${Math.round(pricePerSqm).toLocaleString()}`
                                : 'N/A'}
                              <span className="text-xs font-normal text-muted-foreground">
                                /sqm
                              </span>
                            </p>
                            {isBest && (
                              <Badge className="mt-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] border-0">
                                <Check className="h-2.5 w-2.5 mr-0.5" />
                                Best Value
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
