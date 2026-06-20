import { randomUUID } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreDb } from '@/lib/firebase-admin';
import type {
  Agent,
  Amenity,
  City,
  Company,
  Country,
  Region,
  User,
  UserRole,
} from '@/types';

export const FIRESTORE_COLLECTIONS = {
  amenities: 'amenities',
  agents: 'agents',
  banners: 'banners',
  companies: 'companies',
  contactMessages: 'contactMessages',
  countries: 'countries',
  favorites: 'favorites',
  featureToggles: 'featureToggles',
  inquiries: 'inquiries',
  inquiryAutoReplies: 'inquiryAutoReplies',
  newsItems: 'newsItems',
  properties: process.env.FIRESTORE_PROPERTIES_COLLECTION?.trim() || 'properties',
  propertyReviews: 'propertyReviews',
  siteSettings: 'siteSettings',
  users: 'users',
  transactions: 'transactions',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];

export type StoredCity = City & {
  latitude?: number | null;
  longitude?: number | null;
};

export type StoredRegion = Region & {
  cities?: StoredCity[];
  createdAt?: string;
};

export type StoredCountry = Country & {
  createdAt?: string;
  updatedAt?: string;
  regions?: StoredRegion[];
};

export function db() {
  return getFirestoreDb();
}

export function col(name: FirestoreCollectionName) {
  return db().collection(name);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function makeId(prefix?: string): string {
  return prefix ? `${prefix}-${randomUUID()}` : randomUUID();
}

export function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string' && value) return value;
  if (value instanceof Date) return value.toISOString();
  return nowIso();
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : null;
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  return fallback;
}

export function cleanUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as T;
}

/** Recursively remove undefined values (required for Firestore nested documents). */
export function deepCleanUndefined<T>(input: T): T {
  if (input === undefined) return input;
  if (input === null || typeof input !== 'object') return input;
  if (input instanceof Date) return input;
  if (Array.isArray(input)) {
    return input.map((item) => deepCleanUndefined(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === undefined) continue;
    out[key] = deepCleanUndefined(value);
  }
  return out as T;
}

export function sortByCreatedDesc<T extends { createdAt?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => toIso(b.createdAt) > toIso(a.createdAt) ? 1 : -1);
}

/** Strip sensitive fields before sending user data to the client. */
export function sanitizeUserForApi<T extends { password?: string | null }>(user: T): Omit<T, 'password'> {
  const { password: _password, ...safe } = user;
  return safe;
}

export function userDocToUser(
  id: string,
  raw: Record<string, unknown>,
  agent?: Agent
): User {
  return {
    id,
    email: asString(raw.email),
    name: asNullableString(raw.name),
    password: asNullableString(raw.password),
    phone: asNullableString(raw.phone),
    avatar: asNullableString(raw.avatar),
    role: (raw.role as UserRole) ?? 'USER',
    isActive: asBoolean(raw.isActive, true),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
    ...(agent ? { agent } : {}),
  };
}

