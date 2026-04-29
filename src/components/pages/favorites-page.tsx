'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Star,
  LogIn,
  Search,
  ImageIcon,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import type { Favorite, Property } from '@/types';

// ============================================================
// Animation variants
// ============================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
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

function FavoritesSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-24 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <div className="relative">
              <Skeleton className="aspect-[4/3] w-full rounded-t-xl" />
              <Skeleton className="absolute top-3 right-3 h-9 w-9 rounded-full" />
            </div>
            <CardContent className="pt-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
              <div className="flex gap-3 mt-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-24 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Property Card for Favorites
// ============================================================

function FavoritePropertyCard({
  favorite,
  onRemove,
  onViewProperty,
}: {
  favorite: Favorite;
  onRemove: (propertyId: string) => void;
  onViewProperty: (propertyId: string) => void;
}) {
  const property = favorite.property;
  if (!property) return null;

  const coverImage =
    property.images && property.images.length > 0
      ? property.images[0].url
      : 'https://placehold.co/400x300?text=No+Image';

  return (
    <motion.div variants={fadeInUp} layout>
      <Card className="overflow-hidden group hover:shadow-lg transition-all h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={coverImage}
            alt={property.title}
            className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Remove button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(property.id);
            }}
            className="absolute top-3 right-3 rounded-full bg-white/90 hover:bg-white shadow-md border-0"
          >
            <Heart size={16} className="fill-red-500 text-red-500" />
          </Button>
          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
            {property.isFeatured && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                <Star size={10} className="fill-amber-500" />
                Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent
          className="flex-1 flex flex-col pt-4 cursor-pointer"
          onClick={() => onViewProperty(property.id)}
        >
          <Badge
            variant="outline"
            className={`w-fit mb-2 ${getPropertyTypeColor(property.propertyType)}`}
          >
            {property.propertyType.replace(/_/g, ' ')}
          </Badge>

          <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          <div className="flex items-center gap-1.5 text-muted-foreground mt-1.5">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="text-sm truncate">
              {[property.city?.name, property.region?.name, property.country?.name]
                .filter(Boolean)
                .join(', ') || 'Unknown Location'}
            </span>
          </div>

          {/* Details */}
          <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <Bed size={14} />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-1">
                <Bath size={14} />
                {property.bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize size={14} />
              {property.area} sqm
            </span>
          </div>

          {/* Price */}
          <div className="mt-auto pt-3">
            <p className="text-lg font-bold text-primary">
              {formatPrice(property.price, property.listingType)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function FavoritesPage() {
  const {
    isAuthenticated,
    currentUser,
    setCurrentPage,
    setSelectedPropertyId,
    removeFavorite,
  } = useAppStore();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/favorites?userId=${currentUser.id}`);
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Remove favorite
  const handleRemove = async (propertyId: string) => {
    if (!currentUser) return;
    setRemovingId(propertyId);
    try {
      const res = await fetch(
        `/api/favorites?userId=${currentUser.id}&propertyId=${propertyId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove');
      }
      // Optimistic removal
      setFavorites((prev) => prev.filter((f) => f.propertyId !== propertyId));
      removeFavorite(propertyId);
      toast.success('Removed from favorites');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  // View property
  const handleViewProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setCurrentPage('property-detail');
  };

  // ============================================================
  // Auth Gate
  // ============================================================

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn size={36} className="text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Sign In Required</h2>
          <p className="text-muted-foreground max-w-sm">
            Please sign in to view and manage your favorite properties. Your saved
            listings will appear here once you&apos;re logged in.
          </p>
        </div>
        <Button size="lg" onClick={() => setCurrentPage('home')}>
          <LogIn size={16} />
          Sign In
        </Button>
      </motion.div>
    );
  }

  // ============================================================
  // Loading state
  // ============================================================

  if (loading) return <FavoritesSkeleton />;

  // ============================================================
  // Error state
  // ============================================================

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Heart className="text-muted-foreground" size={28} />
          </div>
          <h2 className="text-xl font-semibold">Failed to load favorites</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button onClick={fetchFavorites} variant="outline">
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // Main Content
  // ============================================================

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="p-4 md:p-6 max-w-6xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl md:text-3xl font-bold">My Favorites</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {favorites.length} saved {favorites.length === 1 ? 'property' : 'properties'}
        </p>
      </motion.div>

      {/* Empty state */}
      {favorites.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Heart className="text-muted-foreground/50" size={32} />
          </div>
          <h3 className="text-xl font-semibold">No favorites yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Start browsing properties and click the heart icon to save your favorites
            here for easy access later.
          </p>
          <Button
            className="mt-6"
            onClick={() => setCurrentPage('search')}
          >
            <Search size={16} />
            Browse Properties
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {favorites.map((fav) => (
              <FavoritePropertyCard
                key={fav.id}
                favorite={fav}
                onRemove={handleRemove}
                onViewProperty={handleViewProperty}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
