'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Quote,
  CheckCircle,
  Shield,
  Bed,
  Bath,
  Maximize,
  Building,
  Layers,
  Warehouse,
  Castle,
  Landmark,
  Brain,
  Eye,
  TrendingUp,
  BarChart3,
  Flame,
  Leaf,
  Wifi,
  Zap,
  ShieldAlert,
  Trophy,
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
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

// ============================================================
// Sub-components
// ============================================================

/** Loading skeleton grid for property cards */
function PropertyCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-52 w-full rounded-xl" />
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

/** Animated stat counter that counts up on mount */
function AnimatedCounter({ value, suffix = '', duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = Date.now();
    const step = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (now < startTime + duration) requestAnimationFrame(step);
      else setCount(value);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span ref={ref} className="stat-value-animated tabular-nums">
      {count}{suffix}
    </span>
  );
}

/** Section heading with gradient underline */
function SectionHeading({
  title,
  subtitle,
  viewAllLabel,
  onViewAll,
  centered = false,
}: {
  title: string;
  subtitle?: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
  centered?: boolean;
}) {
  return (
    <motion.div
      className={`flex flex-col gap-3 ${centered ? 'items-center text-center' : ''} sm:flex-row sm:items-end sm:justify-between`}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      <div>
        <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${centered ? 'gradient-underline gradient-underline-center' : 'gradient-underline'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-sm text-muted-foreground sm:text-base max-w-lg">
            {subtitle}
          </p>
        )}
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="group mt-2 flex items-center gap-1.5 text-sm font-medium text-primary transition-all hover:gap-2.5 sm:mt-0"
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// Property Types Data
// ============================================================

const propertyTypesData = [
  { type: 'APARTMENT', icon: Building2, count: 156 },
  { type: 'VILLA', icon: Castle, count: 89 },
  { type: 'HOUSE', icon: Home, count: 203 },
  { type: 'LAND', icon: MapPin, count: 67 },
  { type: 'OFFICE', icon: Building, count: 124 },
  { type: 'COMMERCIAL', icon: Warehouse, count: 95 },
  { type: 'STUDIO', icon: Layers, count: 78 },
  { type: 'PENTHOUSE', icon: Landmark, count: 45 },
  { type: 'TOWNHOUSE', icon: Home, count: 112 },
  { type: 'DUPLEX', icon: Layers, count: 56 },
];

// ============================================================
// Testimonials Data
// ============================================================

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Homeowner',
    rating: 5,
    text: 'Found our dream villa in less than a week! The platform made the entire process seamless. The search filters helped us narrow down exactly what we were looking for.',
    avatar: 'SM',
  },
  {
    name: 'Ahmed Al-Rashid',
    role: 'Property Investor',
    rating: 5,
    text: 'As an international investor, this platform connected me with verified agents across multiple countries. Exceptional service and premium property listings.',
    avatar: 'AR',
  },
  {
    name: 'Elena Kowalski',
    role: 'First-time Buyer',
    rating: 5,
    text: 'The step-by-step guidance from search to settlement was invaluable. I never felt overwhelmed. The agent connections were professional and responsive.',
    avatar: 'EK',
  },
];

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

  // ---- Testimonial carousel state ----
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonialInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Subtitle typing state ----
  const [showSubtitle, setShowSubtitle] = useState(false);

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

  // ---- Subtitle fade-in after hero loads ----
  useEffect(() => {
    const timer = setTimeout(() => setShowSubtitle(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // ---- Testimonial auto-rotation ----
  useEffect(() => {
    testimonialInterval.current = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => {
      if (testimonialInterval.current) clearInterval(testimonialInterval.current);
    };
  }, []);

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

  const handlePropertyTypeClick = (type: string) => {
    resetFilters();
    setFilters({ propertyType: type });
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
      gradient: 'from-emerald-500 to-teal-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      icon: PhoneCall,
      title: t.howItWorks.step2Title,
      description: t.howItWorks.step2Desc,
      gradient: 'from-amber-500 to-orange-400',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      icon: Home,
      title: t.howItWorks.step3Title,
      description: t.howItWorks.step3Desc,
      gradient: 'from-teal-500 to-emerald-400',
      bgLight: 'bg-teal-50 dark:bg-teal-950/30',
    },
  ];

  // ============================================================
  // Stats data
  // ============================================================

  const stats = [
    { icon: Globe, value: 60, suffix: '+', label: t.hero.countries, color: 'from-emerald-500 to-teal-400' },
    { icon: Building2, value: 30, suffix: '+', label: t.hero.propertiesCount, color: 'from-amber-500 to-orange-400' },
    { icon: Users, value: 6, suffix: '+', label: t.hero.agentsCount, color: 'from-teal-500 to-cyan-400' },
    { icon: Briefcase, value: 5, suffix: '+', label: t.hero.companiesCount, color: 'from-emerald-600 to-emerald-400' },
  ];

  // ============================================================
  // Property type label mapping
  // ============================================================

  const propertyTypeLabels: Record<string, string> = {
    APARTMENT: t.propertyTypes.apartment,
    VILLA: t.propertyTypes.villa,
    HOUSE: t.propertyTypes.house,
    LAND: t.propertyTypes.land,
    OFFICE: t.propertyTypes.office,
    COMMERCIAL: t.propertyTypes.commercial,
    STUDIO: t.propertyTypes.studio,
    PENTHOUSE: t.propertyTypes.penthouse,
    TOWNHOUSE: t.propertyTypes.townhouse,
    DUPLEX: t.propertyTypes.duplex,
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col">

      {/* ================================================================
          1. HERO SECTION — Full Viewport with Animated Gradient Mesh
          ================================================================ */}
      <section className="animated-gradient-mesh relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        {/* Decorative floating orbs */}
        <div className="particles-layer">
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Badge
              variant="secondary"
              className="mb-6 border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary backdrop-blur-sm"
            >
              <Shield className="mr-2 h-3.5 w-3.5" />
              {t.hero.subtitle}
            </Badge>
          </motion.div>

          {/* Main Heading — Gradient Text */}
          <motion.h1
            className="text-gradient-luxury text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {t.hero.title}
          </motion.h1>

          {/* Subtitle — Fade In */}
          <motion.p
            className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showSubtitle ? 1 : 0, y: showSubtitle ? 0 : 20 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {t.hero.subtitle}
          </motion.p>

          {/* Search Bar — Glass Morphism */}
          <motion.div
            className="mx-auto mt-10 max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="glass-card rounded-2xl p-3 shadow-2xl sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Country select */}
                <Select value={searchCountry} onValueChange={setSearchCountry}>
                  <SelectTrigger className="w-full border-white/20 bg-white/10 backdrop-blur-sm focus:ring-primary/30">
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
                <Select value={searchPropertyType} onValueChange={setSearchPropertyType}>
                  <SelectTrigger className="w-full border-white/20 bg-white/10 backdrop-blur-sm focus:ring-primary/30">
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
                <Select value={searchListingType} onValueChange={setSearchListingType}>
                  <SelectTrigger className="w-full border-white/20 bg-white/10 backdrop-blur-sm focus:ring-primary/30">
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
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-400"
                  size="lg"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {t.hero.search}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Animated Floating Stat Counters */}
          <motion.div
            className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                className="group text-center"
              >
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg transition-transform group-hover:scale-110`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="h-6 w-4 rounded-full border-2 border-muted-foreground/30 p-0.5"
            >
              <div className="h-1.5 w-full rounded-full bg-muted-foreground/40" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-divider" />

      {/* ================================================================
          2. FEATURED PROPERTIES — Bento Grid
          ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <SectionHeading
          title={t.property.featured}
          subtitle={t.hero.subtitle}
          viewAllLabel={t.common.viewAll}
          onViewAll={handleViewAllFeatured}
        />

        <div className="mt-10">
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
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
            >
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t.property.noProperties}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={handleViewAllFeatured}
              >
                {t.common.viewAll}
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* First card spans 2 columns on desktop */}
              <motion.div
                className="sm:col-span-2 lg:col-span-2"
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <PropertyCard property={featuredProperties[0]} />
              </motion.div>
              {featuredProperties.slice(1, 4).map((property, i) => (
                <motion.div
                  key={property.id}
                  variants={staggerItem}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
              {featuredProperties.slice(4).map((property, i) => (
                <motion.div
                  key={property.id}
                  variants={staggerItem}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-divider" />

      {/* ================================================================
          3. HOW IT WORKS — Horizontal Steps with Connecting Lines
          ================================================================ */}
      <section className="relative overflow-hidden bg-muted/20 py-20 sm:py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-amber-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="gradient-underline gradient-underline-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t.howItWorks.title}
            </h2>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              {t.hero.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-12"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                variants={staggerItem}
                className={`relative ${idx < steps.length - 1 ? 'step-connector-dot hidden sm:block' : ''}`}
              >
                <div className="card-luxury group relative rounded-2xl bg-card p-8 text-center shadow-sm transition-all hover:shadow-lg">
                  {/* Step number badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r ${step.gradient} text-xs font-bold text-white shadow-lg`}>
                      {idx + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`mx-auto mt-4 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} shadow-lg transition-transform group-hover:scale-110 group-hover:shadow-xl`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Checkmark badge */}
                  <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                    <CheckCircle className="h-3 w-3" />
                    {idx === 0 ? 'Free' : idx === 1 ? 'Verified' : 'Secure'}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-divider" />

      {/* ================================================================
          4. PROPERTY TYPES — Icon Grid
          ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <SectionHeading
          title={t.search.allTypes}
          subtitle="Explore diverse property categories to find exactly what you need"
          centered={true}
        />

        <motion.div
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {propertyTypesData.map((pt) => (
            <motion.div
              key={pt.type}
              variants={staggerItem}
            >
              <button
                onClick={() => handlePropertyTypeClick(pt.type)}
                className="property-type-card w-full cursor-pointer p-5 text-center"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-colors group-hover:from-primary/20 group-hover:to-primary/10">
                  <pt.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight">
                  {propertyTypeLabels[pt.type]}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pt.count} properties
                </p>
              </button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-divider" />

      {/* ================================================================
          5. TESTIMONIALS — Auto-carousel
          ================================================================ */}
      <section className="relative overflow-hidden bg-muted/20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="gradient-underline gradient-underline-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              What Our Clients Say
            </h2>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              Trusted by thousands of property seekers worldwide
            </p>
          </motion.div>

          <div className="relative mt-12 max-w-3xl mx-auto">
            {/* Testimonial cards carousel */}
            <div className="overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="rounded-2xl bg-gradient-to-br from-card via-card to-primary/[0.03] border p-8 shadow-lg sm:p-10"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Quote icon */}
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
                      <Quote className="h-7 w-7 text-primary" />
                    </div>

                    {/* Stars */}
                    <div className="mb-5 flex gap-1">
                      {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    {/* Quote text */}
                    <p className="text-base leading-relaxed text-foreground/90 sm:text-lg">
                      &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                    </p>

                    {/* Author info */}
                    <div className="mt-6 flex items-center gap-3">
                      {/* Avatar placeholder */}
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-teal-400 text-sm font-bold text-white shadow-md">
                        {testimonials[activeTestimonial].avatar}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">{testimonials[activeTestimonial].name}</p>
                        <p className="text-xs text-muted-foreground">{testimonials[activeTestimonial].role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots navigation */}
            <div className="mt-8 flex justify-center gap-3">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`testimonial-dot ${idx === activeTestimonial ? 'active' : ''}`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-divider" />

      {/* ================================================================
          CIAR EXCLUSIVE FEATURES — Bento Grid Showcase
          ================================================================ */}
      <section className="relative overflow-hidden bg-muted/30 py-20 sm:py-24">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute right-1/4 top-1/3 h-80 w-80 rounded-full bg-primary blur-3xl" />
          <div className="absolute left-1/3 bottom-1/4 h-60 w-60 rounded-full bg-amber-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="CIAR Exclusive Features"
            subtitle="30+ smart tools powered by AI and advanced analytics to help you make the best property decisions"
            centered={true}
          />

          <motion.div
            className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {[
              { icon: Brain, label: 'AI Valuation', gradient: 'from-violet-500 to-purple-500' },
              { icon: Eye, label: 'Virtual Tour', gradient: 'from-cyan-500 to-blue-500' },
              { icon: TrendingUp, label: 'ROI Calculator', gradient: 'from-emerald-500 to-teal-400' },
              { icon: MapPin, label: 'Neighborhood', gradient: 'from-rose-500 to-pink-500' },
              { icon: BarChart3, label: 'Price Trends', gradient: 'from-amber-500 to-orange-400' },
              { icon: Star, label: 'Reviews', gradient: 'from-yellow-500 to-amber-400' },
              { icon: Flame, label: 'Price Heatmap', gradient: 'from-red-500 to-orange-500' },
              { icon: Leaf, label: 'Carbon Rating', gradient: 'from-green-500 to-emerald-400' },
              { icon: Wifi, label: 'Smart Home', gradient: 'from-indigo-500 to-blue-400' },
              { icon: Zap, label: 'Energy Score', gradient: 'from-yellow-400 to-orange-400' },
              { icon: ShieldAlert, label: 'Risk Assessment', gradient: 'from-red-600 to-rose-500' },
              { icon: Trophy, label: 'Gamification', gradient: 'from-amber-400 to-yellow-300' },
            ].map((feature, i) => (
              <motion.div key={feature.label} variants={staggerItem}>
                <div className="group flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card/80 p-5 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:-translate-y-1">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold tracking-tight">{feature.label}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm text-muted-foreground">
              ...and 18 more advanced features available on every property page
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-divider" />

      {/* ================================================================
          6. CTA SECTION — Full-width Gradient
          ================================================================ */}
      <section className="relative overflow-hidden">
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700 px-6 py-16 sm:px-12 sm:py-20 lg:py-24">
          {/* Decorative shapes */}
          <div
            className="cta-shape absolute -left-16 -top-16 h-64 w-64 bg-white/5"
            style={{ animation: 'ctaFloat1 12s ease-in-out infinite' }}
          />
          <div
            className="cta-shape absolute -bottom-12 -right-12 h-48 w-48 bg-white/5"
            style={{ animation: 'ctaFloat2 10s ease-in-out infinite' }}
          />
          <div
            className="cta-shape absolute left-1/3 top-1/4 h-32 w-32 rounded-full border border-white/10"
            style={{ animation: 'ctaFloat1 15s ease-in-out infinite reverse' }}
          />
          <div
            className="cta-shape absolute bottom-1/4 right-1/3 h-24 w-24 bg-white/[0.03]"
            style={{ animation: 'ctaFloat2 8s ease-in-out infinite' }}
          />

          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <motion.h2
              className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {t.cta.title}
            </motion.h2>

            <motion.p
              className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {t.cta.subtitle}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button
                size="lg"
                onClick={() => {
                  resetFilters();
                  setCurrentPage('search');
                }}
                className="min-w-[180px] bg-white text-emerald-700 shadow-xl shadow-black/10 hover:bg-white/90 hover:text-emerald-800"
              >
                {t.cta.browseProperties}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-w-[180px] border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => setCurrentPage('agents')}
              >
                {t.cta.findAgents}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          7. POPULAR LOCATIONS — Grid with Country Flags
          ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <SectionHeading
          title={t.footer.topLocations}
          subtitle="Browse properties in the most popular destinations"
          centered={true}
        />

        <div className="mt-10">
          {locationsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : countries.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center"
            >
              <Globe className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t.property.noProperties}</p>
            </motion.div>
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
                    <div
                      className="location-card group cursor-pointer p-5"
                      onClick={() => handleLocationClick(country.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Country flag */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-3xl shadow-sm transition-all group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-md">
                          {country.flag ?? '🌍'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold tracking-tight">
                            {country.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {propertyCount} {t.hero.propertiesCount.replace('+', '')}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ================================================================
          RECENT LISTINGS — Additional Properties
          ================================================================ */}
      <section className="bg-muted/20 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={t.search.sortNewest}
            subtitle="Stay updated with the latest property listings"
            viewAllLabel={t.common.viewAll}
            onViewAll={handleViewAllRecent}
          />

          <div className="mt-10">
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
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center"
              >
                <Building2 className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t.property.noProperties}</p>
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
        </div>
      </section>
    </div>
  );
}
