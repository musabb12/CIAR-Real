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
  Settings,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { AdminSection, type ColumnDef } from './admin-section';
import { AdminAnalyticsTab } from './admin-analytics-tab';
import { AdminFeaturesTab } from './admin-features-tab';
import { ImageUrlInput } from './image-url-input';
import { invalidate } from '@/lib/admin-events';
import { AdminRowMenu, type RowAction } from '@/components/admin/admin-row-menu';
import type { InquiryAutoReply } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CountrySettingsPanel } from '@/components/admin/country-settings-panel';
import { AgentSettingsPanel } from '@/components/admin/agent-settings-panel';
import { CompanySettingsPanel } from '@/components/admin/company-settings-panel';
import { AdminEntityGrid } from '@/components/admin/admin-entity-grid';
import { CountryFlagBadge, FlagPicker } from '@/components/admin/flag-picker';
import { normalizeFlagStorage } from '@/lib/country-flags';
import {
  expandInquiryReplyTemplate,
  buildInquiryMailtoLink,
} from '@/lib/inquiry-replies';
import {
  inquiryStatusLabel,
  userRoleLabel,
} from '@/lib/admin-labels';

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
  if (/region still has properties/i.test(m)) {
    return tx(isAr, 'المنطقة مرتبطة بعقارات.', 'Region has linked properties.');
  }
  if (/city still has properties/i.test(m)) {
    return tx(isAr, 'المدينة مرتبطة بعقارات.', 'City has linked properties.');
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
    const o = raw as { backendConfigured?: boolean; backendMessage?: string; dataSource?: string };
    if (o.backendConfigured === false && o.dataSource !== 'demo') {
      setPropertiesListMode('stub');
      setPropertiesListStubReason(typeof o.backendMessage === 'string' ? o.backendMessage : null);
    } else {
      setPropertiesListMode('live');
      setPropertiesListStubReason(
        o.dataSource === 'demo' && typeof o.backendMessage === 'string' ? o.backendMessage : null,
      );
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

  const openPropertyEdit = useCallback(
    async (r: PropertiesTabRow) => {
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
    [isAr]
  );

  const rowActions = (r: PropertiesTabRow): RowAction[] => [
    {
      id: 'edit',
      label: tx(isAr, 'تعديل العقار', 'Edit property'),
      icon: Sparkles,
      onClick: () => void openPropertyEdit(r),
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
      subtitle={{ ar: 'أضف أو عدّل أو احذف عقاراً', en: 'Add, edit, or remove a listing' }}
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
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              className="admin-card p-4 cursor-pointer transition-all hover:border-amber-400/35 hover:shadow-lg hover:shadow-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              onClick={() => void openPropertyEdit(r)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void openPropertyEdit(r);
                }
              }}
            >
              <div className="relative h-36 rounded-xl overflow-hidden border border-white/10 bg-white/[0.04] mb-3">
                <img
                  src={r.images?.find((img) => img.isCover)?.url || r.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop'}
                  alt={r.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                <div
                  className="absolute top-2 end-2 z-10 [&_button]:!bg-black/55 [&_button]:!border-white/15 [&_button]:hover:!bg-black/70"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                      className="admin-input min-h-[64px] max-h-32 resize-y flex-1 text-xs leading-relaxed"
                      rows={2}
                      value={imageUrlDraft}
                      onChange={(e) => setImageUrlDraft(e.target.value)}
                      placeholder={tx(isAr, 'https://…\nhttps://…', 'https://…\nhttps://…')}
                    />
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button type="button" className="admin-icon-btn !w-auto px-3 gap-1.5 text-xs" onClick={addImagesFromUrlDraft}>
                        <Link2 className="h-3.5 w-3.5" />
                        {tx(isAr, 'إضافة الروابط', 'Add URLs')}
                      </button>
                      <label className="admin-icon-btn !w-auto px-3 gap-1.5 text-xs cursor-pointer">
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
  const [settingsCountryId, setSettingsCountryId] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [checkingFirestore, setCheckingFirestore] = useState(false);

  const recheckFirestore = async () => {
    setCheckingFirestore(true);
    try {
      const res = await fetch('/api/firestore-status');
      const data = await res.json();
      if (data.ok && !data.quotaExceeded) {
        setDemoNotice(null);
        toast.success(
          tx(isAr, 'Firestore متصل — جارٍ تحديث القائمة', 'Firestore is connected — refreshing list'),
        );
        bump();
        return;
      }
      if (data.quotaExceeded) {
        setDemoNotice(
          tx(
            isAr,
            'ما زالت حصة Firebase منتهية. انتظر قليلاً أو فعّل خطة Blaze في Firebase Console.',
            'Firebase quota is still exceeded. Wait a bit or enable the Blaze plan in Firebase Console.',
          ),
        );
        toast.error(tx(isAr, 'الحصة ما زالت منتهية', 'Quota still exceeded'));
        return;
      }
      toast.error(tx(isAr, 'Firestore غير متاح', 'Firestore unavailable'), {
        description: typeof data.error === 'string' ? data.error : '',
      });
    } catch {
      toast.error(tx(isAr, 'فشل التحقق', 'Check failed'));
    } finally {
      setCheckingFirestore(false);
    }
  };
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    flag: '',
    currency: '',
    currencySymbol: '',
  });
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
  const parseItems = useCallback((d: unknown): Row[] => {
    if (Array.isArray(d)) {
      return d as Row[];
    }
    const data = d as { countries?: Row[] };
    return data.countries ?? [];
  }, []);

  const onLocationsApiResponse = useCallback(
    (d: unknown) => {
      if (Array.isArray(d)) {
        setDemoNotice(null);
        return;
      }
      const data = d as {
        dataSource?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (data.dataSource === 'demo') {
        setDemoNotice(isAr ? data.messageAr ?? null : data.messageEn ?? null);
      } else {
        setDemoNotice(null);
      }
    },
    [isAr],
  );

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
        body: JSON.stringify({
          ...form,
          code: form.code.trim().toUpperCase(),
          flag: normalizeFlagStorage(form.flag, form.code),
        }),
      });
      setOpen(false);
      setForm({ name: '', code: '', flag: '', currency: '', currencySymbol: '' });
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

  if (settingsCountryId) {
    return (
      <CountrySettingsPanel
        countryId={settingsCountryId}
        isAr={isAr}
        onBack={() => setSettingsCountryId(null)}
        onUpdated={bump}
      />
    );
  }

  return (
    <>
      {demoNotice && (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90 flex flex-wrap items-center justify-between gap-3">
          <p className="flex-1 min-w-[200px]">{demoNotice}</p>
          <button
            type="button"
            className="admin-btn-premium shrink-0 !py-2 !px-4 text-xs"
            disabled={checkingFirestore}
            onClick={() => void recheckFirestore()}
          >
            {checkingFirestore
              ? tx(isAr, 'جارٍ التحقق…', 'Checking…')
              : tx(isAr, 'تحقق من Firestore', 'Check Firestore')}
          </button>
        </div>
      )}
      <AdminEntityGrid<Row>
        isAr={isAr}
        refreshKey={refreshKey}
        subtitle={{
          ar: 'اضغط على أي دولة لفتح إعداداتها: المناطق، المدن، العلم',
          en: 'Click any country for regions, cities, and flag settings',
        }}
        endpoint="/api/locations?includeInactive=true"
        parseItems={parseItems}
        onApiResponse={onLocationsApiResponse}
        searchKeys={['name', 'code']}
        onAdd={() => setOpen(true)}
        addLabel={{ ar: 'إضافة دولة', en: 'Add country' }}
        emptyAr="لا توجد دول"
        emptyEn="No countries"
        onItemClick={(r) => setSettingsCountryId(r.id)}
        renderCard={(r) => (
          <div className="p-4 w-full">
            <div className="flex items-center gap-3 mb-3">
              <CountryFlagBadge flag={r.flag} code={r.code} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[var(--admin-text)] truncate">{r.name}</div>
                <div className="text-[11px] font-mono text-[var(--admin-text-faint)]">{r.code}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={`admin-pill ${r.isActive ? 'admin-pill-up' : 'admin-pill-down'}`}>
                {r.isActive ? tx(isAr, 'نشطة', 'Active') : tx(isAr, 'معطلة', 'Disabled')}
              </span>
              {r.isFeatured && (
                <span className="admin-pill admin-pill-gold">{tx(isAr, 'مميزة', 'Featured')}</span>
              )}
              <span className="text-[var(--admin-text-mute)]">
                {r._count?.properties ?? 0} {tx(isAr, 'عقار', 'properties')}
              </span>
            </div>
            {r.currency && (
              <p className="mt-2 text-[11px] text-[var(--admin-text-faint)]">
                {tx(isAr, 'العملة', 'Currency')}: {r.currency}
              </p>
            )}
            <p className="mt-3 text-[10px] text-amber-200/70">{tx(isAr, 'اضغط للإعدادات ←', 'Tap for settings →')}</p>
          </div>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tx(isAr, 'إضافة دولة جديدة', 'Add country')}</DialogTitle>
            <DialogDescription>
              {tx(
                isAr,
                'اختر العلم من قائمة صور أعلام الدول، ثم أضف المناطق والمدن من صفحة الإعدادات',
                'Pick a flag image from the world list, then add regions and cities in settings',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={tx(isAr, 'الاسم', 'Name')}>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'الرمز (ISO)', 'Code (ISO)')}>
              <input
                className="admin-input font-mono"
                value={form.code}
                maxLength={2}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase().slice(0, 2);
                  setForm((f) => ({ ...f, code, flag: f.flag || code }));
                }}
              />
            </Field>
            <Field label={tx(isAr, 'العملة', 'Currency')}>
              <input className="admin-input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="SAR" />
            </Field>
            <Field label={tx(isAr, 'رمز العملة', 'Currency symbol')}>
              <input
                className="admin-input"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                placeholder="ر.س"
              />
            </Field>
            <Field label={tx(isAr, 'علم الدولة', 'Country flag')}>
              <FlagPicker
                value={form.flag}
                countryCode={form.code}
                isAr={isAr}
                onChange={(code) => setForm({ ...form, flag: code })}
              />
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
  const parseItems = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);

  const roleColor = (role: string) => {
    if (role === 'ADMIN') return '#f5c97b';
    if (role === 'AGENT') return '#a78bfa';
    if (role === 'COMPANY') return '#fb923c';
    return '#2dd4bf';
  };

  return (
    <AdminEntityGrid<Row>
      isAr={isAr}
      refreshKey={refreshKey}
      subtitle={{
        ar: 'كل الحسابات المسجّلة — استخدم الأزرار أسفل كل بطاقة للإدارة',
        en: 'All registered accounts — use the buttons under each card to manage',
      }}
      endpoint="/api/users"
      parseItems={parseItems}
      searchKeys={['name', 'email', 'phone']}
      searchPlaceholder={{ ar: 'بحث بالاسم أو البريد…', en: 'Search by name or email…' }}
      emptyAr="لا يوجد مستخدمون"
      emptyEn="No users"
      cardClickable={false}
      onItemClick={() => {}}
      renderCard={(r) => (
        <div className="p-4 w-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#f5c97b]/30 to-[#2dd4bf]/30 flex items-center justify-center text-sm font-bold text-[#f5c97b] shrink-0">
              {(r.name ?? r.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{r.name ?? tx(isAr, 'بدون اسم', 'No name')}</div>
              <div className="text-[11px] text-[var(--admin-text-faint)] truncate">{r.email}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="admin-tag" style={{ background: `${roleColor(r.role)}1f`, color: roleColor(r.role) }}>
              {userRoleLabel(isAr, r.role)}
            </span>
            {r.isActive ? (
              <span className="admin-pill admin-pill-up">{tx(isAr, 'نشط', 'Active')}</span>
            ) : (
              <span className="admin-pill admin-pill-down">{tx(isAr, 'موقوف', 'Disabled')}</span>
            )}
          </div>
          {r.phone && (
            <div className="text-xs text-[var(--admin-text-mute)] flex items-center gap-1 mb-1">
              <Phone className="h-3 w-3" />
              {r.phone}
            </div>
          )}
          <p className="text-[11px] text-[var(--admin-text-faint)]">
            {tx(isAr, 'انضم', 'Joined')}: {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}
          </p>
        </div>
      )}
      renderCardActions={(r) => (
        <>
          <button
            type="button"
            className="admin-icon-btn !w-auto px-3 text-xs"
            onClick={async () => {
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
            }}
          >
            {r.isActive ? tx(isAr, 'إيقاف', 'Disable') : tx(isAr, 'تفعيل', 'Enable')}
          </button>
          <button
            type="button"
            className="admin-icon-btn !w-auto px-3 text-xs"
            onClick={async () => {
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
            }}
          >
            {r.role === 'ADMIN'
              ? tx(isAr, 'إزالة الإدارة', 'Remove admin')
              : tx(isAr, 'تعيين أدمن', 'Make admin')}
          </button>
          <button
            type="button"
            className="admin-icon-btn !w-auto px-3 text-xs text-rose-300 border-rose-400/30"
            onClick={async () => {
              if (!window.confirm(tx(isAr, 'حذف هذا المستخدم نهائياً؟', 'Permanently delete this user?'))) return;
              try {
                await adminFetch(`/api/users/${r.id}`, { method: 'DELETE' });
                invalidate('users');
                toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
                bump();
              } catch (e) {
                toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
              }
            }}
          >
            {tx(isAr, 'حذف', 'Delete')}
          </button>
        </>
      )}
    />
  );
}

// ─── Agents Tab ──────────────────────────────
export function AgentsTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    title: '',
    license: '',
    companyId: '',
  });
  const bump = () => setRefreshKey((k) => k + 1);
  type Row = { id: string; rating: number; verified: boolean; totalListings: number; user?: { name?: string; email?: string }; company?: { name?: string }; _count?: { properties: number } };
  const parseItems = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);

  useEffect(() => {
    if (!addOpen) return;
    fetch('/api/companies')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setCompanies(list.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      })
      .catch(() => setCompanies([]));
  }, [addOpen]);

  const submitAgent = async () => {
    if (!form.name.trim()) {
      toast.error(tx(isAr, 'الاسم مطلوب', 'Name is required'));
      return;
    }
    if (!form.email.includes('@')) {
      toast.error(tx(isAr, 'أدخل بريداً إلكترونياً صحيحاً', 'Enter a valid email'));
      return;
    }
    if (form.password.length < 6) {
      toast.error(tx(isAr, 'كلمة المرور 6 أحرف على الأقل', 'Password must be at least 6 characters'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          title: form.title.trim() || undefined,
          license: form.license.trim() || undefined,
          companyId: form.companyId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : tx(isAr, 'فشل الإنشاء', 'Create failed'));
      toast.success(tx(isAr, 'تم إنشاء الوكيل', 'Agent created'));
      setAddOpen(false);
      setForm({ name: '', email: '', password: '', phone: '', title: '', license: '', companyId: '' });
      invalidate('agents');
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الإنشاء', 'Create failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  if (settingsAgentId) {
    return (
      <AgentSettingsPanel
        agentId={settingsAgentId}
        isAr={isAr}
        onBack={() => setSettingsAgentId(null)}
        onUpdated={bump}
      />
    );
  }

  return (
    <>
      <AdminEntityGrid<Row>
        isAr={isAr}
        refreshKey={refreshKey}
        subtitle={{
          ar: 'اضغط على بطاقة الوكيل لفتح الإعدادات، أو أضف وكيلاً جديداً',
          en: 'Click an agent card for settings, or add a new agent',
        }}
        endpoint="/api/agents"
        parseItems={parseItems}
        searchKeys={['name', 'email']}
        searchPlaceholder={{ ar: 'بحث بالاسم…', en: 'Search by name…' }}
        emptyAr="لا يوجد وكلاء — أضف أول وكيل"
        emptyEn="No agents — add your first agent"
        onAdd={() => setAddOpen(true)}
        addLabel={{ ar: 'إضافة وكيل', en: 'Add agent' }}
        onItemClick={(r) => setSettingsAgentId(r.id)}
        renderCard={(r) => (
          <div className="p-4 w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#a78bfa]/30 to-[#2dd4bf]/30 flex items-center justify-center text-sm font-bold text-[#a78bfa] shrink-0">
                {(r.user?.name ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold flex items-center gap-1.5 truncate">
                  {r.user?.name ?? '—'}
                  {r.verified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-label={tx(isAr, 'موثّق', 'Verified')} />
                )}
                </div>
                <div className="text-[11px] text-[var(--admin-text-faint)] truncate">{r.user?.email}</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--admin-text-mute)]">
              <span>{r.company?.name ?? tx(isAr, 'مستقل', 'Independent')}</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-[#f5c97b] fill-current" />
                {r.rating?.toFixed(1) ?? '0.0'}
              </span>
              <span className="font-bold">
                {r._count?.properties ?? r.totalListings ?? 0} {tx(isAr, 'عقار', 'listings')}
              </span>
            </div>
            <p className="mt-3 text-[10px] text-amber-200/70">{tx(isAr, 'اضغط للإعدادات', 'Tap for settings')}</p>
          </div>
        )}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tx(isAr, 'إضافة وكيل عقاري', 'Add real estate agent')}</DialogTitle>
            <DialogDescription>
              {tx(isAr, 'يُنشأ حساب دخول للوكيل تلقائياً', 'A login account will be created for the agent')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={tx(isAr, 'الاسم الكامل', 'Full name')}>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'البريد الإلكتروني', 'Email')}>
              <input type="email" className="admin-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'كلمة المرور', 'Password')}>
              <input type="password" className="admin-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'الهاتف (اختياري)', 'Phone (optional)')}>
              <input className="admin-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'المسمى الوظيفي (اختياري)', 'Job title (optional)')}>
              <input className="admin-input" placeholder={tx(isAr, 'وكيل عقاري', 'Real estate agent')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'رقم الترخيص (اختياري)', 'License no. (optional)')}>
              <input className="admin-input" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'الشركة (اختياري)', 'Company (optional)')}>
              <select className="admin-input" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
                <option value="">{tx(isAr, '— مستقل —', '— Independent —')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <DialogFooter>
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setAddOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button type="button" className="admin-btn-premium" disabled={submitting} onClick={submitAgent}>
              {submitting ? tx(isAr, 'جارٍ الإنشاء…', 'Creating…') : tx(isAr, 'إنشاء الوكيل', 'Create agent')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Inquiries Tab ───────────────────────────
const INQUIRY_TEMPLATE_HINT = {
  ar: 'يمكنك استخدام: {name} {email} {phone} {property} {message}',
  en: 'Placeholders: {name} {email} {phone} {property} {message}',
};

const DEFAULT_AUTO_REPLY_BODY = {
  ar: 'مرحباً {name}،\n\nشكراً لتواصلك بخصوص «{property}».\nاستلمنا رسالتك وسيتواصل معك أحد مستشارينا قريباً.\n\nمع تحيات فريق CIAR',
  en: 'Hello {name},\n\nThank you for your interest in "{property}".\nWe received your message and an advisor will contact you soon.\n\nBest regards,\nCIAR Team',
};

export function InquiriesTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  const [templates, setTemplates] = useState<InquiryAutoReply[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    body: '',
    isActive: true,
    sendOnNewInquiry: false,
    order: 0,
  });

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    message: string;
    property?: { title: string };
    adminReply?: string | null;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  type Row = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    message: string;
    status: string;
    createdAt: string;
    adminReply?: string | null;
    repliedAt?: string | null;
    replySource?: 'manual' | 'auto' | null;
    property?: { title: string };
  };

  const parseItems = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);

  const loadTemplates = useCallback(() => {
    setTemplatesLoading(true);
    fetch('/api/inquiry-auto-replies')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Failed');
        setTemplates(Array.isArray(d) ? d : []);
      })
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates, refreshKey]);

  const inquiryContext = (r: Pick<Row, 'name' | 'email' | 'phone' | 'message' | 'property'>) => ({
    name: r.name,
    email: r.email,
    phone: r.phone,
    property: r.property?.title ?? null,
    message: r.message,
  });

  const openReply = (r: Row) => {
    setReplyTarget(r);
    setReplyText(r.adminReply ?? '');
    setReplyOpen(true);
  };

  const applyTemplateToReply = (template: InquiryAutoReply) => {
    if (!replyTarget) return;
    setReplyText(expandInquiryReplyTemplate(template.body, inquiryContext(replyTarget)));
  };

  const submitReply = async () => {
    if (!replyTarget) return;
    if (!replyText.trim()) {
      toast.error(tx(isAr, 'اكتب نص الرد', 'Write your reply'));
      return;
    }
    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/inquiries/${replyTarget.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : tx(isAr, 'فشل الإرسال', 'Failed'));
      toast.success(tx(isAr, 'تم حفظ الرد', 'Reply saved'));
      setReplyOpen(false);
      setReplyTarget(null);
      invalidate('inquiries');
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل حفظ الرد', 'Could not save reply'), {
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setReplySubmitting(false);
    }
  };

  const openNewTemplate = () => {
    setEditingTemplateId(null);
    setTemplateForm({
      title: '',
      body: isAr ? DEFAULT_AUTO_REPLY_BODY.ar : DEFAULT_AUTO_REPLY_BODY.en,
      isActive: true,
      sendOnNewInquiry: false,
      order: templates.length,
    });
    setTemplateOpen(true);
  };

  const openEditTemplate = (t: InquiryAutoReply) => {
    setEditingTemplateId(t.id);
    setTemplateForm({
      title: t.title,
      body: t.body,
      isActive: t.isActive,
      sendOnNewInquiry: t.sendOnNewInquiry,
      order: t.order,
    });
    setTemplateOpen(true);
  };

  const submitTemplate = async () => {
    if (!templateForm.title.trim() || !templateForm.body.trim()) {
      toast.error(tx(isAr, 'العنوان ونص الرد مطلوبان', 'Title and reply text are required'));
      return;
    }
    setTemplateSubmitting(true);
    try {
      const payload = {
        title: templateForm.title.trim(),
        body: templateForm.body.trim(),
        isActive: templateForm.isActive,
        sendOnNewInquiry: templateForm.sendOnNewInquiry,
        order: templateForm.order,
      };
      const res = editingTemplateId
        ? await fetch(`/api/inquiry-auto-replies/${editingTemplateId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/inquiry-auto-replies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed');
      toast.success(tx(isAr, editingTemplateId ? 'تم التحديث' : 'تمت الإضافة', editingTemplateId ? 'Updated' : 'Added'));
      setTemplateOpen(false);
      loadTemplates();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الحفظ', 'Save failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!window.confirm(tx(isAr, 'حذف هذا الرد التلقائي؟', 'Delete this auto-reply?'))) return;
    try {
      await adminFetch(`/api/inquiry-auto-replies/${id}`, { method: 'DELETE' });
      toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
      loadTemplates();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
    }
  };

  const setStatus = async (r: Row, status: string) => {
    try {
      await adminFetch(`/api/inquiries/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      invalidate('inquiries');
      toast.success(tx(isAr, 'تم تحديث الحالة', 'Status updated'));
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل التحديث', 'Update failed'), { description: e instanceof Error ? e.message : '' });
    }
  };

  const statusPill = (status: string) => {
    const c =
      status === 'NEW' ? 'admin-pill-gold' : status === 'READ' || status === 'REPLIED' ? 'admin-pill-up' : 'admin-pill-down';
    return <span className={`admin-pill ${c}`}>{inquiryStatusLabel(isAr, status)}</span>;
  };

  const activeAutoReply = templates.find((t) => t.isActive && t.sendOnNewInquiry);

  return (
    <>
      <div className="admin-card p-5 mb-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-[#f5c97b] mt-1 shrink-0" />
            <div>
              <h3 className="font-heading font-bold">{tx(isAr, 'الردود التلقائية', 'Automatic replies')}</h3>
              <p className="text-[12px] text-[var(--admin-text-mute)] mt-1 max-w-2xl">
                {tx(
                  isAr,
                  'أنشئ قوالب جاهزة للرد على العملاء. فعِّل «يرسل تلقائياً» على قالب واحد ليُرسل فور وصول أي استفسار جديد.',
                  'Create reply templates. Enable “Send automatically” on one template to reply instantly when a new inquiry arrives.',
                )}
              </p>
              {activeAutoReply ? (
                <p className="text-xs text-emerald-300/90 mt-2">
                  {tx(isAr, 'الرد التلقائي النشط:', 'Active auto-reply:')} <strong>{activeAutoReply.title}</strong>
                </p>
              ) : (
                <p className="text-xs text-[var(--admin-text-faint)] mt-2">
                  {tx(isAr, 'لا يوجد رد تلقائي مفعّل حالياً', 'No automatic reply is enabled')}
                </p>
              )}
            </div>
          </div>
          <button type="button" className="admin-btn-premium !text-xs !py-2" onClick={openNewTemplate}>
            <Plus className="h-3.5 w-3.5" />
            {tx(isAr, 'إضافة قالب', 'Add template')}
          </button>
        </div>

        {templatesLoading ? (
          <p className="text-sm text-[var(--admin-text-faint)]">{tx(isAr, 'جارٍ التحميل…', 'Loading…')}</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-[var(--admin-text-faint)]">
            {tx(isAr, 'لا توجد قوالب — أضف قالباً للرد السريع', 'No templates — add one for quick replies')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm">{t.title}</span>
                  {t.isActive ? (
                    <span className="admin-pill admin-pill-up text-[10px]">{tx(isAr, 'فعّال', 'Active')}</span>
                  ) : (
                    <span className="admin-pill admin-pill-down text-[10px]">{tx(isAr, 'متوقف', 'Off')}</span>
                  )}
                  {t.sendOnNewInquiry && (
                    <span className="admin-pill admin-pill-gold text-[10px]">{tx(isAr, 'تلقائي', 'Auto-send')}</span>
                  )}
                </div>
                <p className="text-xs text-[var(--admin-text-mute)] line-clamp-3 whitespace-pre-wrap">{t.body}</p>
                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  <button type="button" className="admin-icon-btn !w-auto px-3 text-xs" onClick={() => openEditTemplate(t)}>
                    {tx(isAr, 'تعديل', 'Edit')}
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn !w-auto px-3 text-xs text-rose-300 border-rose-400/30"
                    onClick={() => deleteTemplate(t.id)}
                  >
                    {tx(isAr, 'حذف', 'Delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminEntityGrid<Row>
        isAr={isAr}
        refreshKey={refreshKey}
        subtitle={{
          ar: 'اضغط «رد» للرد على العميل — يمكنك اختيار قالب جاهز أو كتابة رد مخصص',
          en: 'Click Reply to respond — pick a template or write a custom message',
        }}
        endpoint="/api/inquiries"
        parseItems={parseItems}
        searchKeys={['name', 'email', 'message']}
        searchPlaceholder={{ ar: 'بحث بالاسم أو الرسالة…', en: 'Search by name or message…' }}
        emptyAr="لا توجد استفسارات"
        emptyEn="No inquiries"
        cardClickable={false}
        onItemClick={() => {}}
        renderCard={(r) => (
          <div className="p-4 w-full">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-semibold">{r.name}</div>
              <div className="flex flex-wrap gap-1 justify-end">
                {statusPill(r.status)}
                {r.replySource === 'auto' && (
                  <span className="admin-pill admin-pill-gold text-[10px]">{tx(isAr, 'رد تلقائي', 'Auto')}</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-[var(--admin-text-faint)] space-y-1 mb-2">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                {r.email}
              </div>
              {r.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" />
                  {r.phone}
                </div>
              )}
            </div>
            {r.property?.title && (
              <p className="text-xs text-[#f5c97b] mb-2">
                {tx(isAr, 'العقار:', 'Property:')} {r.property.title}
              </p>
            )}
            <p className="text-sm text-[var(--admin-text-mute)]">{r.message}</p>
            {r.adminReply && (
              <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] text-emerald-300/80 mb-1">{tx(isAr, 'الرد المحفوظ', 'Saved reply')}</p>
                <p className="text-xs text-[var(--admin-text-mute)] whitespace-pre-wrap">{r.adminReply}</p>
                {r.repliedAt && (
                  <p className="text-[10px] text-[var(--admin-text-faint)] mt-1">
                    {new Date(r.repliedAt).toLocaleString(isAr ? 'ar' : 'en')}
                  </p>
                )}
              </div>
            )}
            <p className="text-[11px] text-[var(--admin-text-faint)] mt-2">
              {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar' : 'en', { dateStyle: 'medium' })}
            </p>
          </div>
        )}
        renderCardActions={(r) => (
          <>
            <button type="button" className="admin-btn-premium !text-xs !py-1.5 !px-3" onClick={() => openReply(r)}>
              <Reply className="h-3.5 w-3.5" />
              {tx(isAr, 'رد', 'Reply')}
            </button>
            <button type="button" className="admin-icon-btn !w-auto px-3 text-xs" onClick={() => setStatus(r, 'READ')}>
              {tx(isAr, 'مقروء', 'Read')}
            </button>
            <button type="button" className="admin-icon-btn !w-auto px-3 text-xs" onClick={() => setStatus(r, 'CLOSED')}>
              {tx(isAr, 'إغلاق', 'Close')}
            </button>
            <button
              type="button"
              className="admin-icon-btn !w-auto px-3 text-xs text-rose-300 border-rose-400/30"
              onClick={async () => {
                if (!window.confirm(tx(isAr, 'حذف الاستفسار؟', 'Delete this inquiry?'))) return;
                try {
                  await adminFetch(`/api/inquiries/${r.id}`, { method: 'DELETE' });
                  invalidate('inquiries');
                  toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
                  bump();
                } catch (e) {
                  toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
                }
              }}
            >
              {tx(isAr, 'حذف', 'Delete')}
            </button>
          </>
        )}
      />

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tx(isAr, 'الرد على الاستفسار', 'Reply to inquiry')}</DialogTitle>
            <DialogDescription>
              {replyTarget
                ? `${replyTarget.name} · ${replyTarget.email}`
                : tx(isAr, 'اكتب ردك للعميل', 'Write your reply to the customer')}
            </DialogDescription>
          </DialogHeader>
          {replyTarget && templates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-[var(--admin-text-faint)] w-full">
                {tx(isAr, 'قوالب سريعة:', 'Quick templates:')}
              </span>
              {templates
                .filter((t) => t.isActive)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="admin-icon-btn !w-auto px-3 text-xs"
                    onClick={() => applyTemplateToReply(t)}
                  >
                    {t.title}
                  </button>
                ))}
            </div>
          )}
          <Field label={tx(isAr, 'نص الرد', 'Reply text')}>
            <textarea
              className="admin-input min-h-[140px]"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </Field>
          <DialogFooter className="flex-wrap gap-2">
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setReplyOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            {replyTarget && replyText.trim() && (
              <a
                href={buildInquiryMailtoLink({
                  to: replyTarget.email,
                  subject: tx(
                    isAr,
                    `رد على استفسارك — ${replyTarget.property?.title ?? 'CIAR'}`,
                    `Re: your inquiry — ${replyTarget.property?.title ?? 'CIAR'}`
                  ),
                  body: replyText.trim(),
                })}
                className="admin-icon-btn !w-auto px-4 inline-flex items-center gap-1.5"
                target="_blank"
                rel="noreferrer"
              >
                <Mail className="h-3.5 w-3.5" />
                {tx(isAr, 'إرسال بالبريد', 'Send via email')}
              </a>
            )}
            <button type="button" className="admin-btn-premium" disabled={replySubmitting} onClick={submitReply}>
              {replySubmitting ? tx(isAr, 'جارٍ الحفظ…', 'Saving…') : tx(isAr, 'حفظ الرد', 'Save reply')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplateId
                ? tx(isAr, 'تعديل قالب الرد', 'Edit reply template')
                : tx(isAr, 'قالب رد جديد', 'New reply template')}
            </DialogTitle>
            <DialogDescription>{tx(isAr, INQUIRY_TEMPLATE_HINT.ar, INQUIRY_TEMPLATE_HINT.en)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={tx(isAr, 'اسم القالب', 'Template name')}>
              <input
                className="admin-input"
                placeholder={tx(isAr, 'مثال: ترحيب سريع', 'e.g. Quick welcome')}
                value={templateForm.title}
                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
              />
            </Field>
            <Field label={tx(isAr, 'نص الرد', 'Reply text')}>
              <textarea
                className="admin-input min-h-[120px]"
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
              />
            </Field>
            <Field label={tx(isAr, 'ترتيب العرض', 'Display order')}>
              <input
                type="number"
                min={0}
                className="admin-input"
                value={templateForm.order}
                onChange={(e) => setTemplateForm({ ...templateForm, order: Number(e.target.value) || 0 })}
              />
            </Field>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={templateForm.isActive}
                onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
              />
              {tx(isAr, 'القالب فعّال', 'Template is active')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={templateForm.sendOnNewInquiry}
                onChange={(e) => setTemplateForm({ ...templateForm, sendOnNewInquiry: e.target.checked })}
              />
              {tx(isAr, 'يرسل تلقائياً عند كل استفسار جديد', 'Send automatically on every new inquiry')}
            </label>
          </div>
          <DialogFooter>
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setTemplateOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button type="button" className="admin-btn-premium" disabled={templateSubmitting} onClick={submitTemplate}>
              {templateSubmitting ? tx(isAr, 'جارٍ الحفظ…', 'Saving…') : tx(isAr, 'حفظ القالب', 'Save template')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [settingsCompanyId, setSettingsCompanyId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '', description: '' });
  const bump = () => setRefreshKey((k) => k + 1);
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
  const parseItems = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);

  const submitCompany = async () => {
    if (!form.name.trim()) {
      toast.error(tx(isAr, 'اسم الشركة مطلوب', 'Company name is required'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          description: form.description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : tx(isAr, 'فشل الإنشاء', 'Create failed'));
      toast.success(tx(isAr, 'تمت إضافة الشركة', 'Company added'));
      setAddOpen(false);
      setForm({ name: '', email: '', phone: '', website: '', description: '' });
      invalidate('companies');
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الإنشاء', 'Create failed'), { description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  if (settingsCompanyId) {
    return (
      <CompanySettingsPanel
        companyId={settingsCompanyId}
        isAr={isAr}
        onBack={() => setSettingsCompanyId(null)}
        onUpdated={bump}
      />
    );
  }

  return (
    <>
      <AdminEntityGrid<Row>
        isAr={isAr}
        refreshKey={refreshKey}
        subtitle={{
          ar: 'اضغط على بطاقة الشركة للإعدادات، أو أضف شركة جديدة',
          en: 'Click a company card for settings, or add a new company',
        }}
        endpoint="/api/companies"
        parseItems={parseItems}
        searchKeys={['name', 'email', 'phone']}
        searchPlaceholder={{ ar: 'بحث باسم الشركة…', en: 'Search companies…' }}
        emptyAr="لا توجد شركات — أضف أول شركة"
        emptyEn="No companies — add your first company"
        onAdd={() => setAddOpen(true)}
        addLabel={{ ar: 'إضافة شركة', en: 'Add company' }}
        onItemClick={(r) => setSettingsCompanyId(r.id)}
        renderCard={(r) => (
          <div className="p-4 w-full">
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-5 w-5 text-[#f5c97b] shrink-0" />
              <span className="font-semibold text-[var(--admin-text)] truncate">{r.name}</span>
            </div>
            <div className="text-[11px] text-[var(--admin-text-mute)] space-y-1 mb-3">
              {r.email && (
                <div className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  {r.email}
                </div>
              )}
              {r.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" />
                  {r.phone}
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs font-bold text-[var(--admin-text-mute)]">
              <span>
                {r._count?.agents ?? r.agentCount ?? 0} {tx(isAr, 'وكيل', 'agents')}
              </span>
              <span>
                {r.listingCount ?? 0} {tx(isAr, 'إعلان', 'listings')}
              </span>
            </div>
            <p className="mt-3 text-[10px] text-amber-200/70">{tx(isAr, 'اضغط للإعدادات', 'Tap for settings')}</p>
          </div>
        )}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tx(isAr, 'إضافة شركة عقارية', 'Add real estate company')}</DialogTitle>
            <DialogDescription>
              {tx(isAr, 'يمكنك لاحقاً ربط الوكلاء بهذه الشركة من تبويب الوكلاء', 'You can link agents to this company later from the Agents tab')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={tx(isAr, 'اسم الشركة', 'Company name')}>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'البريد (اختياري)', 'Email (optional)')}>
              <input type="email" className="admin-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'الهاتف (اختياري)', 'Phone (optional)')}>
              <input className="admin-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'الموقع الإلكتروني (اختياري)', 'Website (optional)')}>
              <input className="admin-input" placeholder="https://…" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </Field>
            <Field label={tx(isAr, 'نبذة (اختياري)', 'About (optional)')}>
              <textarea className="admin-input min-h-[72px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setAddOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button type="button" className="admin-btn-premium" disabled={submitting} onClick={submitCompany}>
              {submitting ? tx(isAr, 'جارٍ الحفظ…', 'Saving…') : tx(isAr, 'إضافة الشركة', 'Add company')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Banners Tab ──────────────────────────
export function BannersTab({ isAr }: { isAr: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image: '', link: '', position: 'home', order: 0, isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = () => ({ title: '', subtitle: '', image: '', link: '', position: 'home', order: 0, isActive: true });

  type Row = { id: string; title: string; subtitle?: string | null; image?: string | null; link?: string | null; position: string; isActive: boolean; order?: number };
  const parseItems = useCallback((d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []), []);

  const openEdit = (r: Row) => {
    setEditingId(r.id);
    setForm({
      title: r.title ?? '',
      subtitle: r.subtitle ?? '',
      image: r.image ?? '',
      link: r.link ?? '',
      position: r.position ?? 'home',
      order: r.order ?? 0,
      isActive: r.isActive,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error(tx(isAr, 'العنوان مطلوب', 'Title is required'));
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await adminFetch(`/api/banners/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        toast.success(tx(isAr, 'تم التحديث', 'Updated'));
      } else {
        const res = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`);
        toast.success(tx(isAr, 'تمت الإضافة', 'Banner added'));
      }
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      invalidate('banners');
      bump();
    } catch (e) {
      toast.error(tx(isAr, editingId ? 'فشل التحديث' : 'فشل الإنشاء', editingId ? 'Update failed' : 'Create failed'), {
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!window.confirm(tx(isAr, 'حذف هذا الإعلان؟', 'Delete this banner?'))) return;
    try {
      await adminFetch(`/api/banners/${id}`, { method: 'DELETE' });
      invalidate('banners');
      toast.success(tx(isAr, 'تم الحذف', 'Deleted'));
      bump();
    } catch (e) {
      toast.error(tx(isAr, 'فشل الحذف', 'Delete failed'), { description: e instanceof Error ? e.message : '' });
    }
  };

  return (
    <>
      <AdminEntityGrid<Row>
        isAr={isAr}
        refreshKey={refreshKey}
        subtitle={{
          ar: 'اضغط على أي بانر لتعديله — أو أضف بانراً جديداً',
          en: 'Click any banner to edit — or add a new one',
        }}
        endpoint="/api/banners"
        parseItems={parseItems}
        searchKeys={['title', 'subtitle', 'position']}
        onAdd={() => {
          setEditingId(null);
          setForm(emptyForm());
          setOpen(true);
        }}
        addLabel={{ ar: 'إضافة بانر', en: 'Add banner' }}
        emptyAr="لا توجد بانرات"
        emptyEn="No banners"
        onItemClick={openEdit}
        columnsClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        renderCard={(r) => (
          <div className="w-full">
            <div className="relative h-28 bg-white/[0.04] overflow-hidden">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-[var(--admin-text-faint)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="font-semibold text-white line-clamp-1">{r.title}</div>
                {r.subtitle && <div className="text-[10px] text-white/75 line-clamp-1">{r.subtitle}</div>}
              </div>
              <div className="absolute top-2 end-2">
                {r.isActive ? (
                  <ToggleRight className="h-5 w-5 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-white/50" />
                )}
              </div>
            </div>
            <div className="p-3 flex items-center justify-between gap-2">
              <span className="admin-tag bg-white/[0.05] text-[var(--admin-text-mute)] text-[10px]">{r.position}</span>
              <span className="text-[10px] text-amber-200/70">{tx(isAr, 'تعديل ←', 'Edit →')}</span>
            </div>
          </div>
        )}
      />

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditingId(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {tx(isAr, editingId ? 'تعديل البانر' : 'إضافة بانر جديد', editingId ? 'Edit banner' : 'Add new banner')}
            </DialogTitle>
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
              <ImageUrlInput
                isAr={isAr}
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
                placeholder="https://…"
              />
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
          <DialogFooter className="flex-wrap gap-2">
            {editingId && (
              <button
                type="button"
                className="admin-icon-btn !w-auto px-4 text-xs text-rose-300 me-auto"
                onClick={() => void deleteBanner(editingId)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {tx(isAr, 'حذف', 'Delete')}
              </button>
            )}
            <button type="button" className="admin-icon-btn !w-auto px-4" onClick={() => setOpen(false)}>
              {tx(isAr, 'إلغاء', 'Cancel')}
            </button>
            <button type="button" className="admin-btn-premium" disabled={submitting} onClick={() => void submit()}>
              {submitting ? tx(isAr, 'جارٍ الحفظ…', 'Saving…') : tx(isAr, 'حفظ', 'Save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { NewsTab } from './news-tab';

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

export { ContentManagerTab } from './content-manager-tab';
export { SiteConfigTab } from './site-config-tab';


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
export function SettingsTab({
  isAr,
  onNavigateTab,
}: {
  isAr: boolean;
  onNavigateTab?: (tab: import('./admin-nav').AdminTabId) => void;
}) {
  const router = useRouter();
  const {
    locale,
    setLocale,
    designSettings,
    updateDesignSettings,
    resetDesignSettings,
    socialSettings,
    updateSocialSettings,
    resetSocialSettings,
  } = useAppStore();
  const { theme, setTheme } = useTheme();

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
            <ImageUrlInput
              isAr={isAr}
              value={designSettings.heroImageUrl}
              onChange={updateHeroImage}
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

      <div className="admin-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold">{tx(isAr, 'محتوى الصفحات', 'Page content')}</h3>
          <p className="text-[12px] text-[var(--admin-text-mute)] mt-1 max-w-xl">
            {tx(
              isAr,
              'تعديل عناوين وصور وشكل كل صفحة من المحرر المخصص — أوضح وأسهل من الإعدادات هنا.',
              'Edit titles, images, and layout per page in the dedicated editor.',
            )}
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-premium !text-sm"
          onClick={() => (onNavigateTab ? onNavigateTab('content-manager') : undefined)}
        >
          <Sparkles className="h-4 w-4" />
          {tx(isAr, 'فتح محرر الصفحات', 'Open page editor')}
        </button>
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
