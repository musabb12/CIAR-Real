'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Home,
  LayoutGrid,
  Search,
  Eye,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ImageIcon,
  BedDouble,
  Bath,
  Maximize2,
  ExternalLink,
  X,
  BarChart3,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { ImageUrlInput } from '@/components/admin/image-url-input';
import { cn } from '@/lib/utils';
import { normalizeLocationsResponse } from '@/lib/normalize-locations';
import type { Country, ListingType, Property, PropertyStatus, PropertyType } from '@/types';
import { toast } from 'sonner';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format&fit=crop';

const PROPERTY_TYPES: PropertyType[] = [
  'APARTMENT',
  'VILLA',
  'HOUSE',
  'TOWNHOUSE',
  'PENTHOUSE',
  'DUPLEX',
  'STUDIO',
  'LAND',
  'OFFICE',
  'COMMERCIAL',
];

const LISTING_TYPES: ListingType[] = ['SALE', 'RENT', 'SHORT_TERM'];

const STATUSES: PropertyStatus[] = ['AVAILABLE', 'PENDING', 'SOLD', 'RENTED'];

type PropertyForm = {
  title: string;
  description: string;
  price: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  area: string;
  bedrooms: string;
  bathrooms: string;
  floors: string;
  yearBuilt: string;
  countryId: string;
  regionId: string;
  cityId: string;
  address: string;
  imageUrl: string;
  isFeatured: boolean;
};

const emptyForm: PropertyForm = {
  title: '',
  description: '',
  price: '',
  listingType: 'SALE',
  propertyType: 'APARTMENT',
  status: 'AVAILABLE',
  area: '',
  bedrooms: '1',
  bathrooms: '1',
  floors: '',
  yearBuilt: '',
  countryId: '',
  regionId: '',
  cityId: '',
  address: '',
  imageUrl: '',
  isFeatured: false,
};

function propertyCover(p: Property): string {
  const cover = p.images?.find((i) => i.isCover)?.url ?? p.images?.[0]?.url;
  return cover || FALLBACK_COVER;
}

function listingLabel(type: ListingType, tx: (ar: string, en: string) => string) {
  if (type === 'SALE') return tx('بيع', 'Sale');
  if (type === 'RENT') return tx('إيجار', 'Rent');
  return tx('إيجار قصير', 'Short term');
}

function statusLabel(status: PropertyStatus, tx: (ar: string, en: string) => string) {
  const map: Record<PropertyStatus, [string, string]> = {
    AVAILABLE: ['متاح', 'Available'],
    PENDING: ['قيد المعالجة', 'Pending'],
    SOLD: ['مباع', 'Sold'],
    RENTED: ['مؤجر', 'Rented'],
  };
  const pair = map[status];
  return tx(pair[0], pair[1]);
}

function propertyTypeLabel(type: PropertyType, tx: (ar: string, en: string) => string) {
  const map: Partial<Record<PropertyType, [string, string]>> = {
    APARTMENT: ['شقة', 'Apartment'],
    VILLA: ['فيلا', 'Villa'],
    HOUSE: ['منزل', 'House'],
    TOWNHOUSE: ['تاون هاوس', 'Townhouse'],
    PENTHOUSE: ['بنتهاوس', 'Penthouse'],
    DUPLEX: ['دوبلكس', 'Duplex'],
    STUDIO: ['استوديو', 'Studio'],
    LAND: ['أرض', 'Land'],
    OFFICE: ['مكتب', 'Office'],
    COMMERCIAL: ['تجاري', 'Commercial'],
  };
  const pair = map[type] ?? [type, type];
  return tx(pair[0], pair[1]);
}

