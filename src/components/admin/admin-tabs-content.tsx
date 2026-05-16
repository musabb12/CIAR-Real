'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Star,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Heart,
  Building,
  Globe,
  Sun,
  Moon,
  Languages,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Ban,
  ShieldOff,
  RefreshCw,
  ImageIcon,
  UserCheck,
  Reply,
  Upload,
  Plus,
  Link2,
  Palette,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { AdminSection, type ColumnDef } from './admin-section';
import { AdminAnalyticsTab } from './admin-analytics-tab';
import { AdminFeaturesTab } from './admin-features-tab';
import { invalidate } from '@/lib/admin-events';
import { AdminRowMenu, type RowAction } from '@/components/admin/admin-row-menu';
import type { ManagedPageKey } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const PropertyAdminMapPicker = dynamic(
  () => import('./property-admin-map-picker').then((m) => m.PropertyAdminMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-xs text-[var(--admin-text-faint)]">
        …
      </div>
    ),
  }
);

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

function mapLocationAdminError(isAr: boolean, message: string): string {
  const m = message.trim();
  if (
    /cannot delete country with linked properties/i.test(m) ||
    /still has properties assigned/i.test(m)
  ) {
    return tx(
      isAr,
      'لا يمكن حذف الدولة لوجود عقارات مرتبطة بها. عطّل الدولة من «تعطيل الدولة» بدلاً من الحذف.',
      'This country still has listings tied to it. Use “Disable country” instead of delete.',
    );
  }
  if (/failed to delete country/i.test(m)) {
    return tx(isAr, 'تعذر حذف الدولة حالياً.', 'The country could not be deleted.');
  }
  if (/failed to update country/i.test(m)) {
    return tx(isAr, 'تعذر تحديث الدولة.', 'Could not update country.');
  }
  return m;
}

async function adminFetch(url: string, init?: RequestInit): Promise<void> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : `HTTP ${res.status}`);
}

const PROPERTY_STATUSES = ['AVAILABLE', 'PENDING', 'SOLD', 'RENTED'] as const;

function nextPropertyStatus(cur: string): string {
  const i = PROPERTY_STATUSES.indexOf(cur as (typeof PROPERTY_STATUSES)[number]);
  const idx = i < 0 ? 0 : i + 1;
  return PROPERTY_STATUSES[idx % PROPERTY_STATUSES.length];
}

type CountryTree = {
  id: string;
  name: string;
  regions: Array<{ id: string; name: string; cities: Array<{ id: string; name: string }> }>;
};

function normLocKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '')
    .trim();
}

function geoCityName(addr: Record<string, string | undefined>): string {
  return (addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '').trim();
}

function geoRegionName(addr: Record<string, string | undefined>): string {
  return (addr.state || addr.region || addr.province || addr.county || '').trim();
}

function geoCountryName(addr: Record<string, string | undefined>): string {
  return (addr.country || '').trim();
}

function matchLocationIds(
  tree: CountryTree[],
  addr: Record<string, string | undefined>
): { countryId: string; regionId: string; cityId: string } | null {
  const cityNm = geoCityName(addr);
  const nCity = normLocKey(cityNm);
  if (!nCity) return null;
  const nCo = normLocKey(geoCountryName(addr));
  const nReg = normLocKey(geoRegionName(addr));

  for (const c of tree) {
    if (nCo) {
      const cn = normLocKey(c.name);
      if (cn !== nCo && !cn.includes(nCo) && !nCo.includes(cn)) continue;
    }
    for (const r of c.regions) {
      if (nReg) {
        const rn = normLocKey(r.name);
        if (rn !== nReg && !rn.includes(nReg) && !nReg.includes(rn)) continue;
      }
      for (const city of r.cities) {
        const x = normLocKey(city.name);
        if (x === nCity || x.includes(nCity) || nCity.includes(x)) {
          return { countryId: c.id, regionId: r.id, cityId: city.id };
        }
      }
    }
  }

  for (const c of tree) {
    for (const r of c.regions) {
      for (const city of r.cities) {
        const x = normLocKey(city.name);
        if (x === nCity || x.includes(nCity) || nCity.includes(x)) {
          return { countryId: c.id, regionId: r.id, cityId: city.id };
        }
      }
    }
  }
  return null;
}

function smartDescriptionDraft(isAr: boolean, form: Record<string, string>, cityLabel: string): string {
  const title = (form.title || '').trim() || (isAr ? 'عقار مميز' : 'Featured listing');
  const listing = form.listingType;
  const type = form.propertyType;
  const area = form.area || (isAr ? '—' : '—');
  const beds = form.bedrooms;
  const baths = form.bathrooms;
  const loc = cityLabel || (isAr ? 'منطقة رئيسية' : 'prime area');
  if (isAr) {
    const deal =
      listing === 'RENT' ? 'للإيجار' : listing === 'SALE' ? 'للبيع' : 'إيجار قصير المدى';
    return `${title} ${deal} (${type}) بمساحة ${area} م²${beds ? `، ${beds} غرف نوم` : ''}${baths ? `، ${baths} حمامات` : ''}. يقع في ${loc}. أضف تفاصيل عن الإطلالة، موقف السيارات، الأمن، والمرافق القريبة.`;
  }
  return `${title}: ${listing} ${type}, ${area} sqm${beds ? `, ${beds} bed` : ''}${baths ? `, ${baths} bath` : ''}. Located in ${loc}. Add details about views, parking, security, and nearby amenities.`;
}

const AREA_SMART_PRESETS: Record<string, number[]> = {
  STUDIO: [42, 58, 72],
  APARTMENT: [90, 120, 160],
  VILLA: [220, 380, 520],
  HOUSE: [180, 260, 340],
  LAND: [300, 600, 1200],
  OFFICE: [65, 95, 140],
  COMMERCIAL: [120, 250, 400],
  PENTHOUSE: [160, 220, 300],
  TOWNHOUSE: [150, 200, 280],
  DUPLEX: [140, 190, 240],
};

function sanitizeLatLngStrings(latStr: string, lngStr: string): { latitude: string; longitude: string } {
  const parse = (s: string) => {
    const v = parseFloat(String(s).replace(/,/g, '.').trim());
    return Number.isFinite(v) ? v : NaN;
  };
  let lat = parse(latStr);
  let lng = parse(lngStr);
  if (Number.isFinite(lat)) lat = Math.max(-90, Math.min(90, lat));
  if (Number.isFinite(lng)) lng = Math.max(-180, Math.min(180, lng));
  return {
    latitude: Number.isFinite(lat) ? lat.toFixed(6) : '',
    longitude: Number.isFinite(lng) ? lng.toFixed(6) : '',
  };
}

// ─── Properties Tab ───────────────────────────────
type PropertiesTabRow = {
  id: string;
  title: string;
  price: number;
  propertyType: string;
  listingType: string;
  status: string;
  views: number;
  isFeatured?: boolean;
  images?: Array<{ url: string; isCover?: boolean; order?: number }>;
  country?: { name: string };
  city?: { name: string };
};

const emptyPropertyForm = () => ({
  title: '',
  description: '',
  price: '',
  listingType: 'SALE',
  propertyType: 'APARTMENT',
  status: 'AVAILABLE',
  area: '',
  bedrooms: '',
  bathrooms: '',
  countryId: '',
  regionId: '',
  cityId: '',
  address: '',
  latitude: '',
  longitude: '',
});

