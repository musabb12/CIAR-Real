'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Building,
  Check,
  Heart,
  Star,
  Shield,
  Clock,
  Send,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import type { Property } from '@/types';
import {
  AIPropertyValuation, VirtualTourViewer, InvestmentROICalculator,
  NeighborhoodInsights, WalkabilityTransit, PriceTrendChart,
  SmartPriceAlerts, PropertyReviews, FloorPlanViewer,
  PriceHeatmap, SchoolDistrictRatings, CommuteCalculator,
  CarbonFootprintRating, SmartHomeCompatibility, NoiseLevelAssessment,
  PetFriendlinessScore, NightlifeProximity, SeasonalPricing,
  RenovationEstimator, RentalYieldCalculator, LifestyleMatch,
  DisasterRiskAssessment, AccessibilityScore, FamilyFriendliness,
  GroceryDelivery, SimilarProperties, PropertyHistoryTimeline,
  MarketBenchmark, EnergyEfficiency, GamifiedExploration
} from '@/components/features/ciar-features';

// ============================================================
// Animation variants
// ============================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

// ============================================================
// Helpers
// ============================================================

function formatPrice(price: number, listingType: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
  return listingType === 'RENT' ? `${formatted}/mo` : formatted;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'SOLD':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'RENTED':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'PENDING':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return '';
  }
}

function getListingTypeColor(type: string): string {
  switch (type) {
    case 'SALE':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'RENT':
      return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'SHORT_TERM':
      return 'bg-violet-100 text-violet-700 border-violet-200';
    default:
      return '';
  }
}

