#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
if (!rawServiceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON is required.');
  process.exit(1);
}

const serviceAccount = JSON.parse(rawServiceAccount);
const FIRESTORE_PROPERTIES_COLLECTION =
  process.env.FIRESTORE_PROPERTIES_COLLECTION?.trim() || 'properties';
const FIREBASE_STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
  `${serviceAccount.project_id}.appspot.com`;
const FIRESTORE_PROPERTIES_PER_COUNTRY_TARGET = Math.max(
  0,
  Number.parseInt(process.env.FIRESTORE_PROPERTIES_PER_COUNTRY_TARGET || '30', 10) || 30
);
const DRY_RUN = process.argv.includes('--dry-run');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
    storageBucket: FIREBASE_STORAGE_BUCKET,
  });
}

const firestore = admin.firestore();
const bucket = admin.storage().bucket();

const COLLECTIONS = {
  amenities: 'amenities',
  agents: 'agents',
  banners: 'banners',
  companies: 'companies',
  contactMessages: 'contactMessages',
  countries: 'countries',
  favorites: 'favorites',
  featureToggles: 'featureToggles',
  inquiries: 'inquiries',
  newsItems: 'newsItems',
  properties: FIRESTORE_PROPERTIES_COLLECTION,
  propertyReviews: 'propertyReviews',
  siteSettings: 'siteSettings',
  users: 'users',
};

const DEFAULT_SITE_SETTINGS = {
  designSettings: {
    primaryColor: '#0D9488',
    accentColor: '#F59E0B',
    heroImageUrl:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80&auto=format&fit=crop',
  },
  contentSettings: {
    home: {},
    search: {},
    agents: {},
    contact: {},
    favorites: {},
    login: {},
    register: {},
    'admin-login': {},
  },
  socialSettings: {
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
  },
};

const SAMPLE_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1400&q=80&auto=format&fit=crop',
];

const PROPERTY_TYPE_CYCLE = [
  'APARTMENT',
  'VILLA',
  'HOUSE',
  'OFFICE',
  'STUDIO',
  'TOWNHOUSE',
  'PENTHOUSE',
  'DUPLEX',
];

const LISTING_TYPE_CYCLE = ['SALE', 'RENT', 'SHORT_TERM'];
const TITLE_PREFIXES = [
  'Signature',
  'Panorama',
  'Prestige',
  'Skyline',
  'Garden',
  'Harbor',
  'Prime',
  'Executive',
];
const DESCRIPTION_SNIPPETS = [
  'Close to top amenities and transport links.',
  'Freshly curated for the Firestore catalog migration.',
  'Suitable for premium residential or investment demand.',
  'Designed to keep the listing grid rich across all locations.',
  'Well balanced layout with modern finishing and bright interiors.',
  'A migration-generated listing that keeps search and discovery populated.',
];

const LOCAL_ASSET_CACHE = new Map();

