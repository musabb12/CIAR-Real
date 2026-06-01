import { expandInquiryReplyTemplate } from '@/lib/inquiry-replies';
import type { Query as FirestoreQuery } from 'firebase-admin/firestore';
import {
  getCachedRead,
  getStaleCachedRead,
  invalidateCachedReadPrefix,
  isFirestoreQuotaError,
  setCachedRead,
} from '@/lib/firestore-read-cache';
import {
  normalizeAdminPermissions,
  normalizeAdminTasks,
  AGENT_ADMIN_PERMISSIONS,
  COMPANY_ADMIN_PERMISSIONS,
} from '@/lib/admin-entity-permissions';
import {
  FIRESTORE_COLLECTIONS,
  asBoolean,
  asNullableNumber,
  asNullableString,
  asNumber,
  asString,
  cleanUndefined,
  col,
  countryDocToCountry,
  getAllAgents,
  getAllAmenities,
  getAllCompanies,
  getAllCountries,
  getCompanyById,
  getCountryById,
  getLocationSnapshot,
  getRawAgentById,
  getRawUserById,
  getUserByEmail as getUserByEmailFromFirestoreShared,
  getUserById,
  makeId,
  nowIso,
  regionDocToRegion,
  sortByCreatedDesc,
  toIso,
  userDocToUser,
} from '@/lib/firestore-shared';
import {
  clearAgentFromProperties,
  deletePropertyInFirestore,
  getPropertyFromFirestore,
  listAllPropertiesFromFirestore,
  refreshPropertiesForAgent,
  refreshPropertiesForCountry,
} from '@/lib/firestore-properties';
import type {
  AccountType,
  Agent,
  Banner,
  Company,
  ContactMessage,
  Favorite,
  FeatureToggle,
  Inquiry,
  InquiryAutoReply,
  Property,
  PropertyReview,
  SiteContentSettings,
  SiteDesignSettings,
  SiteSocialSettings,
  User,
  UserRole,
  PropertyType,
} from '@/types';

const STATS_PROPERTY_TYPES: PropertyType[] = [
  'APARTMENT',
  'VILLA',
  'HOUSE',
  'LAND',
  'OFFICE',
  'COMMERCIAL',
  'STUDIO',
  'PENTHOUSE',
  'TOWNHOUSE',
  'DUPLEX',
];

const STATS_INQUIRY_STATUSES = ['NEW', 'READ', 'REPLIED', 'CLOSED'] as const;

function propertyStatsCol() {
  return col(FIRESTORE_COLLECTIONS.properties);
}

async function safeFirestoreCount(query: FirestoreQuery): Promise<number> {
  try {
    const snap = await query.count().get();
    return snap.data().count;
  } catch (err) {
    if (isFirestoreQuotaError(err)) return 0;
    throw err;
  }
}

async function sumPropertyViewsFromSample(limit = 400): Promise<number> {
  try {
    const snap = await propertyStatsCol().select('views').limit(limit).get();
    return snap.docs.reduce((sum, doc) => sum + asNumber(doc.data().views, 0), 0);
  } catch (err) {
    if (isFirestoreQuotaError(err)) return 0;
    throw err;
  }
}

async function fetchRecentInquiriesForStats() {
  try {
    const snap = await inquiryCollection()
      .orderBy('createdAt', 'desc')
      .limit(10)
      .select('name', 'email', 'message', 'status', 'createdAt')
      .get();
    return snap.docs.map((doc) => {
      const raw = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        name: asString(raw.name),
        email: asString(raw.email),
        message: asString(raw.message),
        status: asString(raw.status, 'NEW'),
        createdAt: toIso(raw.createdAt),
      };
    });
  } catch (err) {
    if (isFirestoreQuotaError(err)) return [];
    throw err;
  }
}

const SETTINGS_KEY = 'global-site-settings';

export const defaultDesignSettings: SiteDesignSettings = {
  primaryColor: '#0D9488',
  accentColor: '#F59E0B',
  heroImageUrl:
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80&auto=format&fit=crop',
  newsTickerBackground: '',
  newsTickerTextColor: '',
  newsTickerFontSizePx: 12,
  newsTickerHeightPx: 40,
  newsTickerLabelTextColor: '',
  newsTickerLabelBackground: '',
  newsTickerSeparatorColor: '',
};

export const defaultContentSettings: SiteContentSettings = {
  home: {},
  search: {},
  agents: {},
  contact: {},
  favorites: {},
  login: {},
  register: {},
  'admin-login': {},
};

export const defaultSocialSettings: SiteSocialSettings = {
  website: '',
  email: '',
  phone: '',
  whatsapp: '',
  telegram: '',
  facebook: '',
  instagram: '',
  x: '',
  youtube: '',
  linkedin: '',
  tiktok: '',
};

export type SiteSettingsPayload = {
  designSettings: SiteDesignSettings;
  contentSettings: SiteContentSettings;
  socialSettings: SiteSocialSettings;
};