export function PartnerDashboardPage() {
  const { rtl } = useTranslation();
  const { currentUser, isAuthenticated, logout, setCurrentPage, setSelectedPropertyId } =
    useAppStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PropertyStatus | 'ALL'>('ALL');
  const [filterListing, setFilterListing] = useState<ListingType | 'ALL'>('ALL');

  const isAr = rtl;
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const apiError = (message: string) => {
    const map: Record<string, [string, string]> = {
      'Failed to create property': ['فشل إنشاء العقار', 'Failed to create property'],
      'Failed to update property': ['فشل تحديث العقار', 'Failed to update property'],
      'Country not found': ['الدولة غير موجودة', 'Country not found'],
      'Region not found': ['المنطقة غير موجودة', 'Region not found'],
      'City not found': ['المدينة غير موجودة', 'City not found'],
      'Title is required': ['اسم العقار مطلوب', 'Title is required'],
      'Country, region, and city are required': [
        'اختر الدولة والمنطقة والمدينة',
        'Country, region, and city are required',
      ],
      Unauthorized: ['غير مصرح — سجّل الدخول', 'Unauthorized'],
    };
    const pair = map[message];
    return pair ? tx(pair[0], pair[1]) : message;
  };

  const isPartner =
    currentUser?.role === 'OWNER' ||
    currentUser?.role === 'COMPANY' ||
    currentUser?.role === 'AGENT';

  const roleLabel =
    currentUser?.role === 'COMPANY'
      ? tx('شركة عقارات', 'Real estate company')
      : currentUser?.role === 'OWNER'
        ? tx('صاحب عقار', 'Property owner')
        : tx('وكيل معتمد', 'Licensed agent');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [propRes, locRes] = await Promise.all([
        fetch('/api/partner/properties'),
        fetch('/api/locations'),
      ]);
      if (propRes.status === 401) {
        setCurrentPage('login');
        return;
      }
      if (propRes.ok) {
        const data = await propRes.json();
        setProperties(data.data ?? []);
      }
      if (locRes.ok) {
        const loc = await locRes.json();
        setCountries(normalizeLocationsResponse(loc));
      }
    } finally {
      setLoading(false);
    }
  }, [setCurrentPage]);

  useEffect(() => {
    if (!isAuthenticated || !isPartner) {
      setCurrentPage('login');
      return;
    }
    load();
  }, [isAuthenticated, isPartner, load, setCurrentPage]);

  const stats = useMemo(() => {
    const total = properties.length;
    const available = properties.filter((p) => p.status === 'AVAILABLE').length;
    const pending = properties.filter((p) => p.status === 'PENDING').length;
    const closed = properties.filter((p) => p.status === 'SOLD' || p.status === 'RENTED').length;
    const views = properties.reduce((sum, p) => sum + (p.views ?? 0), 0);
    const featured = properties.filter((p) => p.isFeatured).length;
    return { total, available, pending, closed, views, featured };
  }, [properties]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
      if (filterListing !== 'ALL' && p.listingType !== filterListing) return false;
      if (!q) return true;
      const blob = [p.title, p.city?.name, p.country?.name, p.address ?? ''].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [properties, search, filterStatus, filterListing]);

  const selectedCountry = countries.find((c) => c.id === form.countryId);
  const regions = selectedCountry?.regions ?? [];
  const selectedRegion = regions.find((r) => r.id === form.regionId);
  const cities = selectedRegion?.cities ?? [];

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (p: Property) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description ?? '',
      price: String(p.price),
      listingType: p.listingType,
      propertyType: p.propertyType,
      status: p.status,
      area: String(p.area),
      bedrooms: String(p.bedrooms ?? 1),
      bathrooms: String(p.bathrooms ?? 1),
      floors: p.floors != null ? String(p.floors) : '',
      yearBuilt: p.yearBuilt != null ? String(p.yearBuilt) : '',
      countryId: p.countryId,
      regionId: p.regionId,
      cityId: p.cityId,
      address: p.address ?? '',
      imageUrl: propertyCover(p),
      isFeatured: p.isFeatured,
    });
    setShowForm(true);
  };

  const buildPayload = () => ({
    id: editingId ?? undefined,
    title: form.title.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    listingType: form.listingType,
    propertyType: form.propertyType,
    status: form.status,
    area: Number(form.area) || 1,
    bedrooms: Number(form.bedrooms) || 1,
    bathrooms: Number(form.bathrooms) || 1,
    floors: form.floors ? Number(form.floors) : null,
    yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : null,
    countryId: form.countryId,
    regionId: form.regionId,
    cityId: form.cityId,
    address: form.address.trim() || null,
    isFeatured: form.isFeatured,
    images: form.imageUrl.trim()
      ? [{ url: form.imageUrl.trim(), isCover: true, order: 0, alt: form.title.trim() || null }]
      : undefined,
  });

  const saveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.countryId || !form.regionId || !form.cityId) {
      toast.error(tx('أكمل الحقول المطلوبة', 'Fill required fields'));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/partner/properties', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(apiError(data.error || tx('فشل الحفظ', 'Save failed')));
        return;
      }
      toast.success(editingId ? tx('تم تحديث العقار', 'Property updated') : tx('تم نشر العقار', 'Property published'));
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  };

  const removeProperty = async (id: string) => {
    if (!confirm(tx('حذف هذا العقار نهائياً؟', 'Delete this property permanently?'))) return;
    const res = await fetch(`/api/partner/properties?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast.success(tx('تم الحذف', 'Deleted'));
      load();
    } else {
      toast.error(tx('فشل الحذف', 'Delete failed'));
    }
  };

  const previewProperty = (id: string) => {
    setSelectedPropertyId(id);
    setCurrentPage('property-detail');
  };

  const userInitial = (currentUser?.name?.[0] ?? currentUser?.email?.[0] ?? 'C').toUpperCase();

  return (
    <div className="partner-dashboard-bg min-h-dvh flex">
      {/* Sidebar — desktop */}
      <aside className="partner-sidebar hidden lg:flex w-64 shrink-0 flex-col p-5">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 shadow-lg shadow-amber-500/25">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-white">CIAR</p>
            <p className="text-[10px] uppercase tracking-widest text-amber-300/70">Partner</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            type="button"
            className={cn('partner-nav-item', !showForm && 'is-active')}
            onClick={() => setShowForm(false)}
          >
            <LayoutGrid className="h-4 w-4" />
            {tx('عقاراتي', 'My listings')}
          </button>
          <button type="button" className="partner-nav-item" onClick={openAddForm}>
            <Plus className="h-4 w-4" />
            {tx('إضافة عقار', 'Add property')}
          </button>
          <button type="button" className="partner-nav-item" onClick={() => setCurrentPage('home')}>
            <Home className="h-4 w-4" />
            {tx('الموقع العام', 'Public site')}
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-emerald-500/20 border border-white/15 text-sm font-bold text-amber-200">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.name ?? currentUser?.email}</p>
              <p className="text-[11px] text-white/45">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            className="partner-nav-item text-rose-300/80 hover:text-rose-200"
            onClick={() => {
              logout();
              fetch('/api/logout', { method: 'POST' }).catch(() => {});
              setCurrentPage('home');
            }}
          >
            <LogOut className="h-4 w-4" />
            {tx('تسجيل الخروج', 'Sign out')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-400" />
            <span className="font-heading font-semibold">{tx('لوحة الشريك', 'Partner hub')}</span>
          </div>
          <MobileActions
            tx={tx}
            onAdd={openAddForm}
            onHome={() => setCurrentPage('home')}
            onLogout={() => {
              logout();
              fetch('/api/logout', { method: 'POST' }).catch(() => {});
              setCurrentPage('home');
            }}
          />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Page header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300/70 font-medium mb-1">
                {tx('مساحة العمل', 'Workspace')}
              </p>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                <span className="text-gradient-gold">{tx('لوحة تحكم العقارات', 'Property command center')}</span>
              </h1>
              <p className="text-sm text-white/50 mt-2 max-w-xl">
                {tx(
                  'أدر إعلاناتك، تتبع الأداء، وانشر عقاراتك باحترافية على منصة CIAR.',
                  'Manage listings, track performance, and publish properties professionally on CIAR.',
                )}
              </p>
            </div>
            <div className="hidden lg:flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setCurrentPage('home')}
              >
                <Home className="h-4 w-4 me-2" />
                {tx('الموقع', 'Site')}
              </Button>
              <Button className="checkout-pay-btn rounded-xl border-0 text-white" onClick={openAddForm}>
                <Plus className="h-4 w-4 me-2" />
                {tx('إضافة عقار', 'Add property')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
            <StatCard
              icon={Building2}
              label={tx('إجمالي العقارات', 'Total listings')}
              value={stats.total}
              accent="amber"
            />
            <StatCard
              icon={CheckCircle2}
              label={tx('متاح', 'Available')}
              value={stats.available}
              accent="emerald"
            />
            <StatCard
              icon={Clock}
              label={tx('قيد المعالجة', 'Pending')}
              value={stats.pending}
              accent="sky"
            />
            <StatCard
              icon={TrendingUp}
              label={tx('مكتمل', 'Closed')}
              value={stats.closed}
              accent="slate"
            />
            <StatCard
              icon={Eye}
              label={tx('المشاهدات', 'Total views')}
              value={stats.views}
              accent="violet"
            />
            <StatCard
              icon={Sparkles}
              label={tx('مميز', 'Featured')}
              value={stats.featured}
              accent="gold"
              className="col-span-2 lg:col-span-1"
            />
          </div>

          {showForm ? (
            <PropertyFormPanel
              isAr={isAr}
              tx={tx}
              form={form}
              setForm={setForm}
              editingId={editingId}
              saving={saving}
              countries={countries}
              regions={regions}
              cities={cities}
              onSubmit={saveProperty}
              onClose={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
              propertyTypeLabel={propertyTypeLabel}
              listingLabel={listingLabel}
              statusLabel={statusLabel}
            />
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tx('ابحث في عقاراتك...', 'Search your listings...')}
                    className="partner-toolbar-input w-full rounded-xl py-2.5 ps-10 pe-4 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as PropertyStatus | 'ALL')}
                    className="partner-toolbar-input rounded-xl px-3 py-2.5 text-sm min-w-[130px]"
                  >
                    <option value="ALL">{tx('كل الحالات', 'All statuses')}</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s, tx)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterListing}
                    onChange={(e) => setFilterListing(e.target.value as ListingType | 'ALL')}
                    className="partner-toolbar-input rounded-xl px-3 py-2.5 text-sm min-w-[130px]"
                  >
                    <option value="ALL">{tx('كل الأنواع', 'All types')}</option>
                    {LISTING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {listingLabel(t, tx)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-white/40 mb-4 flex items-center gap-1.5">
                <Filter className="h-3 w-3" />
                {tx(`${filtered.length} من ${properties.length} عقار`, `${filtered.length} of ${properties.length} listings`)}
              </p>

              {loading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-2xl bg-white/10" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState tx={tx} onAdd={openAddForm} hasProperties={properties.length > 0} />
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      tx={tx}
                      cover={propertyCover(p)}
                      onEdit={() => startEdit(p)}
                      onDelete={() => removeProperty(p.id)}
                      onPreview={() => previewProperty(p.id)}
                      listingLabel={listingLabel(p.listingType, tx)}
                      statusLabel={statusLabel(p.status, tx)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}



function MobileActions({
  tx,
  onAdd,
  onHome,
  onLogout,
}: {
  tx: (ar: string, en: string) => string;
  onAdd: () => void;
  onHome: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex gap-1">
      <Button size="icon" variant="ghost" className="text-white/70" onClick={onAdd}>
        <Plus className="h-5 w-5" />
      </Button>
      <Button size="icon" variant="ghost" className="text-white/70" onClick={onHome}>
        <Home className="h-5 w-5" />
      </Button>
      <Button size="icon" variant="ghost" className="text-white/70" onClick={onLogout}>
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}



function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  className,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  accent: 'amber' | 'emerald' | 'sky' | 'slate' | 'violet' | 'gold';
  className?: string;
}) {
  const iconColor = {
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    sky: 'text-sky-400',
    slate: 'text-slate-400',
    violet: 'text-violet-400',
    gold: 'text-amber-300',
  }[accent];

  return (
    <div className={cn('partner-stat-card rounded-2xl p-4', className)}>
      <Icon className={cn('h-5 w-5 mb-3', iconColor)} />
      <p className="text-2xl font-bold tabular-nums text-white">{value.toLocaleString('en-US')}</p>
      <p className="text-[11px] text-white/45 mt-1">{label}</p>
    </div>
  );
}

function EmptyState({
  tx,
  onAdd,
  hasProperties,
}: {
  tx: (ar: string, en: string) => string;
  onAdd: () => void;
  hasProperties: boolean;
}) {
  return (
    <div className="auth-card rounded-2xl p-12 text-center max-w-lg mx-auto">
      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-amber-400/50" />
      <h3 className="font-heading text-xl font-semibold text-white mb-2">
        {hasProperties ? tx('لا توجد نتائج', 'No results') : tx('ابدأ بأول إعلان', 'Publish your first listing')}
      </h3>
      <p className="text-sm text-white/50 mb-6">
        {hasProperties
          ? tx('جرّب تغيير البحث أو الفلاتر', 'Try adjusting search or filters')
          : tx('أضف عقارك الأول وابدأ في استقبال العملاء', 'Add your first property and start receiving clients')}
      </p>
      {!hasProperties && (
        <Button className="checkout-pay-btn rounded-xl border-0 text-white" onClick={onAdd}>
          <Plus className="h-4 w-4 me-2" />
          {tx('إضافة عقار', 'Add property')}
        </Button>
      )}
    </div>
  );
}

function PropertyCard({
  property: p,
  tx,
  cover,
  onEdit,
  onDelete,
  onPreview,
  listingLabel,
  statusLabel,
}: {
  property: Property;
  tx: (ar: string, en: string) => string;
  cover: string;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  listingLabel: string;
  statusLabel: string;
}) {
  const currency = p.country?.currencySymbol ?? '$';
  const statusClass =
    p.status === 'AVAILABLE'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : p.status === 'PENDING'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-white/10 text-white/60 border-white/15';

  return (
    <article className="partner-property-card rounded-2xl overflow-hidden group">
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-3 start-3 flex flex-wrap gap-1.5">
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', statusClass)}>
            {statusLabel}
          </span>
          {p.isFeatured && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-500/25 text-amber-200 border-amber-500/35 flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              {tx('مميز', 'Featured')}
            </span>
          )}
        </div>
        <span className="absolute bottom-3 start-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 text-white/90 backdrop-blur-sm">
          {listingLabel}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white line-clamp-1">{p.title}</h3>
          <p className="text-xs text-white/45 flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {[p.city?.name, p.country?.name].filter(Boolean).join(', ') || '—'}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-amber-300 tabular-nums">
            {currency}
            {p.price.toLocaleString('en-US')}
          </p>
          <p className="text-xs text-white/40 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {p.views ?? 0}
          </p>
        </div>
        <CardSpecs p={p} tx={tx} />
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-lg border-white/15 bg-white/5 text-white hover:bg-white/10 h-8 text-xs"
            onClick={onPreview}
          >
            <ExternalLink className="h-3 w-3 me-1" />
            {tx('معاينة', 'Preview')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg border-white/15 bg-white/5 text-white hover:bg-white/10 h-8 px-2"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 h-8 px-2"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function CardSpecs({ p, tx }: { p: Property; tx: (ar: string, en: string) => string }) {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-white/45">
      {p.bedrooms != null && (
        <span className="flex items-center gap-1">
          <BedDouble className="h-3 w-3" />
          {p.bedrooms} {tx('غرف', 'beds')}
        </span>
      )}
      {p.bathrooms != null && (
        <span className="flex items-center gap-1">
          <Bath className="h-3 w-3" />
          {p.bathrooms}
        </span>
      )}
      <span className="flex items-center gap-1">
        <Maximize2 className="h-3 w-3" />
        {p.area} m²
      </span>
    </div>
  );
}



function PropertyFormPanel({
  isAr,
  tx,
  form,
  setForm,
  editingId,
  saving,
  countries,
  regions,
  cities,
  onSubmit,
  onClose,
  propertyTypeLabel,
  listingLabel,
  statusLabel,
}: {
  isAr: boolean;
  tx: (ar: string, en: string) => string;
  form: PropertyForm;
  setForm: React.Dispatch<React.SetStateAction<PropertyForm>>;
  editingId: string | null;
  saving: boolean;
  countries: Country[];
  regions: Country['regions'];
  cities: NonNullable<NonNullable<Country['regions']>[number]['cities']>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  propertyTypeLabel: (t: PropertyType, tx: (ar: string, en: string) => string) => string;
  listingLabel: (t: ListingType, tx: (ar: string, en: string) => string) => string;
  statusLabel: (s: PropertyStatus, tx: (ar: string, en: string) => string) => string;
}) {
  return (
    <div className="auth-card rounded-2xl overflow-hidden max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/10">
        <FormHeader editingId={editingId} tx={tx} />
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-8 max-h-[calc(100dvh-12rem)] overflow-y-auto">
        <FormSection title={tx('المعلومات الأساسية', 'Basic information')}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field span={2} label={tx('اسم العقار', 'Property title')} required>
              <input
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </Field>
            <Field span={2} label={tx('الوصف', 'Description')}>
              <textarea
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm min-h-[100px] resize-none"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={tx('صف العقار بإيجاز...', 'Describe the property briefly...')}
              />
            </Field>
            <Field label={tx('نوع العقار', 'Property type')}>
              <select
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.propertyType}
                onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value as PropertyType }))}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {propertyTypeLabel(t, tx)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tx('نوع الإعلان', 'Listing type')}>
              <select
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.listingType}
                onChange={(e) => setForm((f) => ({ ...f, listingType: e.target.value as ListingType }))}
              >
                {LISTING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {listingLabel(t, tx)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tx('حالة العقار', 'Status')}>
              <select
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PropertyStatus }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s, tx)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tx('السعر', 'Price')} required>
              <input
                type="number"
                min={0}
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title={tx('المواصفات', 'Specifications')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label={tx('المساحة m²', 'Area m²')}>
              <input
                type="number"
                min={1}
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              />
            </Field>
            <Field label={tx('غرف النوم', 'Bedrooms')}>
              <input
                type="number"
                min={0}
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.bedrooms}
                onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
              />
            </Field>
            <Field label={tx('الحمامات', 'Bathrooms')}>
              <input
                type="number"
                min={0}
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.bathrooms}
                onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
              />
            </Field>
            <Field label={tx('الطوابق', 'Floors')}>
              <input
                type="number"
                min={0}
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.floors}
                onChange={(e) => setForm((f) => ({ ...f, floors: e.target.value }))}
                placeholder="—"
              />
            </Field>
            <Field label={tx('سنة البناء', 'Year built')}>
              <input
                type="number"
                min={1800}
                max={2100}
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.yearBuilt}
                onChange={(e) => setForm((f) => ({ ...f, yearBuilt: e.target.value }))}
                placeholder="—"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title={tx('الموقع', 'Location')}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={tx('الدولة', 'Country')} required>
              <select
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.countryId}
                onChange={(e) => setForm((f) => ({ ...f, countryId: e.target.value, regionId: '', cityId: '' }))}
                required
              >
                <option value="">{tx('اختر الدولة', 'Select country')}</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tx('المنطقة', 'Region')} required>
              <select
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.regionId}
                onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value, cityId: '' }))}
                required
                disabled={!form.countryId}
              >
                <option value="">{tx('اختر المنطقة', 'Select region')}</option>
                {(regions ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tx('المدينة', 'City')} required>
              <select
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.cityId}
                onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
                required
                disabled={!form.regionId}
              >
                <option value="">{tx('اختر المدينة', 'Select city')}</option>
                {(cities ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field span={2} label={tx('العنوان التفصيلي', 'Street address')}>
              <input
                className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder={tx('الحي، الشارع، رقم المبنى...', 'District, street, building...')}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title={tx('الوسائط والخيارات', 'Media & options')}>
          <div className="space-y-4">
            <Field label={tx('رابط صورة الغلاف', 'Cover image URL')}>
              <ImageUrlInput
                isAr={isAr}
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                folder="properties"
                inputClassName="auth-input flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm"
                uploadClassName="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10 cursor-pointer"
                placeholder="https://..."
              />
            </Field>
            {form.imageUrl.trim() && (
              <div className="relative aspect-video max-w-md rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/8 transition-colors">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="rounded border-white/20"
              />
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  {tx('عقار مميز', 'Featured listing')}
                </p>
                <p className="text-[11px] text-white/45">
                  {tx('يظهر بشكل أوضح في نتائج البحث', 'Highlighted in search results')}
                </p>
              </div>
            </label>
          </div>
        </FormSection>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
          <Button
            type="submit"
            disabled={saving}
            className="checkout-pay-btn rounded-xl border-0 px-8 text-white"
          >
            {saving ? tx('جاري الحفظ...', 'Saving...') : editingId ? tx('حفظ التعديلات', 'Save changes') : tx('نشر العقار', 'Publish listing')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-white/15 bg-transparent text-white hover:bg-white/10"
            onClick={onClose}
          >
            {tx('إلغاء', 'Cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormHeader({ editingId, tx }: { editingId: string | null; tx: (ar: string, en: string) => string }) {
  return (
    <div>
      <p className="partner-form-section-title mb-1">
        {editingId ? tx('تعديل', 'Edit') : tx('جديد', 'New')}
      </p>
      <h2 className="font-heading text-xl font-bold text-white">
        {editingId ? tx('تعديل العقار', 'Edit property') : tx('إضافة عقار جديد', 'Add new property')}
      </h2>
    </div>
  );
}



function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="partner-form-section-title mb-4">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  span,
  required,
}: {
  label: string;
  children: React.ReactNode;
  span?: number;
  required?: boolean;
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2 space-y-2' : 'space-y-2'}>
      <Label className="text-white/70 text-sm">
        {label}
        {required && <span className="text-amber-400 ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
