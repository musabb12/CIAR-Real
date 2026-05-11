'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, PhoneCall, Home, ArrowRight, MapPin, Building2, Globe, Users,
  Briefcase, Star, Quote, CheckCircle, Shield, Building, Layers, Warehouse,
  Castle, Landmark, Brain, Eye, TrendingUp, BarChart3, Flame, Leaf, Wifi,
  Zap, ShieldAlert, Trophy, CreditCard, Banknote, Wallet,
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

function propertiesFromApiPayload(data: unknown): Property[] {
  if (Array.isArray(data)) return data as Property[];
  if (data && typeof data === 'object') {
    const d = data as { data?: unknown; properties?: unknown };
    if (Array.isArray(d.data)) return d.data as Property[];
    if (Array.isArray(d.properties)) return d.properties as Property[];
  }
  return [];
}

async function fetchPropertyList(url: string): Promise<Property[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  try {
    const json = await res.json();
    return propertiesFromApiPayload(json);
  } catch {
    return [];
  }
}

// ─── AnimatedCounter ───────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef(0);
  useEffect(() => {
    start.current = Date.now();
    const duration = 1500;
    const tick = () => {
      const elapsed = Date.now() - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <>{count}{suffix}</>;
}

// ─── Static data ───────────────────────────────────────────────
const testimonials = [
  { name: 'Sarah Mitchell', role: 'Investor', text: 'CIAR made finding luxury properties effortless. The platform is incredibly intuitive and the agents are top-notch.', rating: 5 },
  { name: 'Ahmed Al-Rashid', role: 'Property Owner', text: 'I listed my properties on CIAR and received quality inquiries within days. Truly a global platform.', rating: 5 },
  { name: 'Elena Kowalski', role: 'Buyer', text: 'From browsing to closing, CIAR provided a seamless experience. Highly recommended for anyone in real estate.', rating: 5 },
];

// ─── Hero carousel: 16 elegant property images ──────────────────
const heroImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=2000&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=2000&q=80&auto=format&fit=crop',
];

const HERO_SLIDE_DURATION_MS = 5500;

const stats = [
  { value: 60, label: 'hero.countries', suffix: '+', icon: Globe },
  { value: 30, label: 'hero.propertiesCount', suffix: '+', icon: Building2 },
  { value: 6, label: 'hero.agentsCount', suffix: '+', icon: Users },
  { value: 5, label: 'hero.companiesCount', suffix: '+', icon: Briefcase },
];

const propertyTypes = [
  { key: 'apartment', icon: Building },
  { key: 'villa', icon: Castle },
  { key: 'house', icon: Home },
  { key: 'land', icon: Landmark },
  { key: 'office', icon: Briefcase },
  { key: 'commercial', icon: Warehouse },
  { key: 'studio', icon: Layers },
  { key: 'penthouse', icon: Building2 },
  { key: 'townhouse', icon: Building },
  { key: 'duplex', icon: Layers },
];

const features = [
  { icon: Brain, label: 'AI Valuations' },
  { icon: Eye, label: 'Virtual Tours' },
  { icon: TrendingUp, label: 'Market Insights' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Flame, label: 'Hot Deals' },
  { icon: Leaf, label: 'Green Homes' },
  { icon: Wifi, label: 'Smart Homes' },
  { icon: Zap, label: 'Instant Alerts' },
  { icon: Shield, label: 'Verified Listings' },
  { icon: ShieldAlert, label: 'Secure Transactions' },
  { icon: Trophy, label: 'Premium Support' },
  { icon: Star, label: 'Featured Agent' },
];

const paymentMethods = [
  { icon: CreditCard, label: 'Credit Card' },
  { icon: Banknote, label: 'Bank Transfer' },
  { icon: Wallet, label: 'Digital Wallet' },
  { icon: Shield, label: 'Escrow' },
  { icon: CheckCircle, label: 'Crypto' },
  { icon: Building, label: 'Mortgage' },
];

// ─── Component ─────────────────────────────────────────────────
export function HomePage() {
  const { t } = useTranslation();
  const { setCurrentPage, setFilters, resetFilters, designSettings, contentSettings, filters } = useAppStore();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCountry, setSearchCountry] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchListing, setSearchListing] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeHero, setActiveHero] = useState(0);
  const [prevHero, setPrevHero] = useState(-1);
  const [heroProgress, setHeroProgress] = useState(0);

  const effectiveHeroImages = useMemo(() => {
    const customHero = designSettings.heroImageUrl?.trim();
    if (!customHero) return heroImages;
    return [customHero, ...heroImages.filter((img) => img !== customHero)];
  }, [designSettings.heroImageUrl]);

  // Fetch data (featured: prefer visitor country, then global featured, then latest listings)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const baseFeatured = new URLSearchParams({ isFeatured: 'true', limit: '6' });
        const withCountry = new URLSearchParams(baseFeatured);
        if (filters.countryId) withCountry.set('countryId', filters.countryId);

        const [featuredList, locRes] = await Promise.all([
          (async (): Promise<Property[]> => {
            if (filters.countryId) {
              const local = await fetchPropertyList(`/api/properties?${withCountry.toString()}`);
              if (local.length > 0) return local;
            }
            const globalFeatured = await fetchPropertyList(`/api/properties?${baseFeatured.toString()}`);
            if (globalFeatured.length > 0) return globalFeatured;
            return fetchPropertyList('/api/properties?limit=6&sort=newest');
          })(),
          fetch('/api/locations?includeProperties=true'),
        ]);
        setFeatured(featuredList);
        if (locRes.ok) {
          const data = await locRes.json();
          setCountries(data.countries ?? data ?? []);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [filters.countryId]);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate hero images (16-image elegant carousel)
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setPrevHero(activeHero);
      setActiveHero((prev) => (prev + 1) % effectiveHeroImages.length);
    }, HERO_SLIDE_DURATION_MS);
    return () => clearInterval(slideTimer);
  }, [activeHero, effectiveHeroImages.length]);

  // Hero progress bar (smooth tick)
  useEffect(() => {
    setHeroProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / HERO_SLIDE_DURATION_MS) * 100);
      setHeroProgress(pct);
    }, 60);
    return () => clearInterval(tick);
  }, [activeHero]);

  // Preload next hero image for buttery transitions
  useEffect(() => {
    const next = (activeHero + 1) % effectiveHeroImages.length;
    const img = new Image();
    img.src = effectiveHeroImages[next];
  }, [activeHero, effectiveHeroImages]);

  const goToHero = useCallback((idx: number) => {
    setPrevHero(activeHero);
    setActiveHero(idx);
  }, [activeHero]);

  const handleSearch = useCallback(() => {
    resetFilters();
    const filters: Record<string, string> = {};
    if (searchCountry) filters.countryId = searchCountry;
    if (searchType) filters.propertyType = searchType.toUpperCase();
    if (searchListing) filters.listingType = searchListing.toUpperCase();
    setFilters(filters);
    setCurrentPage('search');
  }, [searchCountry, searchType, searchListing, setFilters, resetFilters, setCurrentPage]);

  const viewAll = useCallback(() => {
    resetFilters();
    setCurrentPage('search');
  }, [resetFilters, setCurrentPage]);

  const delay = (ms: number) => ({ animationDelay: `${ms}ms`, opacity: 0 } as React.CSSProperties);
  const homeContent = contentSettings.home;
  const heroTitle = homeContent.title?.trim() || 'CIAR';
  const heroSubtitle = homeContent.subtitle?.trim() || t.hero.subtitle;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── 1. HERO ─── */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        {/* 16-image elegant Ken-Burns carousel */}
        <div className="hero-carousel" aria-hidden="true">
          {effectiveHeroImages.map((src, i) => (
            <div
              key={src}
              className={`hero-carousel-slide ${
                i === activeHero ? 'is-active' : i === prevHero ? 'is-prev' : ''
              }`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
        <div className="hero-overlay" />
        <div className="hero-grain" />

        {/* Top progress bar */}
        <div className="hero-progress">
          <div className="hero-progress-bar" style={{ width: `${heroProgress}%` }} />
        </div>

        {/* Slide dots */}
        <div className="hero-dots">
          {effectiveHeroImages.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === activeHero ? 'is-active' : ''}`}
              onClick={() => goToHero(i)}
              aria-label={`الانتقال إلى الصورة ${i + 1}`}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <h1 className="animate-fade-in-up font-heading text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white mb-4 drop-shadow-[0_4px_30px_rgba(0,0,0,0.45)]" style={delay(0)}>
            {heroTitle}
          </h1>
          <p className="animate-fade-in-up text-lg sm:text-xl text-white/85 max-w-2xl mb-10 drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]" style={delay(150)}>
            {heroSubtitle}
          </p>

          {/* Search Bar */}
          <div className="animate-fade-in-up glass-hero rounded-2xl p-3 sm:p-4 w-full max-w-4xl flex flex-col sm:flex-row gap-3" style={delay(300)}>
            <Select value={searchCountry} onValueChange={setSearchCountry}>
              <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white rounded-xl">
                <Globe className="h-4 w-4 mr-2 text-gold-light" />
                <SelectValue placeholder={t.search.allCountries} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.flag ? `${c.flag} ` : ''}{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white rounded-xl">
                <Building2 className="h-4 w-4 mr-2 text-gold-light" />
                <SelectValue placeholder={t.search.allTypes} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t.propertyTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={searchListing} onValueChange={setSearchListing}>
              <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white rounded-xl">
                <Search className="h-4 w-4 mr-2 text-gold-light" />
                <SelectValue placeholder={t.search.allListingTypes} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t.listingTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl px-6 h-11">
              {t.hero.search}
            </Button>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl" style={delay(450)}>
            {stats.map((stat, i) => (
              <div key={i} className="glass-stat rounded-xl p-4 text-center">
                <stat.icon className="h-5 w-5 text-gold-light mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-white/60 mt-1">{t[stat.label as keyof typeof t] ?? stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. FEATURED PROPERTIES ─── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">{t.property.featured}</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">{t.hero.featuredProperties}</h2>
            <p className="text-muted-foreground mt-2">{t.hero.featuredSubtitle}</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t.property.noProperties}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Button variant="outline" onClick={viewAll} className="hover-lift-glow">
                  {t.common.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="gradient-divider max-w-4xl mx-auto" />

      {/* ─── 3. HOW IT WORKS ─── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-10">{t.howItWorks.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: t.howItWorks.step1Title, desc: t.howItWorks.step1Desc, icon: Search },
              { step: '02', title: t.howItWorks.step2Title, desc: t.howItWorks.step2Desc, icon: PhoneCall },
              { step: '03', title: t.howItWorks.step3Title, desc: t.howItWorks.step3Desc, icon: CheckCircle },
            ].map((item, i) => (
              <Card key={i} className="glass-card rounded-2xl p-6 text-center hover-lift-glow">
                <CardContent className="p-0 flex flex-col items-center">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <Badge variant="outline" className="mb-3 text-xs">Step {item.step}</Badge>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-divider max-w-4xl mx-auto" />

      {/* ─── 4. PROPERTY TYPES ─── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{t.hero.explore}</h2>
          <p className="text-muted-foreground mb-10">{t.hero.exploreSubtitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {propertyTypes.map((pt, i) => (
              <button
                key={i}
                onClick={() => { setFilters({ propertyType: pt.key.toUpperCase() as Property['propertyType'] }); setCurrentPage('search'); }}
                className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover-lift-glow transition-all"
              >
                <pt.icon className="h-7 w-7 text-primary" />
                <span className="text-sm font-medium">{(t.propertyTypes as Record<string, string>)[pt.key]}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-divider max-w-4xl mx-auto" />

      {/* ─── 5. TESTIMONIALS ─── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-10">What Our Clients Say</h2>
          <div className="relative min-h-[220px]">
            {testimonials.map((item, i) => (
              <div
                key={i}
                className="absolute inset-0 flex flex-col items-center transition-opacity duration-700 ease-in-out"
                style={{ opacity: activeTestimonial === i ? 1 : 0, pointerEvents: activeTestimonial === i ? 'auto' : 'none' }}
              >
                <Quote className="h-8 w-8 text-gold-light mb-4" />
                <p className="text-lg text-foreground/90 italic max-w-xl mb-6">&ldquo;{item.text}&rdquo;</p>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: item.rating }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="font-bold">{item.name}</div>
                <div className="text-sm text-muted-foreground">{item.role}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeTestimonial === i ? 'w-8 bg-primary' : 'w-2.5 bg-muted-foreground/30'}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-divider max-w-4xl mx-auto" />

      {/* ─── 6. CIAR FEATURES ─── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{t.property.ciarFeatures}</h2>
          <p className="text-muted-foreground mb-10">Discover the tools that set CIAR apart</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {features.map((feat, i) => (
              <div key={i} className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 hover-lift-glow cursor-default">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <feat.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-semibold">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-divider max-w-4xl mx-auto" />

      {/* ─── 7. PAYMENT METHODS ─── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{t.footer.securePayments}</h2>
          <p className="text-muted-foreground mb-10">Multiple secure payment options available</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {paymentMethods.map((pm, i) => (
              <div key={i} className="glass-card rounded-xl p-4 flex flex-col items-center gap-2">
                <pm.icon className="h-8 w-8 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{pm.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto glass-card rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">{t.cta.title}</h2>
          <p className="text-muted-foreground mb-8">{t.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={viewAll} className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl px-8">
              {t.cta.browseProperties}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setCurrentPage('contact')} className="rounded-xl px-8">
              {t.common.contact}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
