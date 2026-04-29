'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import type {
  Property, User, Agent, Country, Region, City,
  Inquiry, Banner, Amenity, ListingType, PropertyType, PropertyStatus,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENT IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';

// ═══════════════════════════════════════════════════════════════════════════════
// LUCIDE ICON IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import {
  LayoutDashboard, Building2, Users, MessageSquare, Eye,
  TrendingUp, Plus, Edit, Trash2, Search, BarChart3, MapPin,
  Flag, Image as ImageIcon, ChevronDown, ChevronRight, MoreHorizontal,
  LogIn, ShieldAlert, Star, Globe, Home, Crown,
  // Feature icon imports
  Brain, Footprints, Bell, LayoutGrid,
  Flame, GraduationCap, Car, Leaf, Wifi, Volume2, Dog, Music, CalendarDays,
  Hammer, Coins, Heart, ShieldCheck, Accessibility, ShoppingCart, Copy,
  History, Gauge, Zap, Trophy, Sparkles, Wrench, Settings,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// RECHARTS IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CHART_COLORS = [
  '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#f97316', '#84cc16', '#ec4899', '#64748b', '#0ea5e9',
];

const PROPERTY_TYPES: PropertyType[] = [
  'APARTMENT', 'VILLA', 'HOUSE', 'LAND', 'OFFICE',
  'COMMERCIAL', 'STUDIO', 'PENTHOUSE', 'TOWNHOUSE', 'DUPLEX',
];

const LISTING_TYPES: ListingType[] = ['SALE', 'RENT', 'SHORT_TERM'];

const PROPERTY_STATUSES: PropertyStatus[] = ['AVAILABLE', 'SOLD', 'RENTED', 'PENDING'];

const USER_ROLES = ['ADMIN', 'AGENT', 'USER', 'GUEST'] as const;

const INQUIRY_STATUSES = ['NEW', 'READ', 'REPLIED', 'CLOSED'] as const;

const BANNER_POSITIONS = ['home', 'search', 'sidebar', 'property', 'footer'] as const;

const LOCATION_TYPES = ['Country', 'Region', 'City'] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC ICON MAP FOR FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

const iconMap: Record<string, React.ElementType> = {
  Brain, Eye, TrendingUp, MapPin, Footprints, BarChart3, Bell, Star, LayoutGrid,
  Flame, GraduationCap, Car, Leaf, Wifi, Volume2, Dog, Music, CalendarDays,
  Hammer, Coins, Heart, ShieldCheck, Accessibility, Users, ShoppingCart, Copy,
  History, Gauge, Zap, Trophy, Wrench, Sparkles, ShieldAlert,
};

// Category icon mapping
const categoryIconMap: Record<string, React.ElementType> = {
  ai: Brain,
  analytics: BarChart3,
  tools: Wrench,
  social: Users,
  general: Sparkles,
};

