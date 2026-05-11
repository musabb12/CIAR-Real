import { FieldValue, Timestamp, getFirestore, type Query } from 'firebase-admin/firestore';
import { getFirebaseAdminApp, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import type {
  Property,
  Country,
  Region,
  City,
  Agent,
  User,
  UserRole,
  PropertyImage,
  ListingType,
  PropertyType,
  PropertyStatus,
} from '@/types';

const DEFAULT_CAP = 800;

function collectionName(): string {
  return process.env.FIRESTORE_PROPERTIES_COLLECTION?.trim() || 'properties';
}

function maxFetchDocs(): number {
  const n = parseInt(process.env.FIRESTORE_QUERY_MAX_DOCS || String(DEFAULT_CAP), 10);
  return Math.min(Math.max(n, 50), 5000);
}

function toIso(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string' && v) return v;
  return new Date().toISOString();
}

function asNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return fallback;
}

function asStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  return fallback;
}

function asNullableNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return null;
}

/** Map a Firestore document to the `Property` shape the UI expects. */
export function firestoreDocToProperty(id: string, data: Record<string, unknown>): Property {
  const imagesRaw = data.images;
  const images: PropertyImage[] = Array.isArray(imagesRaw)
    ? (imagesRaw as Record<string, unknown>[]).map((img, i) => ({
        id: asStr(img.id, `fs-img-${id}-${i}`),
        url: asStr(img.url, ''),
        alt: img.alt === null || img.alt === undefined ? null : asStr(img.alt, ''),
        isCover: asBool(img.isCover, i === 0),
        order: asNum(img.order, i),
        propertyId: id,
      }))
    : [];

  const country = (data.country as Country | undefined) ?? {
    id: asStr(data.countryId, 'unknown'),
    name: asStr((data as { countryName?: string }).countryName, ''),
    code: asStr((data as { countryCode?: string }).countryCode, ''),
    flag: (data.countryFlag as string | null) ?? null,
    currency: (data.currency as string | null) ?? null,
    currencySymbol: (data.currencySymbol as string | null) ?? '$',
    isActive: true,
  };

  const region = (data.region as Region | undefined) ?? {
    id: asStr(data.regionId, 'unknown'),
    name: asStr((data as { regionName?: string }).regionName, ''),
    countryId: asStr(data.countryId, ''),
  };

  const city = (data.city as City | undefined) ?? {
    id: asStr(data.cityId, 'unknown'),
    name: asStr((data as { cityName?: string }).cityName, ''),
    regionId: asStr(data.regionId, ''),
  };

  let agent: Agent | undefined;
  const agentRaw = data.agent as Record<string, unknown> | undefined;
  const userRaw = agentRaw?.user as Record<string, unknown> | undefined;
  if (agentRaw && userRaw) {
    const u: User = {
      id: asStr(userRaw.id, 'u'),
      email: asStr(userRaw.email, ''),
      name: (userRaw.name as string | null) ?? null,
      phone: (userRaw.phone as string | null) ?? null,
      avatar: (userRaw.avatar as string | null) ?? null,
      role: (userRaw.role as User['role']) ?? 'AGENT',
      isActive: asBool(userRaw.isActive, true),
      createdAt: toIso(userRaw.createdAt),
      updatedAt: toIso(userRaw.updatedAt),
    };
    agent = {
      id: asStr(agentRaw.id, 'a'),
      userId: asStr(agentRaw.userId, u.id),
      user: u,
      bio: (agentRaw.bio as string | null) ?? null,
      title: (agentRaw.title as string | null) ?? null,
      license: (agentRaw.license as string | null) ?? null,
      phone: (agentRaw.phone as string | null) ?? null,
      whatsapp: (agentRaw.whatsapp as string | null) ?? null,
      experience: asNullableNum(agentRaw.experience),
      rating: asNum(agentRaw.rating, 0),
      totalListings: asNum(agentRaw.totalListings, 0),
      totalSales: asNum(agentRaw.totalSales, 0),
      verified: asBool(agentRaw.verified, false),
      companyId: (agentRaw.companyId as string | null) ?? null,
      createdAt: toIso(agentRaw.createdAt),
      updatedAt: toIso(agentRaw.updatedAt),
    };
  }

  return {
    id,
    title: asStr(data.title, 'Property'),
    slug: asStr(data.slug, id),
    description: asStr(data.description, ''),
    price: asNum(data.price, 0),
    listingType: (data.listingType as ListingType) ?? 'SALE',
    propertyType: (data.propertyType as PropertyType) ?? 'APARTMENT',
    status: (data.status as PropertyStatus) ?? 'AVAILABLE',
    area: asNum(data.area, 0),
    bedrooms: asNullableNum(data.bedrooms),
    bathrooms: asNullableNum(data.bathrooms),
    floors: asNullableNum(data.floors),
    yearBuilt: asNullableNum(data.yearBuilt),
    isFeatured: asBool(data.isFeatured, false),
    views: asNum(data.views, 0),
    countryId: asStr(data.countryId, country.id),
    regionId: asStr(data.regionId, region.id),
    cityId: asStr(data.cityId, city.id),
    address: (data.address as string | null) ?? null,
    latitude: asNullableNum(data.latitude),
    longitude: asNullableNum(data.longitude),
    agentId: (data.agentId as string | null) ?? null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    country,
    region,
    city,
    agent,
    images,
    amenities: Array.isArray(data.amenities) ? (data.amenities as Property['amenities']) : [],
  };
}

