import { FieldValue, type Query } from 'firebase-admin/firestore';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  FIRESTORE_COLLECTIONS,
  asBoolean,
  asNullableNumber,
  asNullableString,
  asNumber,
  asString,
  buildAgentSnapshot,
  cleanUndefined,
  col,
  getAmenitiesByIds,
  getLocationSnapshot,
  makeId,
  nowIso,
  sortByCreatedDesc,
  toIso,
} from '@/lib/firestore-shared';
import type {
  Agent,
  Country,
  ListingType,
  Property,
  PropertyAmenity,
  PropertyImage,
  PropertyStatus,
  PropertyType,
  Region,
  City,
  UserRole,
} from '@/types';

const DEFAULT_CAP = 800;

export function propertyCollectionName(): string {
  return FIRESTORE_COLLECTIONS.properties;
}

function propertyCol() {
  return col(FIRESTORE_COLLECTIONS.properties);
}

function maxFetchDocs(): number {
  const n = parseInt(process.env.FIRESTORE_QUERY_MAX_DOCS || String(DEFAULT_CAP), 10);
  return Math.min(Math.max(n, 50), 5000);
}

function mapPropertyImages(
  propertyId: string,
  imagesRaw: unknown
): PropertyImage[] {
  if (!Array.isArray(imagesRaw)) return [];
  return imagesRaw.map((img, index) => {
    const row = (img ?? {}) as Record<string, unknown>;
    return {
      id: asString(row.id, `fs-img-${propertyId}-${index}`),
      url: asString(row.url),
      alt: asNullableString(row.alt),
      isCover: asBoolean(row.isCover, index === 0),
      order: asNumber(row.order, index),
      propertyId,
    };
  });
}

function mapPropertyAmenities(
  propertyId: string,
  amenitiesRaw: unknown
): PropertyAmenity[] {
  if (!Array.isArray(amenitiesRaw)) return [];
  return amenitiesRaw.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const amenity = (row.amenity ?? {}) as Record<string, unknown>;
    const amenityId = asString(row.amenityId, asString(amenity.id, `amenity-${index}`));
    return {
      id: asString(row.id, `fs-pam-${propertyId}-${amenityId}`),
      propertyId,
      amenityId,
      amenity: {
        id: asString(amenity.id, amenityId),
        name: asString(amenity.name),
        icon: asNullableString(amenity.icon),
        category: asNullableString(amenity.category),
      },
    };
  });
}

function mapAgentSnapshot(raw: unknown): Agent | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const agentRaw = raw as Record<string, unknown>;
  const userRaw = (agentRaw.user ?? {}) as Record<string, unknown>;
  const companyRaw =
    agentRaw.company && typeof agentRaw.company === 'object'
      ? (agentRaw.company as Record<string, unknown>)
      : null;

  return {
    id: asString(agentRaw.id),
    userId: asString(agentRaw.userId),
    user: userRaw.id
      ? {
          id: asString(userRaw.id),
          email: asString(userRaw.email),
          name: asNullableString(userRaw.name),
          password: asNullableString(userRaw.password),
          phone: asNullableString(userRaw.phone),
          avatar: asNullableString(userRaw.avatar),
          role: (userRaw.role as UserRole) ?? 'AGENT',
          isActive: asBoolean(userRaw.isActive, true),
          createdAt: toIso(userRaw.createdAt),
          updatedAt: toIso(userRaw.updatedAt),
        }
      : undefined,
    bio: asNullableString(agentRaw.bio),
    title: asNullableString(agentRaw.title),
    license: asNullableString(agentRaw.license),
    phone: asNullableString(agentRaw.phone),
    whatsapp: asNullableString(agentRaw.whatsapp),
    experience: asNullableNumber(agentRaw.experience),
    rating: asNumber(agentRaw.rating, 0),
    totalListings: asNumber(agentRaw.totalListings, 0),
    totalSales: asNumber(agentRaw.totalSales, 0),
    verified: asBoolean(agentRaw.verified, false),
    companyId: asNullableString(agentRaw.companyId),
    company: companyRaw
      ? {
          id: asString(companyRaw.id),
          name: asString(companyRaw.name),
          logo: asNullableString(companyRaw.logo),
          description: asNullableString(companyRaw.description),
          phone: asNullableString(companyRaw.phone),
          email: asNullableString(companyRaw.email),
          website: asNullableString(companyRaw.website),
          address: asNullableString(companyRaw.address),
          founded: asNullableNumber(companyRaw.founded),
          agentCount: asNumber(companyRaw.agentCount, 0),
          listingCount: asNumber(companyRaw.listingCount, 0),
          createdAt: toIso(companyRaw.createdAt),
          updatedAt: toIso(companyRaw.updatedAt),
        }
      : undefined,
    createdAt: toIso(agentRaw.createdAt),
    updatedAt: toIso(agentRaw.updatedAt),
  };
}