function log(message) {
  console.log(`[firestore-migrate] ${message}`);
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function asNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function chunk(items, size = 400) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function cleanUndefined(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}

function safeJsonParse(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function asPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function extFromPath(filePath, fallback = 'jpg') {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  return ext ? ext.replace(/[^a-z0-9]/g, '') : fallback;
}

function inferContentType(filePath) {
  const ext = extFromPath(filePath);
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  return 'image/jpeg';
}

function buildStorageUrl(objectPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(
    objectPath
  )}?alt=media&token=${token}`;
}

async function maybeUploadLocalAsset(url, folder) {
  if (!url || typeof url !== 'string') return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (LOCAL_ASSET_CACHE.has(url)) return LOCAL_ASSET_CACHE.get(url);

  const relativePath = url.replace(/^\/+/, '');
  const candidates = [
    path.join(process.cwd(), 'public', relativePath),
    path.join(process.cwd(), relativePath),
  ];
  const absolutePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!absolutePath) {
    LOCAL_ASSET_CACHE.set(url, url);
    return url;
  }

  const ext = extFromPath(absolutePath);
  const objectPath = path.posix.join(
    folder,
    `${Date.now()}-${randomUUID()}.${ext || 'jpg'}`
  );
  const token = randomUUID();

  if (!DRY_RUN) {
    await bucket.file(objectPath).save(fs.readFileSync(absolutePath), {
      metadata: {
        contentType: inferContentType(absolutePath),
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
        cacheControl: 'public,max-age=31536000,immutable',
      },
      resumable: false,
    });
  }

  const uploadedUrl = buildStorageUrl(objectPath, token);
  LOCAL_ASSET_CACHE.set(url, uploadedUrl);
  return uploadedUrl;
}

async function writeRows(collectionName, rows) {
  let written = 0;
  for (const group of chunk(rows)) {
    const batch = firestore.batch();
    for (const row of group) {
      batch.set(firestore.collection(collectionName).doc(row.id), row.data, { merge: true });
      written++;
    }
    if (!DRY_RUN) {
      await batch.commit();
    }
  }
  log(`${DRY_RUN ? 'prepared' : 'upserted'} ${written} docs in ${collectionName}`);
}

function countBy(items, getKey) {
  const output = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    output.set(key, (output.get(key) || 0) + 1);
  }
  return output;
}

function countrySnapshot(country) {
  return {
    id: country.id,
    name: country.name,
    code: country.code,
    flag: country.flag ?? null,
    currency: country.currency ?? null,
    currencySymbol: country.currencySymbol ?? null,
    isActive: country.isActive !== false,
    isFeatured: Boolean(country.isFeatured),
  };
}

function regionSnapshot(region) {
  return {
    id: region.id,
    name: region.name,
    countryId: region.countryId,
  };
}

function citySnapshot(city) {
  return {
    id: city.id,
    name: city.name,
    regionId: city.regionId,
  };
}

function buildAgentSnapshot(agent, user, company, propertyCount) {
  if (!agent || !user) return null;
  return cleanUndefined({
    id: agent.id,
    userId: agent.userId,
    user,
    bio: agent.bio ?? null,
    title: agent.title ?? null,
    license: agent.license ?? null,
    phone: agent.phone ?? null,
    whatsapp: agent.whatsapp ?? null,
    experience: agent.experience ?? null,
    rating: asNumber(agent.rating, 0),
    totalListings: propertyCount,
    totalSales: asNumber(agent.totalSales, 0),
    verified: Boolean(agent.verified),
    companyId: agent.companyId ?? null,
    ...(company ? { company } : {}),
    createdAt: toIso(agent.createdAt),
    updatedAt: toIso(agent.updatedAt),
  });
}

function normalizeSiteSettingsRows(rows) {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const global = byKey.get('global-site-settings');

  let parsed = {};
  if (global) {
    parsed = safeJsonParse(global, {});
  } else {
    parsed = {
      designSettings: safeJsonParse(byKey.get('designSettings'), {}),
      contentSettings: safeJsonParse(byKey.get('contentSettings'), {}),
      socialSettings: safeJsonParse(byKey.get('socialSettings'), {}),
    };
  }

  return {
    designSettings: {
      ...DEFAULT_SITE_SETTINGS.designSettings,
      ...asPlainObject(parsed.designSettings),
    },
    contentSettings: {
      ...DEFAULT_SITE_SETTINGS.contentSettings,
      ...asPlainObject(parsed.contentSettings),
    },
    socialSettings: {
      ...DEFAULT_SITE_SETTINGS.socialSettings,
      ...asPlainObject(parsed.socialSettings),
    },
  };
}

function buildGeneratedProperty(country, generatedIndex, amenityPool) {
  if (!Array.isArray(country.regions) || country.regions.length === 0) {
    return null;
  }

  const region = country.regions[generatedIndex % country.regions.length];
  if (!region || !Array.isArray(region.cities) || region.cities.length === 0) {
    return null;
  }

  const city = region.cities[generatedIndex % region.cities.length];
  const propertyType = PROPERTY_TYPE_CYCLE[generatedIndex % PROPERTY_TYPE_CYCLE.length];
  const listingType = LISTING_TYPE_CYCLE[generatedIndex % LISTING_TYPE_CYCLE.length];
  const titlePrefix = TITLE_PREFIXES[generatedIndex % TITLE_PREFIXES.length];
  const descriptor = DESCRIPTION_SNIPPETS[generatedIndex % DESCRIPTION_SNIPPETS.length];
  const priceBase = listingType === 'RENT' ? 1200 : listingType === 'SHORT_TERM' ? 200 : 145000;
  const multiplier = 1 + ((generatedIndex % 7) * 0.12);
  const area = 75 + ((generatedIndex % 8) * 18);
  const bedrooms = propertyType === 'OFFICE' ? null : 1 + (generatedIndex % 5);
  const bathrooms = propertyType === 'OFFICE' ? 1 + (generatedIndex % 3) : 1 + (generatedIndex % 4);
  const floors = ['VILLA', 'HOUSE', 'TOWNHOUSE', 'DUPLEX'].includes(propertyType)
    ? 1 + (generatedIndex % 3)
    : null;
  const yearBuilt = 2015 + (generatedIndex % 10);
  const price = Math.round(priceBase * area * multiplier);
  const title = `${titlePrefix} ${propertyType.toLowerCase()} in ${city.name}`;
  const slug = `${slugify(country.code || country.name)}-${slugify(city.name)}-${slugify(
    propertyType
  )}-${String(generatedIndex + 1).padStart(3, '0')}`;
  const docId = `topup-${country.id}-${String(generatedIndex + 1).padStart(3, '0')}`;
  const amenityCount =
    amenityPool.length > 0
      ? Math.min(amenityPool.length, 2 + (generatedIndex % Math.min(4, amenityPool.length)))
      : 0;
  const selectedAmenities = [];
  for (let index = 0; index < amenityCount; index++) {
    const amenity = amenityPool[(generatedIndex + index) % amenityPool.length];
    if (!amenity) continue;
    selectedAmenities.push({
      id: `pam-${docId}-${amenity.id}`,
      propertyId: docId,
      amenityId: amenity.id,
      amenity,
    });
  }

  const createdAt = new Date(Date.now() - generatedIndex * 86_400_000).toISOString();
  const imageUrl = SAMPLE_IMAGE_URLS[generatedIndex % SAMPLE_IMAGE_URLS.length];

  return {
    id: docId,
    data: {
      id: docId,
      title,
      slug,
      description: `${title}. ${descriptor}`,
      price,
      listingType,
      propertyType,
      status: 'AVAILABLE',
      area,
      bedrooms,
      bathrooms,
      floors,
      yearBuilt,
      isFeatured: generatedIndex < 6 || generatedIndex % 5 === 0,
      views: 0,
      countryId: country.id,
      regionId: region.id,
      cityId: city.id,
      address: `${city.name}, ${country.name}`,
      latitude: null,
      longitude: null,
      agentId: null,
      createdAt,
      updatedAt: createdAt,
      country: countrySnapshot(country),
      region: regionSnapshot(region),
      city: citySnapshot(city),
      agent: null,
      images: [
        {
          id: `img-${docId}-0`,
          url: imageUrl,
          alt: title,
          isCover: true,
          order: 0,
          propertyId: docId,
        },
      ],
      amenities: selectedAmenities,
      countryName: country.name,
      regionName: region.name,
      cityName: city.name,
      countryCode: country.code,
      currencySymbol: country.currencySymbol ?? '$',
      source: 'firestore-topup',
      isGenerated: true,
    },
  };
}

async function getCurrentFirestorePropertyCounts() {
  const snap = await firestore.collection(COLLECTIONS.properties).get();
  return countBy(snap.docs.map((doc) => doc.data()), (item) => item.countryId);
}

async function main() {
  log(`starting ${DRY_RUN ? 'dry-run ' : ''}migration`);

  const [
    countries,
    amenities,
    companies,
    users,
    agents,
    properties,
    favorites,
    inquiries,
    reviews,
    banners,
    newsItems,
    featureToggles,
    contactMessages,
    siteSettings,
  ] = await Promise.all([
    prisma.country.findMany({
      include: {
        regions: {
          include: {
            cities: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.amenity.findMany({ orderBy: { name: 'asc' } }),
    prisma.company.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.agent.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.property.findMany({
      include: {
        country: true,
        region: true,
        city: true,
        agent: {
          include: {
            user: true,
            company: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.favorite.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.inquiry.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.propertyReview.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.banner.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    prisma.newsItem.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    prisma.featureToggle.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.siteSetting.findMany({ orderBy: { key: 'asc' } }),
  ]);

  const propertyCountByAgent = countBy(properties, (item) => item.agentId);
  const agentCountByCompany = countBy(agents, (item) => item.companyId);
  const listingCountByCompany = new Map();
  for (const agent of agents) {
    if (!agent.companyId) continue;
    listingCountByCompany.set(
      agent.companyId,
      (listingCountByCompany.get(agent.companyId) || 0) +
        (propertyCountByAgent.get(agent.id) || 0)
    );
  }

  const amenityRows = amenities.map((amenity) => ({
    id: amenity.id,
    data: {
      id: amenity.id,
      name: amenity.name,
      icon: amenity.icon ?? null,
      category: amenity.category ?? null,
      createdAt: toIso(amenity.createdAt),
    },
  }));
  const amenityMap = new Map(
    amenityRows.map((row) => [
      row.id,
      {
        id: row.data.id,
        name: row.data.name,
        icon: row.data.icon,
        category: row.data.category,
      },
    ])
  );

  const companyRows = [];
  const companyMap = new Map();
  for (const company of companies) {
    const payload = {
      id: company.id,
      name: company.name,
      logo: await maybeUploadLocalAsset(company.logo, 'uploads/companies'),
      description: company.description ?? null,
      phone: company.phone ?? null,
      email: company.email ?? null,
      website: company.website ?? null,
      address: company.address ?? null,
      founded: company.founded ?? null,
      agentCount: agentCountByCompany.get(company.id) || 0,
      listingCount: listingCountByCompany.get(company.id) || 0,
      createdAt: toIso(company.createdAt),
      updatedAt: toIso(company.updatedAt),
    };
    companyRows.push({ id: company.id, data: payload });
    companyMap.set(company.id, payload);
  }

  const userRows = [];
  const userMap = new Map();
  for (const user of users) {
    const payload = {
      id: user.id,
      email: user.email.trim().toLowerCase(),
      name: user.name ?? null,
      password: user.password ?? null,
      phone: user.phone ?? null,
      avatar: await maybeUploadLocalAsset(user.avatar, 'uploads/users'),
      role: user.role,
      isActive: Boolean(user.isActive),
      createdAt: toIso(user.createdAt),
      updatedAt: toIso(user.updatedAt),
    };
    userRows.push({ id: user.id, data: payload });
    userMap.set(user.id, payload);
  }

  const agentRows = [];
  const agentSnapshotMap = new Map();
  for (const agent of agents) {
    const user = userMap.get(agent.userId);
    const company = agent.companyId ? companyMap.get(agent.companyId) || null : null;
    const propertyCount = propertyCountByAgent.get(agent.id) || 0;
    const payload = {
      id: agent.id,
      userId: agent.userId,
      bio: agent.bio ?? null,
      title: agent.title ?? null,
      license: agent.license ?? null,
      phone: agent.phone ?? null,
      whatsapp: agent.whatsapp ?? null,
      experience: agent.experience ?? null,
      rating: asNumber(agent.rating, 0),
      totalListings: propertyCount,
      totalSales: asNumber(agent.totalSales, 0),
      verified: Boolean(agent.verified),
      companyId: agent.companyId ?? null,
      createdAt: toIso(agent.createdAt),
      updatedAt: toIso(agent.updatedAt),
    };
    agentRows.push({ id: agent.id, data: payload });
    agentSnapshotMap.set(agent.id, buildAgentSnapshot(agent, user, company, propertyCount));
  }

  const countryRows = [];
  const countryMap = new Map();
  for (const country of countries) {
    const payload = {
      id: country.id,
      name: country.name,
      code: country.code,
      flag: await maybeUploadLocalAsset(country.flag, 'uploads/countries'),
      currency: country.currency ?? null,
      currencySymbol: country.currencySymbol ?? null,
      isActive: Boolean(country.isActive),
      isFeatured: Boolean(country.isFeatured),
      createdAt: toIso(country.createdAt),
      updatedAt: toIso(country.createdAt),
      regions: country.regions.map((region) => ({
        id: region.id,
        name: region.name,
        countryId: country.id,
        createdAt: toIso(region.createdAt),
        cities: region.cities.map((city) => ({
          id: city.id,
          name: city.name,
          regionId: region.id,
        })),
      })),
    };
    countryRows.push({ id: country.id, data: payload });
    countryMap.set(country.id, payload);
  }

  const propertyRows = [];
  for (const property of properties) {
    const country = countryMap.get(property.countryId);
    const region = country?.regions?.find((item) => item.id === property.regionId);
    const city = region?.cities?.find((item) => item.id === property.cityId);
    const images = [];
    for (const image of property.images) {
      images.push({
        id: image.id,
        url: (await maybeUploadLocalAsset(image.url, 'uploads/properties')) ?? image.url,
        alt: image.alt ?? null,
        isCover: Boolean(image.isCover),
        order: image.order ?? 0,
        propertyId: property.id,
      });
    }

    const amenitiesForProperty = property.amenities.map((item) => ({
      id: item.id,
      propertyId: item.propertyId,
      amenityId: item.amenityId,
      amenity:
        amenityMap.get(item.amenityId) || {
          id: item.amenity.id,
          name: item.amenity.name,
          icon: item.amenity.icon ?? null,
          category: item.amenity.category ?? null,
        },
    }));

    const payload = cleanUndefined({
      id: property.id,
      title: property.title,
      slug: property.slug,
      description: property.description,
      price: asNumber(property.price, 0),
      listingType: property.listingType,
      propertyType: property.propertyType,
      status: property.status,
      area: asNumber(property.area, 0),
      bedrooms: asNullableNumber(property.bedrooms),
      bathrooms: asNullableNumber(property.bathrooms),
      floors: asNullableNumber(property.floors),
      yearBuilt: asNullableNumber(property.yearBuilt),
      isFeatured: Boolean(property.isFeatured),
      views: asNumber(property.views, 0),
      countryId: property.countryId,
      regionId: property.regionId,
      cityId: property.cityId,
      address: property.address ?? null,
      latitude: asNullableNumber(property.latitude),
      longitude: asNullableNumber(property.longitude),
      agentId: property.agentId ?? null,
      createdAt: toIso(property.createdAt),
      updatedAt: toIso(property.updatedAt),
      country: country
        ? countrySnapshot(country)
        : {
            id: property.country.id,
            name: property.country.name,
            code: property.country.code,
            flag: property.country.flag ?? null,
            currency: property.country.currency ?? null,
            currencySymbol: property.country.currencySymbol ?? null,
            isActive: Boolean(property.country.isActive),
            isFeatured: Boolean(property.country.isFeatured),
          },
      region: region
        ? regionSnapshot(region)
        : {
            id: property.region.id,
            name: property.region.name,
            countryId: property.region.countryId,
          },
      city: city
        ? citySnapshot(city)
        : {
            id: property.city.id,
            name: property.city.name,
            regionId: property.city.regionId,
          },
      agent: property.agentId ? agentSnapshotMap.get(property.agentId) || null : null,
      images,
      amenities: amenitiesForProperty,
      countryName: country?.name || property.country.name,
      regionName: region?.name || property.region.name,
      cityName: city?.name || property.city.name,
      countryCode: country?.code || property.country.code,
      currencySymbol: country?.currencySymbol ?? property.country.currencySymbol ?? '$',
      source: 'prisma',
    });

    propertyRows.push({ id: property.id, data: payload });
  }

  const favoriteRows = favorites.map((favorite) => ({
    id: favorite.id,
    data: {
      id: favorite.id,
      userId: favorite.userId,
      propertyId: favorite.propertyId,
      createdAt: toIso(favorite.createdAt),
    },
  }));

  const inquiryRows = inquiries.map((inquiry) => ({
    id: inquiry.id,
    data: {
      id: inquiry.id,
      propertyId: inquiry.propertyId,
      userId: inquiry.userId ?? null,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone ?? null,
      message: inquiry.message,
      status: inquiry.status,
      createdAt: toIso(inquiry.createdAt),
      updatedAt: toIso(inquiry.updatedAt),
    },
  }));

  const reviewRows = reviews.map((review) => ({
    id: review.id,
    data: {
      id: review.id,
      propertyId: review.propertyId,
      userId: review.userId ?? null,
      name: review.name,
      email: review.email,
      rating: review.rating,
      title: review.title ?? null,
      comment: review.comment ?? null,
      isVerified: Boolean(review.isVerified),
      isActive: Boolean(review.isActive),
      createdAt: toIso(review.createdAt),
      updatedAt: toIso(review.updatedAt),
    },
  }));

  const bannerRows = [];
  for (const banner of banners) {
    bannerRows.push({
      id: banner.id,
      data: {
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle ?? null,
        image: await maybeUploadLocalAsset(banner.image, 'uploads/banners'),
        link: banner.link ?? null,
        position: banner.position,
        order: banner.order ?? 0,
        isActive: Boolean(banner.isActive),
        createdAt: toIso(banner.createdAt),
        updatedAt: toIso(banner.updatedAt),
      },
    });
  }

  const newsRows = newsItems.map((item) => ({
    id: item.id,
    data: {
      id: item.id,
      content: item.content,
      link: item.link ?? null,
      type: item.type,
      isActive: Boolean(item.isActive),
      order: item.order ?? 0,
      createdAt: toIso(item.createdAt),
      updatedAt: toIso(item.updatedAt),
    },
  }));

  const featureRows = featureToggles.map((feature) => ({
    id: feature.id,
    data: {
      id: feature.id,
      key: feature.key,
      name: feature.name,
      description: feature.description ?? null,
      category: feature.category,
      icon: feature.icon ?? null,
      isEnabled: Boolean(feature.isEnabled),
      order: feature.order ?? 0,
      createdAt: toIso(feature.createdAt),
      updatedAt: toIso(feature.updatedAt),
    },
  }));

  const contactRows = contactMessages.map((message) => ({
    id: message.id,
    data: {
      id: message.id,
      name: message.name,
      email: message.email,
      phone: message.phone ?? null,
      subject: message.subject ?? null,
      message: message.message,
      status: message.status,
      isRead: Boolean(message.isRead),
      createdAt: toIso(message.createdAt),
      updatedAt: toIso(message.updatedAt),
    },
  }));

  const siteSettingsPayload = normalizeSiteSettingsRows(siteSettings);
  const siteSettingsRows = [
    {
      id: 'global-site-settings',
      data: {
        value: siteSettingsPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  ];

  await writeRows(COLLECTIONS.countries, countryRows);
  await writeRows(COLLECTIONS.amenities, amenityRows);
  await writeRows(COLLECTIONS.companies, companyRows);
  await writeRows(COLLECTIONS.users, userRows);
  await writeRows(COLLECTIONS.agents, agentRows);
  await writeRows(COLLECTIONS.properties, propertyRows);
  await writeRows(COLLECTIONS.favorites, favoriteRows);
  await writeRows(COLLECTIONS.inquiries, inquiryRows);
  await writeRows(COLLECTIONS.propertyReviews, reviewRows);
  await writeRows(COLLECTIONS.banners, bannerRows);
  await writeRows(COLLECTIONS.newsItems, newsRows);
  await writeRows(COLLECTIONS.featureToggles, featureRows);
  await writeRows(COLLECTIONS.contactMessages, contactRows);
  await writeRows(COLLECTIONS.siteSettings, siteSettingsRows);

  const currentCounts = await getCurrentFirestorePropertyCounts();
  const generatedRows = [];
  const amenityPool = [...amenityMap.values()];

  for (const country of countryRows.map((row) => row.data)) {
    const currentCount = currentCounts.get(country.id) || 0;
    const missingCount = Math.max(
      0,
      FIRESTORE_PROPERTIES_PER_COUNTRY_TARGET - currentCount
    );
    for (let index = 0; index < missingCount; index++) {
      const generated = buildGeneratedProperty(country, index, amenityPool);
      if (generated) {
        generatedRows.push(generated);
      }
    }
  }

  if (generatedRows.length > 0) {
    await writeRows(COLLECTIONS.properties, generatedRows);
  }

  const topupSummary = countryRows
    .map((row) => {
      const currentCount = currentCounts.get(row.id) || 0;
      const finalCount = currentCount + generatedRows.filter((item) => item.data.countryId === row.id).length;
      return `${row.data.code || row.data.id}: ${currentCount} -> ${finalCount}`;
    })
    .join(', ');

  log(`property target summary: ${topupSummary || 'no countries found'}`);
  log('migration completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
