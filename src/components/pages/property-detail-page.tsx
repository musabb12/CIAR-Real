'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, Heart, Bed, Bath, Maximize, MapPin, Eye,
  Star, Building2, Phone, Mail, MessageSquare, Share2, CheckCircle,
  Calendar, Home, Layers, Shield, User, ChevronLeft, ChevronRight, X,
  Check, Zap, ShoppingCart, CalendarCheck, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useSiteCurrency } from '@/hooks/use-site-currency';
import { useLocalizedCountryName } from '@/hooks/use-localized-country-name';
import type { Property, PropertyImage, Amenity, PropertyStatus, PropertyType } from '@/types';

const PropertyMap = dynamic(() => import('@/components/map/property-map').then(m => ({ default: m.PropertyMap })), { ssr: false });
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { formatNumberEn } from '@/lib/format-numbers';

function formatPropertyType(type: string): string {
  return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

const listingGradients: Record<string, string> = {
  SALE: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
  RENT: 'bg-gradient-to-r from-teal-600 to-cyan-500',
  SHORT_TERM: 'bg-gradient-to-r from-amber-600 to-amber-500',
};

const listingTypeKeys: Record<string, string> = {
  SALE: 'forSale',
  RENT: 'forRent',
  SHORT_TERM: 'shortTerm',
};

const statusKeys: Record<PropertyStatus, 'available' | 'sold' | 'rented' | 'pending'> = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RENTED: 'rented',
  PENDING: 'pending',
};

const propertyTypeKeys: Record<PropertyType, keyof import('@/lib/i18n/translations').Translations['propertyTypes']> = {
  APARTMENT: 'apartment',
  VILLA: 'villa',
  HOUSE: 'house',
  LAND: 'land',
  OFFICE: 'office',
  COMMERCIAL: 'commercial',
  STUDIO: 'studio',
  PENTHOUSE: 'penthouse',
  TOWNHOUSE: 'townhouse',
  DUPLEX: 'duplex',
};

// ─── Component ─────────────────────────────────────────────

