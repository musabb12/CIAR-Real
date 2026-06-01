// ============================================================
// Enums matching Prisma
// ============================================================

export type UserRole = 'GUEST' | 'USER' | 'AGENT' | 'ADMIN' | 'OWNER' | 'COMPANY';

export type AccountType = 'CLIENT' | 'OWNER' | 'COMPANY';

export type TransactionType = 'PURCHASE' | 'RENT' | 'SHORT_TERM_RENT';
export type TransactionStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface Transaction {
  id: string;
  propertyId: string;
  userId: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currencySymbol: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  checkIn: string | null;
  checkOut: string | null;
  notes: string | null;
  paymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
  property?: Property;
}
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
  adminPermissions?: Record<string, boolean>;
  adminTasks?: string[];
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
  adminPermissions?: Record<string, boolean>;
  adminTasks?: string[];
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
  isFeatured?: boolean;
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
  adminReply?: string | null;
  repliedAt?: string | null;
  replySource?: 'manual' | 'auto' | null;
  autoReplyTemplateId?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  user?: User;
}

export interface InquiryAutoReply {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  /** When true, sent automatically to every new inquiry (only one should be active). */
  sendOnNewInquiry: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
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
  | 'contact'
  | 'admin'
  | 'admin-login'
  | 'partner-dashboard'
  | 'checkout-purchase'
  | 'checkout-rent'
  | 'checkout-complete'
  | 'register'
  | 'login';

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

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteDesignSettings {
  primaryColor: string;
  accentColor: string;
  heroImageUrl: string;
  /** CSS background for the ticker bar; empty keeps the default frosted glass look */
  newsTickerBackground: string;
  /** CSS color for scrolling text; empty uses theme foreground */
  newsTickerTextColor: string;
  newsTickerFontSizePx: number;
  newsTickerHeightPx: number;
  /** CSS color for the «breaking» label and bell; empty uses theme primary */
  newsTickerLabelTextColor: string;
  /** CSS background for the label column; empty uses a subtle primary-tinted gradient */
  newsTickerLabelBackground: string;
  /** CSS color for the «|» separators; empty uses muted foreground */
  newsTickerSeparatorColor: string;
}

export interface SiteSocialSettings {
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  facebook: string;
  instagram: string;
  x: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
}

export type ManagedPageKey =
  | 'home'
  | 'search'
  | 'agents'
  | 'contact'
  | 'favorites'
  | 'login'
  | 'register'
  | 'admin-login';

export interface PageContentEntry {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  backgroundImageUrl?: string;
  backgroundImageUrls?: string[];
  hideBadge?: boolean;
  textAlign?: 'start' | 'center' | 'end';
  titleSize?: 'md' | 'lg' | 'xl';
  overlayOpacity?: number;
  contentMaxWidth?: 'md' | 'lg' | 'xl';
}

export type SiteContentSettings = Record<ManagedPageKey, PageContentEntry>;

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