type NewsItem = {
  id: string;
  content: string;
  link: string | null;
  type: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

function userCollection() {
  return col(FIRESTORE_COLLECTIONS.users);
}

function agentCollection() {
  return col(FIRESTORE_COLLECTIONS.agents);
}

function companyCollection() {
  return col(FIRESTORE_COLLECTIONS.companies);
}

function countryCollection() {
  return col(FIRESTORE_COLLECTIONS.countries);
}

function favoriteCollection() {
  return col(FIRESTORE_COLLECTIONS.favorites);
}

function inquiryCollection() {
  return col(FIRESTORE_COLLECTIONS.inquiries);
}

function inquiryAutoReplyCollection() {
  return col(FIRESTORE_COLLECTIONS.inquiryAutoReplies);
}

function reviewCollection() {
  return col(FIRESTORE_COLLECTIONS.propertyReviews);
}

function bannerCollection() {
  return col(FIRESTORE_COLLECTIONS.banners);
}

function newsCollection() {
  return col(FIRESTORE_COLLECTIONS.newsItems);
}

function featureCollection() {
  return col(FIRESTORE_COLLECTIONS.featureToggles);
}

function siteSettingsCollection() {
  return col(FIRESTORE_COLLECTIONS.siteSettings);
}

function contactCollection() {
  return col(FIRESTORE_COLLECTIONS.contactMessages);
}

async function queryDeleteByField(collectionName: keyof typeof FIRESTORE_COLLECTIONS, field: string, value: string) {
  const snap = await col(FIRESTORE_COLLECTIONS[collectionName]).where(field, '==', value).get();
  if (snap.empty) return;
  const batch = col(FIRESTORE_COLLECTIONS[collectionName]).firestore.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function countByField(collectionName: keyof typeof FIRESTORE_COLLECTIONS, field: string, value: string) {
  const snap = await col(FIRESTORE_COLLECTIONS[collectionName]).where(field, '==', value).get();
  return snap.size;
}

export async function getAgentForUser(userId: string): Promise<Agent | undefined> {
  const snap = await agentCollection().where('userId', '==', userId).limit(1).get();
  if (snap.empty) return undefined;
  const agentId = snap.docs[0].id;
  const raw = snap.docs[0].data() as Record<string, unknown>;
  const user = await getUserById(userId);
  const company = await getCompanyById(asNullableString(raw.companyId));
  return {
    id: agentId,
    userId,
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

async function buildUserResponse(id: string, raw: Record<string, unknown>) {
  const agent = await getAgentForUser(id);
  const favoriteCount = await countByField('favorites', 'userId', id);
  const inquiryCount = await countByField('inquiries', 'userId', id);
  return {
    ...userDocToUser(id, raw, agent),
    _count: {
      favorites: favoriteCount,
      inquiries: inquiryCount,
    },
  };
}

async function buildAgentResponse(
  id: string,
  raw: Record<string, unknown>
): Promise<Agent & { _count: { properties: number } }> {
  const user = await getUserById(asString(raw.userId));
  const company = await getCompanyById(asNullableString(raw.companyId));
  const propertiesCount = await countByField('properties', 'agentId', id);
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
    totalListings: asNumber(raw.totalListings, propertiesCount),
    totalSales: asNumber(raw.totalSales, 0),
    verified: asBoolean(raw.verified, false),
    companyId: asNullableString(raw.companyId),
    company: company ?? undefined,
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
    _count: {
      properties: propertiesCount,
    },
  };
}

function normalizeSiteSettings(input: unknown): SiteSettingsPayload {
  const value = (input ?? {}) as Partial<SiteSettingsPayload>;
  return {
    designSettings: {
      ...defaultDesignSettings,
      ...(value.designSettings ?? {}),
    },
    contentSettings: {
      ...defaultContentSettings,
      ...(value.contentSettings ?? {}),
    },
    socialSettings: {
      ...defaultSocialSettings,
      ...(value.socialSettings ?? {}),
    },
  };
}

export async function listUsersFromFirestore(role?: string | null) {
  const snap = await userCollection().get();
  const rows = await Promise.all(
    snap.docs.map(async (doc) => buildUserResponse(doc.id, doc.data() as Record<string, unknown>))
  );
  let filtered = rows;
  if (role) {
    filtered = filtered.filter((row) => row.role === role);
  }
  return sortByCreatedDesc(filtered);
}

export async function getUserByEmail(email: string) {
  return getUserByEmailFromFirestoreShared(email);
}

export async function getUserDetailFromFirestore(id: string) {
  const raw = await getRawUserById(id);
  if (!raw) return null;
  return buildUserResponse(id, raw);
}

export async function createUserInFirestore(input: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: UserRole;
  isActive?: boolean;
}) {
  const id = makeId('user');
  const payload = {
    id,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    phone: input.phone?.trim() || null,
    avatar: null,
    role: input.role ?? 'USER',
    isActive: input.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await userCollection().doc(id).set(payload);
  return userDocToUser(id, payload);
}

export async function updateUserInFirestore(
  id: string,
  input: {
    name?: string | null;
    phone?: string | null;
    avatar?: string | null;
    isActive?: boolean;
    role?: UserRole;
    password?: string | null;
  }
) {
  const existing = await getRawUserById(id);
  if (!existing) return null;
  const updateData = cleanUndefined({
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.password !== undefined ? { password: input.password } : {}),
    updatedAt: nowIso(),
  });
  await userCollection().doc(id).update(updateData);
  const updated = await getUserDetailFromFirestore(id);
  const agent = await getAgentForUser(id);
  if (agent) {
    await refreshPropertiesForAgent(agent.id);
  }
  return updated;
}

export async function deleteUserInFirestore(id: string) {
  const existing = await getRawUserById(id);
  if (!existing) return false;
  const agent = await getAgentForUser(id);
  if (agent) {
    await clearAgentFromProperties(agent.id);
    await agentCollection().doc(agent.id).delete();
  }
  await Promise.all([
    queryDeleteByField('favorites', 'userId', id),
    queryDeleteByField('inquiries', 'userId', id),
    queryDeleteByField('propertyReviews', 'userId', id),
  ]);
  await userCollection().doc(id).delete();
  return true;
}

export async function listAgentsFromFirestore(countryId?: string | null) {
  const snap = await agentCollection().get();
  let rows = await Promise.all(
    snap.docs.map(async (doc) => buildAgentResponse(doc.id, doc.data() as Record<string, unknown>))
  );
  if (countryId) {
    const properties = await listAllPropertiesFromFirestore();
    const allowed = new Set(
      properties
        .filter((property) => property.countryId === countryId && property.agentId)
        .map((property) => property.agentId as string)
    );
    rows = rows.filter((agent) => allowed.has(agent.id));
  }
  return rows.sort((a, b) => b.rating - a.rating);
}

export async function getAgentDetailFromFirestore(id: string) {
  const raw = await getRawAgentById(id);
  if (!raw) return null;
  const agent = await buildAgentResponse(id, raw);
  const properties = (await listAllPropertiesFromFirestore())
    .filter((property) => property.agentId === id)
    .slice(0, 10);
  return {
    ...agent,
    properties,
  };
}

export async function updateAgentInFirestore(
  id: string,
  input: Partial<{
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
    adminPermissions: Record<string, boolean>;
    adminTasks: string[];
  }>
) {
  const existing = await getRawAgentById(id);
  if (!existing) return null;
  const payload = cleanUndefined({
    ...input,
    updatedAt: nowIso(),
  });
  await agentCollection().doc(id).update(payload);
  await refreshPropertiesForAgent(id);
  return getAgentDetailFromFirestore(id);
}

export async function deleteAgentInFirestore(id: string) {
  const existing = await getRawAgentById(id);
  if (!existing) return false;
  await clearAgentFromProperties(id);
  await agentCollection().doc(id).delete();
  return true;
}

export async function listCompaniesFromFirestore() {
  const [companies, agents, properties] = await Promise.all([
    getAllCompanies(),
    getAllAgents(),
    listAllPropertiesFromFirestore(),
  ]);
  return companies.map((company) => {
    const agentIds = new Set(
      agents.filter((agent) => agent.companyId === company.id).map((agent) => agent.id)
    );
    const listingCount = properties.filter(
      (property) => property.agentId && agentIds.has(property.agentId)
    ).length;
    return {
      ...company,
      agentCount: agentIds.size,
      listingCount,
      _count: {
        agents: agentIds.size,
      },
    };
  });
}

async function getRawCompanyById(id: string) {
  const snap = await companyCollection().doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as Record<string, unknown>;
}

export async function getCompanyDetailFromFirestore(id: string) {
  const raw = await getRawCompanyById(id);
  if (!raw) return null;
  const company = await getCompanyById(id);
  if (!company) return null;
  const agents = (await getAllAgents()).filter((agent) => agent.companyId === id);
  const properties = (await listAllPropertiesFromFirestore()).filter((property) =>
    property.agentId ? agents.some((a) => a.id === property.agentId) : false
  );
  return {
    ...company,
    adminPermissions: normalizeAdminPermissions(raw.adminPermissions, COMPANY_ADMIN_PERMISSIONS),
    adminTasks: normalizeAdminTasks(raw.adminTasks),
    agents: agents.slice(0, 24),
    listingCount: properties.length,
    agentCount: agents.length,
    _count: { agents: agents.length },
  };
}

export async function updateCompanyInFirestore(
  id: string,
  input: Partial<{
    name: string;
    logo: string | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    founded: number | null;
    adminPermissions: Record<string, boolean>;
    adminTasks: string[];
  }>
) {
  const existing = await getRawCompanyById(id);
  if (!existing) return null;
  const payload = cleanUndefined({
    ...input,
    updatedAt: nowIso(),
  });
  await companyCollection().doc(id).update(payload);
  return getCompanyDetailFromFirestore(id);
}

export async function listLocationsFromFirestore(options?: {
  includeProperties?: boolean;
  includeInactive?: boolean;
}) {
  const countries = await getAllCountries({
    includeInactive: options?.includeInactive,
  });
  if (!options?.includeProperties) return countries;

  const properties = await listAllPropertiesFromFirestore();
  const countryCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();

  for (const property of properties) {
    countryCounts.set(property.countryId, (countryCounts.get(property.countryId) || 0) + 1);
    regionCounts.set(property.regionId, (regionCounts.get(property.regionId) || 0) + 1);
    cityCounts.set(property.cityId, (cityCounts.get(property.cityId) || 0) + 1);
  }

  return countries.map((country) => ({
    ...country,
    _count: { properties: countryCounts.get(country.id) || 0 },
    regions: (country.regions ?? []).map((region) => ({
      ...region,
      _count: { properties: regionCounts.get(region.id) || 0 },
      cities: (region.cities ?? []).map((city) => ({
        ...city,
        _count: { properties: cityCounts.get(city.id) || 0 },
      })),
    })),
  }));
}

export async function createCountryInFirestore(input: {
  name: string;
  code: string;
  flag?: string | null;
  currency?: string | null;
  currencySymbol?: string | null;
}) {
  const id = makeId('country');
  const payload = {
    name: input.name,
    code: input.code.toUpperCase(),
    flag: input.flag ?? null,
    currency: input.currency ?? null,
    currencySymbol: input.currencySymbol ?? null,
    isActive: true,
    isFeatured: false,
    regions: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await countryCollection().doc(id).set(payload);
  return countryDocToCountry(id, payload);
}

export async function updateCountryInFirestore(
  id: string,
  input: Partial<{
    name: string;
    code: string;
    flag: string | null;
    currency: string | null;
    currencySymbol: string | null;
    isActive: boolean;
    isFeatured: boolean;
  }>
) {
  const existing = await getCountryById(id);
  if (!existing) return null;
  const payload = cleanUndefined({
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.code !== undefined ? { code: String(input.code).toUpperCase() } : {}),
    ...(input.flag !== undefined ? { flag: input.flag } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    ...(input.currencySymbol !== undefined ? { currencySymbol: input.currencySymbol } : {}),
    ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
    ...(typeof input.isFeatured === 'boolean' ? { isFeatured: input.isFeatured } : {}),
    updatedAt: nowIso(),
  });
  await countryCollection().doc(id).update(payload);
  await refreshPropertiesForCountry(id);
  return getCountryById(id);
}

export async function deleteCountryInFirestore(id: string) {
  const linkedProperties = (await listAllPropertiesFromFirestore()).filter(
    (property) => property.countryId === id
  ).length;
  if (linkedProperties > 0) {
    throw new Error(
      'This country still has properties assigned to it. Turn off the country instead of deleting it.'
    );
  }
  await countryCollection().doc(id).delete();
}

async function persistCountryRegions(
  countryId: string,
  regions: NonNullable<Awaited<ReturnType<typeof getCountryById>>>['regions'],
) {
  await countryCollection().doc(countryId).update({
    regions: regions ?? [],
    updatedAt: nowIso(),
  });
}

export async function createRegionInCountry(countryId: string, name: string) {
  const country = await getCountryById(countryId);
  if (!country) return null;
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Region name is required');

  const region = {
    id: makeId('region'),
    name: trimmed,
    countryId,
    createdAt: nowIso(),
    cities: [] as Array<{ id: string; name: string; regionId: string }>,
  };
  const regions = [...(country.regions ?? []), region];
  await persistCountryRegions(countryId, regions);
  return regionDocToRegion(region as unknown as Record<string, unknown>);
}

export async function updateRegionInCountry(
  countryId: string,
  regionId: string,
  input: { name: string },
) {
  const country = await getCountryById(countryId);
  if (!country) return null;
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error('Region name is required');

  const regions = (country.regions ?? []).map((r) =>
    r.id === regionId ? { ...r, name: trimmed } : r,
  );
  if (!regions.some((r) => r.id === regionId)) return null;

  await persistCountryRegions(countryId, regions);
  await refreshPropertiesForCountry(countryId);
  return regions.find((r) => r.id === regionId) ?? null;
}

export async function deleteRegionFromCountry(countryId: string, regionId: string) {
  const linked = (await listAllPropertiesFromFirestore()).filter(
    (p) => p.regionId === regionId,
  ).length;
  if (linked > 0) {
    throw new Error(
      'This region still has properties assigned to it. Remove or reassign listings first.',
    );
  }

  const country = await getCountryById(countryId);
  if (!country) return false;
  const regions = (country.regions ?? []).filter((r) => r.id !== regionId);
  if (regions.length === (country.regions ?? []).length) return false;

  await persistCountryRegions(countryId, regions);
  return true;
}

export async function createCityInRegion(
  countryId: string,
  regionId: string,
  name: string,
) {
  const country = await getCountryById(countryId);
  if (!country) return null;
  const trimmed = name.trim();
  if (!trimmed) throw new Error('City name is required');

  let created: { id: string; name: string; regionId: string } | null = null;
  const regions = (country.regions ?? []).map((r) => {
    if (r.id !== regionId) return r;
    const city = { id: makeId('city'), name: trimmed, regionId };
    created = city;
    return { ...r, cities: [...(r.cities ?? []), city] };
  });

  if (!created) return null;
  await persistCountryRegions(countryId, regions);
  return created;
}

export async function updateCityInRegion(
  countryId: string,
  regionId: string,
  cityId: string,
  input: { name: string },
) {
  const country = await getCountryById(countryId);
  if (!country) return null;
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error('City name is required');

  let updated: { id: string; name: string; regionId: string } | null = null;
  const regions = (country.regions ?? []).map((r) => {
    if (r.id !== regionId) return r;
    const cities = (r.cities ?? []).map((c) => {
      if (c.id !== cityId) return c;
      updated = { ...c, name: trimmed };
      return updated;
    });
    return { ...r, cities };
  });

  if (!updated) return null;
  await persistCountryRegions(countryId, regions);
  await refreshPropertiesForCountry(countryId);
  return updated;
}

export async function deleteCityFromRegion(
  countryId: string,
  regionId: string,
  cityId: string,
) {
  const linked = (await listAllPropertiesFromFirestore()).filter(
    (p) => p.cityId === cityId,
  ).length;
  if (linked > 0) {
    throw new Error(
      'This city still has properties assigned to it. Remove or reassign listings first.',
    );
  }

  const country = await getCountryById(countryId);
  if (!country) return false;

  let removed = false;
  const regions = (country.regions ?? []).map((r) => {
    if (r.id !== regionId) return r;
    const cities = (r.cities ?? []).filter((c) => {
      if (c.id === cityId) {
        removed = true;
        return false;
      }
      return true;
    });
    return { ...r, cities };
  });

  if (!removed) return false;
  await persistCountryRegions(countryId, regions);
  return true;
}

export async function listAmenitiesFromFirestore() {
  return getAllAmenities();
}

async function buildFavoriteResponse(
  id: string,
  raw: Record<string, unknown>,
  includeUser = false
) {
  const property = await getPropertyFromFirestore(asString(raw.propertyId), true);
  const user = includeUser ? await getUserById(asString(raw.userId)) : null;
  return {
    id,
    userId: asString(raw.userId),
    propertyId: asString(raw.propertyId),
    createdAt: toIso(raw.createdAt),
    property: property ?? undefined,
    ...(includeUser ? { user: user ?? undefined } : {}),
  };
}

export async function listFavoritesForUser(userId: string) {
  const snap = await favoriteCollection().where('userId', '==', userId).get();
  const rows = await Promise.all(
    snap.docs.map((doc) => buildFavoriteResponse(doc.id, doc.data() as Record<string, unknown>))
  );
  return sortByCreatedDesc(rows);
}

export async function addFavoriteInFirestore(userId: string, propertyId: string) {
  const property = await getPropertyFromFirestore(propertyId, true);
  if (!property) throw new Error('Property not found');

  const existing = await favoriteCollection()
    .where('userId', '==', userId)
    .where('propertyId', '==', propertyId)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new Error('Property already in favorites');
  }

  const id = makeId('fav');
  const payload = {
    userId,
    propertyId,
    createdAt: nowIso(),
  };
  await favoriteCollection().doc(id).set(payload);
  return buildFavoriteResponse(id, payload);
}

export async function removeFavoriteInFirestore(userId: string, propertyId: string) {
  const snap = await favoriteCollection()
    .where('userId', '==', userId)
    .where('propertyId', '==', propertyId)
    .limit(1)
    .get();
  if (snap.empty) return false;
  await snap.docs[0].ref.delete();
  return true;
}

export async function listAllFavoritesForAdmin() {
  const snap = await favoriteCollection().get();
  const rows = await Promise.all(
    snap.docs.map((doc) =>
      buildFavoriteResponse(doc.id, doc.data() as Record<string, unknown>, true)
    )
  );
  return sortByCreatedDesc(rows);
}

export async function deleteFavoriteByIdInFirestore(id: string) {
  const ref = favoriteCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

async function buildInquiryResponse(id: string, raw: Record<string, unknown>): Promise<Inquiry> {
  const property = await getPropertyFromFirestore(asString(raw.propertyId), true);
  const user = raw.userId ? await getUserById(asString(raw.userId)) : null;
  return {
    id,
    propertyId: asString(raw.propertyId),
    userId: asNullableString(raw.userId),
    name: asString(raw.name),
    email: asString(raw.email),
    phone: asNullableString(raw.phone),
    message: asString(raw.message),
    status: asString(raw.status, 'NEW'),
    adminReply: asNullableString(raw.adminReply),
    repliedAt: raw.repliedAt ? toIso(raw.repliedAt) : null,
    replySource: (raw.replySource as Inquiry['replySource']) ?? null,
    autoReplyTemplateId: asNullableString(raw.autoReplyTemplateId),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
    property: property ?? undefined,
    user: user ?? undefined,
  };
}

export async function listInquiriesFromFirestore(filters?: {
  propertyId?: string | null;
  status?: string | null;
}) {
  let snap = await inquiryCollection().get();
  let docs = snap.docs;
  if (filters?.propertyId) {
    docs = docs.filter((doc) => asString(doc.data().propertyId) === filters.propertyId);
  }
  if (filters?.status) {
    docs = docs.filter((doc) => asString(doc.data().status) === filters.status);
  }
  const rows = await Promise.all(
    docs.map((doc) => buildInquiryResponse(doc.id, doc.data() as Record<string, unknown>))
  );
  return sortByCreatedDesc(rows);
}

export async function createInquiryInFirestore(input: {
  propertyId: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}) {
  const property = await getPropertyFromFirestore(input.propertyId, true);
  if (!property) throw new Error('Property not found');
  const id = makeId('inq');
  const payload = {
    propertyId: input.propertyId,
    userId: input.userId ?? null,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    message: input.message,
    status: 'NEW',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await inquiryCollection().doc(id).set(payload);
  const inquiry = await buildInquiryResponse(id, payload);
  await maybeApplyAutoReplyToInquiry(inquiry);
  const refreshed = await inquiryCollection().doc(id).get();
  return buildInquiryResponse(id, refreshed.data() as Record<string, unknown>);
}

async function maybeApplyAutoReplyToInquiry(inquiry: Inquiry) {
  const template = await getActiveAutoReplyForNewInquiries();
  if (!template) return;

  const replyText = expandInquiryReplyTemplate(template.body, {
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    property: inquiry.property?.title ?? null,
    message: inquiry.message,
  });

  await inquiryCollection().doc(inquiry.id).update(
    cleanUndefined({
      adminReply: replyText,
      repliedAt: nowIso(),
      replySource: 'auto',
      autoReplyTemplateId: template.id,
      status: 'REPLIED',
      updatedAt: nowIso(),
    })
  );
}

export async function replyToInquiryInFirestore(
  id: string,
  input: { adminReply: string; replySource?: 'manual' | 'auto'; autoReplyTemplateId?: string | null }
) {
  const text = input.adminReply.trim();
  if (!text) throw new Error('Reply message is required');

  const ref = inquiryCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  await ref.update(
    cleanUndefined({
      adminReply: text,
      repliedAt: nowIso(),
      replySource: input.replySource ?? 'manual',
      autoReplyTemplateId: input.autoReplyTemplateId ?? null,
      status: 'REPLIED',
      updatedAt: nowIso(),
    })
  );

  const updated = await ref.get();
  return buildInquiryResponse(id, updated.data() as Record<string, unknown>);
}

function autoReplyDocToModel(id: string, raw: Record<string, unknown>): InquiryAutoReply {
  return {
    id,
    title: asString(raw.title),
    body: asString(raw.body),
    isActive: asBoolean(raw.isActive, true),
    sendOnNewInquiry: asBoolean(raw.sendOnNewInquiry, false),
    order: asNumber(raw.order, 0),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export async function listInquiryAutoRepliesFromFirestore() {
  const snap = await inquiryAutoReplyCollection().get();
  return snap.docs
    .map((doc) => autoReplyDocToModel(doc.id, doc.data() as Record<string, unknown>))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getActiveAutoReplyForNewInquiries(): Promise<InquiryAutoReply | null> {
  const rows = await listInquiryAutoRepliesFromFirestore();
  return rows.find((r) => r.isActive && r.sendOnNewInquiry) ?? null;
}

async function clearOtherAutoReplyDefaults(exceptId?: string) {
  const snap = await inquiryAutoReplyCollection().where('sendOnNewInquiry', '==', true).get();
  const batch = inquiryAutoReplyCollection().firestore.batch();
  let hasUpdates = false;
  for (const doc of snap.docs) {
    if (exceptId && doc.id === exceptId) continue;
    batch.update(doc.ref, { sendOnNewInquiry: false, updatedAt: nowIso() });
    hasUpdates = true;
  }
  if (hasUpdates) await batch.commit();
}

export async function createInquiryAutoReplyInFirestore(input: {
  title: string;
  body: string;
  isActive?: boolean;
  sendOnNewInquiry?: boolean;
  order?: number;
}) {
  const id = makeId('iarp');
  if (input.sendOnNewInquiry) {
    await clearOtherAutoReplyDefaults(id);
  }
  const payload = {
    title: input.title.trim(),
    body: input.body.trim(),
    isActive: input.isActive ?? true,
    sendOnNewInquiry: input.sendOnNewInquiry ?? false,
    order: input.order ?? 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await inquiryAutoReplyCollection().doc(id).set(payload);
  return autoReplyDocToModel(id, payload);
}

export async function updateInquiryAutoReplyInFirestore(
  id: string,
  input: Partial<{
    title: string;
    body: string;
    isActive: boolean;
    sendOnNewInquiry: boolean;
    order: number;
  }>
) {
  const ref = inquiryAutoReplyCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  if (input.sendOnNewInquiry) {
    await clearOtherAutoReplyDefaults(id);
  }

  await ref.update(cleanUndefined({ ...input, updatedAt: nowIso() }));
  const updated = await ref.get();
  return autoReplyDocToModel(id, updated.data() as Record<string, unknown>);
}

export async function deleteInquiryAutoReplyInFirestore(id: string) {
  const ref = inquiryAutoReplyCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export async function updateInquiryInFirestore(
  id: string,
  input: Partial<{
    status: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    adminReply: string | null;
    repliedAt: string | null;
    replySource: 'manual' | 'auto' | null;
    autoReplyTemplateId: string | null;
  }>
) {
  const ref = inquiryCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update(
    cleanUndefined({
      ...input,
      updatedAt: nowIso(),
    })
  );
  const updated = await ref.get();
  return buildInquiryResponse(id, updated.data() as Record<string, unknown>);
}

export async function deleteInquiryInFirestore(id: string) {
  const ref = inquiryCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

async function buildReviewResponse(id: string, raw: Record<string, unknown>): Promise<PropertyReview & { property?: Property }> {
  const property = await getPropertyFromFirestore(asString(raw.propertyId), true);
  const user = raw.userId ? await getUserById(asString(raw.userId)) : null;
  return {
    id,
    propertyId: asString(raw.propertyId),
    userId: asNullableString(raw.userId),
    name: asString(raw.name),
    email: asString(raw.email),
    rating: asNumber(raw.rating, 0),
    title: asNullableString(raw.title),
    comment: asNullableString(raw.comment),
    isVerified: asBoolean(raw.isVerified, false),
    isActive: asBoolean(raw.isActive, true),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
    property: property ?? undefined,
    user: user ?? undefined,
  };
}

export async function listReviewsForAdminFromFirestore() {
  const snap = await reviewCollection().get();
  const rows = await Promise.all(
    snap.docs.map((doc) => buildReviewResponse(doc.id, doc.data() as Record<string, unknown>))
  );
  return sortByCreatedDesc(rows);
}

export async function updateReviewInFirestore(
  id: string,
  input: Partial<{
    isActive: boolean;
    isVerified: boolean;
    rating: number;
    title: string | null;
    comment: string | null;
  }>
) {
  const ref = reviewCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update(
    cleanUndefined({
      ...input,
      updatedAt: nowIso(),
    })
  );
  const updated = await ref.get();
  return buildReviewResponse(id, updated.data() as Record<string, unknown>);
}

export async function deleteReviewInFirestore(id: string) {
  const ref = reviewCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

function bannerDocToBanner(id: string, raw: Record<string, unknown>): Banner {
  return {
    id,
    title: asString(raw.title),
    subtitle: asNullableString(raw.subtitle),
    image: asNullableString(raw.image),
    link: asNullableString(raw.link),
    position: asString(raw.position, 'home'),
    order: asNumber(raw.order, 0),
    isActive: asBoolean(raw.isActive, true),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export async function listBannersFromFirestore(filters?: {
  position?: string | null;
  isActive?: string | null;
}) {
  const snap = await bannerCollection().get();
  let rows = snap.docs.map((doc) => bannerDocToBanner(doc.id, doc.data() as Record<string, unknown>));
  if (filters?.position) rows = rows.filter((banner) => banner.position === filters.position);
  if (filters?.isActive !== null && filters?.isActive !== undefined) {
    rows = rows.filter((banner) => banner.isActive === (filters.isActive === 'true'));
  }
  return rows.sort((a, b) => a.order - b.order || (b.createdAt > a.createdAt ? 1 : -1));
}

export async function createBannerInFirestore(input: {
  title: string;
  subtitle?: string | null;
  image?: string | null;
  link?: string | null;
  position?: string;
  order?: number;
  isActive?: boolean;
}) {
  const id = makeId('banner');
  const payload = {
    title: input.title,
    subtitle: input.subtitle ?? null,
    image: input.image ?? null,
    link: input.link ?? null,
    position: input.position || 'home',
    order: input.order ?? 0,
    isActive: input.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await bannerCollection().doc(id).set(payload);
  return bannerDocToBanner(id, payload);
}

export async function updateBannerInFirestore(
  id: string,
  input: Partial<{
    title: string;
    subtitle: string | null;
    image: string | null;
    link: string | null;
    position: string;
    order: number;
    isActive: boolean;
  }>
) {
  const ref = bannerCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update(cleanUndefined({ ...input, updatedAt: nowIso() }));
  const updated = await ref.get();
  return bannerDocToBanner(id, updated.data() as Record<string, unknown>);
}

export async function deleteBannerInFirestore(id: string) {
  const ref = bannerCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

function newsDocToNews(id: string, raw: Record<string, unknown>): NewsItem {
  return {
    id,
    content: asString(raw.content),
    link: asNullableString(raw.link),
    type: asString(raw.type, 'info'),
    isActive: asBoolean(raw.isActive, true),
    order: asNumber(raw.order, 0),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export async function listNewsFromFirestore(all = false) {
  const cacheKey = `news:${all ? 'all' : 'active'}`;
  const cached = getCachedRead<NewsItem[]>(cacheKey, 60_000);
  if (cached) return cached;

  try {
    const snap = await newsCollection().orderBy('order', 'asc').limit(200).get();
    let rows = snap.docs.map((doc) => newsDocToNews(doc.id, doc.data() as Record<string, unknown>));
    if (!all) rows = rows.filter((item) => item.isActive);
    rows = rows.sort((a, b) => a.order - b.order || (b.createdAt > a.createdAt ? 1 : -1));
    setCachedRead(cacheKey, rows);
    return rows;
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      const stale = getStaleCachedRead<NewsItem[]>(cacheKey, 15 * 60_000);
      if (stale) return stale;
      return [];
    }
    throw err;
  }
}

export async function createNewsInFirestore(input: {
  content: string;
  link?: string | null;
  type?: string;
  order?: number;
  isActive?: boolean;
}) {
  const id = makeId('news');
  const payload = {
    content: input.content.trim(),
    link: input.link ?? null,
    type: input.type || 'info',
    order: input.order ?? 0,
    isActive: input.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await newsCollection().doc(id).set(payload);
  const item = newsDocToNews(id, payload);
  const allCached = getStaleCachedRead<NewsItem[]>('news:all', 15 * 60_000) ?? [];
  const nextAll = [...allCached, item].sort((a, b) => a.order - b.order);
  setCachedRead('news:all', nextAll);
  if (item.isActive) {
    const activeCached = getStaleCachedRead<NewsItem[]>('news:active', 15 * 60_000) ?? [];
    setCachedRead(
      'news:active',
      [...activeCached, item].sort((a, b) => a.order - b.order),
    );
  }
  return item;
}

export async function updateNewsInFirestore(
  id: string,
  input: Partial<{
    content: string;
    link: string | null;
    type: string;
    order: number;
    isActive: boolean;
  }>
) {
  const ref = newsCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update(
    cleanUndefined({
      ...(input.content !== undefined ? { content: input.content.trim() } : {}),
      ...(input.link !== undefined ? { link: input.link } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: nowIso(),
    })
  );
  const updated = await ref.get();
  invalidateCachedReadPrefix('news:');
  return newsDocToNews(id, updated.data() as Record<string, unknown>);
}

export async function deleteNewsInFirestore(id: string) {
  const ref = newsCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  invalidateCachedReadPrefix('news:');
  return true;
}

function featureDocToFeature(id: string, raw: Record<string, unknown>): FeatureToggle {
  return {
    id,
    key: asString(raw.key),
    name: asString(raw.name),
    description: asNullableString(raw.description),
    category: asString(raw.category, 'general'),
    icon: asNullableString(raw.icon),
    isEnabled: asBoolean(raw.isEnabled, true),
    order: asNumber(raw.order, 0),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export async function listFeaturesFromFirestore() {
  const snap = await featureCollection().get();
  return snap.docs
    .map((doc) => featureDocToFeature(doc.id, doc.data() as Record<string, unknown>))
    .sort((a, b) => a.order - b.order);
}

export async function createFeatureInFirestore(input: {
  key: string;
  name: string;
  description?: string | null;
  category?: string;
  icon?: string | null;
  isEnabled?: boolean;
  order?: number;
}) {
  const existing = await featureCollection().where('key', '==', input.key).limit(1).get();
  if (!existing.empty) {
    throw new Error('Feature key already exists');
  }
  const id = makeId('feature');
  const payload = {
    key: input.key,
    name: input.name,
    description: input.description ?? null,
    category: input.category || 'general',
    icon: input.icon ?? null,
    isEnabled: input.isEnabled ?? true,
    order: input.order ?? 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await featureCollection().doc(id).set(payload);
  return featureDocToFeature(id, payload);
}

export async function updateFeatureInFirestore(id: string, input: Partial<FeatureToggle>) {
  const ref = featureCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update(cleanUndefined({ ...input, updatedAt: nowIso() }));
  const updated = await ref.get();
  return featureDocToFeature(id, updated.data() as Record<string, unknown>);
}

export async function readOrCreateSiteSettingsFromFirestore(): Promise<SiteSettingsPayload> {
  const ref = siteSettingsCollection().doc(SETTINGS_KEY);
  const snap = await ref.get();
  if (!snap.exists) {
    const defaults = normalizeSiteSettings({});
    await ref.set({
      value: defaults,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return defaults;
  }
  const raw = snap.data() as Record<string, unknown>;
  return normalizeSiteSettings(raw.value ?? raw);
}

export async function saveSiteSettingsToFirestore(input: unknown) {
  const normalized = normalizeSiteSettings(input);
  await siteSettingsCollection().doc(SETTINGS_KEY).set({
    value: normalized,
    updatedAt: nowIso(),
  }, { merge: true });
  return normalized;
}

export async function createContactMessageInFirestore(input: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  const id = makeId('contact');
  const payload: ContactMessage = {
    id,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    phone: input.phone ?? null,
    subject: input.subject ?? null,
    message: input.message,
    status: 'NEW',
    isRead: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await contactCollection().doc(id).set(payload);
  return payload;
}

export async function getAdminStatsFromFirestore() {
  const propCol = propertyStatsCol();

  const [
    propertyCount,
    featuredCount,
    userCount,
    agentCount,
    inquiryCount,
    views,
    propertiesByType,
    inquiriesByStatus,
    recentInquiries,
  ] = await Promise.all([
    safeFirestoreCount(propCol),
    safeFirestoreCount(propCol.where('isFeatured', '==', true)),
    safeFirestoreCount(userCollection()),
    safeFirestoreCount(agentCollection()),
    safeFirestoreCount(inquiryCollection()),
    sumPropertyViewsFromSample(),
    Promise.all(
      STATS_PROPERTY_TYPES.map(async (type) => ({
        type,
        count: await safeFirestoreCount(propCol.where('propertyType', '==', type)),
      })),
    ).then((rows) => rows.filter((row) => row.count > 0)),
    Promise.all(
      STATS_INQUIRY_STATUSES.map(async (status) => ({
        status,
        count: await safeFirestoreCount(inquiryCollection().where('status', '==', status)),
      })),
    ).then((rows) => rows.filter((row) => row.count > 0)),
    fetchRecentInquiriesForStats(),
  ]);

  return {
    totals: {
      properties: propertyCount,
      users: userCount,
      agents: agentCount,
      inquiries: inquiryCount,
      views,
      featuredProperties: featuredCount,
    },
    propertiesByType,
    inquiriesByStatus,
    recentInquiries,
  };
}

export function accountTypeToRole(accountType: AccountType): UserRole {
  if (accountType === 'OWNER') return 'OWNER';
  if (accountType === 'COMPANY') return 'COMPANY';
  return 'USER';
}

export async function createCompanyInFirestore(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  address?: string | null;
}) {
  const id = makeId('company');
  const payload = {
    id,
    name: input.name.trim(),
    logo: null,
    description: input.description?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    website: input.website?.trim() || null,
    address: input.address?.trim() || null,
    founded: null,
    agentCount: 0,
    listingCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await companyCollection().doc(id).set(payload);
  return getCompanyDetailFromFirestore(id);
}

export async function createAgentWithUserInFirestore(input: {
  name: string;
  email: string;
  /** bcrypt hash */
  password: string;
  phone?: string | null;
  title?: string | null;
  license?: string | null;
  companyId?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const user = await createUserInFirestore({
    name: input.name.trim(),
    email,
    password: input.password,
    phone: input.phone?.trim() || null,
    role: 'AGENT',
    isActive: true,
  });

  const agentId = makeId('agent');
  const agentPayload = cleanUndefined({
    id: agentId,
    userId: user.id,
    bio: null,
    title: input.title?.trim() || txAgentTitleDefault(),
    license: input.license?.trim() || null,
    phone: input.phone?.trim() || null,
    whatsapp: null,
    experience: null,
    rating: 0,
    totalListings: 0,
    totalSales: 0,
    verified: false,
    companyId: input.companyId?.trim() || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await agentCollection().doc(agentId).set(agentPayload);
  return getAgentDetailFromFirestore(agentId);
}

function txAgentTitleDefault() {
  return 'وكيل عقاري';
}

export async function createPartnerProfileForUser(input: {
  userId: string;
  role: UserRole;
  name: string;
  phone?: string | null;
  companyName?: string | null;
}): Promise<Agent | null> {
  if (input.role !== 'OWNER' && input.role !== 'COMPANY' && input.role !== 'AGENT') {
    return null;
  }

  const existing = await getAgentForUser(input.userId);
  if (existing) return existing;

  let companyId: string | null = null;
  if (input.role === 'COMPANY') {
    const companyIdNew = makeId('company');
    const companyName = (input.companyName || input.name).trim();
    const companyPayload = {
      id: companyIdNew,
      name: companyName,
      logo: null,
      description: null,
      phone: input.phone?.trim() || null,
      email: null,
      website: null,
      address: null,
      founded: null,
      agentCount: 1,
      listingCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await companyCollection().doc(companyIdNew).set(companyPayload);
    companyId = companyIdNew;
  }

  const agentId = makeId('agent');
  const title =
    input.role === 'COMPANY'
      ? 'Real Estate Company'
      : input.role === 'OWNER'
        ? 'Property Owner'
        : 'Real Estate Agent';

  const agentPayload = {
    id: agentId,
    userId: input.userId,
    bio: null,
    title,
    license: null,
    phone: input.phone?.trim() || null,
    whatsapp: null,
    experience: null,
    rating: 0,
    totalListings: 0,
    totalSales: 0,
    verified: false,
    companyId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await agentCollection().doc(agentId).set(agentPayload);
  return getAgentForUser(input.userId) ?? null;
}

export async function getPartnerAgentIdForUser(userId: string): Promise<string | null> {
  const agent = await getAgentForUser(userId);
  return agent?.id ?? null;
}