export function PropertiesTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locationTree, setLocationTree] = useState<CountryTree[]>([]);
  const [cardsView, setCardsView] = useState(true);
  const [cardRows, setCardRows] = useState<PropertiesTabRow[]>([]);
  const [form, setForm] = useState(emptyPropertyForm);
  const [imageGallery, setImageGallery] = useState<Array<{ url: string; isCover: boolean }>>([]);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [propertiesListMode, setPropertiesListMode] = useState<'unknown' | 'live' | 'stub'>('unknown');
  const [propertiesListStubReason, setPropertiesListStubReason] = useState<string | null>(null);
  const bump = () => setRefreshKey((k) => k + 1);

  const regionOptions = useMemo(() => {
    const c = locationTree.find((x) => x.id === form.countryId);
    return c?.regions ?? [];
  }, [locationTree, form.countryId]);

  const cityOptions = useMemo(() => {
    const r = regionOptions.find((x) => x.id === form.regionId);
    return r?.cities ?? [];
  }, [regionOptions, form.regionId]);

  const selectedCityLabel = useMemo(() => {
    const r = regionOptions.find((x) => x.id === form.regionId);
    const city = r?.cities.find((x) => x.id === form.cityId);
    return city?.name ?? '';
  }, [regionOptions, form.regionId, form.cityId]);

  const parseRows = useCallback((d: unknown): PropertiesTabRow[] => {
    const data = d as { data?: PropertiesTabRow[]; properties?: PropertiesTabRow[] };
    return data.data ?? data.properties ?? [];
  }, []);

  const onPropertiesApiResponse = useCallback((raw: unknown) => {
    const o = raw as { backendConfigured?: boolean; backendMessage?: string };
    if (o.backendConfigured === false) {
      setPropertiesListMode('stub');
      setPropertiesListStubReason(typeof o.backendMessage === 'string' ? o.backendMessage : null);
    } else {
      setPropertiesListMode('live');
      setPropertiesListStubReason(null);
    }
  }, []);
  const columns: ColumnDef<PropertiesTabRow>[] = [
    {
      key: 'title',
      header: { ar: 'العقار', en: 'Property' },
      render: (r) => (
        <div>
          <div className="font-semibold flex items-center gap-2">
            {r.title}
            {r.isFeatured && <Star className="h-3 w-3 text-[#f5c97b] fill-current" />}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--admin-text-faint)] mt-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {r.city?.name ?? '—'}, {r.country?.name ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: { ar: 'النوع', en: 'Type' },
      render: (r) => <span className="admin-tag bg-white/[0.05] text-[var(--admin-text-mute)]">{r.propertyType}</span>,
    },
    {
      key: 'listing',
      header: { ar: 'الإدراج', en: 'Listing' },
      render: (r) => <span className="admin-tag bg-[#f5c97b]/15 text-[#f5c97b]">{r.listingType}</span>,
    },
    {
      key: 'price',
      header: { ar: 'السعر', en: 'Price' },
      render: (r) => <span className="font-bold text-[#f5c97b]">${r.price.toLocaleString()}</span>,
    },
    {
      key: 'views',
      header: { ar: 'المشاهدات', en: 'Views' },
      render: (r) => <span className="text-[var(--admin-text-mute)]">{r.views?.toLocaleString() ?? 0}</span>,
    },
    {
      key: 'status',
      header: { ar: 'الحالة', en: 'Status' },
      render: (r) => {
        const statusColor = r.status === 'AVAILABLE' ? 'admin-pill-up' : r.status === 'SOLD' ? 'admin-pill-down' : 'admin-pill-gold';
        return <span className={`admin-pill ${statusColor}`}>{r.status}</span>;
      },
    },
  ];

  const rowActions = (r: PropertiesTabRow): RowAction[] => [
    {
      id: 'edit',
      label: tx(isAr, 'تعديل العقار', 'Edit property'),
      icon: Sparkles,
      onClick: async () => {
        setEditingId(r.id);
        setOpen(true);
        setEditLoading(true);
        setImageGallery([]);
        try {
          const res = await fetch(`/api/properties/${r.id}?skipView=1`);
          if (!res.ok) throw new Error('load');
          const p = (await res.json()) as {
            title: string;
            description: string;
            price: number;
            listingType: string;
            propertyType: string;
            status: string;
            area: number;
            bedrooms: number | null;
            bathrooms: number | null;
            countryId: string;
            regionId: string;
            cityId: string;
            address?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            images?: Array<{ url: string; isCover?: boolean }>;
          };
          setForm({
            title: p.title ?? '',
            description: p.description ?? '',
            price: String(p.price ?? ''),
            listingType: p.listingType ?? 'SALE',
            propertyType: p.propertyType ?? 'APARTMENT',
            status: p.status ?? 'AVAILABLE',
            area: String(p.area ?? ''),
            bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
            bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
            countryId: p.countryId ?? '',
            regionId: p.regionId ?? '',
            cityId: p.cityId ?? '',
            address: p.address ?? '',
            latitude: p.latitude != null ? String(p.latitude) : '',
            longitude: p.longitude != null ? String(p.longitude) : '',
          });
          setImageGallery(
            (p.images ?? []).map((img, i) => ({
              url: img.url,
              isCover: Boolean(img.isCover) || i === 0,
            }))
          );
        } catch {
          toast.error(tx(isAr, 'تعذر تحميل العقار', 'Could not load property'));
          setOpen(false);
          setEditingId(null);
        } finally {
          setEditLoading(false);
        }
      },
    },
    {
      id: 'feat',
      label: tx(isAr, r.isFeatured ? 'إلغاء التمييز' : 'تمييز', r.isFeatured ? 'Unfeature' : 'Feature'),
      icon: Sparkles,
      onClick: async () => {
        try {
          await adminFetch(`/api/properties/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured: !r.isFeatured }),
          });
          invalidate('properties');
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), {
            description: e instanceof Error ? e.message : '',
          });
        }
      },
    },
    {
      id: 'status',
      label: tx(isAr, 'تغيير الحالة', 'Change status'),
      icon: RefreshCw,
      onClick: async () => {
        const next = nextPropertyStatus(r.status);
        try {
          await adminFetch(`/api/properties/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: next }),
          });
          invalidate('properties');
          toast.success(tx(isAr, `الحالة: ${next}`, `Status: ${next}`));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), {
            description: e instanceof Error ? e.message : '',
          });
        }
      },
    },
    {
      id: 'del',
      label: tx(isAr, 'حذف العقار', 'Delete property'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        if (!window.confirm(tx(isAr, 'حذف هذا العقار نهائياً؟', 'Permanently delete this property?'))) return;
        try {
          await adminFetch(`/api/properties/${r.id}`, { method: 'DELETE' });
          invalidate('properties');
          toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), {
            description: e instanceof Error ? e.message : '',
          });
        }
      },
    },
  ];

  useEffect(() => {
    fetch('/api/locations?includeInactive=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const countries = Array.isArray(data) ? data : data?.countries ?? [];
        const tree: CountryTree[] = countries.map(
          (country: { id: string; name: string; regions?: CountryTree['regions'] }) => ({
            id: country.id,
            name: country.name,
            regions: (country.regions ?? []).map((region) => ({
              id: region.id,
              name: region.name,
              cities: (region.cities ?? []).map((city: { id: string; name: string }) => ({
                id: city.id,
                name: city.name,
              })),
            })),
          })
        );
        setLocationTree(tree);
      })
      .catch(() => {});
  }, []);

  const submitProperty = async () => {
    if (!form.title.trim() || !form.price || !form.area || !form.countryId || !form.regionId || !form.cityId) {
      toast.error(tx(isAr, 'يرجى تعبئة الحقول الأساسية', 'Please fill required fields'));
      return;
    }
    const desc = form.description.trim() || (isAr ? 'لا يوجد وصف بعد.' : 'No description yet.');
    const coords = sanitizeLatLngStrings(form.latitude, form.longitude);
    const snapshot = { ...form, ...coords };
    setForm(snapshot);
    const imagesPayload = imageGallery.map((g, i) => ({
      url: g.url,
      isCover: g.isCover || i === 0,
      order: i,
    }));
    setSubmitting(true);
    try {
      const endpoint = editingId ? `/api/properties/${editingId}` : '/api/properties';
      const method = editingId ? 'PUT' : 'POST';
      const body: Record<string, unknown> = {
        ...snapshot,
        description: desc,
        latitude: coords.latitude || null,
        longitude: coords.longitude || null,
      };
      if (!editingId) body.isFeatured = false;
      if (editingId) {
        body.images = imagesPayload;
      } else if (imagesPayload.length > 0) {
        body.images = imagesPayload;
      }
      await adminFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      toast.success(tx(isAr, 'تم الحفظ بنجاح', 'Saved successfully'));
      setOpen(false);
      setEditingId(null);
      setForm(emptyPropertyForm());
      setImageGallery([]);
      setImageUrlDraft('');
      invalidate('properties');
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الحفظ', 'Save failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const PROPERTY_IMAGE_MAX = 60;

  const urlLooksValid = (t: string) => {
    const s = t.trim();
    if (!s) return false;
    return (
      (typeof URL !== 'undefined' && 'canParse' in URL && (URL as { canParse: (x: string) => boolean }).canParse(s)) ||
      /^https?:\/\/.+/i.test(s)
    );
  };

  const addImagesFromUrlDraft = () => {
    const raw = imageUrlDraft.trim();
    if (!raw) return;
    const tokens = raw
      .split(/[\n\r,;|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const valid = Array.from(new Set(tokens.filter(urlLooksValid)));
    if (!valid.length) {
      toast.error(tx(isAr, 'لا يوجد رابط صالح', 'No valid URLs'));
      return;
    }
    setImageGallery((g) => {
      const room = PROPERTY_IMAGE_MAX - g.length;
      if (room <= 0) {
        toast.error(tx(isAr, `الحد ${PROPERTY_IMAGE_MAX} صورة`, `Maximum ${PROPERTY_IMAGE_MAX} images`));
        return g;
      }
      const slice = valid.slice(0, room);
      const start = g.length;
      if (slice.length < valid.length) {
        toast.message(
          tx(isAr, `أُضيفت ${slice.length} من ${valid.length} رابطاً`, `Added ${slice.length} of ${valid.length} URL(s)`)
        );
      } else {
        toast.success(tx(isAr, `تمت إضافة ${slice.length} رابطاً`, `Added ${slice.length} URL(s)`));
      }
      return [...g, ...slice.map((url, i) => ({ url, isCover: start === 0 && i === 0 }))];
    });
    setImageUrlDraft('');
  };

  const uploadPropertyImageFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => {
      const t = f.type || '';
      if (/^image\/(jpeg|png|webp|gif)$/i.test(t)) return true;
      return /\.(jpe?g|png|webp|gif)$/i.test(f.name);
    });
    if (!files.length) {
      toast.error(tx(isAr, 'اختر ملفات صور (JPEG/PNG/WebP/GIF)', 'Choose image files (JPEG/PNG/WebP/GIF)'));
      return;
    }
    setUploadingImage(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'properties');
        const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !data.url) continue;
        uploaded.push(data.url);
      }
      if (!uploaded.length) {
        toast.error(tx(isAr, 'فشل رفع الملفات', 'Upload failed'));
        return;
      }
      setImageGallery((g) => {
        const room = PROPERTY_IMAGE_MAX - g.length;
        if (room <= 0) {
          toast.error(tx(isAr, `الحد ${PROPERTY_IMAGE_MAX} صورة`, `Maximum ${PROPERTY_IMAGE_MAX} images`));
          return g;
        }
        const slice = uploaded.slice(0, room);
        const start = g.length;
        if (slice.length < uploaded.length) {
          toast.message(
            tx(
              isAr,
              `أُضيف للمعرض ${slice.length} من ${uploaded.length} بعد الرفع (الحد ${PROPERTY_IMAGE_MAX})`,
              `Gallery took ${slice.length} of ${uploaded.length} uploads (max ${PROPERTY_IMAGE_MAX})`
            )
          );
        } else if (uploaded.length < files.length) {
          toast.message(
            tx(isAr, `تم رفع ${uploaded.length} من ${files.length} ملفاً`, `Uploaded ${uploaded.length} of ${files.length} file(s)`)
          );
        } else {
          toast.success(tx(isAr, `تم رفع ${uploaded.length} صورة`, `Uploaded ${uploaded.length} image(s)`));
        }
        return [...g, ...slice.map((url, i) => ({ url, isCover: start === 0 && i === 0 }))];
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const applySmartGeocode = async () => {
    if (!form.latitude.trim() || !form.longitude.trim()) {
      toast.error(tx(isAr, 'ضع دبوساً على الخريطة أولاً', 'Drop a pin on the map first'));
      return;
    }
    setGeocodeLoading(true);
    try {
      const res = await fetch(
        `/api/geocode/reverse?lat=${encodeURIComponent(form.latitude)}&lon=${encodeURIComponent(form.longitude)}`
      );
      const data = (await res.json()) as {
        error?: string;
        displayName?: string;
        address?: Record<string, string | undefined>;
      };
      if (!res.ok) throw new Error(data.error || 'geocode');
      const addr = data.address ?? {};
      const line =
        [addr.road, addr.neighbourhood, addr.city || addr.town, addr.state, addr.country]
          .filter(Boolean)
          .join(', ') || (data.displayName ?? '');
      const matched = matchLocationIds(locationTree, addr);
      setForm((f) => ({
        ...f,
        address: line || f.address,
        ...(matched
          ? { countryId: matched.countryId, regionId: matched.regionId, cityId: matched.cityId }
          : {}),
      }));
      if (matched) {
        toast.success(tx(isAr, 'تم ملء العنوان ومطابقة المدينة', 'Address filled and city matched'));
      } else {
        toast.message(tx(isAr, 'تم ملء العنوان', 'Address filled'), {
          description: tx(isAr, 'لم تُطابق المدينة تلقائياً — اخترها من القوائم', 'City not auto-matched — pick from lists'),
        });
      }
    } catch (e) {
      toast.error(tx(isAr, 'فشل ذكاء الموقع', 'Location lookup failed'), {
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const fillSmartDescription = () => {
    setForm((f) => ({
      ...f,
      description: smartDescriptionDraft(isAr, f as unknown as Record<string, string>, selectedCityLabel),
    }));
    toast.success(tx(isAr, 'تم إدراج مسودة وصف', 'Description draft inserted'));
  };

  const applyAreaPreset = (n: number) => {
    setForm((f) => ({ ...f, area: String(n) }));
  };

  return (
    <>
      {propertiesListMode === 'stub' && (
        <div className="admin-card p-4 mb-4 border border-amber-500/40 bg-amber-500/[0.12] text-sm text-amber-50/95 leading-relaxed">
          <p className="font-semibold">{tx(isAr, 'قاعدة البيانات غير متصلة', 'Database backend is not connected')}</p>
          <p className="mt-2 text-[var(--admin-text-mute)]">
            {tx(
              isAr,
              'لوحة التحكم تحتاج مفتاح خدمة Firebase على الخادم. أضف المتغير FIREBASE_SERVICE_ACCOUNT_JSON إلى ملف .env (JSON حساب الخدمة كاملاً) ثم أعد تشغيل npm run dev.',
              'The admin API needs Firebase Admin credentials. Add FIREBASE_SERVICE_ACCOUNT_JSON to your .env (full service-account JSON), then restart npm run dev.',
            )}
          </p>
          {propertiesListStubReason ? (
            <p className="mt-2 font-mono text-[11px] text-amber-200/80 break-all">{propertiesListStubReason}</p>
          ) : null}
        </div>
      )}

    <AdminSection<PropertiesTabRow>
      key={refreshKey}
      isAr={isAr}
      title={{ ar: 'إدارة العقارات', en: 'Manage Properties' }}
      subtitle={{ ar: 'كل العقارات المُدرجة على المنصة — التعديل يظهر فوراً في البحث والقوائم', en: 'All listings — changes apply instantly across the site' }}
      endpoint="/api/properties?limit=100"
      parseRows={parseRows}
      columns={columns}
      searchKeys={['title']}
      rowActions={rowActions}
      showTable={!cardsView}
      onFilteredRows={setCardRows}
      onApiResponse={onPropertiesApiResponse}
      emptyAr={
        propertiesListMode === 'stub'
          ? 'لا تُعرض العقارات حتى يتصل الخادم بـ Firebase — راجع التنبيه أعلاه.'
          : 'لا توجد عقارات تطابق البحث'
      }
      emptyEn={
        propertiesListMode === 'stub'
          ? 'Listings stay hidden until the server can reach Firebase — see the notice above.'
          : 'No properties match your search'
      }
      toolbarActions={(
        <button
          type="button"
          className="admin-icon-btn !w-auto px-3 gap-1.5 text-xs"
          onClick={() => setCardsView((v) => !v)}
        >
          {cardsView ? tx(isAr, 'عرض جدول', 'Table view') : tx(isAr, 'عرض كروت', 'Cards view')}
        </button>
      )}
      onAdd={() => {
        setEditingId(null);
        setForm(emptyPropertyForm());
        setImageGallery([]);
        setImageUrlDraft('');
        setOpen(true);
      }}
    />
      {cardsView && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cardRows.length === 0 ? (
            <div className="col-span-full admin-card py-14 text-center text-sm text-[var(--admin-text-mute)]">
              {propertiesListMode === 'stub'
                ? tx(
                    isAr,
                    'لا تُحمَّل العقارات — راجع تنبيه الاتصال بقاعدة البيانات أعلاه.',
                    'Properties are not loaded — see the database connection notice above.',
                  )
                : tx(isAr, 'لا توجد عقارات تطابق البحث', 'No properties match your search')}
            </div>
          ) : null}
          {cardRows.map((r) => (
            <div key={r.id} className="admin-card p-4">
              <div className="relative h-36 rounded-xl overflow-hidden border border-white/10 bg-white/[0.04] mb-3">
                <img
                  src={r.images?.find((img) => img.isCover)?.url || r.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop'}
                  alt={r.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                <div className="absolute top-2 end-2 z-10 [&_button]:!bg-black/55 [&_button]:!border-white/15 [&_button]:hover:!bg-black/70">
                  <AdminRowMenu
                    actions={rowActions(r)}
                    ariaLabel={tx(isAr, 'إجراءات العقار', 'Property actions')}
                  />
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white line-clamp-1">{r.title}</div>
                    <div className="text-[11px] text-white/80 mt-0.5 line-clamp-1">
                      {r.city?.name ?? '—'}, {r.country?.name ?? '—'}
                    </div>
                  </div>
                  {r.isFeatured && <span className="admin-pill admin-pill-gold">{tx(isAr, 'مميز', 'Featured')}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className={`admin-pill ${r.status === 'AVAILABLE' ? 'admin-pill-up' : r.status === 'PENDING' ? 'admin-pill-gold' : 'admin-pill-down'}`}>
                  {r.status}
                </span>
                <span className="text-[11px] text-[var(--admin-text-faint)]">{tx(isAr, 'المشاهدات', 'Views')}: {r.views?.toLocaleString() ?? 0}</span>
              </div>

              <div className="mt-2 text-sm text-[var(--admin-text-mute)]">
                ${r.price.toLocaleString()} · {r.propertyType} · {r.listingType}
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEditingId(null);
            setEditLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[min(88vh,900px)] overflow-y-auto gap-0 border-[var(--admin-border-strong)] bg-[var(--admin-bg-2)]/95 sm:rounded-2xl p-0 sm:p-0">
          <DialogHeader className="space-y-1 border-b border-[var(--admin-border)] px-5 py-4 text-start bg-[var(--admin-bg-3)]/50">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[var(--admin-text)]">
              {tx(isAr, editingId ? 'تعديل عقار' : 'إضافة عقار', editingId ? 'Edit Property' : 'Add Property')}
            </DialogTitle>
            <DialogDescription className="text-[12px] leading-relaxed text-[var(--admin-text-mute)]">
              {tx(isAr, 'يمكنك إضافة أو تحديث العقار مباشرة من الأدمن', 'You can add or update property directly from admin')}
            </DialogDescription>
          </DialogHeader>

          {editLoading ? (
            <div className="py-16 text-center text-sm text-[var(--admin-text-mute)]">
              {tx(isAr, 'جارٍ التحميل…', 'Loading property…')}
            </div>
          ) : (
            <>
              <div className="space-y-5 px-5 py-5">
                <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-2)]/40 p-4 space-y-3">
                  <div className="text-[11px] font-semibold text-[var(--admin-text-mute)] tracking-wide">
                    {tx(isAr, 'اختصارات', 'Shortcuts')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border-strong)] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[var(--admin-text)] hover:border-[#f5c97b]/35 hover:bg-[#f5c97b]/10 transition-colors"
                      onClick={fillSmartDescription}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#f5c97b]" />
                      {tx(isAr, 'مسودة وصف ذكية', 'Smart description')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border-strong)] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[var(--admin-text)] hover:border-[#f5c97b]/35 hover:bg-[#f5c97b]/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      disabled={geocodeLoading || !form.latitude || !form.longitude}
                      onClick={() => void applySmartGeocode()}
                    >
                      <Globe className="h-3.5 w-3.5 text-[#f5c97b]" />
                      {geocodeLoading
                        ? tx(isAr, 'جارٍ الجيو…', 'Geocoding…')
                        : tx(isAr, 'ذكاء الموقع من الخريطة', 'Smart location from map')}
                    </button>
                  </div>
                  <div className="pt-2 border-t border-[var(--admin-border)]">
                    <div className="text-[11px] font-medium text-[var(--admin-text-mute)] mb-2">
                      {tx(isAr, 'مساحة مقترحة (م²)', 'Suggested area (m²)')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(AREA_SMART_PRESETS[form.propertyType] ?? [100, 150, 200]).map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="rounded-full border border-[var(--admin-border)] bg-white/[0.03] px-2.5 py-1 text-[11px] tabular-nums text-[var(--admin-text-mute)] hover:border-[#f5c97b]/45 hover:text-[#f5c97b] transition-colors"
                          onClick={() => applyAreaPreset(n)}
                        >
                          {n} m²
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label={tx(isAr, 'العنوان', 'Title')}>
                    <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </Field>
                  <Field label={tx(isAr, 'السعر', 'Price')}>
                    <input className="admin-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </Field>
                  <Field label={tx(isAr, 'النوع', 'Property type')}>
                    <select
                      className="admin-input"
                      value={form.propertyType}
                      onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                    >
                      {['APARTMENT', 'VILLA', 'HOUSE', 'LAND', 'OFFICE', 'COMMERCIAL', 'STUDIO', 'PENTHOUSE', 'TOWNHOUSE', 'DUPLEX'].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={tx(isAr, 'الإدراج', 'Listing')}>
                    <select className="admin-input" value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value })}>
                      {['SALE', 'RENT', 'SHORT_TERM'].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={tx(isAr, 'الحالة', 'Status')}>
                    <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {['AVAILABLE', 'PENDING', 'SOLD', 'RENTED'].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={tx(isAr, 'المساحة (م²)', 'Area (m²)')}>
                    <input className="admin-input" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
                  </Field>
                  <Field label={tx(isAr, 'غرف النوم', 'Bedrooms')}>
                    <input className="admin-input" type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
                  </Field>
                  <Field label={tx(isAr, 'الحمامات', 'Bathrooms')}>
                    <input className="admin-input" type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
                  </Field>
                </div>

                <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-2)]/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#f5c97b]" />
                    <span className="text-sm font-semibold text-[var(--admin-text)]">{tx(isAr, 'صور العقار', 'Property images')}</span>
                    {imageGallery.length > 0 ? (
                      <span className="rounded-full border border-[var(--admin-border)] bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium tabular-nums text-[var(--admin-text-mute)]">
                        {imageGallery.length}/{PROPERTY_IMAGE_MAX}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[var(--admin-text-faint)] leading-relaxed">
                    {tx(
                      isAr,
                      'عدة روابط (سطر لكل رابط أو مفصولة بفاصلة/فاصلة منقوطة) أو اختيار عدة ملفات دفعة واحدة — حتى 60 صورة.',
                      'Multiple URLs (one per line or separated by comma/semicolon) or multi-file upload — up to 60 images.'
                    )}
                  </p>
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="admin-input min-h-[64px] max-h-32 resize-y flex-1 text-xs leading-relaxed"
                      rows={2}
                      value={imageUrlDraft}
                      onChange={(e) => setImageUrlDraft(e.target.value)}
                      placeholder={tx(isAr, 'https://…\nhttps://…', 'https://…\nhttps://…')}
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" className="admin-icon-btn !w-auto px-3 gap-1.5 text-xs shrink-0" onClick={addImagesFromUrlDraft}>
                        <Link2 className="h-3.5 w-3.5" />
                        {tx(isAr, 'إضافة الروابط', 'Add URLs')}
                      </button>
                      <label className="admin-icon-btn !w-auto px-3 gap-1.5 text-xs shrink-0 cursor-pointer">
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingImage ? tx(isAr, 'جارٍ الرفع…', 'Uploading…') : tx(isAr, 'رفع ملفات', 'Upload files')}
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={(e) => {
                            const list = e.target.files;
                            e.target.value = '';
                            if (list?.length) void uploadPropertyImageFiles(list);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  {imageGallery.length > 0 ? (
                    <ul className="space-y-2 max-h-72 overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-black/20 p-2">
                      {imageGallery.map((img, idx) => (
                        <li
                          key={`gallery-${idx}`}
                          className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white/[0.03] px-2 py-1.5"
                        >
                          <img src={img.url} alt="" className="h-11 w-14 rounded-md object-cover shrink-0 border border-white/10" />
                          <span className="text-[10px] text-[var(--admin-text-faint)] truncate flex-1 font-mono">{img.url}</span>
                          <button
                            type="button"
                            className="text-[10px] px-2 py-1 rounded-md bg-[#f5c97b]/15 text-[#f5c97b] shrink-0 font-medium"
                            onClick={() =>
                              setImageGallery((list) =>
                                list.map((g, i) => ({ ...g, isCover: i === idx }))
                              )
                            }
                          >
                            {img.isCover ? tx(isAr, 'غلاف', 'Cover') : tx(isAr, 'تعيين غلاف', 'Set cover')}
                          </button>
                          <button
                            type="button"
                            className="text-[10px] px-2 py-1 rounded-md bg-red-500/12 text-red-300 shrink-0 font-medium"
                            onClick={() => setImageGallery((list) => list.filter((_, i) => i !== idx))}
                          >
                            {tx(isAr, 'حذف', 'Remove')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex min-h-[72px] items-center justify-center rounded-xl border border-dashed border-[var(--admin-border-strong)] bg-black/15 px-3 text-center text-[11px] text-[var(--admin-text-faint)]">
                      {tx(isAr, 'لا توجد صور بعد — أضف رابطاً أو ارفع ملفاً', 'No images yet — add a URL or upload')}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-2)]/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#f5c97b]" />
                    <span className="text-sm font-semibold text-[var(--admin-text)]">{tx(isAr, 'الموقع على الخريطة', 'Map location')}</span>
                  </div>
                  <p className="text-[11px] text-[var(--admin-text-faint)] leading-relaxed">
                    {tx(
                      isAr,
                      'انقر على الخريطة لوضع الدبوس، ثم استخدم «ذكاء الموقع». الإحداثيات تُعرض بالاتجاه L→R لتفادي أخطاء الكتابة.',
                      'Click the map to drop a pin, then use Smart location. Coordinates use LTR digits to avoid RTL typos.'
                    )}
                  </p>
                  <div className="dir-ltr">
                    <PropertyAdminMapPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      height={200}
                      onPick={(lat, lng) => {
                        const c = sanitizeLatLngStrings(String(lat), String(lng));
                        setForm((f) => ({ ...f, ...c }));
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 dir-ltr">
                    <Field label={tx(isAr, 'خط العرض', 'Latitude')}>
                      <input
                        className="admin-input text-xs font-mono tabular-nums"
                        inputMode="decimal"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        onBlur={() =>
                          setForm((f) => ({ ...f, ...sanitizeLatLngStrings(f.latitude, f.longitude) }))
                        }
                        placeholder="24.713600"
                      />
                    </Field>
                    <Field label={tx(isAr, 'خط الطول', 'Longitude')}>
                      <input
                        className="admin-input text-xs font-mono tabular-nums"
                        inputMode="decimal"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        onBlur={() =>
                          setForm((f) => ({ ...f, ...sanitizeLatLngStrings(f.latitude, f.longitude) }))
                        }
                        placeholder="46.675300"
                      />
                    </Field>
                  </div>
                  <Field label={tx(isAr, 'العنوان المكتوب', 'Street / address line')}>
                    <input
                      className="admin-input"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder={tx(isAr, 'يُملأ من «ذكاء الموقع» أو أدخل يدوياً', 'Filled via smart location or type manually')}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label={tx(isAr, 'الدولة', 'Country')}>
                    <select
                      className="admin-input"
                      value={form.countryId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({ ...f, countryId: v, regionId: '', cityId: '' }));
                      }}
                    >
                      <option value="">{tx(isAr, 'اختر الدولة', 'Select country')}</option>
                      {locationTree.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={tx(isAr, 'المنطقة', 'Region')}>
                    <select
                      className="admin-input"
                      value={form.regionId}
                      disabled={!form.countryId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({ ...f, regionId: v, cityId: '' }));
                      }}
                    >
                      <option value="">{tx(isAr, 'اختر المنطقة', 'Select region')}</option>
                      {regionOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={tx(isAr, 'المدينة', 'City')}>
                    <select
                      className="admin-input"
                      value={form.cityId}
                      disabled={!form.regionId}
                      onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                    >
                      <option value="">{tx(isAr, 'اختر المدينة', 'Select city')}</option>
                      {cityOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label={tx(isAr, 'الوصف', 'Description')}>
                  <textarea className="admin-input min-h-[108px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
              </div>
            </>
          )}

          <DialogFooter className="gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-bg-3)]/40 px-5 py-4 sm:justify-between">
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button
              type="button"
              className="admin-btn-premium"
              disabled={submitting || editLoading}
              onClick={() => void submitProperty()}
            >
              {submitting ? tx(isAr, 'جارٍ الحفظ…', 'Saving...') : tx(isAr, 'حفظ', 'Save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Featured Tab ──────────────────────────────
export function FeaturedTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  type Row = { id: string; title: string; price: number; propertyType: string; listingType: string; status: string; views: number; country?: { name: string } };
  const parseRows = useCallback((d: unknown): Row[] => {
    const data = d as { data?: Row[]; properties?: Row[] };
    return data.data ?? data.properties ?? [];
  }, []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'title',
      header: { ar: 'العقار', en: 'Property' },
      render: (r) => (
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-[#f5c97b] fill-current" />
          <span className="font-semibold">{r.title}</span>
        </div>
      ),
    },
    { key: 'country', header: { ar: 'الدولة', en: 'Country' }, render: (r) => r.country?.name ?? '—' },
    { key: 'price', header: { ar: 'السعر', en: 'Price' }, render: (r) => <span className="font-bold text-[#f5c97b]">${r.price.toLocaleString()}</span> },
    { key: 'views', header: { ar: 'المشاهدات', en: 'Views' }, render: (r) => r.views?.toLocaleString() ?? 0 },
    { key: 'status', header: { ar: 'الحالة', en: 'Status' }, render: (r) => <span className="admin-pill admin-pill-gold">{r.status}</span> },
  ];
  const rowActions = (r: Row): RowAction[] => [
    {
      id: 'unfeat',
      label: tx(isAr, 'إزالة من المميزة', 'Remove from featured'),
      icon: Sparkles,
      variant: 'danger',
      onClick: async () => {
        try {
          await adminFetch(`/api/properties/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured: false }),
          });
          invalidate('properties');
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
  ];
  return (
    <AdminSection<Row>
      key={refreshKey}
      isAr={isAr}
      title={{ ar: 'العقارات المميزة', en: 'Featured Properties' }}
      subtitle={{ ar: 'العقارات الفاخرة المعروضة في المقدمة', en: 'Premium properties on the spotlight' }}
      endpoint="/api/properties?isFeatured=true&limit=100"
      parseRows={parseRows}
      columns={columns}
      searchKeys={['title']}
      rowActions={rowActions}
    />
  );
}

// ─── Locations Tab ─────────────────────────────
export function LocationsTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', flag: '', currency: '' });
  const bump = () => setRefreshKey((k) => k + 1);
  type Row = {
    id: string;
    name: string;
    code: string;
    flag?: string;
    currency?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    _count?: { properties: number };
  };
  const parseRows = useCallback((d: unknown): Row[] => {
    if (Array.isArray(d)) return d as Row[];
    const data = d as { countries?: Row[] };
    return data.countries ?? [];
  }, []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      header: { ar: 'الدولة', en: 'Country' },
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{r.flag ?? '🌍'}</span>
          <span className="font-semibold">{r.name}</span>
        </div>
      ),
    },
    { key: 'code', header: { ar: 'الرمز', en: 'Code' }, render: (r) => <span className="font-mono text-[11px] text-[var(--admin-text-mute)]">{r.code}</span> },
    { key: 'currency', header: { ar: 'العملة', en: 'Currency' }, render: (r) => r.currency ?? '—' },
    {
      key: 'status',
      header: { ar: 'الحالة', en: 'Status' },
      render: (r) => (
        <span className={`admin-pill ${r.isActive ? 'admin-pill-up' : 'admin-pill-down'}`}>
          {r.isActive ? tx(isAr, 'نشطة', 'Active') : tx(isAr, 'معطلة', 'Disabled')}
        </span>
      ),
    },
    {
      key: 'featured',
      header: { ar: 'مميزة', en: 'Featured' },
      render: (r) => (
        r.isFeatured
          ? <span className="admin-pill admin-pill-gold">{tx(isAr, 'مميزة', 'Featured')}</span>
          : <span className="text-[var(--admin-text-faint)]">—</span>
      ),
    },
    { key: 'properties', header: { ar: 'العقارات', en: 'Properties' }, render: (r) => <span className="font-bold">{r._count?.properties ?? 0}</span> },
  ];
  const rowActions = (r: Row): RowAction[] => [
    {
      id: 'toggle-active',
      label: tx(isAr, r.isActive ? 'تعطيل الدولة' : 'تفعيل الدولة', r.isActive ? 'Disable country' : 'Enable country'),
      icon: r.isActive ? EyeOff : Eye,
      onClick: async () => {
        try {
          await adminFetch(`/api/locations/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !r.isActive }),
          });
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), {
            description: e instanceof Error ? mapLocationAdminError(isAr, e.message) : '',
          });
        }
      },
    },
    {
      id: 'toggle-featured',
      label: tx(isAr, r.isFeatured ? 'إزالة من المميزة' : 'تعيين كمميزة', r.isFeatured ? 'Unfeature country' : 'Feature country'),
      icon: Sparkles,
      onClick: async () => {
        try {
          await adminFetch(`/api/locations/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured: !r.isFeatured }),
          });
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), {
            description: e instanceof Error ? mapLocationAdminError(isAr, e.message) : '',
          });
        }
      },
    },
    {
      id: 'delete',
      label: tx(isAr, 'حذف الدولة', 'Delete country'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        if (!window.confirm(tx(isAr, 'حذف الدولة نهائياً؟', 'Delete country permanently?'))) return;
        try {
          await adminFetch(`/api/locations/${r.id}`, { method: 'DELETE' });
          toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'تعذر الحذف', 'Delete failed'), {
            description: e instanceof Error ? mapLocationAdminError(isAr, e.message) : '',
          });
        }
      },
    },
  ];

  const submit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error(tx(isAr, 'الاسم والرمز مطلوبان', 'Name and code are required'));
      return;
    }
    setSubmitting(true);
    try {
      await adminFetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setOpen(false);
      setForm({ name: '', code: '', flag: '', currency: '' });
      toast.success(tx(isAr, 'تمت الإضافة', 'Country added'));
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الإنشاء', 'Create failed'), {
        description: e instanceof Error ? mapLocationAdminError(isAr, e.message) : '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminSection<Row>
        key={refreshKey}
        isAr={isAr}
        title={{ ar: 'الدول والمدن', en: 'Countries & Cities' }}
        subtitle={{ ar: 'إدارة الدول والمناطق والمدن', en: 'Manage countries, regions, and cities' }}
        endpoint="/api/locations?includeProperties=true&includeInactive=true"
        parseRows={parseRows}
        columns={columns}
        searchKeys={['name', 'code']}
        rowActions={rowActions}
        onAdd={() => setOpen(true)}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tx(isAr, 'إضافة دولة جديدة', 'Add country')}</DialogTitle>
            <DialogDescription>{tx(isAr, 'يمكنك إدارتها لاحقاً من قائمة الدول', 'You can manage it later from countries list')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={tx(isAr, 'الاسم', 'Name')}>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'الرمز (ISO)', 'Code (ISO)')}>
              <input className="admin-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label={tx(isAr, 'العلم', 'Flag')}>
              <input className="admin-input" value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} placeholder="🇸🇦" />
            </Field>
            <Field label={tx(isAr, 'العملة', 'Currency')}>
              <input className="admin-input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="SAR" />
            </Field>
          </div>
          <DialogFooter>
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button type="button" className="admin-btn-premium" disabled={submitting} onClick={submit}>
              {submitting ? tx(isAr, 'جارٍ الحفظ…', 'Saving...') : tx(isAr, 'حفظ', 'Save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Users Tab ────────────────────────────────
export function UsersTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  type Row = { id: string; name: string | null; email: string; phone: string | null; role: string; isActive: boolean; createdAt: string };
  const parseRows = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      header: { ar: 'المستخدم', en: 'User' },
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#f5c97b]/30 to-[#2dd4bf]/30 flex items-center justify-center text-xs font-bold text-[#f5c97b]">
            {(r.name ?? r.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{r.name ?? '—'}</div>
            <div className="text-[11px] text-[var(--admin-text-faint)]">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: { ar: 'الهاتف', en: 'Phone' },
      render: (r) => r.phone ?? '—',
    },
    {
      key: 'role',
      header: { ar: 'الصلاحية', en: 'Role' },
      render: (r) => {
        const c = r.role === 'ADMIN' ? '#f5c97b' : r.role === 'AGENT' ? '#a78bfa' : '#2dd4bf';
        return <span className="admin-tag" style={{ background: `${c}1f`, color: c }}>{r.role}</span>;
      },
    },
    {
      key: 'status',
      header: { ar: 'الحالة', en: 'Status' },
      render: (r) =>
        r.isActive ? (
          <span className="admin-pill admin-pill-up">{tx(isAr, 'نشط', 'Active')}</span>
        ) : (
          <span className="admin-pill admin-pill-down">{tx(isAr, 'موقوف', 'Disabled')}</span>
        ),
    },
    {
      key: 'created',
      header: { ar: 'تاريخ الإنشاء', en: 'Joined' },
      render: (r) => <span className="text-[var(--admin-text-mute)] text-[12px]">{new Date(r.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}</span>,
    },
  ];
  const rowActions = (r: Row): RowAction[] => [
    {
      id: 'toggle',
      label: tx(isAr, r.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب', r.isActive ? 'Disable account' : 'Activate account'),
      icon: r.isActive ? Ban : CheckCircle2,
      onClick: async () => {
        try {
          await adminFetch(`/api/users/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !r.isActive }),
          });
          invalidate('users');
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
    {
      id: 'role',
      label: tx(isAr, r.role === 'ADMIN' ? 'إزالة صلاحية الإدارة' : 'تعيين كأدمن', r.role === 'ADMIN' ? 'Demote from admin' : 'Promote to admin'),
      icon: UserCheck,
      onClick: async () => {
        try {
          await adminFetch(`/api/users/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: r.role === 'ADMIN' ? 'USER' : 'ADMIN' }),
          });
          invalidate('users');
          toast.success(tx(isAr, 'تم تحديث الصلاحية', 'Role updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
    {
      id: 'del',
      label: tx(isAr, 'حذف المستخدم', 'Delete user'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        if (!window.confirm(tx(isAr, 'حذف هذا المستخدم نهائياً؟', 'Permanently delete this user?'))) return;
        try {
          await adminFetch(`/api/users/${r.id}`, { method: 'DELETE' });
          invalidate('users');
          toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
  ];
  return (
    <AdminSection<Row>
      key={refreshKey}
      isAr={isAr}
      title={{ ar: 'إدارة المستخدمين', en: 'Manage Users' }}
      subtitle={{ ar: 'كل المستخدمين المسجلين على المنصة', en: 'All registered users on the platform' }}
      endpoint="/api/users"
      parseRows={parseRows}
      columns={columns}
      searchKeys={['name', 'email']}
      rowActions={rowActions}
    />
  );
}

// ─── Agents Tab ──────────────────────────────
export function AgentsTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  type Row = { id: string; rating: number; verified: boolean; totalListings: number; user?: { name?: string; email?: string }; company?: { name?: string }; _count?: { properties: number } };
  const parseRows = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      header: { ar: 'الوكيل', en: 'Agent' },
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#a78bfa]/30 to-[#2dd4bf]/30 flex items-center justify-center text-xs font-bold text-[#a78bfa]">
            {(r.user?.name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold flex items-center gap-1.5">
              {r.user?.name ?? '—'}
              {r.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <div className="text-[11px] text-[var(--admin-text-faint)]">{r.user?.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'company', header: { ar: 'الشركة', en: 'Company' }, render: (r) => r.company?.name ?? '—' },
    {
      key: 'rating',
      header: { ar: 'التقييم', en: 'Rating' },
      render: (r) => (
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 text-[#f5c97b] fill-current" />
          <span className="font-bold">{r.rating?.toFixed(1) ?? '0.0'}</span>
        </span>
      ),
    },
    { key: 'listings', header: { ar: 'القوائم', en: 'Listings' }, render: (r) => <span className="font-bold">{r._count?.properties ?? r.totalListings ?? 0}</span> },
  ];
  const rowActions = (r: Row): RowAction[] => [
    {
      id: 'verify',
      label: tx(isAr, r.verified ? 'إلغاء التوثيق' : 'توثيق الوكيل', r.verified ? 'Unverify agent' : 'Verify agent'),
      icon: r.verified ? ShieldOff : ShieldCheck,
      onClick: async () => {
        try {
          await adminFetch(`/api/agents/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verified: !r.verified }),
          });
          invalidate('agents');
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
    {
      id: 'del',
      label: tx(isAr, 'حذف الوكيل', 'Delete agent'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        if (!window.confirm(tx(isAr, 'حذف الوكيل نهائياً؟', 'Permanently delete this agent?'))) return;
        try {
          await adminFetch(`/api/agents/${r.id}`, { method: 'DELETE' });
          invalidate('agents');
          toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
  ];
  return (
    <AdminSection<Row>
      key={refreshKey}
      isAr={isAr}
      title={{ ar: 'إدارة الوكلاء', en: 'Manage Agents' }}
      subtitle={{ ar: 'الوكلاء المعتمدون والشركات', en: 'Verified agents and companies' }}
      endpoint="/api/agents"
      parseRows={parseRows}
      columns={columns}
      rowActions={rowActions}
    />
  );
}

// ─── Inquiries Tab ───────────────────────────
export function InquiriesTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  type Row = { id: string; name: string; email: string; phone?: string | null; message: string; status: string; createdAt: string; property?: { title: string } };
  const parseRows = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      header: { ar: 'العميل', en: 'Customer' },
      render: (r) => (
        <div>
          <div className="font-semibold">{r.name}</div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--admin-text-faint)] mt-0.5">
            <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{r.email}</span>
            {r.phone && <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{r.phone}</span>}
          </div>
        </div>
      ),
    },
    { key: 'property', header: { ar: 'العقار', en: 'Property' }, render: (r) => <span className="text-[var(--admin-text-mute)]">{r.property?.title ?? '—'}</span> },
    {
      key: 'message',
      header: { ar: 'الرسالة', en: 'Message' },
      render: (r) => <span className="text-[var(--admin-text-mute)] line-clamp-1 max-w-xs block">{r.message}</span>,
    },
    {
      key: 'status',
      header: { ar: 'الحالة', en: 'Status' },
      render: (r) => {
        const c = r.status === 'NEW' ? 'admin-pill-gold' : r.status === 'READ' ? 'admin-pill-up' : 'admin-pill-down';
        return <span className={`admin-pill ${c}`}>{r.status}</span>;
      },
    },
    {
      key: 'date',
      header: { ar: 'التاريخ', en: 'Date' },
      render: (r) => <span className="text-[var(--admin-text-mute)] text-[12px]">{new Date(r.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}</span>,
    },
  ];
  const setStatus = async (r: Row, status: string) => {
    try {
      await adminFetch(`/api/inquiries/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      invalidate('inquiries');
      toast.success(tx(isAr, `الحالة: ${status}`, `Status: ${status}`));
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
    }
  };
  const rowActions = (r: Row): RowAction[] => [
    { id: 'read', label: tx(isAr, 'تعليم كمقروء', 'Mark as read'), icon: Eye, onClick: () => setStatus(r, 'READ') },
    { id: 'reply', label: tx(isAr, 'تعليم كمُجاب', 'Mark as replied'), icon: Reply, onClick: () => setStatus(r, 'REPLIED') },
    { id: 'close', label: tx(isAr, 'إغلاق', 'Close'), icon: Ban, onClick: () => setStatus(r, 'CLOSED') },
    {
      id: 'del',
      label: tx(isAr, 'حذف', 'Delete'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        if (!window.confirm(tx(isAr, 'حذف الاستفسار؟', 'Delete this inquiry?'))) return;
        try {
          await adminFetch(`/api/inquiries/${r.id}`, { method: 'DELETE' });
          invalidate('inquiries');
          toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
  ];
  return (
    <AdminSection<Row>
      key={refreshKey}
      isAr={isAr}
      title={{ ar: 'الاستفسارات', en: 'Inquiries' }}
      subtitle={{ ar: 'كل الاستفسارات الواردة من العملاء', en: 'All inquiries from customers' }}
      endpoint="/api/inquiries"
      parseRows={parseRows}
      columns={columns}
      searchKeys={['name', 'email', 'message']}
      rowActions={rowActions}
    />
  );
}

// ─── Reviews Tab ──────────────────────────
export function ReviewsTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  type Row = {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    name: string;
    email: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    property?: { title: string };
  };
  const parseRows = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'reviewer',
      header: { ar: 'المقيّم', en: 'Reviewer' },
      render: (r) => (
        <div>
          <div className="font-semibold">{r.name}</div>
          <div className="text-[11px] text-[var(--admin-text-faint)]">{r.email}</div>
        </div>
      ),
    },
    {
      key: 'rating',
      header: { ar: 'التقييم', en: 'Rating' },
      render: (r) => (
        <span className="text-[#f5c97b] tracking-tight" aria-label={`${r.rating} stars`}>
          {'★'.repeat(Math.min(5, Math.max(0, r.rating)))}
          <span className="text-[var(--admin-text-faint)]">
            {'☆'.repeat(5 - Math.min(5, Math.max(0, r.rating)))}
          </span>
        </span>
      ),
    },
    {
      key: 'property',
      header: { ar: 'العقار', en: 'Property' },
      render: (r) => <span className="text-[var(--admin-text-mute)]">{r.property?.title ?? '—'}</span>,
    },
    {
      key: 'comment',
      header: { ar: 'التعليق', en: 'Comment' },
      render: (r) => (
        <span className="text-[var(--admin-text-mute)] line-clamp-2 max-w-xs block">
          {r.comment ?? r.title ?? '—'}
        </span>
      ),
    },
    {
      key: 'flags',
      header: { ar: 'الحالة', en: 'Status' },
      render: (r) => (
        <span className="flex flex-wrap gap-1">
          {r.isVerified && <span className="admin-pill admin-pill-up">{tx(isAr, 'موثّق', 'Verified')}</span>}
          <span className={`admin-pill ${r.isActive ? 'admin-pill-gold' : 'admin-pill-down'}`}>
            {r.isActive ? tx(isAr, 'ظاهر', 'Visible') : tx(isAr, 'مخفي', 'Hidden')}
          </span>
        </span>
      ),
    },
    {
      key: 'date',
      header: { ar: 'التاريخ', en: 'Date' },
      render: (r) => (
        <span className="text-[var(--admin-text-mute)] text-[12px]">
          {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}
        </span>
      ),
    },
  ];
  const rowActions = (r: Row): RowAction[] => [
    {
      id: 'visible',
      label: tx(isAr, r.isActive ? 'إخفاء' : 'إظهار', r.isActive ? 'Hide' : 'Show'),
      icon: r.isActive ? EyeOff : Eye,
      onClick: async () => {
        try {
          await adminFetch(`/api/admin/reviews/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !r.isActive }),
          });
          invalidate('reviews');
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
    {
      id: 'verify',
      label: tx(isAr, r.isVerified ? 'إلغاء التوثيق' : 'توثيق التقييم', r.isVerified ? 'Unverify' : 'Verify'),
      icon: r.isVerified ? ShieldOff : ShieldCheck,
      onClick: async () => {
        try {
          await adminFetch(`/api/admin/reviews/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isVerified: !r.isVerified }),
          });
          invalidate('reviews');
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
    {
      id: 'del',
      label: tx(isAr, 'حذف التقييم', 'Delete review'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        if (!window.confirm(tx(isAr, 'حذف هذا التقييم نهائياً؟', 'Permanently delete this review?'))) return;
        try {
          await adminFetch(`/api/admin/reviews/${r.id}`, { method: 'DELETE' });
          invalidate('reviews');
          toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
  ];
  return (
    <AdminSection<Row>
      key={refreshKey}
      isAr={isAr}
      title={{ ar: 'تقييمات العقارات', en: 'Property Reviews' }}
      subtitle={{ ar: 'جميع التقييمات المعروضة على المنصة', en: 'All reviews submitted on the platform' }}
      endpoint="/api/admin/reviews"
      parseRows={parseRows}
      columns={columns}
      searchKeys={['name', 'email', 'comment', 'title']}
      rowActions={rowActions}
    />
  );
}

// ─── Favorites Tab ────────────────────────
export function FavoritesTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  type Row = {
    id: string;
    createdAt: string;
    user?: { name?: string | null; email?: string };
    property?: {
      title: string;
      price: number;
      country?: { name: string };
      city?: { name: string };
    };
  };
  const parseRows = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'user',
      header: { ar: 'المستخدم', en: 'User' },
      render: (r) => (
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">{r.user?.name ?? '—'}</div>
            <div className="text-[11px] text-[var(--admin-text-faint)]">{r.user?.email ?? ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'property',
      header: { ar: 'العقار', en: 'Property' },
      render: (r) => (
        <div>
          <div className="font-medium">{r.property?.title ?? '—'}</div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--admin-text-faint)] mt-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {r.property?.city?.name ?? '—'}, {r.property?.country?.name ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: { ar: 'السعر', en: 'Price' },
      render: (r) => (
        <span className="font-bold text-[#f5c97b]">
          {r.property?.price != null ? `$${Number(r.property.price).toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      key: 'date',
      header: { ar: 'أضيفت', en: 'Saved' },
      render: (r) => (
        <span className="text-[var(--admin-text-mute)] text-[12px]">
          {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}
        </span>
      ),
    },
  ];
  const rowActions = (r: Row): RowAction[] => [
    {
      id: 'del',
      label: tx(isAr, 'إزالة من المفضلة', 'Remove favorite'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        try {
          await adminFetch(`/api/admin/favorites/${r.id}`, { method: 'DELETE' });
          invalidate('favorites');
          toast.success(tx(isAr, 'تمت الإزالة', 'Removed'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل', 'Failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
  ];
  return (
    <AdminSection<Row>
      key={refreshKey}
      isAr={isAr}
      title={{ ar: 'المفضلة', en: 'Favorites' }}
      subtitle={{ ar: 'كل العقارات المحفوظة من قبل المستخدمين', en: 'Properties saved by users' }}
      endpoint="/api/admin/favorites"
      parseRows={parseRows}
      columns={columns}
      rowActions={rowActions}
    />
  );
}

// ─── Companies Tab ────────────────────────
export function CompaniesTab({ isAr }: { isAr: boolean }) {
  type Row = {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    listingCount: number;
    agentCount: number;
    _count?: { agents: number };
  };
  const parseRows = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      header: { ar: 'الشركة', en: 'Company' },
      render: (r) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-[#f5c97b] shrink-0" />
          <span className="font-semibold">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: { ar: 'التواصل', en: 'Contact' },
      render: (r) => (
        <div className="text-[12px] text-[var(--admin-text-mute)]">
          {r.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {r.email}
            </div>
          )}
          {r.phone && (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" />
              {r.phone}
            </div>
          )}
          {r.website && (
            <div className="flex items-center gap-1 mt-0.5">
              <Globe className="h-3 w-3" />
              {r.website}
            </div>
          )}
          {!r.email && !r.phone && !r.website && '—'}
        </div>
      ),
    },
    {
      key: 'agents',
      header: { ar: 'الوكلاء', en: 'Agents' },
      render: (r) => (
        <span className="font-bold tabular-nums">{r._count?.agents ?? r.agentCount ?? 0}</span>
      ),
    },
    {
      key: 'listings',
      header: { ar: 'إعلانات (حقل)', en: 'Listings (field)' },
      render: (r) => <span className="tabular-nums">{r.listingCount}</span>,
    },
  ];
  return (
    <AdminSection<Row>
      isAr={isAr}
      title={{ ar: 'الشركات', en: 'Companies' }}
      subtitle={{ ar: 'شركات العقارات المرتبطة بالوكلاء', en: 'Real-estate firms linked to agents' }}
      endpoint="/api/companies"
      parseRows={parseRows}
      columns={columns}
      searchKeys={['name', 'email', 'phone']}
    />
  );
}

// ─── Banners Tab ──────────────────────────
export function BannersTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', image: '', link: '', position: 'home', order: 0, isActive: true });
  const [submitting, setSubmitting] = useState(false);

  type Row = { id: string; title: string; subtitle?: string | null; image?: string | null; link?: string | null; position: string; isActive: boolean; order?: number };
  const parseRows = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'title',
      header: { ar: 'الإعلان', en: 'Banner' },
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-16 rounded-md bg-white/[0.05] overflow-hidden flex items-center justify-center">
            {r.image ? (
              <img src={r.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-4 w-4 text-[var(--admin-text-faint)]" />
            )}
          </div>
          <div>
            <div className="font-semibold">{r.title}</div>
            {r.subtitle && <div className="text-[11px] text-[var(--admin-text-faint)]">{r.subtitle}</div>}
          </div>
        </div>
      ),
    },
    { key: 'position', header: { ar: 'الموقع', en: 'Position' }, render: (r) => <span className="admin-tag bg-white/[0.05] text-[var(--admin-text-mute)]">{r.position}</span> },
    {
      key: 'active',
      header: { ar: 'الحالة', en: 'Status' },
      render: (r) =>
        r.isActive ? (
          <ToggleRight className="h-5 w-5 text-emerald-400" />
        ) : (
          <ToggleLeft className="h-5 w-5 text-[var(--admin-text-faint)]" />
        ),
    },
  ];

  const rowActions = (r: Row): RowAction[] => [
    {
      id: 'toggle',
      label: tx(isAr, r.isActive ? 'إيقاف' : 'تفعيل', r.isActive ? 'Deactivate' : 'Activate'),
      icon: r.isActive ? ToggleLeft : ToggleRight,
      onClick: async () => {
        try {
          await adminFetch(`/api/banners/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !r.isActive }),
          });
          invalidate('banners');
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
    {
      id: 'del',
      label: tx(isAr, 'حذف الإعلان', 'Delete banner'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        if (!window.confirm(tx(isAr, 'حذف هذا الإعلان؟', 'Delete this banner?'))) return;
        try {
          await adminFetch(`/api/banners/${r.id}`, { method: 'DELETE' });
          invalidate('banners');
          toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
  ];

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error(tx(isAr, 'العنوان مطلوب', 'Title is required'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`);
      toast.success(tx(isAr, 'تمت الإضافة', 'Banner added'));
      setOpen(false);
      setForm({ title: '', subtitle: '', image: '', link: '', position: 'home', order: 0, isActive: true });
      invalidate('banners');
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الإنشاء', 'Create failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminSection<Row>
        key={refreshKey}
        isAr={isAr}
        title={{ ar: 'الإعلانات (البانرات)', en: 'Banners' }}
        subtitle={{ ar: 'إدارة الإعلانات على الصفحات', en: 'Manage banners across pages' }}
        endpoint="/api/banners"
        parseRows={parseRows}
        columns={columns}
        searchKeys={['title', 'subtitle', 'position']}
        onAdd={() => setOpen(true)}
        rowActions={rowActions}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tx(isAr, 'إضافة بانر جديد', 'Add new banner')}</DialogTitle>
            <DialogDescription>
              {tx(isAr, 'سيظهر فوراً في الموقع بعد الحفظ', 'Will appear on the site after saving')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={tx(isAr, 'العنوان', 'Title')}>
              <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'العنوان الفرعي', 'Subtitle')}>
              <input className="admin-input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'رابط الصورة', 'Image URL')}>
              <input className="admin-input" placeholder="https://…" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'رابط البانر', 'Link URL')}>
              <input className="admin-input" placeholder="https://…" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx(isAr, 'الموقع', 'Position')}>
                <select className="admin-input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                  <option value="home">home</option>
                  <option value="search">search</option>
                  <option value="sidebar">sidebar</option>
                </select>
              </Field>
              <Field label={tx(isAr, 'الترتيب', 'Order')}>
                <input
                  type="number"
                  className="admin-input"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              {tx(isAr, 'فعّال', 'Active')}
            </label>
          </div>
          <DialogFooter>
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button type="button" className="admin-btn-premium" disabled={submitting} onClick={submit}>
              {submitting ? tx(isAr, 'جارٍ الحفظ…', 'Saving…') : tx(isAr, 'حفظ', 'Save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── News Tab ───────────────────────────
export function NewsTab({ isAr }: { isAr: boolean }) {
  const designSettings = useAppStore((s) => s.designSettings);
  const updateDesignSettings = useAppStore((s) => s.updateDesignSettings);
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ content: '', type: 'info', link: '', order: 0, isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const clampTickerDim = (value: number, min: number, max: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
  };

  type Row = { id: string; content: string; type: string; isActive: boolean; order: number; createdAt: string; link?: string | null };
  const parseRows = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);
  const columns: ColumnDef<Row>[] = [
    {
      key: 'content',
      header: { ar: 'المحتوى', en: 'Content' },
      render: (r) => <span className="font-medium">{r.content}</span>,
    },
    {
      key: 'type',
      header: { ar: 'النوع', en: 'Type' },
      render: (r) => {
        const c = r.type === 'urgent' ? 'admin-pill-down' : r.type === 'promo' ? 'admin-pill-gold' : 'admin-pill-up';
        return <span className={`admin-pill ${c}`}>{r.type}</span>;
      },
    },
    { key: 'order', header: { ar: 'الترتيب', en: 'Order' }, render: (r) => <span className="font-mono">{r.order}</span> },
    {
      key: 'active',
      header: { ar: 'الحالة', en: 'Status' },
      render: (r) =>
        r.isActive ? (
          <span className="admin-pill admin-pill-up">{tx(isAr, 'فعّال', 'Active')}</span>
        ) : (
          <span className="admin-pill admin-pill-down">{tx(isAr, 'متوقف', 'Inactive')}</span>
        ),
    },
  ];

  const rowActions = (r: Row): RowAction[] => [
    {
      id: 'toggle',
      label: tx(isAr, r.isActive ? 'إيقاف' : 'تفعيل', r.isActive ? 'Deactivate' : 'Activate'),
      icon: r.isActive ? ToggleLeft : ToggleRight,
      onClick: async () => {
        try {
          await adminFetch('/api/news', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: r.id, isActive: !r.isActive }),
          });
          invalidate('news');
          toast.success(tx(isAr, 'تم التحديث', 'Updated'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
    {
      id: 'del',
      label: tx(isAr, 'حذف الخبر', 'Delete news'),
      icon: Trash2,
      variant: 'danger',
      onClick: async () => {
        if (!window.confirm(tx(isAr, 'حذف هذا الخبر؟', 'Delete this item?'))) return;
        try {
          await adminFetch(`/api/news?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
          invalidate('news');
          toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
          bump();
        } catch (e) {
          toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
        }
      },
    },
  ];

  const submit = async () => {
    if (!form.content.trim()) {
      toast.error(tx(isAr, 'المحتوى مطلوب', 'Content is required'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`);
      toast.success(tx(isAr, 'تمت الإضافة', 'News added'));
      setOpen(false);
      setForm({ content: '', type: 'info', link: '', order: 0, isActive: true });
      invalidate('news');
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الإنشاء', 'Create failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="admin-card p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#f5c97b]" />
            <div>
              <h3 className="font-heading font-bold">{tx(isAr, 'مظهر الشريط الإخباري', 'Ticker appearance')}</h3>
              <p className="text-[12px] text-[var(--admin-text-mute)] mt-1 max-w-xl">
                {tx(
                  isAr,
                  'يُحفظ تلقائياً مع إعدادات الموقع (بعد ثوانٍ قليلة). اترك الحقول الفارغة لاستخدام المظهر الافتراضي للوضع الفاتح/الداكن.',
                  'Saves automatically with site settings (short debounce). Leave color fields empty to keep the default light/dark theme look.',
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-icon-btn !w-auto px-4"
            onClick={() => {
              updateDesignSettings({
                newsTickerBackground: '',
                newsTickerTextColor: '',
                newsTickerFontSizePx: 12,
                newsTickerHeightPx: 40,
                newsTickerLabelTextColor: '',
                newsTickerLabelBackground: '',
                newsTickerSeparatorColor: '',
              });
              toast.success(tx(isAr, 'تمت إعادة مظهر الشريط للافتراضي', 'Ticker appearance reset to defaults'));
            }}
          >
            {tx(isAr, 'إعادة مظهر الشريط', 'Reset ticker look')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label={tx(isAr, 'ارتفاع الشريط (بكسل)', 'Bar height (px)')}>
            <input
              type="number"
              min={28}
              max={80}
              className="admin-input"
              value={designSettings.newsTickerHeightPx ?? 40}
              onChange={(e) =>
                updateDesignSettings({
                  newsTickerHeightPx: clampTickerDim(Number(e.target.value), 28, 80, 40),
                })
              }
            />
          </Field>
          <Field label={tx(isAr, 'حجم خط النص المتحرك (بكسل)', 'Scrolling text size (px)')}>
            <input
              type="number"
              min={10}
              max={24}
              className="admin-input"
              value={designSettings.newsTickerFontSizePx ?? 12}
              onChange={(e) =>
                updateDesignSettings({
                  newsTickerFontSizePx: clampTickerDim(Number(e.target.value), 10, 24, 12),
                })
              }
            />
          </Field>
          <Field label={tx(isAr, 'خلفية الشريط (CSS)', 'Bar background (CSS)')}>
            <input
              className="admin-input font-mono text-[13px]"
              placeholder="linear-gradient(...) · rgba(...) · #hex"
              value={designSettings.newsTickerBackground}
              onChange={(e) => updateDesignSettings({ newsTickerBackground: e.target.value })}
            />
          </Field>
          <Field label={tx(isAr, 'لون نص الأخبار (CSS)', 'News text color (CSS)')}>
            <input
              className="admin-input font-mono text-[13px]"
              placeholder="#334155 · rgb(...)"
              value={designSettings.newsTickerTextColor}
              onChange={(e) => updateDesignSettings({ newsTickerTextColor: e.target.value })}
            />
          </Field>
          <Field label={tx(isAr, 'خلفية عمود «عاجل» (CSS)', 'Label column background (CSS)')}>
            <input
              className="admin-input font-mono text-[13px]"
              placeholder={tx(isAr, 'فارغ = تدرج خفيف بلون الهوية', 'Empty = subtle brand tint')}
              value={designSettings.newsTickerLabelBackground}
              onChange={(e) => updateDesignSettings({ newsTickerLabelBackground: e.target.value })}
            />
          </Field>
          <Field label={tx(isAr, 'لون نص «عاجل» والجرس (CSS)', 'Label & bell color (CSS)')}>
            <input
              className="admin-input font-mono text-[13px]"
              placeholder={tx(isAr, 'فارغ = اللون الأساسي للموقع', 'Empty = site primary color')}
              value={designSettings.newsTickerLabelTextColor}
              onChange={(e) => updateDesignSettings({ newsTickerLabelTextColor: e.target.value })}
            />
          </Field>
          <Field label={tx(isAr, 'لون الفواصل | (CSS)', 'Separator color (CSS)')}>
            <input
              className="admin-input font-mono text-[13px]"
              placeholder={tx(isAr, 'فارغ = لون خافت من السمة', 'Empty = muted theme color')}
              value={designSettings.newsTickerSeparatorColor}
              onChange={(e) => updateDesignSettings({ newsTickerSeparatorColor: e.target.value })}
            />
          </Field>
        </div>

        <p className="text-[11px] text-[var(--admin-text-faint)] mb-2">{tx(isAr, 'معاينة', 'Preview')}</p>
        <div
          className="rounded-lg border border-white/10 overflow-hidden glass-nav"
          style={{
            height: designSettings.newsTickerHeightPx ?? 40,
            ...(designSettings.newsTickerBackground?.trim()
              ? { background: designSettings.newsTickerBackground }
              : {}),
          }}
        >
          <div className="flex h-full items-center">
            <div
              className={
                designSettings.newsTickerLabelBackground?.trim()
                  ? 'flex h-full items-center gap-2 border-r border-border/40 px-3'
                  : 'flex h-full items-center gap-2 border-r border-border/40 bg-gradient-to-r from-primary/10 to-transparent px-3 dark:from-primary/5'
              }
              style={
                designSettings.newsTickerLabelBackground?.trim()
                  ? { background: designSettings.newsTickerLabelBackground }
                  : undefined
              }
            >
              <span
                className={designSettings.newsTickerLabelTextColor?.trim() ? '' : 'text-primary'}
                style={{
                  fontSize: designSettings.newsTickerFontSizePx ?? 12,
                  ...(designSettings.newsTickerLabelTextColor?.trim()
                    ? { color: designSettings.newsTickerLabelTextColor }
                    : {}),
                }}
              >
                {tx(isAr, 'عاجل', 'Breaking')}
              </span>
            </div>
            <div className="flex-1 px-3 truncate">
              <span
                className={designSettings.newsTickerTextColor?.trim() ? '' : 'text-foreground/80'}
                style={{
                  fontSize: designSettings.newsTickerFontSizePx ?? 12,
                  ...(designSettings.newsTickerTextColor?.trim()
                    ? { color: designSettings.newsTickerTextColor }
                    : {}),
                }}
              >
                {tx(isAr, 'نص تجريبي للشريط الإخباري…', 'Sample ticker headline text…')}
              </span>
              <span
                className={`mx-1 ${designSettings.newsTickerSeparatorColor?.trim() ? '' : 'text-foreground/20'}`}
                style={
                  designSettings.newsTickerSeparatorColor?.trim()
                    ? { color: designSettings.newsTickerSeparatorColor }
                    : undefined
                }
              >
                |
              </span>
            </div>
          </div>
        </div>
      </div>

      <AdminSection<Row>
        key={refreshKey}
        isAr={isAr}
        title={{ ar: 'الأخبار وشريط الأخبار', en: 'News & Ticker' }}
        subtitle={{ ar: 'إدارة الأخبار العاجلة — تظهر فوراً في الشريط أعلى الصفحات', en: 'Edits show instantly in the public ticker' }}
        endpoint="/api/news?all=1"
        parseRows={parseRows}
        columns={columns}
        searchKeys={['content']}
        onAdd={() => setOpen(true)}
        rowActions={rowActions}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tx(isAr, 'إضافة خبر جديد', 'Add news item')}</DialogTitle>
            <DialogDescription>
              {tx(isAr, 'سيظهر فوراً في شريط الأخبار للزوار', 'Will appear instantly in the public ticker')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={tx(isAr, 'المحتوى', 'Content')}>
              <textarea
                className="admin-input min-h-[80px]"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Field>
            <Field label={tx(isAr, 'الرابط (اختياري)', 'Link (optional)')}>
              <input className="admin-input" placeholder="https://…" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx(isAr, 'النوع', 'Type')}>
                <select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="info">info</option>
                  <option value="warning">warning</option>
                  <option value="urgent">urgent</option>
                  <option value="promo">promo</option>
                </select>
              </Field>
              <Field label={tx(isAr, 'الترتيب', 'Order')}>
                <input
                  type="number"
                  className="admin-input"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              {tx(isAr, 'فعّال', 'Active')}
            </label>
          </div>
          <DialogFooter>
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button type="button" className="admin-btn-premium" disabled={submitting} onClick={submit}>
              {submitting ? tx(isAr, 'جارٍ الحفظ…', 'Saving…') : tx(isAr, 'حفظ', 'Save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] mb-1 text-[var(--admin-text-mute)]">{label}</div>
      {children}
    </label>
  );
}

// ─── Features Tab ────────────────────────
export function FeaturesTab({ isAr }: { isAr: boolean }) {
  return <AdminFeaturesTab isAr={isAr} />;
}

export function ContentManagerTab({ isAr }: { isAr: boolean }) {
  const router = useRouter();
  const {
    contentSettings,
    updatePageContent,
    resetPageContent,
    socialSettings,
    updateSocialSettings,
    resetSocialSettings,
  } = useAppStore();
  const [activePageContentTab, setActivePageContentTab] = useState<ManagedPageKey>('home');
  const [backgroundUrlDraft, setBackgroundUrlDraft] = useState('');
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const pageMeta: Record<ManagedPageKey, { ar: string; en: string }> = {
    home: { ar: 'الرئيسية', en: 'Home' },
    search: { ar: 'البحث', en: 'Search' },
    agents: { ar: 'الوكلاء', en: 'Agents' },
    contact: { ar: 'اتصل بنا', en: 'Contact' },
    favorites: { ar: 'المفضلة', en: 'Favorites' },
    login: { ar: 'دخول المستخدم', en: 'User Login' },
    register: { ar: 'تسجيل المستخدم', en: 'User Register' },
    'admin-login': { ar: 'دخول الأدمن', en: 'Admin Login' },
  };

  const activeContentEntry = contentSettings[activePageContentTab];
  const hasCustomData = Boolean(
    activeContentEntry.title?.trim()
    || activeContentEntry.subtitle?.trim()
    || activeContentEntry.badgeText?.trim()
    || activeContentEntry.backgroundImageUrl?.trim()
    || activeContentEntry.hideBadge
    || activeContentEntry.textAlign
    || activeContentEntry.titleSize
    || typeof activeContentEntry.overlayOpacity === 'number'
    || activeContentEntry.contentMaxWidth,
  );
  const openPageMap: Record<ManagedPageKey, string> = {
    home: '/',
    search: '/#search',
    agents: '/#agents',
    contact: '/#contact',
    favorites: '/#favorites',
    login: '/#login',
    register: '/#register',
    'admin-login': '/admin',
  };
  const previewImage = activeContentEntry.backgroundImageUrl?.trim();
  const placeholderImage = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80&auto=format&fit=crop';
  const galleryImages = Array.from(
    new Set([
      ...(activeContentEntry.backgroundImageUrl?.trim()
        ? [activeContentEntry.backgroundImageUrl.trim()]
        : []),
      ...((activeContentEntry.backgroundImageUrls ?? [])
        .map((url) => url.trim())
        .filter(Boolean)),
    ]),
  );

  const handleSetBackgroundPrimary = (url: string) => {
    updatePageContent(activePageContentTab, {
      backgroundImageUrl: url,
      backgroundImageUrls: galleryImages,
    });
  };

  const handleRemoveBackgroundImage = (url: string) => {
    const nextGallery = galleryImages.filter((item) => item !== url);
    updatePageContent(activePageContentTab, {
      backgroundImageUrls: nextGallery,
      backgroundImageUrl:
        activeContentEntry.backgroundImageUrl?.trim() === url
          ? nextGallery[0] ?? ''
          : activeContentEntry.backgroundImageUrl ?? '',
    });
  };

  const handleAddBackgroundUrl = () => {
    const nextUrl = backgroundUrlDraft.trim();
    if (!nextUrl) return;
    const nextGallery = Array.from(new Set([...galleryImages, nextUrl]));
    updatePageContent(activePageContentTab, {
      backgroundImageUrl: activeContentEntry.backgroundImageUrl?.trim() || nextUrl,
      backgroundImageUrls: nextGallery,
    });
    setBackgroundUrlDraft('');
    toast.success(tx(isAr, 'تمت إضافة الخلفية', 'Background added'));
  };

  const handleUploadBackground = async (file: File) => {
    setUploadingBackground(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'Upload failed');
      }

      const uploadedUrl = String(payload.url);
      const nextGallery = Array.from(new Set([...galleryImages, uploadedUrl]));
      updatePageContent(activePageContentTab, {
        backgroundImageUrl: activeContentEntry.backgroundImageUrl?.trim() || uploadedUrl,
        backgroundImageUrls: nextGallery,
      });
      toast.success(tx(isAr, 'تم رفع الخلفية', 'Background uploaded'));
    } catch (error) {
      toast.error(
        (error as Error)?.message || tx(isAr, 'فشل رفع الصورة', 'Failed to upload image'),
      );
    } finally {
      setUploadingBackground(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="admin-card p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c97b]/30 bg-[#f5c97b]/10 px-3 py-1 text-[11px] font-semibold text-[#f5c97b]">
          <Sparkles className="h-3.5 w-3.5" />
          {tx(isAr, 'محرر المحتوى الذكي', 'Smart Content Editor')}
        </div>
        <h1 className="font-heading mt-3 text-2xl sm:text-3xl font-bold">{tx(isAr, 'إدارة محتوى الصفحات', 'Pages Content Manager')}</h1>
        <p className="text-sm text-[var(--admin-text-mute)] mt-1">
          {tx(
            isAr,
            'تحكم شامل بالعناوين والنصوص والخلفيات لكل صفحة',
            'Full control over titles, text, and backgrounds for each page',
          )}
        </p>
      </div>

      <div className="admin-card p-5 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
          {(Object.keys(pageMeta) as Array<keyof typeof pageMeta>).map((page) => {
            const entry = contentSettings[page];
            const hasValues = Boolean(
              entry.title?.trim()
              || entry.subtitle?.trim()
              || entry.badgeText?.trim()
              || entry.backgroundImageUrl?.trim(),
            );
            return (
              <button
                key={page}
                type="button"
                onClick={() => setActivePageContentTab(page)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all inline-flex items-center justify-center gap-1.5 ${
                  activePageContentTab === page
                    ? 'bg-[#f5c97b]/20 border-[#f5c97b]/40 text-[#f5c97b] shadow-[0_0_0_1px_rgba(245,201,123,0.2)]'
                    : 'border-white/10 hover:bg-white/[0.04] text-[var(--admin-text-mute)] hover:text-[var(--admin-text)]'
                }`}
              >
                {tx(isAr, pageMeta[page].ar, pageMeta[page].en)}
                {hasValues && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="text-xs text-[var(--admin-text-faint)] mb-2">
            {tx(isAr, 'المحتوى المطبق حالياً لكل صفحة', 'Currently applied content per page')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {(Object.keys(pageMeta) as Array<ManagedPageKey>).map((page) => {
              const entry = contentSettings[page];
              const imageCount = Array.from(
                new Set([
                  ...(entry.backgroundImageUrl?.trim() ? [entry.backgroundImageUrl.trim()] : []),
                  ...((entry.backgroundImageUrls ?? []).map((url) => url.trim()).filter(Boolean)),
                ]),
              ).length;
              return (
                <button
                  key={`overview-${page}`}
                  type="button"
                  onClick={() => setActivePageContentTab(page)}
                  className={`text-start rounded-lg border p-2 transition-colors ${
                    activePageContentTab === page
                      ? 'border-[#f5c97b]/40 bg-[#f5c97b]/10'
                      : 'border-white/10 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="text-[11px] text-[var(--admin-text-faint)] mb-0.5">
                    {tx(isAr, pageMeta[page].ar, pageMeta[page].en)}
                  </div>
                  <div className="text-xs font-semibold truncate">
                    {entry.title?.trim() || tx(isAr, 'عنوان افتراضي', 'Default title')}
                  </div>
                  <div className="text-[11px] text-[var(--admin-text-mute)] truncate">
                    {entry.subtitle?.trim() || tx(isAr, 'نص افتراضي', 'Default subtitle')}
                  </div>
                  <div className="mt-1 text-[10px] text-emerald-300">
                    {tx(isAr, `صور الخلفية: ${imageCount}`, `Backgrounds: ${imageCount}`)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-3">
            <div className="rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-[var(--admin-text-faint)]">{tx(isAr, 'الصفحة المحددة', 'Selected page')}</div>
                <div className="font-semibold text-base">{tx(isAr, pageMeta[activePageContentTab].ar, pageMeta[activePageContentTab].en)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="admin-icon-btn !w-auto px-3 h-8 text-xs"
                  onClick={() => router.push(openPageMap[activePageContentTab])}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {tx(isAr, 'فتح الصفحة', 'Open page')}
                </button>
                <button
                  type="button"
                  className="admin-icon-btn !w-auto px-3 h-8 text-xs"
                  onClick={() => {
                    updatePageContent(activePageContentTab, {
                      title: '',
                      subtitle: '',
                      badgeText: '',
                      backgroundImageUrl: '',
                      backgroundImageUrls: [],
                      hideBadge: false,
                      textAlign: 'center',
                      titleSize: 'lg',
                      overlayOpacity: 58,
                      contentMaxWidth: 'xl',
                    });
                    toast.success(tx(isAr, 'تم تفريغ الحقول', 'Fields cleared'));
                  }}
                >
                  {tx(isAr, 'تفريغ', 'Clear')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <Field label={tx(isAr, 'العنوان', 'Title')}>
                <input
                  className="admin-input"
                  value={activeContentEntry.title ?? ''}
                  onChange={(e) => updatePageContent(activePageContentTab, { title: e.target.value })}
                  placeholder={tx(isAr, 'عنوان الصفحة', 'Page title')}
                />
              </Field>
              <Field label={tx(isAr, 'النص الفرعي', 'Subtitle')}>
                <input
                  className="admin-input"
                  value={activeContentEntry.subtitle ?? ''}
                  onChange={(e) => updatePageContent(activePageContentTab, { subtitle: e.target.value })}
                  placeholder={tx(isAr, 'نص وصفي', 'Descriptive text')}
                />
              </Field>
              <Field label={tx(isAr, 'نص الشارة', 'Badge text')}>
                <input
                  className="admin-input"
                  value={activeContentEntry.badgeText ?? ''}
                  onChange={(e) => updatePageContent(activePageContentTab, { badgeText: e.target.value })}
                  placeholder={tx(isAr, 'اختياري', 'Optional')}
                />
              </Field>
              <Field label={tx(isAr, 'الخلفية الأساسية', 'Primary background')}>
                <input
                  className="admin-input"
                  value={activeContentEntry.backgroundImageUrl ?? ''}
                  onChange={(e) => updatePageContent(activePageContentTab, { backgroundImageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </Field>
              <Field label={tx(isAr, 'محاذاة المحتوى', 'Content alignment')}>
                <select
                  className="admin-input"
                  value={activeContentEntry.textAlign ?? 'center'}
                  onChange={(e) => updatePageContent(activePageContentTab, { textAlign: e.target.value as 'start' | 'center' | 'end' })}
                >
                  <option value="start">{tx(isAr, 'بداية', 'Start')}</option>
                  <option value="center">{tx(isAr, 'منتصف', 'Center')}</option>
                  <option value="end">{tx(isAr, 'نهاية', 'End')}</option>
                </select>
              </Field>
              <Field label={tx(isAr, 'حجم العنوان', 'Title size')}>
                <select
                  className="admin-input"
                  value={activeContentEntry.titleSize ?? 'lg'}
                  onChange={(e) => updatePageContent(activePageContentTab, { titleSize: e.target.value as 'md' | 'lg' | 'xl' })}
                >
                  <option value="md">{tx(isAr, 'متوسط', 'Medium')}</option>
                  <option value="lg">{tx(isAr, 'كبير', 'Large')}</option>
                  <option value="xl">{tx(isAr, 'كبير جدًا', 'Extra large')}</option>
                </select>
              </Field>
              <Field label={tx(isAr, 'عرض المحتوى', 'Content width')}>
                <select
                  className="admin-input"
                  value={activeContentEntry.contentMaxWidth ?? 'xl'}
                  onChange={(e) => updatePageContent(activePageContentTab, { contentMaxWidth: e.target.value as 'md' | 'lg' | 'xl' })}
                >
                  <option value="md">{tx(isAr, 'مضغوط', 'Compact')}</option>
                  <option value="lg">{tx(isAr, 'متوازن', 'Balanced')}</option>
                  <option value="xl">{tx(isAr, 'واسع', 'Wide')}</option>
                </select>
              </Field>
              <Field label={tx(isAr, 'شفافية طبقة التعتيم', 'Overlay opacity')}>
                <input
                  type="range"
                  min={0}
                  max={95}
                  step={1}
                  className="w-full accent-[#f5c97b]"
                  value={Math.min(Math.max(Number(activeContentEntry.overlayOpacity ?? 58), 0), 95)}
                  onChange={(e) => updatePageContent(activePageContentTab, { overlayOpacity: Number(e.target.value) })}
                />
                <div className="mt-1 text-[11px] text-[var(--admin-text-faint)]">
                  {Math.min(Math.max(Number(activeContentEntry.overlayOpacity ?? 58), 0), 95)}%
                </div>
              </Field>
              <label className="inline-flex items-center gap-2 mt-1 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(activeContentEntry.hideBadge)}
                  onChange={(e) => updatePageContent(activePageContentTab, { hideBadge: e.target.checked })}
                />
                <span className="text-[var(--admin-text-mute)]">{tx(isAr, 'إخفاء الشارة أعلى العنوان', 'Hide badge above title')}</span>
              </label>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                  {tx(isAr, 'مكتبة الخلفيات لهذه الصفحة', 'Background library for this page')}
                </div>
                <div className="text-[11px] text-[var(--admin-text-faint)]">
                  {tx(isAr, 'يمكنك إضافة أكثر من خلفية', 'You can add multiple backgrounds')}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <input
                    className="admin-input"
                    value={backgroundUrlDraft}
                    onChange={(e) => setBackgroundUrlDraft(e.target.value)}
                    placeholder={tx(isAr, 'ألصق رابط صورة جديدة...', 'Paste a new image URL...')}
                  />
                </div>
                <button
                  type="button"
                  className="admin-icon-btn !w-auto px-3 h-10 text-xs"
                  onClick={handleAddBackgroundUrl}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{tx(isAr, 'إضافة رابط', 'Add URL')}</span>
                </button>
                <label className="admin-icon-btn !w-auto px-3 h-10 text-xs cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {uploadingBackground
                      ? tx(isAr, 'جارٍ الرفع...', 'Uploading...')
                      : tx(isAr, 'رفع صورة', 'Upload image')}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (selected) {
                        void handleUploadBackground(selected);
                      }
                      event.currentTarget.value = '';
                    }}
                    disabled={uploadingBackground}
                  />
                </label>
              </div>

              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                  {galleryImages.map((url) => {
                    const isPrimary = activeContentEntry.backgroundImageUrl?.trim() === url;
                    return (
                      <div key={url} className="relative rounded-lg overflow-hidden border border-white/10">
                        <div
                          className="h-24 bg-cover bg-center"
                          style={{ backgroundImage: `url('${url}')` }}
                        />
                        <div className="p-2 bg-black/35 space-y-1.5">
                          <div className="text-[10px] text-white/75 truncate">{url}</div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className={`admin-icon-btn !h-7 !w-auto px-2 text-[11px] ${isPrimary ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : ''}`}
                              onClick={() => handleSetBackgroundPrimary(url)}
                            >
                              <Link2 className="h-3 w-3" />
                              {tx(isAr, 'أساسي', 'Primary')}
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn !h-7 !w-auto px-2 text-[11px]"
                              onClick={() => handleRemoveBackgroundImage(url)}
                            >
                              <Trash2 className="h-3 w-3" />
                              {tx(isAr, 'حذف', 'Delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-xs text-[var(--admin-text-faint)]">
                  {tx(isAr, 'لا توجد خلفيات مضافة بعد', 'No backgrounds added yet')}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="text-xs text-[var(--admin-text-faint)] mb-1">{tx(isAr, 'معاينة مباشرة', 'Live preview')}</div>
              <div
                className="h-40 rounded-lg overflow-hidden border border-white/10 bg-cover bg-center relative"
                style={{ backgroundImage: `url('${previewImage || placeholderImage}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/10" />
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-[10px] text-white/80">{activeContentEntry.badgeText || tx(isAr, 'شارة الصفحة', 'Page badge')}</div>
                  <div className="text-sm text-white font-semibold truncate">{activeContentEntry.title || tx(isAr, 'عنوان الصفحة', 'Page title')}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[var(--admin-text-mute)] line-clamp-2">
                {activeContentEntry.subtitle || tx(isAr, 'لا يوجد نص فرعي مخصص لهذه الصفحة', 'No custom subtitle for this page')}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <div className="text-xs text-[var(--admin-text-faint)]">{tx(isAr, 'الحالة', 'Status')}</div>
              <div className="flex items-center justify-between text-sm">
                <span>{tx(isAr, 'حقول مخصصة', 'Custom fields')}</span>
                <span className={`admin-pill ${hasCustomData ? 'admin-pill-up' : 'admin-pill-down'}`}>
                  {hasCustomData ? tx(isAr, 'موجود', 'Present') : tx(isAr, 'لا يوجد', 'Empty')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{tx(isAr, 'عدد الأحرف في العنوان', 'Title length')}</span>
                <span className="text-[var(--admin-text-mute)] tabular-nums">{(activeContentEntry.title ?? '').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{tx(isAr, 'جاهزية العرض', 'Display readiness')}</span>
                <span className={`inline-flex items-center gap-1.5 ${hasCustomData ? 'text-emerald-400' : 'text-amber-300'}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {hasCustomData ? tx(isAr, 'جاهز', 'Ready') : tx(isAr, 'افتراضي', 'Default')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="admin-icon-btn !w-auto px-4"
            onClick={() => {
              resetPageContent(activePageContentTab);
              toast.success(tx(isAr, 'تمت إعادة ضبط الصفحة', 'Page reset done'));
            }}
          >
            {tx(isAr, 'إعادة ضبط هذه الصفحة', 'Reset this page')}
          </button>
          <button
            type="button"
            className="admin-btn-premium"
            onClick={() => toast.success(tx(isAr, 'تم حفظ التعديلات تلقائياً', 'Changes are saved automatically'))}
          >
            {tx(isAr, 'تم', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SiteConfigTab({ isAr }: { isAr: boolean }) {
  const { designSettings, contentSettings } = useAppStore();
  const [featureToggles, setFeatureToggles] = useState<Array<{ key: string; name: string; isEnabled: boolean }>>([]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/features')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!mounted || !Array.isArray(data)) return;
        setFeatureToggles(
          data.map((f) => ({
            key: String(f?.key ?? ''),
            name: String(f?.name ?? f?.key ?? ''),
            isEnabled: Boolean(f?.isEnabled),
          })),
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const managedPages: Array<{
    key: 'home' | 'search' | 'agents' | 'contact' | 'favorites' | 'login' | 'register' | 'admin-login';
    ar: string;
    en: string;
  }> = [
    { key: 'home', ar: 'الرئيسية', en: 'Home' },
    { key: 'search', ar: 'البحث', en: 'Search' },
    { key: 'agents', ar: 'الوكلاء', en: 'Agents' },
    { key: 'contact', ar: 'اتصل بنا', en: 'Contact' },
    { key: 'favorites', ar: 'المفضلة', en: 'Favorites' },
    { key: 'login', ar: 'دخول المستخدم', en: 'User Login' },
    { key: 'register', ar: 'تسجيل المستخدم', en: 'User Register' },
    { key: 'admin-login', ar: 'دخول الأدمن', en: 'Admin Login' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          {tx(isAr, 'الحالة الحالية للموقع', 'Current Site Setup')}
        </h1>
        <p className="text-sm text-[var(--admin-text-mute)] mt-1">
          {tx(
            isAr,
            'كل الإعدادات المطبقة الآن على الموقع في شاشة واحدة',
            'All currently applied site settings in one screen',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <h3 className="font-heading font-bold mb-3">{tx(isAr, 'ألوان الهوية', 'Brand Colors')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--admin-text-mute)]">{tx(isAr, 'الأساسي', 'Primary')}</span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: designSettings.primaryColor }} />
                <code>{designSettings.primaryColor}</code>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--admin-text-mute)]">{tx(isAr, 'التمييز', 'Accent')}</span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: designSettings.accentColor }} />
                <code>{designSettings.accentColor}</code>
              </span>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 md:col-span-2">
          <h3 className="font-heading font-bold mb-2">{tx(isAr, 'صورة الهيرو الحالية', 'Current Hero Image')}</h3>
          <p className="text-[12px] text-[var(--admin-text-mute)] mb-3 truncate">{designSettings.heroImageUrl}</p>
          <div className="h-28 rounded-xl overflow-hidden border border-white/10 bg-white/[0.04]">
            {designSettings.heroImageUrl ? (
              <img src={designSettings.heroImageUrl} alt="hero image preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[12px] text-[var(--admin-text-faint)]">
                {tx(isAr, 'لا توجد صورة', 'No image')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-card p-5">
        <h3 className="font-heading font-bold mb-3">{tx(isAr, 'محتوى الصفحات المطبق حالياً', 'Applied Pages Content')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {managedPages.map((page) => {
            const entry = contentSettings[page.key];
            return (
              <div key={page.key} className="rounded-xl border border-white/10 p-3 bg-white/[0.02]">
                <div className="text-xs text-[var(--admin-text-faint)] mb-1">{tx(isAr, page.ar, page.en)}</div>
                <div className="text-sm font-semibold truncate">{entry.title?.trim() || tx(isAr, '— افتراضي —', '— default —')}</div>
                <div className="text-xs text-[var(--admin-text-mute)] truncate mt-1">
                  {entry.subtitle?.trim() || tx(isAr, 'لا يوجد نص فرعي مخصص', 'No custom subtitle')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-card p-5">
        <h3 className="font-heading font-bold mb-3">{tx(isAr, 'حالة المميزات', 'Feature Toggles Status')}</h3>
        {featureToggles.length === 0 ? (
          <p className="text-sm text-[var(--admin-text-mute)]">{tx(isAr, 'لا توجد بيانات حالياً', 'No data right now')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {featureToggles.map((feature) => (
              <div key={feature.key} className="rounded-lg border border-white/10 px-3 py-2 flex items-center justify-between">
                <span className="text-sm">{feature.name}</span>
                <span className={`admin-pill ${feature.isEnabled ? 'admin-pill-up' : 'admin-pill-down'}`}>
                  {feature.isEnabled ? tx(isAr, 'مفعل', 'Enabled') : tx(isAr, 'متوقف', 'Disabled')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Coming-soon helper ──────────────────
export function ComingSoon({ isAr, title }: { isAr: boolean; title: { ar: string; en: string } }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tx(isAr, title.ar, title.en)}</h1>
      </div>
      <div className="admin-card p-12 flex flex-col items-center justify-center text-center">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#f5c97b]/20 to-[#2dd4bf]/20 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-[#f5c97b]" />
        </div>
        <h3 className="font-heading text-lg font-bold mb-1">
          {tx(isAr, 'قريباً', 'Coming soon')}
        </h3>
        <p className="text-sm text-[var(--admin-text-mute)] max-w-md">
          {tx(
            isAr,
            'نعمل على تجهيز هذا القسم بأحدث الإمكانيات. ترقّبوا التحديث القادم.',
            "We're crafting this module with cutting-edge capabilities. Stay tuned.",
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Analytics Tab ───────────────────────
export function AnalyticsTab({ isAr }: { isAr: boolean }) {
  return <AdminAnalyticsTab isAr={isAr} />;
}

// ─── Settings Tab ────────────────────────
export function SettingsTab({ isAr }: { isAr: boolean }) {
  const router = useRouter();
  const {
    locale,
    setLocale,
    designSettings,
    updateDesignSettings,
    resetDesignSettings,
    contentSettings,
    updatePageContent,
    resetPageContent,
    socialSettings,
    updateSocialSettings,
    resetSocialSettings,
  } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [activePageContentTab, setActivePageContentTab] = useState<
    'home' | 'search' | 'agents' | 'contact' | 'favorites' | 'login' | 'register' | 'admin-login'
  >('home');

  const setLang = (next: 'ar' | 'en') => {
    setLocale(next);
    toast.success(isAr ? 'تم تغيير اللغة' : 'Language updated');
  };

  const updatePrimary = (value: string) => {
    updateDesignSettings({ primaryColor: value });
  };

  const updateAccent = (value: string) => {
    updateDesignSettings({ accentColor: value });
  };

  const updateHeroImage = (value: string) => {
    updateDesignSettings({ heroImageUrl: value });
  };

  const pageMeta: Record<
    'home' | 'search' | 'agents' | 'contact' | 'favorites' | 'login' | 'register' | 'admin-login',
    { ar: string; en: string }
  > = {
    home: { ar: 'الرئيسية', en: 'Home' },
    search: { ar: 'البحث', en: 'Search' },
    agents: { ar: 'الوكلاء', en: 'Agents' },
    contact: { ar: 'اتصل بنا', en: 'Contact' },
    favorites: { ar: 'المفضلة', en: 'Favorites' },
    login: { ar: 'دخول المستخدم', en: 'User Login' },
    register: { ar: 'تسجيل المستخدم', en: 'User Register' },
    'admin-login': { ar: 'دخول الأدمن', en: 'Admin Login' },
  };

  const activeContentEntry = contentSettings[activePageContentTab];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tx(isAr, 'إعدادات النظام', 'System Settings')}</h1>
        <p className="text-sm text-[var(--admin-text-mute)] mt-1">
          {tx(isAr, 'اختصارات تعمل فوراً على هذه الجلسة', 'Shortcuts apply immediately to this session')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="admin-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Languages className="h-4 w-4 text-[#f5c97b]" />
            <h3 className="font-heading font-bold">{tx(isAr, 'اللغة', 'Language')}</h3>
          </div>
          <p className="text-[12px] text-[var(--admin-text-mute)] mb-4">{tx(isAr, 'لغة واجهة الموقع', 'Site UI language')}</p>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                locale === 'ar'
                  ? 'bg-[#f5c97b]/20 border-[#f5c97b]/40 text-[#f5c97b]'
                  : 'border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                locale === 'en'
                  ? 'bg-[#f5c97b]/20 border-[#f5c97b]/40 text-[#f5c97b]'
                  : 'border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center gap-2 mb-3">
            {theme === 'dark' ? <Moon className="h-4 w-4 text-[#a78bfa]" /> : <Sun className="h-4 w-4 text-[#fbbf24]" />}
            <h3 className="font-heading font-bold">{tx(isAr, 'المظهر', 'Appearance')}</h3>
          </div>
          <p className="text-[12px] text-[var(--admin-text-mute)] mb-4">{tx(isAr, 'الوضع الفاتح أو الداكن', 'Light or dark mode')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                toast.success(tx(isAr, 'تم تفعيل الوضع النهاري', 'Light mode enabled'));
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${theme === 'light' ? 'bg-[#f5c97b]/20 border-[#f5c97b]/40 text-[#f5c97b]' : 'border-white/10 hover:bg-white/[0.06]'}`}
            >
              {tx(isAr, 'نهاري', 'Light')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                toast.success(tx(isAr, 'تم تفعيل الوضع الليلي', 'Dark mode enabled'));
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${theme === 'dark' ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]' : 'border-white/10 hover:bg-white/[0.06]'}`}
            >
              {tx(isAr, 'ليلي', 'Dark')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme('system');
                toast.success(tx(isAr, 'تم تفعيل وضع النظام', 'System mode enabled'));
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${theme === 'system' ? 'bg-[#2dd4bf]/20 border-[#2dd4bf]/40 text-[#2dd4bf]' : 'border-white/10 hover:bg-white/[0.06]'}`}
            >
              {tx(isAr, 'تلقائي', 'System')}
            </button>
          </div>
        </div>

        <div className="admin-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="h-4 w-4 text-[#2dd4bf]" />
            <h3 className="font-heading font-bold">{tx(isAr, 'الموقع العام', 'Public site')}</h3>
          </div>
          <p className="text-[12px] text-[var(--admin-text-mute)] mb-4">
            {tx(isAr, 'العودة إلى الصفحة الرئيسية للزوار', 'Return to the visitor home page')}
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="admin-btn-premium"
          >
            {tx(isAr, 'فتح الموقع', 'Open site')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="admin-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[#f5c97b]" />
            <h3 className="font-heading font-bold">{tx(isAr, 'ألوان الهوية', 'Brand Colors')}</h3>
          </div>
          <p className="text-[12px] text-[var(--admin-text-mute)] mb-4">
            {tx(isAr, 'تنطبق مباشرة على الموقع العام', 'Applied instantly on the public site')}
          </p>
          <div className="space-y-3">
            <Field label={tx(isAr, 'اللون الأساسي', 'Primary color')}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={designSettings.primaryColor}
                  onChange={(e) => updatePrimary(e.target.value)}
                  className="h-10 w-12 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  className="admin-input"
                  value={designSettings.primaryColor}
                  onChange={(e) => updatePrimary(e.target.value)}
                />
              </div>
            </Field>
            <Field label={tx(isAr, 'لون التمييز', 'Accent color')}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={designSettings.accentColor}
                  onChange={(e) => updateAccent(e.target.value)}
                  className="h-10 w-12 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  className="admin-input"
                  value={designSettings.accentColor}
                  onChange={(e) => updateAccent(e.target.value)}
                />
              </div>
            </Field>
          </div>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-[#2dd4bf]" />
            <h3 className="font-heading font-bold">{tx(isAr, 'خلفية الهيرو', 'Hero Background')}</h3>
          </div>
          <p className="text-[12px] text-[var(--admin-text-mute)] mb-4">
            {tx(isAr, 'تظهر كأول صورة في القسم الرئيسي', 'Appears as the first image in home hero')}
          </p>
          <Field label={tx(isAr, 'رابط الصورة', 'Image URL')}>
            <input
              className="admin-input"
              value={designSettings.heroImageUrl}
              onChange={(e) => updateHeroImage(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <div className="mt-3 h-28 rounded-xl overflow-hidden border border-white/10 bg-white/[0.04]">
            {designSettings.heroImageUrl ? (
              <img src={designSettings.heroImageUrl} alt="hero preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[12px] text-[var(--admin-text-faint)]">
                {tx(isAr, 'لا توجد صورة', 'No image')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-bold">{tx(isAr, 'استعادة التصميم الافتراضي', 'Restore default design')}</h3>
            <p className="text-[12px] text-[var(--admin-text-mute)]">
              {tx(isAr, 'يعيد ألوان وخلفية الموقع كما كانت', 'Resets site colors and hero background')}
            </p>
          </div>
          <button
            type="button"
            className="admin-icon-btn !w-auto px-4"
            onClick={() => {
              resetDesignSettings();
              toast.success(tx(isAr, 'تمت الاستعادة', 'Defaults restored'));
            }}
          >
            {tx(isAr, 'إعادة الضبط', 'Reset')}
          </button>
        </div>
      </div>

      <div className="admin-card p-5 space-y-4">
        <div>
          <h3 className="font-heading font-bold">{tx(isAr, 'إدارة محتوى الصفحات', 'Pages Content Manager')}</h3>
          <p className="text-[12px] text-[var(--admin-text-mute)]">
            {tx(
              isAr,
              'تبويبات للتحكم بالعناوين والنصوص والخلفيات لكل صفحة',
              'Tabs to control titles, text, and backgrounds per page',
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(pageMeta) as Array<keyof typeof pageMeta>).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setActivePageContentTab(page)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activePageContentTab === page
                  ? 'bg-[#f5c97b]/20 border-[#f5c97b]/40 text-[#f5c97b]'
                  : 'border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              {tx(isAr, pageMeta[page].ar, pageMeta[page].en)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={tx(isAr, 'العنوان', 'Title')}>
            <input
              className="admin-input"
              value={activeContentEntry.title ?? ''}
              onChange={(e) => updatePageContent(activePageContentTab, { title: e.target.value })}
              placeholder={tx(isAr, 'عنوان الصفحة', 'Page title')}
            />
          </Field>
          <Field label={tx(isAr, 'النص الفرعي', 'Subtitle')}>
            <input
              className="admin-input"
              value={activeContentEntry.subtitle ?? ''}
              onChange={(e) => updatePageContent(activePageContentTab, { subtitle: e.target.value })}
              placeholder={tx(isAr, 'نص وصفي', 'Descriptive text')}
            />
          </Field>
          <Field label={tx(isAr, 'نص الشارة', 'Badge text')}>
            <input
              className="admin-input"
              value={activeContentEntry.badgeText ?? ''}
              onChange={(e) => updatePageContent(activePageContentTab, { badgeText: e.target.value })}
              placeholder={tx(isAr, 'اختياري', 'Optional')}
            />
          </Field>
          <Field label={tx(isAr, 'رابط الخلفية', 'Background URL')}>
            <input
              className="admin-input"
              value={activeContentEntry.backgroundImageUrl ?? ''}
              onChange={(e) => updatePageContent(activePageContentTab, { backgroundImageUrl: e.target.value })}
              placeholder="https://..."
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="admin-icon-btn !w-auto px-4"
            onClick={() => {
              resetPageContent(activePageContentTab);
              toast.success(tx(isAr, 'تمت إعادة ضبط الصفحة', 'Page reset done'));
            }}
          >
            {tx(isAr, 'إعادة ضبط هذه الصفحة', 'Reset this page')}
          </button>
        </div>
      </div>

      <div className="admin-card p-5 space-y-4">
        <div>
          <h3 className="font-heading font-bold">{tx(isAr, 'روابط التواصل', 'Social Links')}</h3>
          <p className="text-[12px] text-[var(--admin-text-mute)]">
            {tx(isAr, 'تظهر في الفوتر مباشرة', 'Displayed directly in footer')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Website">
            <input className="admin-input" value={socialSettings.website} onChange={(e) => updateSocialSettings({ website: e.target.value })} placeholder="https://example.com" />
          </Field>
          <Field label="Email">
            <input className="admin-input" value={socialSettings.email} onChange={(e) => updateSocialSettings({ email: e.target.value })} placeholder="info@example.com" />
          </Field>
          <Field label="Phone">
            <input className="admin-input" value={socialSettings.phone} onChange={(e) => updateSocialSettings({ phone: e.target.value })} placeholder="+966..." />
          </Field>
          <Field label="WhatsApp">
            <input className="admin-input" value={socialSettings.whatsapp} onChange={(e) => updateSocialSettings({ whatsapp: e.target.value })} placeholder="+966..." />
          </Field>
          <Field label="Telegram">
            <input className="admin-input" value={socialSettings.telegram} onChange={(e) => updateSocialSettings({ telegram: e.target.value })} placeholder="https://t.me/username" />
          </Field>
          <Field label="Facebook">
            <input className="admin-input" value={socialSettings.facebook} onChange={(e) => updateSocialSettings({ facebook: e.target.value })} placeholder="https://facebook.com/..." />
          </Field>
          <Field label="Instagram">
            <input className="admin-input" value={socialSettings.instagram} onChange={(e) => updateSocialSettings({ instagram: e.target.value })} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="X (Twitter)">
            <input className="admin-input" value={socialSettings.x} onChange={(e) => updateSocialSettings({ x: e.target.value })} placeholder="https://x.com/..." />
          </Field>
          <Field label="YouTube">
            <input className="admin-input" value={socialSettings.youtube} onChange={(e) => updateSocialSettings({ youtube: e.target.value })} placeholder="https://youtube.com/..." />
          </Field>
          <Field label="LinkedIn">
            <input className="admin-input" value={socialSettings.linkedin} onChange={(e) => updateSocialSettings({ linkedin: e.target.value })} placeholder="https://linkedin.com/..." />
          </Field>
          <Field label="TikTok">
            <input className="admin-input" value={socialSettings.tiktok} onChange={(e) => updateSocialSettings({ tiktok: e.target.value })} placeholder="https://tiktok.com/..." />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="admin-icon-btn !w-auto px-4"
            onClick={() => {
              resetSocialSettings();
              toast.success(tx(isAr, 'تمت إعادة ضبط روابط التواصل', 'Social links reset'));
            }}
          >
            {tx(isAr, 'إعادة ضبط الروابط', 'Reset links')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { ar: 'الإعدادات العامة', en: 'General', desc: { ar: 'اسم الموقع، الشعار، الوصف', en: 'Site name, logo, description' } },
          { ar: 'الأمان والخصوصية', en: 'Security & Privacy', desc: { ar: 'كلمات المرور، 2FA، الجلسات', en: 'Passwords, 2FA, sessions' } },
          { ar: 'الإشعارات', en: 'Notifications', desc: { ar: 'البريد، الرسائل، التنبيهات', en: 'Email, SMS, alerts' } },
          { ar: 'التكاملات', en: 'Integrations', desc: { ar: 'API، خرائط، مدفوعات', en: 'API, maps, payments' } },
        ].map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toast.message(tx(isAr, 'قريباً في تحديث لاحق', 'Coming in a future update'))}
            className="admin-card p-5 text-start group cursor-pointer"
          >
            <div className="font-bold mb-1 group-hover:text-[#f5c97b] transition-colors">
              {tx(isAr, s.ar, s.en)}
            </div>
            <p className="text-[12px] text-[var(--admin-text-mute)]">{tx(isAr, s.desc.ar, s.desc.en)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