export function useFirestoreForPropertiesList(): boolean {
  return isFirebaseAdminConfigured();
}

function getDb() {
  getFirebaseAdminApp();
  return getFirestore();
}

export type PropertyListQuery = {
  countryId: string | null;
  cityId: string | null;
  listingType: string | null;
  propertyType: string | null;
  priceMin: string | null;
  priceMax: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  areaMin: string | null;
  areaMax: string | null;
  isFeatured: string | null;
  search: string | null;
  sort: string;
  page: number;
  limit: number;
};

export async function listPropertiesFromFirestore(
  q: PropertyListQuery
): Promise<{ data: Property[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const db = getDb();
  const col = db.collection(collectionName());

  let query: Query = col as Query;
  if (q.countryId) query = query.where('countryId', '==', q.countryId);
  if (q.cityId) query = query.where('cityId', '==', q.cityId);
  if (q.listingType) query = query.where('listingType', '==', q.listingType);
  if (q.propertyType) query = query.where('propertyType', '==', q.propertyType);
  if (q.isFeatured === 'true') query = query.where('isFeatured', '==', true);

  query = query.orderBy('createdAt', 'desc').limit(maxFetchDocs());

  let snap;
  try {
    snap = await query.get();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('index') && !msg.includes('FAILED_PRECONDITION')) throw err;
    snap = await col.orderBy('createdAt', 'desc').limit(maxFetchDocs()).get();
  }
  let rows = snap.docs.map((d) => firestoreDocToProperty(d.id, d.data() as Record<string, unknown>));

  const priceMin = q.priceMin ? parseFloat(q.priceMin) : null;
  const priceMax = q.priceMax ? parseFloat(q.priceMax) : null;
  const bedMin = q.bedrooms ? parseInt(q.bedrooms, 10) : null;
  const bathMin = q.bathrooms ? parseInt(q.bathrooms, 10) : null;
  const areaMin = q.areaMin ? parseFloat(q.areaMin) : null;
  const areaMax = q.areaMax ? parseFloat(q.areaMax) : null;
  const search = q.search?.trim().toLowerCase() ?? '';

  if (priceMin !== null) rows = rows.filter((p) => p.price >= priceMin);
  if (priceMax !== null) rows = rows.filter((p) => p.price <= priceMax);
  if (bedMin !== null) rows = rows.filter((p) => (p.bedrooms ?? 0) >= bedMin);
  if (bathMin !== null) rows = rows.filter((p) => (p.bathrooms ?? 0) >= bathMin);
  if (areaMin !== null) rows = rows.filter((p) => p.area >= areaMin);
  if (areaMax !== null) rows = rows.filter((p) => p.area <= areaMax);
  if (search) {
    rows = rows.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        (p.address?.toLowerCase().includes(search) ?? false)
    );
  }

  if (q.sort === 'price_asc') rows = [...rows].sort((a, b) => a.price - b.price);
  else if (q.sort === 'price_desc') rows = [...rows].sort((a, b) => b.price - a.price);

  const total = rows.length;
  const skip = (q.page - 1) * q.limit;
  const pageRows = rows.slice(skip, skip + q.limit);
  const totalPages = Math.max(1, Math.ceil(total / q.limit));

  return {
    data: pageRows,
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages,
    },
  };
}

export async function getPropertyFromFirestore(
  id: string,
  skipView: boolean
): Promise<Property | null> {
  const db = getDb();
  const ref = db.collection(collectionName()).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const raw = snap.data() as Record<string, unknown>;
  if (!skipView) {
    await ref.update({ views: FieldValue.increment(1) }).catch(() => {});
  }
  const views = asNum(raw.views, 0) + (skipView ? 0 : 1);
  return firestoreDocToProperty(id, { ...raw, views });
}
