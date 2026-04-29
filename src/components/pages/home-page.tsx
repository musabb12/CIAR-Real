'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  PhoneCall,
  Home,
  ArrowRight,
  MapPin,
  Building2,
  Globe,
  Users,
  Briefcase,
  Star,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PropertyCard } from '@/components/property/property-card';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import type { Property, Country } from '@/types';

// ============================================================
// Animation variants
// ============================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ============================================================
// Sub-components
// ============================================================

/** Loading skeleton grid for property cards */
function PropertyCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

/** Section heading with optional "View All" link */
function SectionHeading({
  title,
  subtitle,
  viewAllLabel,
  onViewAll,
}: {
  title: string;
  subtitle?: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
}) {
  return (
    <motion.div
      className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      variants={fadeInUp}
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-2 flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:mt-0"
        >
          {viewAllLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function HomePage() {
  const { setCurrentPage, setFilters, resetFilters } = useAppStore();
  const { t } = useTranslation();

  // ---- Data states ----
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // ---- Loading states ----
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);

  // ---- Hero search state ----
  const [searchCountry, setSearchCountry] = useState<string>('');
  const [searchPropertyType, setSearchPropertyType] = useState<string>('');
  const [searchListingType, setSearchListingType] = useState<string>('');

  // ============================================================
  // Data fetching
  // ============================================================

  const fetchFeatured = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const res = await fetch('/api/properties?isFeatured=true&limit=6');
      if (res.ok) {
        const json = await res.json();
        setFeaturedProperties(json.data ?? []);
      }
    } catch {
      // Silently fail - the UI will show an empty state
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await fetch('/api/properties?sort=newest&limit=6');
      if (res.ok) {
        const json = await res.json();
        setRecentProperties(json.data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setRecentLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const res = await fetch('/api/locations?includeProperties=true');
      if (res.ok) {
        setCountries(await res.json());
      }
    } catch {
      // Silently fail
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
    fetchRecent();
    fetchLocations();
  }, [fetchFeatured, fetchRecent, fetchLocations]);

  // ============================================================
  // Handlers
  // ============================================================

  const handleSearch = () => {
    resetFilters();
    const newFilters: Record<string, unknown> = {};
    if (searchCountry) newFilters.countryId = searchCountry;
    if (searchPropertyType) newFilters.propertyType = searchPropertyType;
    if (searchListingType) newFilters.listingType = searchListingType;
    setFilters(newFilters);
    setCurrentPage('search');
  };

  const handleViewAllFeatured = () => {
    resetFilters();
    setFilters({ isFeatured: true });
    setCurrentPage('search');
  };

  const handleViewAllRecent = () => {
    resetFilters();
    setFilters({ sort: 'newest' });
    setCurrentPage('search');
  };

  const handleLocationClick = (countryId: string) => {
    resetFilters();
    setFilters({ countryId });
    setCurrentPage('search');
  };

  // ============================================================
  // How It Works data
  // ============================================================

  const steps = [
    {
      icon: Search,
      title: t.howItWorks.step1Title,
      description: t.howItWorks.step1Desc,
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: PhoneCall,
      title: t.howItWorks.step2Title,
      description: t.howItWorks.step2Desc,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Home,
      title: t.howItWorks.step3Title,
      description: t.howItWorks.step3Desc,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ];

  // ============================================================
  // Stats data
  // ============================================================

  const stats = [
    { icon: Globe, value: '60+', label: t.hero.countries },
    { icon: Building2, value: '30+', label: t.hero.propertiesCount },
    { icon: Users, value: '6+', label: t.hero.agentsCount },
    { icon: Briefcase, value: '5+', label: t.hero.companiesCount },
  ];

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col">
      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=800&fit=crop"
            alt="Luxury real estate"
            className="h-full w-full object-cover"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <Badge
              variant="secondary"
              className="mb-6 border-0 bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur-sm"
            >
              <Star className="mr-1.5 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {t.hero.subtitle}
            </Badge>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
          </motion.div>

          {/* Search bar — glass morphism */}
          <motion.div
            className="mx-auto mt-10 max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Country select */}
                <Select value={searchCountry} onValueChange={setSearchCountry}>
                  <SelectTrigger className="w-full border-white/20 bg-white/15 text-white placeholder:text-white/60 focus:ring-white/30">
                    <SelectValue placeholder={t.search.allCountries} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.search.allCountries}</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="mr-1.5">{c.flag}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Property type select */}
                <Select
                  value={searchPropertyType}
                  onValueChange={setSearchPropertyType}
                >
                  <SelectTrigger className="w-full border-white/20 bg-white/15 text-white placeholder:text-white/60 focus:ring-white/30">
                    <SelectValue placeholder={t.propertyTypes.apartment} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.search.allTypes}</SelectItem>
                    {[
                      ['APARTMENT', t.propertyTypes.apartment],
                      ['VILLA', t.propertyTypes.villa],
                      ['HOUSE', t.propertyTypes.house],
                      ['PENTHOUSE', t.propertyTypes.penthouse],
                      ['STUDIO', t.propertyTypes.studio],
                      ['TOWNHOUSE', t.propertyTypes.townhouse],
                      ['DUPLEX', t.propertyTypes.duplex],
                      ['LAND', t.propertyTypes.land],
                      ['OFFICE', t.propertyTypes.office],
                      ['COMMERCIAL', t.propertyTypes.commercial],
                    ].map(([val, label]) => (
                      <SelectItem key={val} value={val as string}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Listing type select */}
                <Select
                  value={searchListingType}
                  onValueChange={setSearchListingType}
                >
                  <SelectTrigger className="w-full border-white/20 bg-white/15 text-white placeholder:text-white/60 focus:ring-white/30">
                    <SelectValue placeholder={t.property.forRent} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.listingTypes.all}</SelectItem>
                    <SelectItem value="SALE">{t.property.forSale}</SelectItem>
                    <SelectItem value="RENT">{t.property.forRent}</SelectItem>
                    <SelectItem value="SHORT_TERM">{t.property.shortTerm}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Search button */}
                <Button
                  onClick={handleSearch}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {t.hero.search}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats counters */}
          <motion.div
            className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                className="text-center"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  <stat.icon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          FEATURED PROPERTIES
          ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          title={t.property.featured}
          subtitle={t.hero.subtitle}
          viewAllLabel={t.common.viewAll}
          onViewAll={handleViewAllFeatured}
        />

        <div className="mt-8">
          {featuredLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredProperties.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
            >
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {t.property.noProperties}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleViewAllFeatured}
              >
                {t.common.viewAll}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {featuredProperties.map((property) => (
                <motion.div key={property.id} variants={staggerItem}>
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t.howItWorks.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {t.hero.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((step, idx) => (
              <motion.div key={step.title} variants={staggerItem}>
                <div className="group relative rounded-2xl border bg-card p-6 text-center shadow-sm transition-all hover:shadow-md">
                  {/* Step number */}
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {idx + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${step.color}`}
                  >
                    <step.icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Connector arrow (hidden on last item and mobile) */}
                  {idx < steps.length - 1 && (
                    <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 sm:block">
                      <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          RECENT LISTINGS
          ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          title={t.search.sortNewest}
          subtitle={t.hero.subtitle}
          viewAllLabel={t.common.viewAll}
          onViewAll={handleViewAllRecent}
        />

        <div className="mt-8">
          {recentLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : recentProperties.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
            >
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {t.property.noProperties}
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {recentProperties.map((property) => (
                <motion.div key={property.id} variants={staggerItem}>
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ================================================================
          POPULAR LOCATIONS
          ================================================================ */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t.footer.topLocations}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {t.hero.subtitle}
            </p>
          </motion.div>

          <div className="mt-10">
            {locationsLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : countries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                <Globe className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {t.property.noProperties}
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {countries.map((country) => {
                  const propertyCount = (country as unknown as { _count?: { properties: number } })._count?.properties ?? 0;
                  return (
                    <motion.div key={country.id} variants={staggerItem}>
                      <Card
                        className="group cursor-pointer overflow-hidden border-0 py-0 shadow-sm transition-all hover:shadow-md"
                        onClick={() => handleLocationClick(country.id)}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          {/* Country flag */}
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                            {country.flag ?? '🌍'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold">
                              {country.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {propertyCount}{' '}
                              {t.hero.propertiesCount.replace('+','')}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA BANNER
          ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Decorative circles */}
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative z-10">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {t.cta.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
              {t.cta.subtitle}
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  resetFilters();
                  setCurrentPage('search');
                }}
                className="min-w-[160px]"
              >
                {t.cta.browseProperties}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground min-w-[160px]"
                onClick={() => setCurrentPage('agents')}
              >
                {t.cta.findAgents}
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