export function PropertyDetailPage() {
  const { selectedPropertyId, setCurrentPage, setSelectedPropertyId, toggleFavorite, isFavorite, isAuthenticated, currentUser } = useAppStore();
  const { t, rtl } = useTranslation();
  const { formatPrice } = useSiteCurrency();
  const countryLabel = useLocalizedCountryName();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const inquiryRef = useRef<HTMLDivElement>(null);

  // Fetch property
  useEffect(() => {
    if (!selectedPropertyId) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => { setLoading(false); });
      return;
    }
    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      setLoading(true);
      setActiveImage(0);
    });
    fetch(`/api/properties/${selectedPropertyId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (!cancelled) { setProperty(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedPropertyId]);

  const images: PropertyImage[] = useMemo(() => property?.images ?? [], [property]);
  const coverImage = images.find(img => img.isCover) ?? images[0] ?? null;
  const currentImage = images[activeImage] ?? coverImage;

  const favorited = selectedPropertyId ? isFavorite(selectedPropertyId) : false;
  const isRent = property?.listingType === 'RENT' || property?.listingType === 'SHORT_TERM';
  const location = [
    property?.city?.name,
    property?.region?.name,
    property?.country ? countryLabel(property.country) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const amenities =
    property?.amenities
      ?.map((row) => row.amenity)
      .filter((a): a is Amenity => Boolean(a)) ?? [];

  const whatsappUrl = useMemo(() => {
    if (!property?.agent?.whatsapp) return null;
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const message = rtl
      ? `مرحباً، أنا مهتم بهذا العقار على CIAR:\n${property.title}${link ? `\n${link}` : ''}`
      : `Hi, I'm interested in this property on CIAR:\n${property.title}${link ? `\n${link}` : ''}`;
    return buildWhatsAppUrl(property.agent.whatsapp, message);
  }, [property?.agent?.whatsapp, property?.title, rtl]);

  // Handlers
  const goBack = useCallback(() => {
    setCurrentPage('home');
    setSelectedPropertyId(null);
  }, [setCurrentPage, setSelectedPropertyId]);

  const handleFavorite = useCallback(() => {
    if (!selectedPropertyId) return;
    const nowFav = toggleFavorite(selectedPropertyId);
    toast.success(nowFav ? t.favorites.added : t.favorites.removed);
  }, [selectedPropertyId, toggleFavorite, t]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  }, []);

  const handlePrevImage = useCallback(() => {
    setActiveImage(prev => prev > 0 ? prev - 1 : images.length - 1);
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setActiveImage(prev => prev < images.length - 1 ? prev + 1 : 0);
  }, [images.length]);

  const goToCheckout = useCallback(() => {
    if (!isAuthenticated) {
      toast.error(rtl ? 'سجّل الدخول أولاً' : 'Please sign in first');
      setCurrentPage('login');
      return;
    }
    if (property?.listingType === 'SALE') {
      setCurrentPage('checkout-purchase');
    } else {
      setCurrentPage('checkout-rent');
    }
  }, [isAuthenticated, property?.listingType, rtl, setCurrentPage]);

  const scrollToInquiry = useCallback((messageTemplate: string) => {
    if (!property) return;
    const msg = messageTemplate.replace('{title}', property.title);
    setInquiryMsg(msg);
    requestAnimationFrame(() => {
      inquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [property]);

  const handleSendInquiry = useCallback(async () => {
    if (!property || !inquiryMsg.trim()) return;
    if (!isAuthenticated) {
      toast.error('Please sign in to send a message');
      return;
    }
    setSendingInquiry(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          userId: currentUser?.id,
          name: currentUser?.name ?? '',
          email: currentUser?.email ?? '',
          phone: currentUser?.phone ?? '',
          message: inquiryMsg.trim(),
        }),
      });
      if (res.ok) {
        toast.success(t.contactPage.success);
        setInquiryMsg('');
      } else {
        toast.error(t.contactPage.error);
      }
    } catch {
      toast.error(t.contactPage.error);
    }
    setSendingInquiry(false);
  }, [property, inquiryMsg, isAuthenticated, currentUser, t]);

  // Keyboard nav for gallery
  useEffect(() => {
    if (!showGallery) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'Escape') setShowGallery(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showGallery, handlePrevImage, handleNextImage]);

  // Auto-recover when detail opens without a valid listing (stale id / failed fetch).
  useEffect(() => {
    if (loading || property) return;

    if (!selectedPropertyId) {
      setCurrentPage('home');
      return;
    }

    setSelectedPropertyId(null);
    setCurrentPage('search');
  }, [loading, property, selectedPropertyId, setCurrentPage, setSelectedPropertyId]);

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative h-[60vh] sm:h-[70vh]">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── No property ───
  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <Building2 className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-muted-foreground text-lg">Property not found</p>
        <Button onClick={goBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t.property.back}
        </Button>
      </div>
    );
  }

  // ─── Detail Page ───
  return (
    <div className="min-h-screen">
      {/* ─── Image Gallery ─── */}
      <div className="relative">
        {/* Main image */}
        <div
          className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] cursor-pointer overflow-hidden group"
          onClick={() => images.length > 0 && setShowGallery(true)}
        >
          {currentImage ? (
            <img
              src={currentImage.url}
              alt={currentImage.alt ?? property.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <Building2 className="h-20 w-20 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Back button */}
          <button
            onClick={(e) => { e.stopPropagation(); goBack(); }}
            className="absolute top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Actions - top right */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleFavorite(); }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <Heart className={`h-5 w-5 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            </button>
          </div>

          {/* Listing type badge */}
          <div className="absolute bottom-6 left-6 z-20">
            <Badge className={`${listingGradients[property.listingType] ?? 'bg-primary'} border-0 px-4 py-1.5 text-sm font-bold uppercase text-white shadow-lg`}>
              {t.property[listingTypeKeys[property.listingType] as keyof typeof t.property] ?? property.listingType}
            </Badge>
          </div>

          {/* Image counter + nav */}
          {images.length > 1 && (
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
              <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {activeImage + 1} / {images.length}
              </span>
              <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Thumbnails strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-background/80 backdrop-blur-sm border-b">
            {images.slice(0, 10).map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImage === i ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
              </button>
            ))}
            {images.length > 10 && (
              <button onClick={() => setShowGallery(true)} className="flex h-16 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground hover:bg-muted/80">
                +{images.length - 10}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title + Price */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{formatPropertyType(property.propertyType)}</Badge>
                    {property.isFeatured && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                        <Star className="h-3 w-3 mr-1 fill-amber-500" /> {t.property.featured}
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">{property.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    <span className="text-sm font-medium">{location}</span>
                    {property.address && (
                      <>
                        <span className="text-muted-foreground/40">-</span>
                        <span className="text-sm">{property.address}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-foreground">
                    {formatPrice(property.price, property.country?.currency)}
                  </div>
                  {isRent && (
                    <span className="text-sm text-muted-foreground">{t.property.perMonth}</span>
                  )}
                  <div className="flex items-center gap-2 mt-1 justify-end text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="tabular-nums">{formatNumberEn(property.views)} {t.property.views}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {property.bedrooms != null && property.bedrooms > 0 && (
                <div className="glass-card rounded-xl p-4 text-center">
                  <Bed className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-xl font-bold tabular-nums">{formatNumberEn(property.bedrooms)}</div>
                  <div className="text-xs text-muted-foreground">{t.property.bedrooms}</div>
                </div>
              )}
              {property.bathrooms != null && property.bathrooms > 0 && (
                <div className="glass-card rounded-xl p-4 text-center">
                  <Bath className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-xl font-bold tabular-nums">{formatNumberEn(property.bathrooms)}</div>
                  <div className="text-xs text-muted-foreground">{t.property.bathrooms}</div>
                </div>
              )}
              {property.area > 0 && (
                <div className="glass-card rounded-xl p-4 text-center">
                  <Maximize className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-xl font-bold tabular-nums">{formatNumberEn(property.area)}</div>
                  <div className="text-xs text-muted-foreground">{t.property.sqm}</div>
                </div>
              )}
              {property.yearBuilt && (
                <div className="glass-card rounded-xl p-4 text-center">
                  <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-xl font-bold tabular-nums">{formatNumberEn(property.yearBuilt)}</div>
                  <div className="text-xs text-muted-foreground">{t.property.yearBuilt}</div>
                </div>
              )}
            </div>

            <Separator />

            {/* Property details */}
            <div>
              <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                {t.property.details}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/40 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{t.property.propertyTypeLabel}</dt>
                  <dd className="text-sm font-semibold mt-1">
                    {t.propertyTypes[propertyTypeKeys[property.propertyType]] ?? formatPropertyType(property.propertyType)}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted/40 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{t.property.listingTypeLabel}</dt>
                  <dd className="text-sm font-semibold mt-1">
                    {t.property[listingTypeKeys[property.listingType] as keyof typeof t.property] ?? property.listingType}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted/40 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{t.admin.status}</dt>
                  <dd className="text-sm font-semibold mt-1">{t.status[statusKeys[property.status]]}</dd>
                </div>
                {property.floors != null && property.floors > 0 && (
                  <div className="rounded-xl bg-muted/40 px-4 py-3">
                    <dt className="text-xs text-muted-foreground">{t.property.floors}</dt>
                    <dd className="text-sm font-semibold mt-1 tabular-nums">{formatNumberEn(property.floors)}</dd>
                  </div>
                )}
                {property.address && (
                  <div className="rounded-xl bg-muted/40 px-4 py-3 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">{t.property.addressLabel}</dt>
                    <dd className="text-sm font-semibold mt-1">{property.address}</dd>
                  </div>
                )}
              </dl>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                {t.property.description}
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description || 'No description available for this property.'}
              </p>
            </div>

            <Separator />

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t.property.amenities}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map(a => (
                    <div key={a.id} className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Map */}
            <div>
              <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {t.property.location}
              </h2>
              {mapLoading ? (
                <Skeleton className="h-[300px] w-full rounded-xl" />
              ) : mapCoords ? (
                <PropertyMap lat={mapCoords.lat} lng={mapCoords.lng} address={location} />
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-dashed p-6">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{location}</p>
                    <p className="text-xs text-muted-foreground">{property.address ?? location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Agent Card + Inquiry */}
          <div className="space-y-6">
            {/* Agent Card */}
            {property.agent && (
              <Card className="glass-card overflow-hidden rounded-2xl border-0">
                <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {t.property.listingAgent}
                  </h3>
                  <div className="flex items-center gap-3">
                    {property.agent.user?.avatar ? (
                      <img src={property.agent.user.avatar} alt={property.agent.user.name ?? 'Agent'} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{property.agent.user?.name ?? t.property.agent}</p>
                      <p className="text-xs text-muted-foreground">{property.agent.title ?? t.labels.realEstateAgent}</p>
                      {property.agent.verified && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          <CheckCircle className="h-3 w-3 mr-1 text-primary" /> {t.agents.verified}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {property.agent.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{property.agent.bio}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    {property.agent.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 text-primary/60" />
                        <span>{property.agent.phone}</span>
                      </div>
                    )}
                    {property.agent.whatsapp && whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{property.agent.whatsapp}</span>
                      </a>
                    )}
                    {property.agent.user?.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 text-primary/60" />
                        <span className="truncate">{property.agent.user.email}</span>
                      </div>
                    )}
                    {property.agent.experience && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary/60" />
                        <span>{property.agent.experience} {t.agents.years} {t.agents.experience}</span>
                      </div>
                    )}
                  </div>

                  {property.agent.rating > 0 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const rating = property.agent!.rating;
                        return (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                          />
                        );
                      })}
                      <span className="text-sm font-semibold ml-1">{property.agent.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {property.agent.company && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="h-4 w-4 text-primary/60" />
                        <span className="text-xs font-semibold">{t.agents.company}</span>
                      </div>
                      <p className="text-sm font-medium">{property.agent.company.name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Buy / Book */}
            <Card className="glass-card rounded-2xl border-0 overflow-hidden">
              <CardContent className="p-6 space-y-3">
                {whatsappUrl && (
                  <Button
                    asChild
                    className="w-full rounded-xl bg-[#25D366] py-2.5 font-semibold text-white hover:bg-[#20bd5a] shadow-lg shadow-emerald-500/20"
                  >
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t.property.contactAdvertiser}
                    </a>
                  </Button>
                )}
                {property.listingType === 'SALE' ? (
                  <Button
                    onClick={goToCheckout}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 font-semibold text-white hover:from-emerald-700 hover:to-emerald-600"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t.property.buyNow}
                  </Button>
                ) : property.listingType === 'SHORT_TERM' ? (
                  <Button
                    onClick={goToCheckout}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 font-semibold text-white hover:from-amber-700 hover:to-amber-600"
                  >
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    {t.property.bookStay}
                  </Button>
                ) : (
                  <Button
                    onClick={goToCheckout}
                    className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 py-2.5 font-semibold text-white hover:from-teal-700 hover:to-cyan-600"
                  >
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    {t.property.bookViewing}
                  </Button>
                )}
                {property.agent?.phone && (
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <a href={`tel:${property.agent.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {property.agent.phone}
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Inquiry Form */}
            <div ref={inquiryRef}>
            <Card className="glass-card rounded-2xl border-0">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  {t.property.contactAgent}
                </h3>
                <textarea
                  value={inquiryMsg}
                  onChange={e => setInquiryMsg(e.target.value)}
                  placeholder={t.contactPage.messagePlaceholder}
                  rows={4}
                  className="w-full rounded-xl border bg-background/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
                <Button
                  onClick={handleSendInquiry}
                  disabled={sendingInquiry || !inquiryMsg.trim()}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl py-2.5 font-semibold hover:shadow-lg transition-shadow"
                >
                  {sendingInquiry ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" /> {t.contactPage.sending}</>
                  ) : (
                    <><MessageSquare className="h-4 w-4 mr-2" /> {t.property.sendMessage}</>
                  )}
                </Button>
              </CardContent>
            </Card>
            </div>

            {/* Back button (mobile) */}
            <Button variant="outline" onClick={goBack} className="w-full rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t.property.back}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Full Gallery Modal ─── */}
      {showGallery && images.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setShowGallery(false)}>
          <button onClick={() => setShowGallery(false)} className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>

          {/* Main image */}
          <img
            src={images[activeImage]?.url}
            alt={images[activeImage]?.alt ?? ''}
            className="max-h-[80vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()}
          />

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            {activeImage + 1} / {images.length}
          </div>

          {/* Filmstrip */}
          {images.length > 1 && (
            <div className="absolute bottom-0 inset-x-0 overflow-x-auto px-4 pb-4">
              <div className="flex gap-2 justify-center">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={(e) => { e.stopPropagation(); setActiveImage(i); }}
                    className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${activeImage === i ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