/** Map a Firestore document to the `Property` shape the UI expects. */
export function firestoreDocToProperty(id: string, data: Record<string, unknown>): Property {
  const country = (data.country as Country | undefined) ?? {
    id: asString(data.countryId, 'unknown'),
    name: asString((data as { countryName?: string }).countryName, ''),
    code: asString((data as { countryCode?: string }).countryCode, ''),
    flag: asNullableString(data.countryFlag),
    currency: asNullableString(data.currency),
    currencySymbol: asNullableString(data.currencySymbol),
    isActive: true,
  };

  const region = (data.region as Region | undefined) ?? {
    id: asString(data.regionId, 'unknown'),
    name: asString((data as { regionName?: string }).regionName, ''),
    countryId: asString(data.countryId, ''),
  };

  const city = (data.city as City | undefined) ?? {
    id: asString(data.cityId, 'unknown'),
    name: asString((data as { cityName?: string }).cityName, ''),
    regionId: asString(data.regionId, ''),
  };

  return {
    id,
    title: asString(data.title, 'Property'),
    slug: asString(data.slug, id),
    description: asString(data.description, ''),
    price: asNumber(data.price, 0),
    listingType: (data.listingType as ListingType) ?? 'SALE',
    propertyType: (data.propertyType as PropertyType) ?? 'APARTMENT',
    status: (data.status as PropertyStatus) ?? 'AVAILABLE',
    area: asNumber(data.area, 0),
    bedrooms: asNullableNumber(data.bedrooms),
    bathrooms: asNullableNumber(data.bathrooms),
    floors: asNullableNumber(data.floors),
    yearBuilt: asNullableNumber(data.yearBuilt),
    isFeatured: asBoolean(data.isFeatured, false),
    views: asNumber(data.views, 0),
    countryId: asString(data.countryId, country.id),
    regionId: asString(data.regionId, region.id),
    cityId: asString(data.cityId, city.id),
    address: asNullableString(data.address),
    latitude: asNullableNumber(data.latitude),
    longitude: asNullableNumber(data.longitude),
    agentId: asNullableString(data.agentId),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    country,
    region,
    city,
    agent: mapAgentSnapshot(data.agent),
    images: mapPropertyImages(id, data.images),
    amenities: mapPropertyAmenities(id, data.amenities),
  };
}

export function useFirestoreForPropertiesList(): boolean {
  return isFirebaseAdminConfigured();
}