// Category color mapping
const categoryColorMap: Record<string, string> = {
  ai: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  analytics: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  tools: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  social: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  general: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface StatsResponse {
  totals: {
    properties: number;
    users: number;
    agents: number;
    inquiries: number;
    views: number;
    featuredProperties: number;
  };
  propertiesByType: { type: string; count: number }[];
  inquiriesByStatus: { status: string; count: number }[];
  recentInquiries: Inquiry[];
}

interface PropertiesResponse {
  data: Property[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface FeatureItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isEnabled: boolean;
  order: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(price);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE CLASS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const propertyStatusClasses: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  SOLD: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  RENTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const inquiryStatusClasses: Record<string, string> = {
  NEW: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  READ: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  REPLIED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const userRoleClasses: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  AGENT: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  USER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  GUEST: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const newsTypeClasses: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  promo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT FORM VALUES
// ═══════════════════════════════════════════════════════════════════════════════

const defaultPropertyForm = {
  title: '',
  description: '',
  price: '',
  listingType: 'SALE' as ListingType,
  propertyType: 'APARTMENT' as PropertyType,
  status: 'AVAILABLE' as PropertyStatus,
  area: '',
  bedrooms: '',
  bathrooms: '',
  floors: '',
  yearBuilt: '',
  address: '',
  countryId: '',
  regionId: '',
  cityId: '',
  agentId: '',
  isFeatured: false,
  imageUrls: '',
  selectedAmenities: [] as string[],
};

// ═══════════════════════════════════════════════════════════════════════════════
// FADE-IN ANIMATION VARIANT
// ═══════════════════════════════════════════════════════════════════════════════

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { currentUser, isAuthenticated, setCurrentPage } = useAppStore();
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'ADMIN';

  // ── Active Tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERVIEW STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPERTIES STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propSearch, setPropSearch] = useState('');
  const [propListingFilter, setPropListingFilter] = useState('all');
  const [propTypeFilter, setPropTypeFilter] = useState('all');
  const [propStatusFilter, setPropStatusFilter] = useState('all');
  const [propDialogOpen, setPropDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propForm, setPropForm] = useState({ ...defaultPropertyForm });
  const [propSaving, setPropSaving] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', role: 'USER' as string, isActive: true });
  const [userSaving, setUserSaving] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATIONS STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [locations, setLocations] = useState<Country[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [locDialogOpen, setLocDialogOpen] = useState(false);
  const [locForm, setLocForm] = useState({ type: 'Country', name: '', code: '', parentId: '' });
  const [locSaving, setLocSaving] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // INQUIRIES STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inqStatusFilter, setInqStatusFilter] = useState('all');
  const [inqViewOpen, setInqViewOpen] = useState(false);
  const [viewingInquiry, setViewingInquiry] = useState<Inquiry | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // BANNERS STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', image: '', link: '',
    position: 'home', order: 0, isActive: true,
  });
  const [bannerSaving, setBannerSaving] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURES STATE (NEW)
  // ═══════════════════════════════════════════════════════════════════════════

  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [featureSearch, setFeatureSearch] = useState('');
  const [featureCategoryFilter, setFeatureCategoryFilter] = useState('all');

  // ═══════════════════════════════════════════════════════════════════════════
  // NEWS STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [newsForm, setNewsForm] = useState({ content: '', link: '', type: 'info', order: 0, isActive: true });
  const [newsSaving, setNewsSaving] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const [agents, setAgents] = useState<Agent[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE DIALOG STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Fetch Stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data: StatsResponse = await res.json();
      setStats(data);
    } catch {
      toast.error('Failed to load dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch Properties ──────────────────────────────────────────────────────
  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (propSearch) params.set('search', propSearch);
      if (propListingFilter !== 'all') params.set('listingType', propListingFilter);
      if (propTypeFilter !== 'all') params.set('propertyType', propTypeFilter);
      if (propStatusFilter !== 'all') params.set('status', propStatusFilter);
      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch properties');
      const data: PropertiesResponse = await res.json();
      setProperties(data.data);
    } catch {
      toast.error('Failed to load properties');
    } finally {
      setPropertiesLoading(false);
    }
  }, [propSearch, propListingFilter, propTypeFilter, propStatusFilter]);

  // ── Fetch Users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: User[] = await res.json();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ── Fetch Locations ───────────────────────────────────────────────────────
  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const res = await fetch('/api/locations');
      if (!res.ok) throw new Error('Failed to fetch locations');
      const data: Country[] = await res.json();
      setLocations(data);
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  // ── Fetch Inquiries ───────────────────────────────────────────────────────
  const fetchInquiries = useCallback(async () => {
    setInquiriesLoading(true);
    try {
      const params = new URLSearchParams();
      if (inqStatusFilter !== 'all') params.set('status', inqStatusFilter);
      const res = await fetch(`/api/inquiries?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch inquiries');
      const data: Inquiry[] = await res.json();
      setInquiries(data);
    } catch {
      toast.error('Failed to load inquiries');
    } finally {
      setInquiriesLoading(false);
    }
  }, [inqStatusFilter]);

  // ── Fetch Banners ─────────────────────────────────────────────────────────
  const fetchBanners = useCallback(async () => {
    setBannersLoading(true);
    try {
      const res = await fetch('/api/banners');
      if (!res.ok) throw new Error('Failed to fetch banners');
      const data: Banner[] = await res.json();
      setBanners(data);
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setBannersLoading(false);
    }
  }, []);

  // ── Fetch News ───────────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setNewsItems(data);
    } catch {
      toast.error('Failed to load news');
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // ── Fetch Features (NEW) ──────────────────────────────────────────────────
  const fetchFeatures = useCallback(async () => {
    setFeaturesLoading(true);
    try {
      const res = await fetch('/api/features');
      if (!res.ok) throw new Error('Failed to fetch features');
      const data: FeatureItem[] = await res.json();
      setFeatures(data);
    } catch {
      toast.error('Failed to load features');
    } finally {
      setFeaturesLoading(false);
    }
  }, []);

  // ── Fetch Agents ──────────────────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) return;
      const data: Agent[] = await res.json();
      setAgents(data);
    } catch { /* silent */ }
  }, []);

  // ── Fetch Amenities ───────────────────────────────────────────────────────
  const fetchAmenities = useCallback(async () => {
    try {
      const res = await fetch('/api/amenities');
      if (!res.ok) return;
      const data: Amenity[] = await res.json();
      setAmenities(data);
    } catch { /* silent */ }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS — Fetch data on tab change
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'properties') fetchProperties();
  }, [activeTab, fetchProperties]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'locations') fetchLocations();
  }, [activeTab, fetchLocations]);

  useEffect(() => {
    if (activeTab === 'inquiries') fetchInquiries();
  }, [activeTab, fetchInquiries]);

  useEffect(() => {
    if (activeTab === 'banners') fetchBanners();
  }, [activeTab, fetchBanners]);

  useEffect(() => {
    if (activeTab === 'features') fetchFeatures();
  }, [activeTab, fetchFeatures]);

  useEffect(() => {
    if (activeTab === 'news') fetchNews();
  }, [activeTab, fetchNews]);

  useEffect(() => { fetchAgents(); fetchAmenities(); fetchLocations(); }, [fetchAgents, fetchAmenities, fetchLocations]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — Property CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  const updatePropForm = (field: string, value: unknown) => {
    setPropForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'countryId') { next.regionId = ''; next.cityId = ''; }
      else if (field === 'regionId') { next.cityId = ''; }
      return next;
    });
  };

  const openPropertyDialog = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
      setPropForm({
        title: property.title,
        description: property.description,
        price: String(property.price),
        listingType: property.listingType,
        propertyType: property.propertyType,
        status: property.status,
        area: String(property.area),
        bedrooms: property.bedrooms != null ? String(property.bedrooms) : '',
        bathrooms: property.bathrooms != null ? String(property.bathrooms) : '',
        floors: property.floors != null ? String(property.floors) : '',
        yearBuilt: property.yearBuilt != null ? String(property.yearBuilt) : '',
        address: property.address || '',
        countryId: property.countryId,
        regionId: property.regionId,
        cityId: property.cityId,
        agentId: property.agentId || '',
        isFeatured: property.isFeatured,
        imageUrls: property.images?.map((i) => i.url).join(', ') || '',
        selectedAmenities: property.amenities?.map((a) => a.amenityId) || [],
      });
    } else {
      setEditingProperty(null);
      setPropForm({ ...defaultPropertyForm, selectedAmenities: [] });
    }
    setPropDialogOpen(true);
  };

  const saveProperty = async () => {
    if (!propForm.title || !propForm.price || !propForm.countryId || !propForm.regionId || !propForm.cityId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setPropSaving(true);
    try {
      const imageUrls = propForm.imageUrls.split(',').map((u) => u.trim()).filter(Boolean);
      const images = imageUrls.map((url, i) => ({ url, alt: '', isCover: i === 0, order: i }));
      const body = {
        ...propForm,
        price: parseFloat(propForm.price) || 0,
        area: parseFloat(propForm.area) || 0,
        bedrooms: propForm.bedrooms ? parseInt(propForm.bedrooms, 10) : null,
        bathrooms: propForm.bathrooms ? parseInt(propForm.bathrooms, 10) : null,
        floors: propForm.floors ? parseInt(propForm.floors, 10) : null,
        yearBuilt: propForm.yearBuilt ? parseInt(propForm.yearBuilt, 10) : null,
        agentId: propForm.agentId || null,
        images,
        amenityIds: propForm.selectedAmenities,
      };
      const url = editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save property');
      }
      toast.success(editingProperty ? 'Property updated successfully' : 'Property created successfully');
      setPropDialogOpen(false);
      setEditingProperty(null);
      fetchProperties();
      fetchStats();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save property');
    } finally {
      setPropSaving(false);
    }
  };

  const toggleFeatured = async (property: Property) => {
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !property.isFeatured }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Property ${property.isFeatured ? 'unfeatured' : 'featured'}`);
      fetchProperties();
      fetchStats();
    } catch {
      toast.error('Failed to update property');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — User Management
  // ═══════════════════════════════════════════════════════════════════════════

  const openUserDialog = (user: User) => {
    setEditingUser(user);
    setUserForm({ name: user.name || '', role: user.role, isActive: user.isActive });
    setUserDialogOpen(true);
  };

  const saveUser = async () => {
    if (!editingUser) return;
    setUserSaving(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      if (!res.ok) throw new Error();
      toast.success('User updated successfully');
      setUserDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    } finally {
      setUserSaving(false);
    }
  };

  const toggleUserActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — Inquiries
  // ═══════════════════════════════════════════════════════════════════════════

  const updateInquiryStatus = async (inquiry: Inquiry, newStatus: string) => {
    try {
      const res = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Inquiry status updated to ${newStatus}`);
      fetchInquiries();
      fetchStats();
    } catch {
      toast.error('Failed to update inquiry status');
    }
  };

  const viewInquiry = (inquiry: Inquiry) => {
    setViewingInquiry(inquiry);
    setInqViewOpen(true);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — Banners
  // ═══════════════════════════════════════════════════════════════════════════

  const openBannerDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title, subtitle: banner.subtitle || '', image: banner.image || '',
        link: banner.link || '', position: banner.position, order: banner.order, isActive: banner.isActive,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({ title: '', subtitle: '', image: '', link: '', position: 'home', order: banners.length, isActive: true });
    }
    setBannerDialogOpen(true);
  };

  const saveBanner = async () => {
    if (!bannerForm.title) { toast.error('Title is required'); return; }
    setBannerSaving(true);
    try {
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bannerForm) });
      if (!res.ok) throw new Error();
      toast.success(editingBanner ? 'Banner updated' : 'Banner created');
      setBannerDialogOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } catch {
      toast.error('Failed to save banner');
    } finally {
      setBannerSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — Locations
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleCountry = (id: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openLocationDialog = (type?: string, parentId?: string) => {
    setLocForm({ type: type || 'Country', name: '', code: '', parentId: parentId || '' });
    setLocDialogOpen(true);
  };

  const saveLocation = async () => {
    if (!locForm.name) { toast.error('Name is required'); return; }
    setLocSaving(true);
    try {
      let body: Record<string, unknown> = {};
      if (locForm.type === 'Country') {
        body = { name: locForm.name, code: locForm.code || locForm.name.substring(0, 2).toUpperCase() };
      } else if (locForm.type === 'Region') {
        body = { name: locForm.name, countryId: locForm.parentId };
      } else {
        body = { name: locForm.name, regionId: locForm.parentId };
      }
      const res = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast.success(`${locForm.type} created`);
      setLocDialogOpen(false);
      fetchLocations();
    } catch {
      toast.error('Failed to create location');
    } finally {
      setLocSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — News CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  const openNewsDialog = (item?: any) => {
    if (item) {
      setEditingNews(item);
      setNewsForm({
        content: item.content || '',
        link: item.link || '',
        type: item.type || 'info',
        order: item.order ?? 0,
        isActive: item.isActive ?? true,
      });
    } else {
      setEditingNews(null);
      setNewsForm({ content: '', link: '', type: 'info', order: newsItems.length, isActive: true });
    }
    setNewsDialogOpen(true);
  };

  const saveNews = async () => {
    if (!newsForm.content.trim()) { toast.error('Content is required'); return; }
    setNewsSaving(true);
    try {
      const method = editingNews ? 'PUT' : 'POST';
      const body = editingNews ? { ...newsForm, id: editingNews.id } : newsForm;
      const res = await fetch('/api/news', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast.success(editingNews ? 'News updated' : 'News created');
      setNewsDialogOpen(false);
      setEditingNews(null);
      fetchNews();
    } catch {
      toast.error('Failed to save news');
    } finally {
      setNewsSaving(false);
    }
  };

  const toggleNewsActive = async (item: any) => {
    try {
      const res = await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(`News ${item.isActive ? 'deactivated' : 'activated'}`);
      fetchNews();
    } catch {
      toast.error('Failed to update news');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — Features Toggle (NEW)
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleFeature = async (feature: FeatureItem) => {
    try {
      const res = await fetch('/api/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feature.id, isEnabled: !feature.isEnabled }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${feature.name} ${feature.isEnabled ? 'disabled' : 'enabled'}`);
      fetchFeatures();
    } catch {
      toast.error(`Failed to toggle ${feature.name}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — Delete
  // ═══════════════════════════════════════════════════════════════════════════

  const confirmDelete = (id: string, type: string, label: string) => {
    setDeleteTarget({ id, type, label });
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const endpoint = deleteTarget.type === 'property' ? `/api/properties/${deleteTarget.id}`
        : deleteTarget.type === 'user' ? `/api/users/${deleteTarget.id}`
          : deleteTarget.type === 'inquiry' ? `/api/inquiries/${deleteTarget.id}`
            : deleteTarget.type === 'banner' ? `/api/banners/${deleteTarget.id}`
              : deleteTarget.type === 'news' ? `/api/news?id=${deleteTarget.id}`
                : null;
      if (!endpoint) throw new Error('Unknown type');
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`${deleteTarget.label} deleted successfully`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      if (deleteTarget.type === 'property') { fetchProperties(); fetchStats(); }
      else if (deleteTarget.type === 'user') fetchUsers();
      else if (deleteTarget.type === 'inquiry') { fetchInquiries(); fetchStats(); }
      else if (deleteTarget.type === 'banner') fetchBanners();
      else if (deleteTarget.type === 'news') fetchNews();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED — Cascading location data
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredRegions = locations.find((c) => c.id === propForm.countryId)?.regions || [];
  const filteredCities = filteredRegions.find((r) => r.id === propForm.regionId)?.cities || [];

  // Computed — Feature grouping
  const enabledCount = features.filter((f) => f.isEnabled).length;
  const disabledCount = features.length - enabledCount;

  const filteredFeatures = features.filter((f) => {
    if (featureSearch && !f.name.toLowerCase().includes(featureSearch.toLowerCase()) && !f.description.toLowerCase().includes(featureSearch.toLowerCase())) return false;
    if (featureCategoryFilter !== 'all' && f.category !== featureCategoryFilter) return false;
    return true;
  });

  const featuresByCategory = filteredFeatures.reduce<Record<string, FeatureItem[]>>((acc, feature) => {
    const cat = feature.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(feature);
    return acc;
  }, {});

  const categoryOrder = ['ai', 'analytics', 'tools', 'social', 'general'];

  const uniqueCategories = Object.keys(featuresByCategory).sort((a, b) => {
    return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESS DENIED
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <motion.div {...fadeIn}>
          <ShieldAlert className="mx-auto h-16 w-16 text-destructive/60" />
          <h2 className="mt-4 font-heading text-2xl font-bold">{t.admin.accessDenied}</h2>
          <p className="mt-2 text-center text-muted-foreground max-w-md">
            {t.admin.accessDeniedMessage}
          </p>
          <Button className="mt-6 gap-2" onClick={() => setCurrentPage('home')}>
            <LogIn className="h-4 w-4" /> {t.nav.signIn}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1: OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const renderOverview = () => {
    if (statsLoading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      );
    }

    if (!stats) return <p className="text-muted-foreground">Failed to load stats.</p>;

    const statCards = [
      { label: t.admin.totalProperties, value: stats.totals.properties, icon: Building2, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/50' },
      { label: t.admin.totalUsers, value: stats.totals.users, icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50' },
      { label: t.admin.totalAgents, value: stats.totals.agents, icon: Star, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/50' },
      { label: t.admin.totalInquiries, value: stats.totals.inquiries, icon: MessageSquare, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50' },
      { label: t.admin.totalViews, value: stats.totals.views.toLocaleString(), icon: Eye, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/50' },
    ];

    return (
      <motion.div {...fadeIn} className="space-y-6">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
            >
              <Card className="glass-stat rounded-xl hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Properties by Type — Bar Chart */}
        <Card className="glass-card rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-heading">
                <BarChart3 className="h-4 w-4" /> {t.admin.propertiesByType}
              </CardTitle>
              <div className="h-[3px] w-16 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full mt-1" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                {stats.propertiesByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.propertiesByType} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" name="Properties" radius={[4, 4, 0, 0]}>
                        {stats.propertiesByType.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-muted-foreground text-sm">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inquiries by Status — Bar Chart */}
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-heading">
                <MessageSquare className="h-4 w-4" /> Inquiries by Status
              </CardTitle>
              <div className="h-[3px] w-16 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full mt-1" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                {stats.inquiriesByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.inquiriesByStatus} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" name="Inquiries" radius={[4, 4, 0, 0]}>
                        {stats.inquiriesByStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-muted-foreground text-sm">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Inquiries Table ── */}
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <TrendingUp className="h-4 w-4" /> {t.admin.recentInquiries}
            </CardTitle>
            <div className="h-[3px] w-16 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full mt-1" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentInquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No inquiries yet</TableCell>
                    </TableRow>
                  ) : (
                    stats.recentInquiries.slice(0, 5).map((inq) => (
                      <TableRow key={inq.id}>
                        <TableCell className="font-medium">{inq.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{inq.email}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{inq.property?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={inquiryStatusClasses[inq.status] || ''}>{inq.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{formatDate(inq.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2: PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════════

  const renderProperties = () => (
    <motion.div {...fadeIn} className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search properties..." value={propSearch} onChange={(e) => setPropSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={propListingFilter} onValueChange={setPropListingFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Listing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              {LISTING_TYPES.map((lt) => <SelectItem key={lt} value={lt}>{lt.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={propTypeFilter} onValueChange={setPropTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROPERTY_TYPES.map((pt) => <SelectItem key={pt} value={pt}>{pt.charAt(0) + pt.slice(1).toLowerCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={propStatusFilter} onValueChange={setPropStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PROPERTY_STATUSES.map((ps) => <SelectItem key={ps} value={ps}>{ps.charAt(0) + ps.slice(1).toLowerCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => openPropertyDialog()}>
            <Plus className="mr-1 h-4 w-4" /> {t.admin.add}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="glass-panel rounded-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            {propertiesLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">{t.admin.price}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t.admin.status}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t.admin.featured}</TableHead>
                    <TableHead className="hidden lg:table-cell">Views</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell>
                    </TableRow>
                  ) : (
                    properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{property.title}</p>
                            <p className="text-xs text-muted-foreground">{property.propertyType}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatPrice(property.price)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className={propertyStatusClasses[property.status] || ''}>{property.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {property.isFeatured && <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Star className="mr-1 h-3 w-3" />Featured</Badge>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{property.views}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openPropertyDialog(property)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleFeatured(property)}><Star className="mr-2 h-4 w-4" />{property.isFeatured ? 'Unfeature' : 'Feature'}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(property.id, 'property', property.title)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Property Add/Edit Dialog ── */}
      <Dialog open={propDialogOpen} onOpenChange={setPropDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
            <DialogDescription>Fill in the property details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-title">Title *</Label>
                <Input id="prop-title" value={propForm.title} onChange={(e) => updatePropForm('title', e.target.value)} placeholder="Property title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-price">Price *</Label>
                <Input id="prop-price" type="number" value={propForm.price} onChange={(e) => updatePropForm('price', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-desc">Description</Label>
              <Textarea id="prop-desc" value={propForm.description} onChange={(e) => updatePropForm('description', e.target.value)} placeholder="Property description..." rows={3} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Listing Type</Label>
                <Select value={propForm.listingType} onValueChange={(v) => updatePropForm('listingType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LISTING_TYPES.map((lt) => <SelectItem key={lt} value={lt}>{lt.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select value={propForm.propertyType} onValueChange={(v) => updatePropForm('propertyType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map((pt) => <SelectItem key={pt} value={pt}>{pt.charAt(0) + pt.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={propForm.status} onValueChange={(v) => updatePropForm('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_STATUSES.map((ps) => <SelectItem key={ps} value={ps}>{ps.charAt(0) + ps.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Area (sqm)</Label>
                <Input type="number" value={propForm.area} onChange={(e) => updatePropForm('area', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input type="number" value={propForm.bedrooms} onChange={(e) => updatePropForm('bedrooms', e.target.value)} placeholder="—" />
              </div>
              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input type="number" value={propForm.bathrooms} onChange={(e) => updatePropForm('bathrooms', e.target.value)} placeholder="—" />
              </div>
              <div className="space-y-2">
                <Label>Floors</Label>
                <Input type="number" value={propForm.floors} onChange={(e) => updatePropForm('floors', e.target.value)} placeholder="—" />
              </div>
              <div className="space-y-2">
                <Label>Year Built</Label>
                <Input type="number" value={propForm.yearBuilt} onChange={(e) => updatePropForm('yearBuilt', e.target.value)} placeholder="—" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={propForm.address} onChange={(e) => updatePropForm('address', e.target.value)} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={propForm.countryId} onValueChange={(v) => updatePropForm('countryId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region *</Label>
                <Select value={propForm.regionId} onValueChange={(v) => updatePropForm('regionId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {filteredRegions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Select value={propForm.cityId} onValueChange={(v) => updatePropForm('cityId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {filteredCities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={propForm.agentId} onValueChange={(v) => updatePropForm('agentId', v)}>
                  <SelectTrigger><SelectValue placeholder="No agent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No agent</SelectItem>
                    {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.user?.name || a.title || 'Agent'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={propForm.isFeatured} onCheckedChange={(v) => updatePropForm('isFeatured', v)} />
                <Label>Featured</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URLs (comma separated)</Label>
              <Textarea value={propForm.imageUrls} onChange={(e) => updatePropForm('imageUrls', e.target.value)} placeholder="https://example.com/image1.jpg, https://..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropDialogOpen(false)}>{t.admin.cancel}</Button>
            <Button onClick={saveProperty} disabled={propSaving}>{propSaving ? 'Saving...' : t.admin.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3: USERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderUsers = () => (
    <motion.div {...fadeIn} className="space-y-4">
      <Card className="glass-panel rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading text-base">User Management ({users.length})</CardTitle>
              <div className="h-[3px] w-16 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            {usersLoading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.name}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t.admin.email}</TableHead>
                    <TableHead>{t.admin.role}</TableHead>
                    <TableHead>{t.admin.status}</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell></TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={userRoleClasses[user.role] || ''}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={user.isActive ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-gray-400 text-gray-500 dark:text-gray-400'}>
                            {user.isActive ? t.admin.active : t.admin.inactive}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openUserDialog(user)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleUserActive(user)}>
                                <Switch className="mr-2" checked={!user.isActive} />
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              {user.role !== 'ADMIN' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(user.id, 'user', user.name || user.email)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── User Edit Dialog ── */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={userForm.isActive} onCheckedChange={(v) => setUserForm((p) => ({ ...p, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>{t.admin.cancel}</Button>
            <Button onClick={saveUser} disabled={userSaving}>{userSaving ? 'Saving...' : t.admin.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 4: LOCATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderLocations = () => (
    <motion.div {...fadeIn} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm text-muted-foreground">{locations.length} countries</h3>
        <Button size="sm" onClick={() => openLocationDialog('Country')}>
          <Plus className="mr-1 h-4 w-4" /> {t.admin.addCountry}
        </Button>
      </div>
      <Card className="glass-panel rounded-xl">
        <CardContent className="p-0">
          <div className="max-h-[560px] overflow-y-auto">
            {locationsLoading ? (
              <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="divide-y">
                {locations.map((country) => (
                  <Collapsible key={country.id} open={expandedCountries.has(country.id)} onOpenChange={() => toggleCountry(country.id)}>
                    <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${expandedCountries.has(country.id) ? 'rotate-90' : ''}`} />
                      <Flag className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="font-medium flex-1">{country.name}</span>
                      <span className="text-xs text-muted-foreground">{country.code}</span>
                      <Badge variant="outline" className="text-xs">{country.regions?.length || 0} regions</Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); openLocationDialog('Region', country.id); }}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {country.regions?.map((region) => (
                        <Collapsible key={region.id} open={expandedRegions.has(region.id)} onOpenChange={() => toggleRegion(region.id)}>
                          <CollapsibleTrigger className="flex w-full items-center gap-3 pl-12 pr-4 py-2.5 hover:bg-muted/50 transition-colors">
                            <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${expandedRegions.has(region.id) ? 'rotate-90' : ''}`} />
                            <MapPin className="h-4 w-4 text-teal-500 shrink-0" />
                            <span className="text-sm flex-1">{region.name}</span>
                            <Badge variant="outline" className="text-xs">{region.cities?.length || 0} cities</Badge>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); openLocationDialog('City', region.id); }}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {region.cities?.map((city) => (
                              <div key={city.id} className="flex items-center gap-3 pl-24 pr-4 py-2 hover:bg-muted/30 transition-colors">
                                <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm text-muted-foreground">{city.name}</span>
                              </div>
                            )) || <p className="pl-24 pr-4 py-2 text-xs text-muted-foreground">No cities</p>}
                          </CollapsibleContent>
                        </Collapsible>
                      )) || <p className="pl-12 pr-4 py-2 text-xs text-muted-foreground">No regions</p>}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Location Add Dialog ── */}
      <Dialog open={locDialogOpen} onOpenChange={setLocDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add {locForm.type}</DialogTitle>
            <DialogDescription>Create a new {locForm.type.toLowerCase()}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {locForm.type === 'Country' && (
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={locForm.code} onChange={(e) => setLocForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. US" maxLength={2} />
              </div>
            )}
            <div className="space-y-2">
              <Label>{locForm.type} Name *</Label>
              <Input value={locForm.name} onChange={(e) => setLocForm((p) => ({ ...p, name: e.target.value }))} placeholder={`${locForm.type} name`} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocDialogOpen(false)}>{t.admin.cancel}</Button>
            <Button onClick={saveLocation} disabled={locSaving}>{locSaving ? 'Saving...' : t.admin.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 5: INQUIRIES
  // ═══════════════════════════════════════════════════════════════════════════

  const renderInquiries = () => (
    <motion.div {...fadeIn} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={inqStatusFilter} onValueChange={setInqStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {INQUIRY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{inquiries.length} inquiries</span>
        </div>
      </div>

      <Card className="glass-panel rounded-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            {inquiriesLoading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.name}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t.admin.email}</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>{t.admin.status}</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell></TableRow>
                  ) : (
                    inquiries.map((inq) => (
                      <TableRow key={inq.id}>
                        <TableCell className="font-medium">{inq.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{inq.email}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{inq.property?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="cursor-pointer">
                                <Badge variant="secondary" className={inquiryStatusClasses[inq.status] || ''}>{inq.status}</Badge>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {INQUIRY_STATUSES.map((s) => (
                                <DropdownMenuItem key={s} onClick={() => updateInquiryStatus(inq, s)} disabled={s === inq.status}>
                                  {s.charAt(0) + s.slice(1).toLowerCase()}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{formatDate(inq.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => viewInquiry(inq)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirmDelete(inq.id, 'inquiry', inq.name)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Inquiry View Dialog ── */}
      <Dialog open={inqViewOpen} onOpenChange={setInqViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>View the full inquiry message.</DialogDescription>
          </DialogHeader>
          {viewingInquiry && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">{t.admin.name}</p><p className="font-medium">{viewingInquiry.name}</p></div>
                <div><p className="text-xs text-muted-foreground">{t.admin.email}</p><p className="font-medium">{viewingInquiry.email}</p></div>
                {viewingInquiry.phone && (
                  <div><p className="text-xs text-muted-foreground">{t.admin.phone}</p><p className="font-medium">{viewingInquiry.phone}</p></div>
                )}
                <div><p className="text-xs text-muted-foreground">Property</p><p className="font-medium truncate">{viewingInquiry.property?.title || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground">{t.admin.status}</p><Badge variant="secondary" className={inquiryStatusClasses[viewingInquiry.status] || ''}>{viewingInquiry.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium text-sm">{formatDate(viewingInquiry.createdAt)}</p></div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{viewingInquiry.message}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Select value={viewingInquiry?.status || ''} onValueChange={(v) => { if (viewingInquiry) { updateInquiryStatus(viewingInquiry, v); setInqViewOpen(false); } }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Change status" /></SelectTrigger>
              <SelectContent>{INQUIRY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
            </Select>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 6: BANNERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderBanners = () => (
    <motion.div {...fadeIn} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm text-muted-foreground">{banners.length} banners</h3>
        <Button size="sm" onClick={() => openBannerDialog()}><Plus className="mr-1 h-4 w-4" /> {t.admin.add}</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            {bannersLoading ? (
              <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.name}</TableHead>
                    <TableHead className="hidden sm:table-cell">Position</TableHead>
                    <TableHead className="hidden md:table-cell">Order</TableHead>
                    <TableHead>{t.admin.status}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t.admin.image}</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell></TableRow>
                  ) : (
                    banners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{banner.title}</p>
                            {banner.subtitle && <p className="text-xs text-muted-foreground">{banner.subtitle}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="outline">{banner.position}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{banner.order}</TableCell>
                        <TableCell>
                          <Badge variant={banner.isActive ? 'default' : 'secondary'} className={banner.isActive ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>{banner.isActive ? 'Active' : 'Inactive'}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {banner.image ? (
                            <div className="h-8 w-16 rounded overflow-hidden bg-muted">
                              <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                            </div>
                          ) : <span className="text-muted-foreground text-xs">No image</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openBannerDialog(banner)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(banner.id, 'banner', banner.title)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Banner Add/Edit Dialog ── */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            <DialogDescription>Configure banner display settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Title *</Label>
              <Input id="banner-title" value={bannerForm.title} onChange={(e) => setBannerForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-subtitle">Subtitle</Label>
              <Input id="banner-subtitle" value={bannerForm.subtitle} onChange={(e) => setBannerForm((p) => ({ ...p, subtitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-image">{t.admin.image} URL</Label>
              <Input id="banner-image" value={bannerForm.image} onChange={(e) => setBannerForm((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-link">Link URL</Label>
              <Input id="banner-link" value={bannerForm.link} onChange={(e) => setBannerForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={bannerForm.position} onValueChange={(v) => setBannerForm((p) => ({ ...p, position: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BANNER_POSITIONS.map((bp) => <SelectItem key={bp} value={bp}>{bp.charAt(0).toUpperCase() + bp.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input type="number" value={bannerForm.order} onChange={(e) => setBannerForm((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={bannerForm.isActive} onCheckedChange={(v) => setBannerForm((p) => ({ ...p, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>{t.admin.cancel}</Button>
            <Button onClick={saveBanner} disabled={bannerSaving}>{bannerSaving ? 'Saving...' : t.admin.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 7: FEATURES (NEW — MOST IMPORTANT)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderFeatures = () => {
    if (featuresLoading) {
      return (
        <motion.div {...fadeIn} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div {...fadeIn} className="space-y-6">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                  <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Features</p>
                  <p className="text-2xl font-bold tracking-tight">{features.length}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enabled</p>
                  <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{enabledCount}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Settings className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Disabled</p>
                  <p className="text-2xl font-bold tracking-tight text-gray-500 dark:text-gray-400">{disabledCount}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search features..."
              value={featureSearch}
              onChange={(e) => setFeatureSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={featureCategoryFilter} onValueChange={setFeatureCategoryFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOrder.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Progress Bar ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Feature Adoption</span>
            <span>{features.length > 0 ? Math.round((enabledCount / features.length) * 100) : 0}% enabled</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${features.length > 0 ? (enabledCount / features.length) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* ── Feature Cards Grouped by Category ── */}
        {uniqueCategories.map((category) => {
          const CatIcon = categoryIconMap[category] || Sparkles;
          const catFeatures = featuresByCategory[category];
          const catEnabled = catFeatures.filter((f) => f.isEnabled).length;

          return (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${categoryColorMap[category] || ''}`}>
                  <CatIcon className="h-4 w-4" />
                </div>
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">{category}</h3>
                <div className="h-[2px] w-10 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
                <Badge variant="secondary" className="text-xs">{catEnabled}/{catFeatures.length} enabled</Badge>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catFeatures.map((feature, idx) => {
                  const FeatureIcon = iconMap[feature.icon] || Sparkles;
                  const isEnabled = feature.isEnabled;

                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                    >
                      <Card
                        className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                          isEnabled
                            ? 'border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background'
                            : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30'
                        }`}
                      >
                        {/* Subtle status indicator bar */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                          isEnabled
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`} />

                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {/* Feature Icon */}
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                isEnabled
                                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                              }`}>
                                <FeatureIcon className="h-5 w-5" />
                              </div>

                              {/* Feature Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-medium text-sm truncate ${isEnabled ? '' : 'text-muted-foreground'}`}>
                                    {feature.name}
                                  </h4>
                                  {/* Category Badge */}
                                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 shrink-0 ${categoryColorMap[feature.category] || ''}`}>
                                    {feature.category}
                                  </Badge>
                                </div>
                                <p className={`text-xs mt-0.5 line-clamp-2 ${isEnabled ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                                  {feature.description}
                                </p>
                              </div>
                            </div>

                            {/* Toggle Switch */}
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => toggleFeature(feature)}
                              className="shrink-0 mt-0.5"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {!featuresLoading && filteredFeatures.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No features found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 8: NEWS TICKER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const renderNews = () => (
    <motion.div {...fadeIn} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm text-muted-foreground">{newsItems.length} news items</h3>
        <Button size="sm" onClick={() => openNewsDialog()}><Plus className="mr-1 h-4 w-4" /> Add News</Button>
      </div>
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            {newsLoading ? (
              <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead>{t.admin.status}</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsItems.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No news items yet</TableCell></TableRow>
                  ) : (
                    newsItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">{item.order ?? 0}</TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <p className="font-medium truncate">{item.content}</p>
                            {item.link && <p className="text-xs text-muted-foreground truncate">{item.link}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className={newsTypeClasses[item.type] || ''}>{item.type || 'info'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch checked={item.isActive} onCheckedChange={() => toggleNewsActive(item)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openNewsDialog(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(item.id, 'news', item.content.substring(0, 40))}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── News Add/Edit Dialog ── */}
      <Dialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit News' : 'Add News'}</DialogTitle>
            <DialogDescription>Manage news ticker items displayed on the platform.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="news-content">Content *</Label>
              <Textarea
                id="news-content"
                value={newsForm.content}
                onChange={(e) => setNewsForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="Enter news content..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-link">Link URL</Label>
              <Input id="news-link" value={newsForm.link} onChange={(e) => setNewsForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newsForm.type} onValueChange={(v) => setNewsForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input type="number" value={newsForm.order} onChange={(e) => setNewsForm((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newsForm.isActive} onCheckedChange={(v) => setNewsForm((p) => ({ ...p, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewsDialogOpen(false)}>{t.admin.cancel}</Button>
            <Button onClick={saveNews} disabled={newsSaving}>{newsSaving ? 'Saving...' : t.admin.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER — Tab Layout
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 z-50 bg-gradient-to-r from-[#0a1a14]/95 via-[#0d1f18]/95 to-[#0f1a12]/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl border-emerald-800/30">
        {/* Gold accent line at top */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        <div className="container mx-auto max-w-7xl px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-heading text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent"
                >
                  CIAR {t.admin.dashboard}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-muted-foreground/80 mt-0.5"
                >
                  Manage your platform from one place
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Badge variant="outline" className="hidden sm:flex items-center gap-1 border-amber-500/30 text-amber-400">
                <ShieldAlert className="h-3 w-3" /> Admin
              </Badge>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tab Navigation & Content */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab List */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <TabsList className="glass-nav w-full flex flex-wrap h-auto gap-1 p-1 rounded-lg">
              <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.overview}</span>
              </TabsTrigger>
              <TabsTrigger value="properties" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.properties}</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.users}</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.locations}</span>
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.inquiries}</span>
              </TabsTrigger>
              <TabsTrigger value="banners" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.banners}</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline font-semibold">Features</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">{(t as any).admin?.news || 'News'}</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* Tab Contents */}
          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="properties">{renderProperties()}</TabsContent>
          <TabsContent value="users">{renderUsers()}</TabsContent>
          <TabsContent value="locations">{renderLocations()}</TabsContent>
          <TabsContent value="inquiries">{renderInquiries()}</TabsContent>
          <TabsContent value="banners">{renderBanners()}</TabsContent>
          <TabsContent value="features">{renderFeatures()}</TabsContent>
          <TabsContent value="news">{renderNews()}</TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DELETE CONFIRMATION DIALOG (shared)                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.label}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t.admin.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : t.admin.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
