'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import type {
  Property, User, Agent, Country, Region, City,
  Inquiry, Banner, Amenity, ListingType, PropertyType, PropertyStatus,
} from '@/types';

// ─── UI Components ──────────────────────────────────────────────────────────
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

// ─── Icons ──────────────────────────────────────────────────────────────────
import {
  LayoutDashboard, Building2, Users, MessageSquare, Eye,
  TrendingUp, Plus, Edit, Trash2, Search, BarChart3, MapPin,
  Flag, Image as ImageIcon, ChevronDown, ChevronRight, MoreHorizontal,
  LogIn, ShieldAlert, Star, Globe, Home,
} from 'lucide-react';

// ─── Recharts ───────────────────────────────────────────────────────────────
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ─── Constants ──────────────────────────────────────────────────────────────

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

// ─── API Response Types ────────────────────────────────────────────────────

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

// ─── Helper Functions ───────────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(price);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

// ─── Badge Helpers ──────────────────────────────────────────────────────────

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

// ─── Default Property Form ──────────────────────────────────────────────────

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

// ─── Fade-in animation variant ──────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { currentUser, isAuthenticated, setCurrentPage } = useAppStore();
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'ADMIN';

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');

  // ── Overview State ────────────────────────────────────────────────────────
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Properties State ──────────────────────────────────────────────────────
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

  // ── Users State ───────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', role: 'USER' as string, isActive: true });
  const [userSaving, setUserSaving] = useState(false);

  // ── Locations State ───────────────────────────────────────────────────────
  const [locations, setLocations] = useState<Country[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [locDialogOpen, setLocDialogOpen] = useState(false);
  const [locForm, setLocForm] = useState({ type: 'Country', name: '', code: '', parentId: '' });
  const [locSaving, setLocSaving] = useState(false);

  // ── Inquiries State ───────────────────────────────────────────────────────
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inqStatusFilter, setInqStatusFilter] = useState('all');
  const [inqViewOpen, setInqViewOpen] = useState(false);
  const [viewingInquiry, setViewingInquiry] = useState<Inquiry | null>(null);

  // ── Banners State ─────────────────────────────────────────────────────────
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', image: '', link: '',
    position: 'home', order: 0, isActive: true,
  });
  const [bannerSaving, setBannerSaving] = useState(false);

  // ── Shared Data ───────────────────────────────────────────────────────────
  const [agents, setAgents] = useState<Agent[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  // ── Delete Dialog State ───────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════════

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

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) return;
      const data: Agent[] = await res.json();
      setAgents(data);
    } catch { /* silent */ }
  }, []);

  const fetchAmenities = useCallback(async () => {
    try {
      const res = await fetch('/api/amenities');
      if (!res.ok) return;
      const data: Amenity[] = await res.json();
      setAmenities(data);
    } catch { /* silent */ }
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────

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
  useEffect(() => { fetchAgents(); fetchAmenities(); fetchLocations(); }, [fetchAgents, fetchAmenities, fetchLocations]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Property Handlers ─────────────────────────────────────────────────────

  const updatePropForm = (field: string, value: unknown) => {
    setPropForm((prev) => {
      const next = { ...prev, [field]: value };
      // Cascade: country → region → city
      if (field === 'countryId') {
        next.regionId = '';
        next.cityId = '';
      } else if (field === 'regionId') {
        next.cityId = '';
      }
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
      const imageUrls = propForm.imageUrls
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
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

  // ── User Handlers ─────────────────────────────────────────────────────────

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

  // ── Inquiry Handlers ──────────────────────────────────────────────────────

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

  // ── Banner Handlers ───────────────────────────────────────────────────────

  const openBannerDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title,
        subtitle: banner.subtitle || '',
        image: banner.image || '',
        link: banner.link || '',
        position: banner.position,
        order: banner.order,
        isActive: banner.isActive,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        title: '', subtitle: '', image: '', link: '',
        position: 'home', order: banners.length, isActive: true,
      });
    }
    setBannerDialogOpen(true);
  };

  const saveBanner = async () => {
    if (!bannerForm.title) { toast.error('Title is required'); return; }
    setBannerSaving(true);
    try {
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm),
      });
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

  // ── Location Handlers ─────────────────────────────────────────────────────

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
      let url = '/api/locations';
      let body: Record<string, unknown> = {};
      if (locForm.type === 'Country') {
        body = { name: locForm.name, code: locForm.code || locForm.name.substring(0, 2).toUpperCase() };
      } else if (locForm.type === 'Region') {
        body = { name: locForm.name, countryId: locForm.parentId };
      } else {
        body = { name: locForm.name, regionId: locForm.parentId };
      }
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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

  // ── Delete Handler ────────────────────────────────────────────────────────

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
              : null;
      if (!endpoint) throw new Error('Unknown type');

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error();

      toast.success(`${deleteTarget.label} deleted successfully`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);

      // Refresh relevant data
      if (deleteTarget.type === 'property') { fetchProperties(); fetchStats(); }
      else if (deleteTarget.type === 'user') fetchUsers();
      else if (deleteTarget.type === 'inquiry') { fetchInquiries(); fetchStats(); }
      else if (deleteTarget.type === 'banner') fetchBanners();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // ── Computed: cascading location data ─────────────────────────────────────

  const filteredRegions = locations.find((c) => c.id === propForm.countryId)?.regions || [];
  const filteredCities = filteredRegions.find((r) => r.id === propForm.regionId)?.cities || [];

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESS DENIED
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <motion.div {...fadeIn}>
          <ShieldAlert className="mx-auto h-16 w-16 text-destructive/60" />
          <h2 className="mt-4 text-2xl font-bold">{t.admin.accessDenied}</h2>
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
  // OVERVIEW TAB
  // ═══════════════════════════════════════════════════════════════════════════

  const renderOverview = () => {
    if (statsLoading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
      { label: t.admin.totalInquiries, value: stats.totals.inquiries, icon: MessageSquare, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50' },
      { label: t.admin.totalViews, value: stats.totals.views.toLocaleString(), icon: Eye, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/50' },
    ];

    return (
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{card.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Properties by Type */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" /> {t.admin.propertiesByType}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                {stats.propertiesByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.propertiesByType} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
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

          {/* Inquiries by Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" /> Inquiries by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                {stats.inquiriesByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.inquiriesByStatus} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
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

        {/* Recent Inquiries Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> {t.admin.recentInquiries}
            </CardTitle>
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
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No inquiries yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.recentInquiries.slice(0, 5).map((inq) => (
                      <TableRow key={inq.id}>
                        <TableCell className="font-medium">{inq.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{inq.email}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{inq.property?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={inquiryStatusClasses[inq.status] || ''}>
                            {inq.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {formatDate(inq.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPERTIES TAB
  // ═══════════════════════════════════════════════════════════════════════════

  const renderProperties = () => (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={propSearch}
            onChange={(e) => setPropSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={propListingFilter} onValueChange={setPropListingFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Listing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              {LISTING_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={propTypeFilter} onValueChange={setPropTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={propStatusFilter} onValueChange={setPropStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PROPERTY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={() => openPropertyDialog()}>
            <Plus className="h-4 w-4" /> Add Property
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {propertiesLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Featured</TableHead>
                    <TableHead className="hidden md:table-cell">Views</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No properties found
                      </TableCell>
                    </TableRow>
                  ) : (
                    properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium max-w-[240px] truncate">{property.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{property.propertyType}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatPrice(property.price)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {property.city?.name}{property.country?.name ? `, ${property.country.name}` : ''}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={propertyStatusClasses[property.status] || ''}>
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Switch
                            checked={property.isFeatured}
                            onCheckedChange={() => toggleFeatured(property)}
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{property.views}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => openPropertyDialog(property)}>
                                <Edit className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => confirmDelete(property.id, 'property', property.title)}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS TAB
  // ═══════════════════════════════════════════════════════════════════════════

  const renderUsers = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Manage Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || 'Unnamed'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={userRoleClasses[user.role] || ''}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => toggleUserActive(user)}
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => openUserDialog(user)}>
                                <Edit className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => confirmDelete(user.id, 'user', user.name || user.email)}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATIONS TAB
  // ═══════════════════════════════════════════════════════════════════════════

  const renderLocations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Location Tree</h3>
        <Button className="gap-2" onClick={() => openLocationDialog('Country')}>
          <Plus className="h-4 w-4" /> Add Country
        </Button>
      </div>

      {locationsLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : locations.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No locations found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {locations.map((country) => (
            <Collapsible
              key={country.id}
              open={expandedCountries.has(country.id)}
              onOpenChange={() => toggleCountry(country.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors rounded-lg">
                    {expandedCountries.has(country.id) ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {country.flag && <span className="text-lg">{country.flag}</span>}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{country.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({country.regions?.length || 0} regions)
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">{country.code}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs shrink-0"
                      onClick={(e) => { e.stopPropagation(); openLocationDialog('Region', country.id); }}
                    >
                      <Plus className="h-3 w-3" /> Region
                    </Button>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-4 pb-3 pt-1 space-y-1">
                    {(!country.regions || country.regions.length === 0) ? (
                      <p className="py-2 pl-7 text-sm text-muted-foreground">No regions</p>
                    ) : (
                      country.regions.map((region) => (
                        <Collapsible
                          key={region.id}
                          open={expandedRegions.has(region.id)}
                          onOpenChange={() => toggleRegion(region.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center gap-2 py-2 pl-7 text-left hover:bg-muted/50 rounded-md transition-colors">
                              {expandedRegions.has(region.id) ? (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium flex-1">{region.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({region.cities?.length || 0} cities)
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 text-xs shrink-0"
                                onClick={(e) => { e.stopPropagation(); openLocationDialog('City', region.id); }}
                              >
                                <Plus className="h-3 w-3" /> City
                              </Button>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-14 space-y-0.5">
                              {(!region.cities || region.cities.length === 0) ? (
                                <p className="py-1 text-xs text-muted-foreground">No cities</p>
                              ) : (
                                region.cities.map((city) => (
                                  <div key={city.id} className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                                    <Home className="h-3 w-3" />
                                    {city.name}
                                  </div>
                                ))
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // INQUIRIES TAB
  // ═══════════════════════════════════════════════════════════════════════════

  const renderInquiries = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold">Inquiries ({inquiries.length})</h3>
        <Select value={inqStatusFilter} onValueChange={setInqStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {INQUIRY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {inquiriesLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden lg:table-cell">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No inquiries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    inquiries.map((inq) => (
                      <TableRow key={inq.id}>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                          {inq.id.substring(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">{inq.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{inq.email}</TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm">{inq.property?.title || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[180px] truncate text-sm text-muted-foreground">
                          {inq.message}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={inq.status}
                            onValueChange={(val) => updateInquiryStatus(inq, val)}
                          >
                            <SelectTrigger className="w-[110px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INQUIRY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {formatDate(inq.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewInquiry(inq)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => confirmDelete(inq.id, 'inquiry', `Inquiry from ${inq.name}`)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // BANNERS TAB
  // ═══════════════════════════════════════════════════════════════════════════

  const renderBanners = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Banners ({banners.length})</h3>
        <Button className="gap-2" onClick={() => openBannerDialog()}>
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      {bannersLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      ) : banners.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No banners found</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <motion.div key={banner.id} {...fadeIn}>
              <Card className={`overflow-hidden transition-opacity ${!banner.isActive ? 'opacity-60' : ''}`}>
                {banner.image ? (
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-medium truncate">{banner.title}</h4>
                      {banner.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{banner.position}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Order: {banner.order}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>{banner.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={async () => {
                          try {
                            const res = await fetch(`/api/banners/${banner.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isActive: !banner.isActive }),
                            });
                            if (!res.ok) throw new Error();
                            toast.success('Banner updated');
                            fetchBanners();
                          } catch {
                            toast.error('Failed to update banner');
                          }
                        }}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => openBannerDialog(banner)}>
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => confirmDelete(banner.id, 'banner', banner.title)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div {...fadeIn} className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage properties, users, locations, inquiries, and banners.
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2 -mb-2">
            <TabsList className="w-auto">
              <TabsTrigger value="overview" className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> {t.admin.overview}
              </TabsTrigger>
              <TabsTrigger value="properties" className="gap-1.5">
                <Building2 className="h-4 w-4" /> {t.admin.properties}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5">
                <Users className="h-4 w-4" /> {t.admin.users}
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-1.5">
                <Globe className="h-4 w-4" /> {t.admin.locations}
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> {t.admin.inquiries}
              </TabsTrigger>
              <TabsTrigger value="banners" className="gap-1.5">
                <ImageIcon className="h-4 w-4" /> {t.admin.banners}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="properties">{renderProperties()}</TabsContent>
          <TabsContent value="users">{renderUsers()}</TabsContent>
          <TabsContent value="locations">{renderLocations()}</TabsContent>
          <TabsContent value="inquiries">{renderInquiries()}</TabsContent>
          <TabsContent value="banners">{renderBanners()}</TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Property Form Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={propDialogOpen}
        onOpenChange={(open) => {
          if (!open) { setPropDialogOpen(false); setEditingProperty(null); }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingProperty ? 'Edit property details' : 'Create a new property listing'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Title & Description */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prop-title">Title *</Label>
                <Input
                  id="prop-title"
                  placeholder="Property title"
                  value={propForm.title}
                  onChange={(e) => updatePropForm('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-price">Price (USD) *</Label>
                <Input
                  id="prop-price"
                  type="number"
                  placeholder="0"
                  value={propForm.price}
                  onChange={(e) => updatePropForm('price', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prop-desc">Description</Label>
              <Textarea
                id="prop-desc"
                placeholder="Property description..."
                rows={3}
                value={propForm.description}
                onChange={(e) => updatePropForm('description', e.target.value)}
              />
            </div>

            {/* Listing Type, Property Type, Status */}
            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-2">
                <Label>Listing Type</Label>
                <Select value={propForm.listingType} onValueChange={(v) => updatePropForm('listingType', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LISTING_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select value={propForm.propertyType} onValueChange={(v) => updatePropForm('propertyType', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={propForm.status} onValueChange={(v) => updatePropForm('status', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Area, Bedrooms, Bathrooms, Floors, Year Built */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="prop-area">Area (sqm)</Label>
                <Input id="prop-area" type="number" placeholder="0" value={propForm.area}
                  onChange={(e) => updatePropForm('area', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-beds">Bedrooms</Label>
                <Input id="prop-beds" type="number" placeholder="0" value={propForm.bedrooms}
                  onChange={(e) => updatePropForm('bedrooms', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-baths">Bathrooms</Label>
                <Input id="prop-baths" type="number" placeholder="0" value={propForm.bathrooms}
                  onChange={(e) => updatePropForm('bathrooms', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-floors">Floors</Label>
                <Input id="prop-floors" type="number" placeholder="0" value={propForm.floors}
                  onChange={(e) => updatePropForm('floors', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-year">Year Built</Label>
                <Input id="prop-year" type="number" placeholder="2024" value={propForm.yearBuilt}
                  onChange={(e) => updatePropForm('yearBuilt', e.target.value)} />
              </div>
            </div>

            {/* Location Cascading Selects */}
            <Separator />
            <h4 className="font-medium text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Location
            </h4>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={propForm.countryId} onValueChange={(v) => updatePropForm('countryId', v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region *</Label>
                <Select value={propForm.regionId} onValueChange={(v) => updatePropForm('regionId', v)} disabled={!propForm.countryId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {filteredRegions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Select value={propForm.cityId} onValueChange={(v) => updatePropForm('cityId', v)} disabled={!propForm.regionId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {filteredCities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address & Agent */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prop-address">Address</Label>
                <Input id="prop-address" placeholder="Street address" value={propForm.address}
                  onChange={(e) => updatePropForm('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={propForm.agentId} onValueChange={(v) => updatePropForm('agentId', v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Agent</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.userId}>
                        {a.user?.name || a.user?.email || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Featured & Image URLs */}
            <Separator />
            <div className="flex items-center gap-3">
              <Switch
                checked={propForm.isFeatured}
                onCheckedChange={(v) => updatePropForm('isFeatured', v)}
                id="prop-featured"
              />
              <Label htmlFor="prop-featured" className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500" /> Featured Property
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prop-images">Image URLs (comma-separated)</Label>
              <Textarea
                id="prop-images"
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                rows={2}
                value={propForm.imageUrls}
                onChange={(e) => updatePropForm('imageUrls', e.target.value)}
              />
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amenities</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto rounded-md border p-3">
                    {amenities.map((am) => (
                      <label key={am.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          checked={propForm.selectedAmenities.includes(am.id)}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              updatePropForm('selectedAmenities', [...propForm.selectedAmenities, am.id]);
                            } else {
                              updatePropForm('selectedAmenities', propForm.selectedAmenities.filter((id) => id !== am.id));
                            }
                          }}
                        />
                        <span className="truncate">{am.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPropDialogOpen(false); setEditingProperty(null); }}>
              Cancel
            </Button>
            <Button onClick={saveProperty} disabled={propSaving}>
              {propSaving ? 'Saving...' : editingProperty ? 'Update Property' : 'Create Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── User Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={userDialogOpen} onOpenChange={(open) => { if (!open) setUserDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="sr-only">Edit user details and role</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={userForm.name}
                onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={userForm.isActive}
                onCheckedChange={(v) => setUserForm((p) => ({ ...p, isActive: v }))}
                id="user-active"
              />
              <Label htmlFor="user-active">Active Account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveUser} disabled={userSaving}>
              {userSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Inquiry View Dialog ─────────────────────────────────────────── */}
      <Dialog open={inqViewOpen} onOpenChange={(open) => { if (!open) { setInqViewOpen(false); setViewingInquiry(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription className="sr-only">View full inquiry details</DialogDescription>
          </DialogHeader>
          {viewingInquiry && (
            <div className="space-y-4 py-2">
              <div className="grid gap-3 grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name</span>
                  <p className="font-medium">{viewingInquiry.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{viewingInquiry.email}</p>
                </div>
                {viewingInquiry.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p className="font-medium">{viewingInquiry.phone}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div className="mt-0.5">
                    <Badge variant="secondary" className={inquiryStatusClasses[viewingInquiry.status] || ''}>
                      {viewingInquiry.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{formatDate(viewingInquiry.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Property</span>
                  <p className="font-medium">{viewingInquiry.property?.title || 'N/A'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Message</span>
                <div className="mt-1 rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {viewingInquiry.message}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setInqViewOpen(false); setViewingInquiry(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Banner Form Dialog ──────────────────────────────────────────── */}
      <Dialog open={bannerDialogOpen} onOpenChange={(open) => { if (!open) { setBannerDialogOpen(false); setEditingBanner(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingBanner ? 'Edit banner details' : 'Create a new banner'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Title *</Label>
              <Input id="banner-title" placeholder="Banner title" value={bannerForm.title}
                onChange={(e) => setBannerForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-subtitle">Subtitle</Label>
              <Input id="banner-subtitle" placeholder="Banner subtitle" value={bannerForm.subtitle}
                onChange={(e) => setBannerForm((p) => ({ ...p, subtitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-image">Image URL</Label>
              <Input id="banner-image" placeholder="https://example.com/banner.jpg" value={bannerForm.image}
                onChange={(e) => setBannerForm((p) => ({ ...p, image: e.target.value }))} />
              {bannerForm.image && (
                <div className="aspect-video bg-muted rounded-md overflow-hidden border">
                  <img src={bannerForm.image} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-link">Link URL</Label>
              <Input id="banner-link" placeholder="https://example.com" value={bannerForm.link}
                onChange={(e) => setBannerForm((p) => ({ ...p, link: e.target.value }))} />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={bannerForm.position} onValueChange={(v) => setBannerForm((p) => ({ ...p, position: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-order">Order</Label>
                <Input id="banner-order" type="number" value={bannerForm.order}
                  onChange={(e) => setBannerForm((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={bannerForm.isActive}
                onCheckedChange={(v) => setBannerForm((p) => ({ ...p, isActive: v }))} id="banner-active" />
              <Label htmlFor="banner-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBannerDialogOpen(false); setEditingBanner(null); }}>
              Cancel
            </Button>
            <Button onClick={saveBanner} disabled={bannerSaving}>
              {bannerSaving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Location Form Dialog ────────────────────────────────────────── */}
      <Dialog open={locDialogOpen} onOpenChange={(open) => { if (!open) setLocDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add {locForm.type}</DialogTitle>
            <DialogDescription className="sr-only">Add a new location entry</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={locForm.type} onValueChange={(v) => setLocForm((p) => ({ ...p, type: v, parentId: '' }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-name">Name *</Label>
              <Input id="loc-name" placeholder="Name" value={locForm.name}
                onChange={(e) => setLocForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            {locForm.type === 'Country' && (
              <div className="space-y-2">
                <Label htmlFor="loc-code">Country Code</Label>
                <Input id="loc-code" placeholder="US, AE, GB..." maxLength={2} value={locForm.code}
                  onChange={(e) => setLocForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
              </div>
            )}
            {locForm.type === 'Region' && (
              <div className="space-y-2">
                <Label>Parent Country</Label>
                <Select value={locForm.parentId} onValueChange={(v) => setLocForm((p) => ({ ...p, parentId: v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {locForm.type === 'City' && (
              <div className="space-y-2">
                <Label>Parent Region</Label>
                <Select value={locForm.parentId} onValueChange={(v) => setLocForm((p) => ({ ...p, parentId: v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {locations.flatMap((c) => c.regions || []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name} ({locations.find((c) => c.id === r.countryId)?.name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveLocation} disabled={locSaving}>
              {locSaving ? 'Saving...' : `Add ${locForm.type}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.label}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
