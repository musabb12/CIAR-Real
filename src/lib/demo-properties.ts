import { normalizeFlagStorage } from '@/lib/country-flags';
import { getSeedCountriesCatalog, getSeedCountryById } from '@/lib/seed-countries-catalog';
import type { City, Country, Property, Region } from '@/types';

const ISO = new Date().toISOString();

function img(propertyId: string, url: string, cover = true) {
  return {
    id: `demo-img-${propertyId}`,
    url,
    alt: null,
    isCover: cover,
    order: 0,
    propertyId,
  };
}

/** Offline showcase listings when Firestore quota is exceeded or DB is unreachable. */
const DEMO_PROPERTIES: Property[] = [
  {
    id: 'ciar-demo-riyadh-1',
    title: 'فيلا فاخرة — الرياض',
    slug: 'villa-riyadh-demo-1',
    description: 'فيلا واسعة مع مسبح وحديقة، مناسبة للعائلة.',
    price: 2850000,
    listingType: 'SALE',
    propertyType: 'VILLA',
    status: 'AVAILABLE',
    area: 420,
    bedrooms: 5,
    bathrooms: 4,
    floors: 2,
    yearBuilt: 2022,
    isFeatured: true,
    views: 1200,
    countryId: 'sa',
    regionId: 'sa-riyadh',
    cityId: 'sa-riyadh-capital',
    address: 'حي الملقا، الرياض',
    latitude: 24.8,
    longitude: 46.6,
    agentId: null,
    createdAt: ISO,
    updatedAt: ISO,
    country: { id: 'sa', name: 'السعودية', code: 'SA', flag: '🇸🇦', currency: 'SAR', currencySymbol: 'ر.س', isActive: true },
    region: { id: 'sa-riyadh', name: 'منطقة الرياض', countryId: 'sa' },
    city: { id: 'sa-riyadh-capital', name: 'الرياض', regionId: 'sa-riyadh' },
    images: [img('ciar-demo-riyadh-1', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80')],
  },
  {
    id: 'ciar-demo-dubai-2',
    title: 'شقة بانوراما — دبي مارينا',
    slug: 'apartment-dubai-demo-2',
    description: 'إطلالة بحرية، تشطيبات فاخرة، جاهزة للسكن.',
    price: 1850000,
    listingType: 'SALE',
    propertyType: 'APARTMENT',
    status: 'AVAILABLE',
    area: 110,
    bedrooms: 2,
    bathrooms: 2,
    floors: 42,
    yearBuilt: 2021,
    isFeatured: true,
    views: 3400,
    countryId: 'ae',
    regionId: 'ae-dubai',
    cityId: 'ae-dubai-marina',
    address: 'Dubai Marina',
    latitude: 25.08,
    longitude: 55.14,
    agentId: null,
    createdAt: ISO,
    updatedAt: ISO,
    country: { id: 'ae', name: 'الإمارات', code: 'AE', flag: '🇦🇪', currency: 'AED', currencySymbol: 'د.إ', isActive: true },
    region: { id: 'ae-dubai', name: 'دبي', countryId: 'ae' },
    city: { id: 'ae-dubai-marina', name: 'دبي مارينا', regionId: 'ae-dubai' },
    images: [img('ciar-demo-dubai-2', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80')],
  },
  {
    id: 'ciar-demo-cairo-3',
    title: 'شقة للإيجار — القاهرة الجديدة',
    slug: 'rent-cairo-demo-3',
    description: 'شقة مفروشة بالكامل، قريبة من الخدمات.',
    price: 12000,
    listingType: 'RENT',
    propertyType: 'APARTMENT',
    status: 'AVAILABLE',
    area: 95,
    bedrooms: 3,
    bathrooms: 2,
    floors: 8,
    yearBuilt: 2019,
    isFeatured: true,
    views: 890,
    countryId: 'eg',
    regionId: 'eg-cairo',
    cityId: 'eg-new-cairo',
    address: 'التجمع الخامس',
    latitude: 30.03,
    longitude: 31.47,
    agentId: null,
    createdAt: ISO,
    updatedAt: ISO,
    country: { id: 'eg', name: 'مصر', code: 'EG', flag: '🇪🇬', currency: 'EGP', currencySymbol: 'ج.م', isActive: true },
    region: { id: 'eg-cairo', name: 'القاهرة', countryId: 'eg' },
    city: { id: 'eg-new-cairo', name: 'القاهرة الجديدة', regionId: 'eg-cairo' },
    images: [img('ciar-demo-cairo-3', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80')],
  },
  {
    id: 'ciar-demo-istanbul-4',
    title: 'بنتهاوس — إسطنبول',
    slug: 'penthouse-istanbul-demo-4',
    description: 'إطلالة على البوسفور، تشطيبات عالية الجودة.',
    price: 4200000,
    listingType: 'SALE',
    propertyType: 'PENTHOUSE',
    status: 'AVAILABLE',
    area: 280,
    bedrooms: 4,
    bathrooms: 3,
    floors: 1,
    yearBuilt: 2023,
    isFeatured: true,
    views: 2100,
    countryId: 'tr',
    regionId: 'tr-istanbul',
    cityId: 'tr-istanbul-center',
    address: 'Beşiktaş',
    latitude: 41.04,
    longitude: 29.0,
    agentId: null,
    createdAt: ISO,
    updatedAt: ISO,
    country: { id: 'tr', name: 'تركيا', code: 'TR', flag: '🇹🇷', currency: 'TRY', currencySymbol: '₺', isActive: true },
    region: { id: 'tr-istanbul', name: 'إسطنبول', countryId: 'tr' },
    city: { id: 'tr-istanbul-center', name: 'إسطنبول', regionId: 'tr-istanbul' },
    images: [img('ciar-demo-istanbul-4', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80')],
  },
  {
    id: 'ciar-demo-london-5',
    title: 'Townhouse — لندن',
    slug: 'townhouse-london-demo-5',
    description: 'منزل عائلي أنيق في حي هادئ قريب من المترو.',
    price: 1250000,
    listingType: 'SALE',
    propertyType: 'TOWNHOUSE',
    status: 'AVAILABLE',
    area: 185,
    bedrooms: 4,
    bathrooms: 3,
    floors: 3,
    yearBuilt: 2018,
    isFeatured: false,
    views: 560,
    countryId: 'gb',
    regionId: 'gb-london',
    cityId: 'gb-london-city',
    address: 'Kensington',
    latitude: 51.5,
    longitude: -0.12,
    agentId: null,
    createdAt: ISO,
    updatedAt: ISO,
    country: { id: 'gb', name: 'المملكة المتحدة', code: 'GB', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', isActive: true },
    region: { id: 'gb-london', name: 'لندن', countryId: 'gb' },
    city: { id: 'gb-london-city', name: 'لندن', regionId: 'gb-london' },
    images: [img('ciar-demo-london-5', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80')],
  },
  {
    id: 'ciar-demo-jeddah-6',
    title: 'فيلا ساحلية — جدة',
    slug: 'villa-jeddah-demo-6',
    description: 'قرب الكورنيش، مسبح خاص وموقف واسع.',
    price: 3200000,
    listingType: 'SALE',
    propertyType: 'VILLA',
    status: 'AVAILABLE',
    area: 380,
    bedrooms: 5,
    bathrooms: 5,
    floors: 2,
    yearBuilt: 2020,
    isFeatured: true,
    views: 980,
    countryId: 'sa',
    regionId: 'sa-makkah',
    cityId: 'sa-jeddah',
    address: 'الشاطئ، جدة',
    latitude: 21.54,
    longitude: 39.17,
    agentId: null,
    createdAt: ISO,
    updatedAt: ISO,
    country: { id: 'sa', name: 'السعودية', code: 'SA', flag: '🇸🇦', currency: 'SAR', currencySymbol: 'ر.س', isActive: true },
    region: { id: 'sa-makkah', name: 'مكة', countryId: 'sa' },
    city: { id: 'sa-jeddah', name: 'جدة', regionId: 'sa-makkah' },
    images: [img('ciar-demo-jeddah-6', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80')],
  },
];

export type DemoPropertyQuery = {
  countryId?: string | null;
  cityId?: string | null;
  agentId?: string | null;
  listingType?: string | null;
  propertyType?: string | null;
  isFeatured?: string | null;
  search?: string | null;
  sort?: string | null;
  page?: number;
  limit?: number;
};

export function listDemoProperties(q: DemoPropertyQuery): {
  data: Property[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
} {
  let rows = [...DEMO_PROPERTIES];

  if (q.countryId) {
    const byCountry = rows.filter((p) => p.countryId === q.countryId);
    if (byCountry.length > 0) rows = byCountry;
  }
  if (q.cityId) {
    const byCity = rows.filter((p) => p.cityId === q.cityId);
    if (byCity.length > 0) rows = byCity;
  }
  if (q.agentId) rows = rows.filter((p) => p.agentId === q.agentId);
  if (q.listingType) rows = rows.filter((p) => p.listingType === q.listingType);
  if (q.propertyType) rows = rows.filter((p) => p.propertyType === q.propertyType);
  if (q.isFeatured === 'true') rows = rows.filter((p) => p.isFeatured);

  const search = q.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        (p.city?.name ?? '').toLowerCase().includes(search)
    );
  }

  if (q.sort === 'price-asc') rows.sort((a, b) => a.price - b.price);
  else if (q.sort === 'price-desc') rows.sort((a, b) => b.price - a.price);
  else rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const page = Math.max(1, q.page ?? 1);
  const limit = Math.min(Math.max(1, q.limit ?? 12), 30);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    data: rows.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  };
}

export function getDemoPropertyById(id: string): Property | null {
  return DEMO_PROPERTIES.find((p) => p.id === id) ?? null;
}

type DemoCountryRow = Country & {
  regions?: Array<
    Region & {
      cities?: Array<City & { _count?: { properties: number } }>;
      _count?: { properties: number };
    }
  >;
  _count?: { properties: number };
};

function propertyCountsByCountry(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of DEMO_PROPERTIES) {
    const id = p.countryId || p.country?.id;
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

/** Full seed catalog (68 countries) with optional listing counts from demo properties. */
function buildDemoLocationTree(includeCounts: boolean): DemoCountryRow[] {
  const counts = propertyCountsByCountry();

  return getSeedCountriesCatalog()
    .map((c) => ({
      ...c,
      flag: normalizeFlagStorage(c.flag, c.code),
      currencySymbol: c.currencySymbol ?? null,
      isFeatured: c.isFeatured ?? false,
      regions: (c.regions ?? []).map((r) => ({
        ...r,
        cities: (r.cities ?? []).map((city) => ({
          ...city,
          ...(includeCounts ? { _count: { properties: 0 } } : {}),
        })),
        ...(includeCounts ? { _count: { properties: 0 } } : {}),
      })),
      ...(includeCounts
        ? { _count: { properties: counts.get(c.id) || 0 } }
        : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDemoCountries(options?: { includeProperties?: boolean }): DemoCountryRow[] {
  return buildDemoLocationTree(Boolean(options?.includeProperties));
}

export function getDemoCountryById(
  id: string,
  options?: { includeProperties?: boolean },
): DemoCountryRow | null {
  const fromList = getDemoCountries(options).find(
    (c) => c.id === id || c.code.toLowerCase() === id.toLowerCase(),
  );
  if (fromList) return fromList;

  const seed = getSeedCountryById(id);
  if (!seed) return null;

  const includeCounts = Boolean(options?.includeProperties);
  const counts = propertyCountsByCountry();
  return {
    ...seed,
    flag: normalizeFlagStorage(seed.flag, seed.code),
    currencySymbol: seed.currencySymbol ?? null,
    isFeatured: false,
    regions: seed.regions ?? [],
    ...(includeCounts ? { _count: { properties: counts.get(seed.id) || 0 } } : {}),
  };
}

/** Country detail payload for admin when Firestore is unavailable. */
export function getDemoCountryDetailForApi(id: string) {
  const demo = getDemoCountryById(id, { includeProperties: true });
  if (!demo) return null;
  return {
    ...demo,
    quotaExceeded: true,
    dataSource: 'demo' as const,
    readOnly: true,
    warning:
      'Showing demo country catalog. Connect Firebase or wait for quota reset to save changes.',
  };
}

export function getDemoLocationsPayload(options?: { includeProperties?: boolean }) {
  return {
    countries: getDemoCountries(options),
    dataSource: 'demo' as const,
    quotaExceeded: true,
    total: getSeedCountriesCatalog().length,
    messageAr:
      'عرض كتالوج الدول المحلي (68 دولة) لأن حصة Firebase منتهية. البيانات الحقيقية في Firestore ستظهر بعد إعادة التعيين أو ترقية الخطة.',
    messageEn:
      'Showing local country catalog (68 countries) because Firebase quota is exceeded. Live Firestore data returns after quota reset or plan upgrade.',
  };
}