function getPropertyTypeColor(type: string): string {
  switch (type) {
    case 'APARTMENT':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'VILLA':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'HOUSE':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'LAND':
      return 'bg-lime-100 text-lime-700 border-lime-200';
    case 'OFFICE':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'COMMERCIAL':
      return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

// ============================================================
// Skeleton Loader
// ============================================================

function PropertyDetailSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-8 w-full max-w-md" />
      <div className="rounded-xl overflow-hidden">
        <Skeleton className="aspect-[16/9] w-full" />
      </div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-60 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================
// Star Rating Component
// ============================================================

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground'
          }
        />
      ))}
      <span className="ml-1 text-sm font-medium text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function PropertyDetailPage() {
  const {
    selectedPropertyId,
    setCurrentPage,
    toggleFavorite,
    isFavorite,
    currentUser,
    isAuthenticated,
    isFeatureEnabled,
  } = useAppStore();
  const { t } = useTranslation();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Contact form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // Fetch property
  const fetchProperty = useCallback(async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${selectedPropertyId}`);
      if (!res.ok) throw new Error('Property not found');
      const data = await res.json();
      setProperty(data);
      // Set the initial active image to the cover
      const coverIdx = (data.images || []).findIndex((img: { isCover: boolean }) => img.isCover);
      setActiveImageIndex(coverIdx >= 0 ? coverIdx : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load property');
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // Pre-fill contact form if user is logged in
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setFormName(currentUser.name || '');
      setFormEmail(currentUser.email || '');
      setFormPhone(currentUser.phone || '');
    }
  }, [isAuthenticated, currentUser]);

  // Image navigation
  const images = property?.images || [];

  const goToPrev = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Favorite toggle
  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add favorites');
      return;
    }
    const added = toggleFavorite(property!.id);
    if (added) {
      toast.success('Added to favorites');
      // POST to API
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser!.id,
          propertyId: property!.id,
        }),
      }).catch(() => {
        toast.error('Failed to save favorite');
        toggleFavorite(property!.id); // revert optimistic update
      });
    } else {
      toast.info('Removed from favorites');
      fetch(`/api/favorites?userId=${currentUser!.id}&propertyId=${property!.id}`, {
        method: 'DELETE',
      }).catch(() => {
        toast.error('Failed to remove favorite');
      });
    }
  };

  // Contact form submit
  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          userId: currentUser?.id || null,
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
          message: formMessage.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send inquiry');
      }
      toast.success('Your inquiry has been sent successfully!');
      setFormMessage('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Loading & error states
  // ============================================================

  if (loading) return <PropertyDetailSkeleton />;

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="text-muted-foreground" size={28} />
          </div>
          <h2 className="text-xl font-semibold">{error || 'Property not found'}</h2>
          <p className="text-muted-foreground">
            The property you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => setCurrentPage('search')} variant="outline">
            <ArrowLeft size={16} />
            {t.property.back} {t.search.title}
          </Button>
        </motion.div>
      </div>
    );
  }

  const favorited = isFavorite(property.id);
  const agent = property.agent;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto"
    >
      {/* Hero Banner */}
      <motion.div
        variants={fadeInUp}
        className="relative -mx-4 -mt-4 overflow-hidden sm:-mx-6 md:-mx-6 sm:-mt-6 md:-mt-6"
        style={{
          backgroundImage: "url('https://picsum.photos/seed/ciar-property-bg/1920/400.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        <div className="relative px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentPage('search')}
              className="gap-2 -ml-2 text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft size={16} />
              {t.property.back}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getListingTypeColor(property.listingType)}>
              {property.listingType === 'SALE' ? t.property.forSale : property.listingType === 'RENT' ? t.property.forRent : t.property.shortTerm}
            </Badge>
            <Badge className={getPropertyTypeColor(property.propertyType)}>
              {property.propertyType.replace(/_/g, ' ')}
            </Badge>
            <Badge className={getStatusColor(property.status)}>
              {property.status === 'AVAILABLE' ? t.status.available : property.status === 'SOLD' ? t.status.sold : property.status === 'RENTED' ? t.status.rented : t.status.pending}
            </Badge>
            {property.isFeatured && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                <Star size={12} className="fill-amber-500" />
                {t.property.featured}
              </Badge>
            )}
          </div>
          <h1 className="font-heading mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            {property.title}
          </h1>
          <div className="mt-3 h-[3px] w-16 bg-gradient-to-r from-amber-500 to-amber-400" />
          <div className="mt-3 flex items-center gap-2 text-white/80">
            <MapPin size={16} />
            <span className="text-sm">
              {[property.city?.name, property.region?.name, property.country?.name]
                .filter(Boolean)
                .join(', ') || 'Unknown Location'}
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400 sm:text-3xl">
            {formatPrice(property.price, property.listingType)}
          </div>
        </div>
      </motion.div>

      {/* Image Gallery */}
      <motion.div variants={fadeInUp} className="space-y-3">
        <div className="relative rounded-xl overflow-hidden bg-muted">
          <img
            src={
              images.length > 0
                ? images[activeImageIndex].url
                : 'https://placehold.co/800x500?text=No+Image'
            }
            alt={
              images.length > 0
                ? images[activeImageIndex].alt || property.title
                : property.title
            }
            className="w-full aspect-[16/9] object-cover"
          />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white border-0 shadow-lg"
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white border-0 shadow-lg"
              >
                <ChevronRight size={20} />
              </Button>
              {/* Image counter */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {activeImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === activeImageIndex
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Property Header */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getListingTypeColor(property.listingType)}>
                {property.listingType === 'SALE' ? t.property.forSale : property.listingType === 'RENT' ? t.property.forRent : t.property.shortTerm}
              </Badge>
              <Badge className={getPropertyTypeColor(property.propertyType)}>
                {property.propertyType.replace(/_/g, ' ')}
              </Badge>
              <Badge className={getStatusColor(property.status)}>
                {property.status === 'AVAILABLE' ? t.status.available : property.status === 'SOLD' ? t.status.sold : property.status === 'RENTED' ? t.status.rented : t.status.pending}
              </Badge>
              {property.isFeatured && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                  <Star size={12} className="fill-amber-500" />
                  {t.property.featured}
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold leading-tight">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={16} />
              <span className="text-sm">
                {[property.city?.name, property.region?.name, property.country?.name]
                  .filter(Boolean)
                  .join(', ') || 'Unknown Location'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {formatPrice(property.price, property.listingType)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              Listed {formatDate(property.createdAt)}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              className="mt-1"
            >
              <Heart
                size={20}
                className={
                  favorited
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground'
                }
              />
              <span className="sr-only">
                {favorited ? 'Remove from favorites' : 'Add to favorites'}
              </span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Details Grid */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {property.bedrooms !== null && (
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Bed size={22} className="text-primary" />
                  <div className="text-center">
                    <div className="text-lg font-semibold">{property.bedrooms}</div>
                    <div className="text-xs text-muted-foreground">{t.property.bedrooms}</div>
                  </div>
                </div>
              )}
              {property.bathrooms !== null && (
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Bath size={22} className="text-primary" />
                  <div className="text-center">
                    <div className="text-lg font-semibold">{property.bathrooms}</div>
                    <div className="text-xs text-muted-foreground">{t.property.bathrooms}</div>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Maximize size={22} className="text-primary" />
                <div className="text-center">
                  <div className="text-lg font-semibold">{property.area}</div>
                  <div className="text-xs text-muted-foreground">{t.property.sqm}</div>
                </div>
              </div>
              {property.yearBuilt && (
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Calendar size={22} className="text-primary" />
                  <div className="text-center">
                    <div className="text-lg font-semibold">{property.yearBuilt}</div>
                    <div className="text-xs text-muted-foreground">{t.property.yearBuilt}</div>
                  </div>
                </div>
              )}
              {property.floors && (
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Building size={22} className="text-primary" />
                  <div className="text-center">
                    <div className="text-lg font-semibold">{property.floors}</div>
                    <div className="text-xs text-muted-foreground">{t.property.floors}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Description */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">{t.property.description}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">{t.property.amenities}</CardTitle>
              <CardDescription>
                {property.amenities.length} amenities available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {property.amenities.map((pa) => (
                  <div
                    key={pa.id}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-sm"
                  >
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                    <span className="truncate">
                      {pa.amenity?.name || 'Amenity'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Agent Card & Contact Form */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Card */}
        {agent && (
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-heading">{t.property.listingAgent}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={agent.user?.avatar || undefined}
                    alt={agent.user?.name || 'Agent'}
                  />
                  <AvatarFallback className="text-lg font-semibold">
                    {(agent.user?.name || 'AG')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base truncate">
                      {agent.user?.name || 'Unknown Agent'}
                    </h3>
                    {agent.verified && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"
                      >
                        <Shield size={10} />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {agent.title || 'Real Estate Agent'}
                  </p>
                  {agent.company && (
                    <p className="text-sm text-muted-foreground">
                      {agent.company.name}
                    </p>
                  )}
                  <StarRating rating={agent.rating} size={14} />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {agent.experience && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {agent.experience} years experience
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Building size={12} />
                      {agent.totalListings} listings
                    </span>
                  </div>
                </div>
              </div>

              {agent.bio && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {agent.bio}
                  </p>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => setCurrentPage('agents')}
                variant="outline"
              >
                View Agent Profile
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Contact Form */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="font-heading">{t.property.contactAgent}</CardTitle>
            <CardDescription>
              Send an inquiry about this property
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name *</Label>
                <Input
                  id="contact-name"
                  placeholder="Your full name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message">Message *</Label>
                <Textarea
                  id="contact-message"
                  placeholder={`I'm interested in "${property.title}". Please provide more information.`}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Inquiry
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Location Map Placeholder */}
      {property.latitude && property.longitude && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <MapPin size={18} />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/80 border border-dashed p-8 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin size={24} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {property.address || 'Property Location'}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1"
                >
                  <Button variant="outline" size="sm">
                    <MapPin size={14} />
                    Open in Google Maps
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* CIAR SMART TOOLS SECTION */}
      <motion.div variants={fadeInUp} className="mt-12">
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold">{t.property.smartTools}</h2>
          <div className="mt-2 h-[3px] w-16 bg-gradient-to-r from-amber-500 to-amber-400" />
          <p className="mt-2 text-muted-foreground">Advanced analytics and AI-powered insights</p>
        </div>

        {/* AI Features */}
        {isFeatureEnabled('ai_valuation') && <AIPropertyValuation property={property} />}

        {/* Analytics Features */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isFeatureEnabled('roi_calculator') && <InvestmentROICalculator property={property} />}
          {isFeatureEnabled('neighborhood') && <NeighborhoodInsights property={property} />}
          {isFeatureEnabled('walkability') && <WalkabilityTransit property={property} />}
          {isFeatureEnabled('price_trends') && <PriceTrendChart property={property} />}
          {isFeatureEnabled('schools') && <SchoolDistrictRatings property={property} />}
          {isFeatureEnabled('carbon') && <CarbonFootprintRating property={property} />}
          {isFeatureEnabled('noise') && <NoiseLevelAssessment property={property} />}
          {isFeatureEnabled('nightlife') && <NightlifeProximity property={property} />}
          {isFeatureEnabled('seasonal') && <SeasonalPricing property={property} />}
          {isFeatureEnabled('rental_yield') && <RentalYieldCalculator property={property} />}
          {isFeatureEnabled('disaster') && <DisasterRiskAssessment property={property} />}
          {isFeatureEnabled('family') && <FamilyFriendliness property={property} />}
          {isFeatureEnabled('benchmark') && <MarketBenchmark property={property} />}
          {isFeatureEnabled('energy') && <EnergyEfficiency property={property} />}
        </div>

        {/* Tools Features */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isFeatureEnabled('virtual_tour') && <VirtualTourViewer property={property} />}
          {isFeatureEnabled('floor_plan') && <FloorPlanViewer property={property} />}
          {isFeatureEnabled('commute') && <CommuteCalculator property={property} />}
          {isFeatureEnabled('smart_home') && <SmartHomeCompatibility property={property} />}
          {isFeatureEnabled('pet_friendly') && <PetFriendlinessScore property={property} />}
          {isFeatureEnabled('renovation') && <RenovationEstimator property={property} />}
          {isFeatureEnabled('accessibility') && <AccessibilityScore property={property} />}
          {isFeatureEnabled('grocery') && <GroceryDelivery property={property} />}
          {isFeatureEnabled('heatmap') && <PriceHeatmap property={property} />}
        </div>

        {/* Social Features */}
        {isFeatureEnabled('reviews') && <PropertyReviews property={property} />}

        {/* Full-width features */}
        {isFeatureEnabled('similarity') && <SimilarProperties property={property} />}
        {isFeatureEnabled('timeline') && <PropertyHistoryTimeline property={property} />}
        {isFeatureEnabled('lifestyle') && <LifestyleMatch property={property} />}
        {isFeatureEnabled('price_alerts') && <SmartPriceAlerts property={property} />}
        {isFeatureEnabled('gamification') && <GamifiedExploration property={property} />}
      </motion.div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </motion.div>
  );
}