export function companyDocToCompany(id: string, raw: Record<string, unknown>): Company {
  return {
    id,
    name: asString(raw.name),
    logo: asNullableString(raw.logo),
    description: asNullableString(raw.description),
    phone: asNullableString(raw.phone),
    email: asNullableString(raw.email),
    website: asNullableString(raw.website),
    address: asNullableString(raw.address),
    founded: asNullableNumber(raw.founded),
    agentCount: asNumber(raw.agentCount, 0),
    listingCount: asNumber(raw.listingCount, 0),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export function cityDocToCity(raw: Record<string, unknown>): StoredCity {
  return {
    id: asString(raw.id),
    name: asString(raw.name),
    regionId: asString(raw.regionId),
    latitude: asNullableNumber(raw.latitude),
    longitude: asNullableNumber(raw.longitude),
  };
}

export function regionDocToRegion(raw: Record<string, unknown>): StoredRegion {
  return {
    id: asString(raw.id),
    name: asString(raw.name),
    countryId: asString(raw.countryId),
    createdAt: toIso(raw.createdAt),
    cities: Array.isArray(raw.cities)
      ? raw.cities.map((city) => cityDocToCity((city ?? {}) as Record<string, unknown>))
      : [],
  };
}

export function countryDocToCountry(id: string, raw: Record<string, unknown>): StoredCountry {
  return {
    id,
    name: asString(raw.name),
    code: asString(raw.code),
    flag: asNullableString(raw.flag),
    currency: asNullableString(raw.currency),
    currencySymbol: asNullableString(raw.currencySymbol),
    isActive: asBoolean(raw.isActive, true),
    isFeatured: asBoolean(raw.isFeatured, false),
    description: asNullableString(raw.description),
    displayOrder: asNumber(raw.displayOrder, 0),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
    regions: Array.isArray(raw.regions)
      ? raw.regions.map((region) => regionDocToRegion((region ?? {}) as Record<string, unknown>))
      : [],
  };
}

export function amenityDocToAmenity(id: string, raw: Record<string, unknown>): Amenity {
  return {
    id,
    name: asString(raw.name),
    icon: asNullableString(raw.icon),
    category: asNullableString(raw.category),
  };
}

export async function getAllAmenities(): Promise<Amenity[]> {
  const snap = await col(FIRESTORE_COLLECTIONS.amenities).get();
  return snap.docs
    .map((doc) => amenityDocToAmenity(doc.id, doc.data() as Record<string, unknown>))
    .sort((a, b) => {
      const catA = a.category ?? '';
      const catB = b.category ?? '';
      if (catA === catB) return a.name.localeCompare(b.name);
      return catA.localeCompare(catB);
    });
}

export async function getAmenitiesByIds(ids: string[]): Promise<Amenity[]> {
  const all = await getAllAmenities();
  const wanted = new Set(ids);
  return all.filter((item) => wanted.has(item.id));
}

export async function getAllCompanies(): Promise<Company[]> {
  const snap = await col(FIRESTORE_COLLECTIONS.companies).get();
  return snap.docs
    .map((doc) => companyDocToCompany(doc.id, doc.data() as Record<string, unknown>))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCompanyById(id: string | null | undefined): Promise<Company | null> {
  if (!id) return null;
  const snap = await col(FIRESTORE_COLLECTIONS.companies).doc(id).get();
  if (!snap.exists) return null;
  return companyDocToCompany(snap.id, snap.data() as Record<string, unknown>);
}

export async function getAllCountries(
  options?: { includeInactive?: boolean }
): Promise<StoredCountry[]> {
  const snap = await col(FIRESTORE_COLLECTIONS.countries).get();
  let rows = snap.docs.map((doc) =>
    countryDocToCountry(doc.id, doc.data() as Record<string, unknown>)
  );
  if (!options?.includeInactive) {
    rows = rows.filter((country) => country.isActive !== false);
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCountryById(id: string): Promise<StoredCountry | null> {
  const snap = await col(FIRESTORE_COLLECTIONS.countries).doc(id).get();
  if (!snap.exists) return null;
  return countryDocToCountry(snap.id, snap.data() as Record<string, unknown>);
}

export async function getLocationSnapshot(input: {
  countryId: string;
  regionId: string;
  cityId: string;
}): Promise<{ country: Country; region: Region; city: City }> {
  const country = await getCountryById(input.countryId);
  if (!country) {
    throw new Error('Country not found');
  }

  const region = country.regions?.find((item) => item.id === input.regionId);
  if (!region) {
    throw new Error('Region not found');
  }

  const city = region.cities?.find((item) => item.id === input.cityId);
  if (!city) {
    throw new Error('City not found');
  }

  return {
    country: {
      id: country.id,
      name: country.name,
      code: country.code,
      flag: country.flag ?? null,
      currency: country.currency ?? null,
      currencySymbol: country.currencySymbol ?? null,
      isActive: country.isActive,
      isFeatured: country.isFeatured ?? false,
      regions: undefined,
    },
    region: {
      id: region.id,
      name: region.name,
      countryId: region.countryId,
      cities: undefined,
    },
    city: {
      id: city.id,
      name: city.name,
      regionId: city.regionId,
    },
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const snap = await col(FIRESTORE_COLLECTIONS.users).doc(id).get();
  if (!snap.exists) return null;
  return userDocToUser(snap.id, snap.data() as Record<string, unknown>);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const snap = await col(FIRESTORE_COLLECTIONS.users)
    .where('email', '==', normalized)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return userDocToUser(doc.id, doc.data() as Record<string, unknown>);
}

export async function getRawUserById(id: string): Promise<Record<string, unknown> | null> {
  const snap = await col(FIRESTORE_COLLECTIONS.users).doc(id).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : null;
}

export async function getRawAgentById(id: string): Promise<Record<string, unknown> | null> {
  const snap = await col(FIRESTORE_COLLECTIONS.agents).doc(id).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : null;
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const raw = await getRawAgentById(id);
  if (!raw) return null;
  const user = await getUserById(asString(raw.userId));
  const company = await getCompanyById(asNullableString(raw.companyId));
  return {
    id,
    userId: asString(raw.userId),
    user: user ?? undefined,
    bio: asNullableString(raw.bio),
    title: asNullableString(raw.title),
    license: asNullableString(raw.license),
    phone: asNullableString(raw.phone),
    whatsapp: asNullableString(raw.whatsapp),
    experience: asNullableNumber(raw.experience),
    rating: asNumber(raw.rating, 0),
    totalListings: asNumber(raw.totalListings, 0),
    totalSales: asNumber(raw.totalSales, 0),
    verified: asBoolean(raw.verified, false),
    companyId: asNullableString(raw.companyId),
    company: company ?? undefined,
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export async function getAllAgents(): Promise<Agent[]> {
  const snap = await col(FIRESTORE_COLLECTIONS.agents).get();
  const rows = await Promise.all(snap.docs.map((doc) => getAgentById(doc.id)));
  return rows.filter(Boolean) as Agent[];
}

export async function buildAgentSnapshot(agentId: string | null | undefined): Promise<Agent | undefined> {
  if (!agentId) return undefined;
  const agent = await getAgentById(agentId);
  return agent ?? undefined;
}

export async function mapIds<T>(
  ids: string[],
  loader: (id: string) => Promise<T | null>
): Promise<T[]> {
  const rows = await Promise.all(ids.map((id) => loader(id)));
  return rows.filter(Boolean) as T[];
}