export type PropertyListQuery = {
  countryId: string | null;
  cityId: string | null;
  agentId?: string | null;
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

export async function listAllPropertiesFromFirestore(): Promise<Property[]> {
  const snap = await propertyCol().orderBy('createdAt', 'desc').limit(maxFetchDocs()).get();
  return sortByCreatedDesc(
    snap.docs.map((doc) => firestoreDocToProperty(doc.id, doc.data() as Record<string, unknown>))
  );
}

export async function listPropertiesFromFirestore(
  q: PropertyListQuery
): Promise<{ data: Property[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  let query: Query = propertyCol() as unknown as Query;
  if (q.countryId) query = query.where('countryId', '==', q.countryId);
  if (q.cityId) query = query.where('cityId', '==', q.cityId);
  if (q.agentId) query = query.where('agentId', '==', q.agentId);
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
    snap = await propertyCol().orderBy('createdAt', 'desc').limit(maxFetchDocs()).get();
  }

  let rows = snap.docs.map((doc) =>
    firestoreDocToProperty(doc.id, doc.data() as Record<string, unknown>)
  );

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
    rows = rows.filter((p) => {
      const blob = [
        p.title,
        p.description,
        p.address ?? '',
        p.city?.name ?? '',
        p.region?.name ?? '',
        p.country?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(search);
    });
  }

  if (q.sort === 'price_asc') rows = [...rows].sort((a, b) => a.price - b.price);
  else if (q.sort === 'price_desc') rows = [...rows].sort((a, b) => b.price - a.price);
  else rows = sortByCreatedDesc(rows);

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
  const ref = propertyCol().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const raw = snap.data() as Record<string, unknown>;
  if (!skipView) {
    await ref.update({ views: FieldValue.increment(1) }).catch(() => {});
  }
  const views = asNumber(raw.views, 0) + (skipView ? 0 : 1);
  return firestoreDocToProperty(id, { ...raw, views });
}

type PropertyWriteInput = {
  title: string;
  description: string;
  price: number | string;
  listingType: ListingType;
  propertyType: PropertyType;
  area: number | string;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  floors?: number | string | null;
  yearBuilt?: number | string | null;
  isFeatured?: boolean;
  status?: PropertyStatus;
  countryId: string;
  regionId: string;
  cityId: string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  agentId?: string | null;
  images?: Array<{ id?: string; url: string; alt?: string | null; isCover?: boolean; order?: number }>;
  amenityIds?: string[];
  slug?: string;
};

function createSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'property'}-${Date.now()}`;
}

function normalizeImages(
  propertyId: string,
  images: PropertyWriteInput['images'] | undefined,
  existing: PropertyImage[]
): PropertyImage[] {
  const src = images ?? existing;
  return src.map((img, index) => ({
    id: img.id || makeId('img'),
    url: img.url,
    alt: img.alt ?? null,
    isCover: typeof img.isCover === 'boolean' ? img.isCover : index === 0,
    order: typeof img.order === 'number' ? img.order : index,
    propertyId,
  }));
}

async function buildAmenities(
  propertyId: string,
  amenityIds: string[] | undefined,
  existing: PropertyAmenity[]
): Promise<PropertyAmenity[]> {
  if (!amenityIds) return existing;
  const amenities = await getAmenitiesByIds(amenityIds);
  return amenities.map((amenity) => ({
    id: makeId('pam'),
    propertyId,
    amenityId: amenity.id,
    amenity,
  }));
}

async function buildStoredProperty(
  propertyId: string,
  input: PropertyWriteInput,
  existing?: Property
): Promise<Record<string, unknown>> {
  const location = await getLocationSnapshot({
    countryId: input.countryId,
    regionId: input.regionId,
    cityId: input.cityId,
  });
  const agent = await buildAgentSnapshot(input.agentId ?? null);
  const images = normalizeImages(propertyId, input.images, existing?.images ?? []);
  const amenities = await buildAmenities(propertyId, input.amenityIds, existing?.amenities ?? []);
  const createdAt = existing?.createdAt ?? nowIso();

  return cleanUndefined({
    id: propertyId,
    title: input.title,
    slug: input.slug || existing?.slug || createSlug(input.title),
    description: input.description,
    price: asNumber(input.price, 0),
    listingType: input.listingType,
    propertyType: input.propertyType,
    status: input.status || existing?.status || 'AVAILABLE',
    area: asNumber(input.area, 0),
    bedrooms: asNullableNumber(input.bedrooms),
    bathrooms: asNullableNumber(input.bathrooms),
    floors: asNullableNumber(input.floors),
    yearBuilt: asNullableNumber(input.yearBuilt),
    isFeatured: typeof input.isFeatured === 'boolean' ? input.isFeatured : (existing?.isFeatured ?? false),
    views: existing?.views ?? 0,
    countryId: location.country.id,
    regionId: location.region.id,
    cityId: location.city.id,
    address: input.address ?? null,
    latitude: asNullableNumber(input.latitude),
    longitude: asNullableNumber(input.longitude),
    agentId: input.agentId ?? null,
    createdAt,
    updatedAt: nowIso(),
    country: location.country,
    region: location.region,
    city: location.city,
    agent,
    images,
    amenities,
    countryName: location.country.name,
    regionName: location.region.name,
    cityName: location.city.name,
    countryCode: location.country.code,
    currencySymbol: location.country.currencySymbol ?? '$',
  });
}

export async function createPropertyInFirestore(input: PropertyWriteInput): Promise<Property> {
  const id = makeId('prop');
  const payload = await buildStoredProperty(id, input);
  await propertyCol().doc(id).set(payload);
  return firestoreDocToProperty(id, payload);
}

export async function updatePropertyInFirestore(
  id: string,
  input: Partial<PropertyWriteInput>
): Promise<Property | null> {
  const existing = await getPropertyFromFirestore(id, true);
  if (!existing) return null;
  const merged: PropertyWriteInput = {
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    price: input.price ?? existing.price,
    listingType: input.listingType ?? existing.listingType,
    propertyType: input.propertyType ?? existing.propertyType,
    area: input.area ?? existing.area,
    bedrooms: input.bedrooms ?? existing.bedrooms,
    bathrooms: input.bathrooms ?? existing.bathrooms,
    floors: input.floors ?? existing.floors,
    yearBuilt: input.yearBuilt ?? existing.yearBuilt,
    isFeatured: input.isFeatured ?? existing.isFeatured,
    status: input.status ?? existing.status,
    countryId: input.countryId ?? existing.countryId,
    regionId: input.regionId ?? existing.regionId,
    cityId: input.cityId ?? existing.cityId,
    address: input.address ?? existing.address,
    latitude: input.latitude ?? existing.latitude,
    longitude: input.longitude ?? existing.longitude,
    agentId: input.agentId ?? existing.agentId,
    images: input.images ?? existing.images,
    amenityIds: input.amenityIds,
    slug: input.slug ?? existing.slug,
  };
  const payload = await buildStoredProperty(id, merged, existing);
  await propertyCol().doc(id).set(payload);
  return firestoreDocToProperty(id, payload);
}

async function deleteByForeignKey(collectionName: string, field: string, value: string) {
  const snap = await col(collectionName as typeof FIRESTORE_COLLECTIONS[keyof typeof FIRESTORE_COLLECTIONS])
    .where(field, '==', value)
    .get();
  if (snap.empty) return;
  const batch = propertyCol().firestore.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export async function deletePropertyInFirestore(id: string): Promise<boolean> {
  const ref = propertyCol().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await Promise.all([
    deleteByForeignKey(FIRESTORE_COLLECTIONS.favorites, 'propertyId', id),
    deleteByForeignKey(FIRESTORE_COLLECTIONS.inquiries, 'propertyId', id),
    deleteByForeignKey(FIRESTORE_COLLECTIONS.propertyReviews, 'propertyId', id),
  ]);
  await ref.delete();
  return true;
}

export async function clearAgentFromProperties(agentId: string): Promise<void> {
  const snap = await propertyCol().where('agentId', '==', agentId).get();
  if (snap.empty) return;
  const batch = propertyCol().firestore.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      agentId: null,
      agent: null,
      updatedAt: nowIso(),
    });
  });
  await batch.commit();
}

export async function refreshPropertiesForAgent(agentId: string): Promise<void> {
  const snap = await propertyCol().where('agentId', '==', agentId).get();
  if (snap.empty) return;
  const agent = await buildAgentSnapshot(agentId);
  const batch = propertyCol().firestore.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      agent: agent ?? null,
      updatedAt: nowIso(),
    });
  });
  await batch.commit();
}

export async function refreshPropertiesForCountry(countryId: string): Promise<void> {
  const snap = await propertyCol().where('countryId', '==', countryId).get();
  if (snap.empty) return;
  for (const doc of snap.docs) {
    const row = firestoreDocToProperty(doc.id, doc.data() as Record<string, unknown>);
    const location = await getLocationSnapshot({
      countryId: row.countryId,
      regionId: row.regionId,
      cityId: row.cityId,
    });
    await doc.ref.update({
      country: location.country,
      region: location.region,
      city: location.city,
      countryName: location.country.name,
      regionName: location.region.name,
      cityName: location.city.name,
      countryCode: location.country.code,
      currencySymbol: location.country.currencySymbol ?? '$',
      updatedAt: nowIso(),
    });
  }
}
