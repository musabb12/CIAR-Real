// ============================================================
// Enums matching Prisma
// ============================================================

export type UserRole = 'GUEST' | 'USER' | 'AGENT' | 'ADMIN';
export type ListingType = 'SALE' | 'RENT' | 'SHORT_TERM';
export type PropertyType =
  | 'APARTMENT'
  | 'VILLA'
  | 'HOUSE'
  | 'LAND'
  | 'OFFICE'
  | 'COMMERCIAL'
  | 'STUDIO'
  | 'PENTHOUSE'
  | 'TOWNHOUSE'
  | 'DUPLEX';
export type PropertyStatus = 'AVAILABLE' | 'SOLD' | 'RENTED' | 'PENDING';

// ============================================================
// Interfaces matching Prisma models
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  password?: string | null;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  agent?: Agent;
}

export interface Agent {
  id: string;
  userId: string;
  user?: User;
  bio: string | null;
  title: string | null;
  license: string | null;
  phone: string | null;
  whatsapp: string | null;
  experience: number | null;
  rating: number;
  totalListings: number;
  totalSales: number;
  verified: boolean;
  companyId: string | null;
  company?: Company;
  createdAt: string;
  updatedAt: string;
  properties?: Property[];
}

export interface Company {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  founded: number | null;
  agentCount: number;
  listingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag: string | null;
  currency: string | null;
  currencySymbol: string | null;
  isActive: boolean;
  regions?: Region[];
}

export interface Region {
  id: string;
  name: string;
  countryId: string;
  cities?: City[];
}

export interface City {
  id: string;
  name: string;
  regionId: string;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  yearBuilt: number | null;
  isFeatured: boolean;
  views: number;
  countryId: string;
  regionId: string;
  cityId: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
  country?: Country;
  region?: Region;
  city?: City;
  agent?: Agent;
  images?: PropertyImage[];
  amenities?: PropertyAmenity[];
}

export interface PropertyImage {
  id: string;
  url: string;
  alt: string | null;
  isCover: boolean;
  order: number;
  propertyId: string;
}

export interface PropertyAmenity {
  id: string;
  propertyId: string;
  amenityId: string;
  amenity?: Amenity;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string | null;
  category: string | null;
}

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
  property?: Property;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  user?: User;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string | null;
  position: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Filter types
// ============================================================

export interface PropertyFilters {
  countryId?: string;
  regionId?: string;
  cityId?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaMin?: number;
  areaMax?: number;
  isFeatured?: boolean;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

// ============================================================
// App page types
// ============================================================

export type AppPage =
  | 'home'
  | 'search'
  | 'property-detail'
  | 'agents'
  | 'favorites'
  | 'admin'
  | 'admin-login';

export interface AdminTab {
  id: string;
  label: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalProperties: number;
  totalUsers: number;
  totalAgents: number;
  totalInquiries: number;
  totalViews: number;
  propertiesByType: Record<string, number>;
  recentInquiries: Inquiry[];
  propertiesByCountry: Record<string, number>;
  inquiriesByStatus: Record<string, number>;
}

export interface FeatureToggle {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  isEnabled: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyReview {
  id: string;
  propertyId: string;
  userId: string | null;
  name: string;
  email: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}
