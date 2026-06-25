import { countryDisplayName, normalizeFlagStorage } from '@/lib/country-flags';
import { getSeedCountriesCatalog, type CatalogCountry } from '@/lib/seed-countries-catalog';
import type { Agent, City, Company, Country, ListingType, Property, PropertyType, Region } from '@/types';

export const MARKETPLACE_COMPANIES_PER_COUNTRY = 10;
export const MARKETPLACE_AGENTS_PER_COUNTRY = 10;
export const MARKETPLACE_PROPERTIES_PER_PARTNER = 8;

const ISO = new Date().toISOString();

const DEMO_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=80',
];

const AGENT_FIRST = ['سارة', 'أحمد', 'محمد', 'مريم', 'عمر', 'ليلى', 'خالد', 'فاطمة', 'يوسف', 'عائشة'];
const AGENT_LAST = ['العتيبي', 'الحسن', 'الغامدي', 'الشمري', 'الراشد', 'الزهراني', 'القحطاني', 'الخالد', 'السيد', 'النجار'];
const AGENT_TITLES = ['وكيل عقاري', 'مستشار عقارات', 'وكيل أول', 'خبير عقاري', 'مدير مبيعات عقارية'];
const COMPANY_SUFFIX = ['العقارية', 'للعقارات', 'الأملاك', 'للاستثمار', 'الرائدة', 'المتميزة', 'العالمية', 'الفاخرة', 'الذهبية', 'الشركاء'];

const TYPE_AR: Record<PropertyType, string> = {
  APARTMENT: 'شقة',
  VILLA: 'فيلا',
  HOUSE: 'منزل',
  LAND: 'أرض',
  OFFICE: 'مكتب',
  COMMERCIAL: 'تجاري',
  STUDIO: 'استوديو',
  PENTHOUSE: 'بنتهاوس',
  TOWNHOUSE: 'تاون هاوس',
  DUPLEX: 'دوبلكس',
};

const AR_COUNTRY_CODES = new Set([
  'SA', 'AE', 'EG', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'IQ', 'SY', 'PS', 'LY', 'TN', 'DZ', 'MA', 'SD', 'YE', 'MR', 'SO', 'DJ', 'KM',
]);

function localizedCountryName(country: CatalogCountry): string {
  return countryDisplayName(country.code, 'ar');
}

type LocationPick = { region: Region & { cities?: City[] }; city: City };

interface MarketplaceBundle {
  companies: Array<Company & { _count?: { agents: number } }>;
  agents: Array<Agent & { _count: { properties: number } }>;
  properties: Property[];
}

const bundleCache = new Map<string, MarketplaceBundle>();
let allPropertiesCache: Property[] | null = null;
let allAgentsCache: Array<Agent & { _count: { properties: number } }> | null = null;
let allCompaniesCache: Array<Company & { _count?: { agents: number } }> | null = null;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

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

function pickLocations(country: CatalogCountry, count: number): LocationPick[] {
  const picks: LocationPick[] = [];
  const regions = country.regions ?? [];
  if (regions.length === 0) {
    const fallbackRegion: Region & { cities?: City[] } = {
      id: `${country.id}-main`,
      name: country.name,
      countryId: country.id,
      cities: [{ id: `${country.id}-capital`, name: country.name, regionId: `${country.id}-main` }],
    };
    picks.push({ region: fallbackRegion, city: fallbackRegion.cities![0] });
    return picks;
  }

  for (let i = 0; i < count; i += 1) {
    const region = regions[i % regions.length];
    const cities = region.cities ?? [];
    const city =
      cities.length > 0
        ? cities[i % cities.length]
        : { id: `${region.id}-city`, name: region.name, regionId: region.id };
    picks.push({ region, city });
  }
  return picks;
}

function countrySnapshot(country: CatalogCountry): Country {
  return {
    id: country.id,
    name: country.name,
    code: country.code,
    flag: normalizeFlagStorage(country.flag, country.code),
    currency: country.currency ?? null,
    currencySymbol: country.currencySymbol ?? null,
    isActive: country.isActive !== false,
  };
}

function demoListingTitle(
  country: CatalogCountry,
  city: City,
  propertyType: PropertyType,
  listingType: ListingType,
): string {
  const lt = listingType === 'RENT' ? 'للإيجار' : listingType === 'SHORT_TERM' ? 'إيجار قصير' : 'للبيع';
  return `${TYPE_AR[propertyType]} ${lt} — ${city.name}`;
}

function demoListingDescription(
  country: CatalogCountry,
  city: City,
  propertyType: PropertyType,
): string {
  const typeAr = TYPE_AR[propertyType];
  return `${typeAr} مميز في ${city.name}، ${localizedCountryName(country)}. تشطيبات عالية الجودة وموقع استراتيجي قريب من الخدمات.`;
}

function buildProperty(
  country: CatalogCountry,
  location: LocationPick,
  seq: number,
  owner: { kind: 'agent' | 'company'; id: string; commission: number },
): Property {
  const propertyTypes: PropertyType[] = ['APARTMENT', 'VILLA', 'HOUSE', 'TOWNHOUSE', 'PENTHOUSE', 'STUDIO', 'OFFICE', 'DUPLEX'];
  const listingTypes: ListingType[] = ['SALE', 'RENT', 'SALE', 'RENT'];
  const propertyType = propertyTypes[seq % propertyTypes.length];
  const listingType = listingTypes[seq % listingTypes.length];
  const id = `mp-pr-${country.id}-${owner.kind}-${owner.id.split('-').pop()}-${pad2(seq + 1)}`;
  const basePrice = 90000 + (seq % 19) * 165000 + (owner.kind === 'company' ? 50000 : 0);
  const price = listingType === 'RENT' ? Math.round(basePrice / 130) : basePrice;
  const area = 70 + (seq % 11) * 32;
  const bedrooms = 1 + (seq % 5);
  const bathrooms = 1 + (seq % 4);
  const commissionPercent = Number((owner.commission + (seq % 4) * 0.15).toFixed(2));

  return {
    id,
    title: demoListingTitle(country, location.city, propertyType, listingType),
    slug: `mp-${country.id}-${owner.kind}-${seq}`,
    description: demoListingDescription(country, location.city, propertyType),
    price,
    listingType,
    propertyType,
    status: 'AVAILABLE',
    area,
    bedrooms,
    bathrooms,
    floors: propertyType === 'APARTMENT' || propertyType === 'STUDIO' ? 1 + (seq % 18) : 1 + (seq % 3),
    yearBuilt: 2014 + (seq % 11),
    isFeatured: seq % 7 === 0,
    views: 80 + seq * 41,
    countryId: country.id,
    regionId: location.region.id,
    cityId: location.city.id,
    address: location.city.name,
    latitude: 18 + (seq % 42),
    longitude: -12 + (seq % 54),
    agentId: owner.kind === 'agent' ? owner.id : null,
    commissionPercent,
    createdAt: ISO,
    updatedAt: ISO,
    country: countrySnapshot(country),
    region: { id: location.region.id, name: location.region.name, countryId: country.id },
    city: { id: location.city.id, name: location.city.name, regionId: location.region.id },
    images: [img(id, DEMO_IMAGE_POOL[(seq + country.id.length) % DEMO_IMAGE_POOL.length])],
  };
}

function buildBundleForCountry(country: CatalogCountry): MarketplaceBundle {
  const locations = pickLocations(
    country,
    MARKETPLACE_AGENTS_PER_COUNTRY * MARKETPLACE_PROPERTIES_PER_PARTNER +
      MARKETPLACE_COMPANIES_PER_COUNTRY * MARKETPLACE_PROPERTIES_PER_PARTNER,
  );

  const companies: Array<Company & { _count?: { agents: number } }> = [];
  const agents: Array<Agent & { _count: { properties: number } }> = [];
  const properties: Property[] = [];
  const countryNameAr = localizedCountryName(country);

  for (let i = 0; i < MARKETPLACE_COMPANIES_PER_COUNTRY; i += 1) {
    const idx = i + 1;
    const id = `mp-co-${country.id}-${pad2(idx)}`;
    const defaultCommissionPercent = Number((2.5 + (i % 5) * 0.4).toFixed(2));
    companies.push({
      id,
      name: `شركة ${COMPANY_SUFFIX[i % COMPANY_SUFFIX.length]} ${countryNameAr} ${idx}`,
      logo: null,
      description: `شركة عقارية موثوقة تخدم سوق ${countryNameAr} في البيع والإيجار والاستثمار.`,
      phone: `+${1000 + i}-${country.code}-${idx}${idx}`,
      email: `contact${idx}@${country.id}-realty.demo`,
      website: `https://${country.id}-realty-${idx}.demo`,
      address: countryNameAr,
      founded: 2005 + (i % 15),
      agentCount: 1,
      listingCount: MARKETPLACE_PROPERTIES_PER_PARTNER,
      countryId: country.id,
      defaultCommissionPercent,
      createdAt: ISO,
      updatedAt: ISO,
      _count: { agents: 1 },
    });
  }

  for (let i = 0; i < MARKETPLACE_AGENTS_PER_COUNTRY; i += 1) {
    const idx = i + 1;
    const id = `mp-ag-${country.id}-${pad2(idx)}`;
    const company = companies[i];
    const defaultCommissionPercent = Number((2.0 + (i % 6) * 0.35).toFixed(2));
    const first = AGENT_FIRST[i % AGENT_FIRST.length];
    const last = AGENT_LAST[(i + 3) % AGENT_LAST.length];
    const userId = `mp-user-${country.id}-${pad2(idx)}`;

    agents.push({
      id,
      userId,
      user: {
        id: userId,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${country.id}.demo`,
        name: `${first} ${last}`,
        phone: `+${2000 + i}-${country.code}-${idx}`,
        avatar: null,
        role: 'AGENT',
        isActive: true,
        createdAt: ISO,
        updatedAt: ISO,
      },
      bio: `وكيل مرخّص متخصص في السوق العقاري في ${countryNameAr}.`,
      title: AGENT_TITLES[i % AGENT_TITLES.length],
      license: `${country.code.toUpperCase()}-${2010 + i}-${1000 + idx}`,
      phone: `+${2000 + i}-${country.code}-${idx}`,
      whatsapp: `+${2000 + i}${country.code}${idx}`,
      experience: 4 + (i % 12),
      rating: Number((4.2 + (i % 8) * 0.1).toFixed(1)),
      totalListings: MARKETPLACE_PROPERTIES_PER_PARTNER,
      totalSales: 5 + i * 3,
      verified: i % 4 !== 3,
      companyId: company.id,
      countryId: country.id,
      defaultCommissionPercent,
      company,
      createdAt: ISO,
      updatedAt: ISO,
      _count: { properties: MARKETPLACE_PROPERTIES_PER_PARTNER },
    });

    for (let p = 0; p < MARKETPLACE_PROPERTIES_PER_PARTNER; p += 1) {
      const loc = locations[i * MARKETPLACE_PROPERTIES_PER_PARTNER + p];
      properties.push(
        buildProperty(country, loc, p, {
          kind: 'agent',
          id,
          commission: defaultCommissionPercent,
        }),
      );
    }
  }

  for (let i = 0; i < MARKETPLACE_COMPANIES_PER_COUNTRY; i += 1) {
    const company = companies[i];
    const base = MARKETPLACE_AGENTS_PER_COUNTRY * MARKETPLACE_PROPERTIES_PER_PARTNER;
    for (let p = 0; p < MARKETPLACE_PROPERTIES_PER_PARTNER; p += 1) {
      const loc = locations[base + i * MARKETPLACE_PROPERTIES_PER_PARTNER + p];
      properties.push(
        buildProperty(country, loc, p + 10, {
          kind: 'company',
          id: company.id,
          commission: company.defaultCommissionPercent ?? 2.5,
        }),
      );
    }
    company.listingCount = MARKETPLACE_PROPERTIES_PER_PARTNER;
  }

  for (const agent of agents) {
    const count = properties.filter((p) => p.agentId === agent.id && p.id.includes('-agent-')).length;
    agent.totalListings = count;
    agent._count.properties = count;
  }

  return { companies, agents, properties };
}

function getBundle(countryId: string): MarketplaceBundle | null {
  const country = getSeedCountriesCatalog().find(
    (c) => c.id === countryId || c.code.toLowerCase() === countryId.toLowerCase(),
  );
  if (!country) return null;

  const cached = bundleCache.get(country.id);
  if (cached) return cached;

  const bundle = buildBundleForCountry(country);
  bundleCache.set(country.id, bundle);
  return bundle;
}

export function getAllMarketplaceProperties(): Property[] {
  if (allPropertiesCache) return allPropertiesCache;
  const rows: Property[] = [];
  for (const country of getSeedCountriesCatalog()) {
    const bundle = getBundle(country.id);
    if (bundle) rows.push(...bundle.properties);
  }
  allPropertiesCache = rows;
  return rows;
}

export function listMarketplaceAgents(countryId?: string | null): Array<Agent & { _count: { properties: number } }> {
  if (!countryId) {
    if (allAgentsCache) return allAgentsCache.map((row) => ({ ...row }));
    const rows: Array<Agent & { _count: { properties: number } }> = [];
    for (const country of getSeedCountriesCatalog()) {
      const bundle = getBundle(country.id);
      if (bundle) rows.push(...bundle.agents);
    }
    allAgentsCache = rows;
    return rows.map((row) => ({ ...row }));
  }

  const bundle = getBundle(countryId);
  return bundle ? bundle.agents.map((row) => ({ ...row })) : [];
}

export function listMarketplaceCompanies(countryId?: string | null): Array<Company & { _count?: { agents: number } }> {
  if (!countryId) {
    if (allCompaniesCache) return allCompaniesCache.map((row) => ({ ...row }));
    const rows: Array<Company & { _count?: { agents: number } }> = [];
    for (const country of getSeedCountriesCatalog()) {
      const bundle = getBundle(country.id);
      if (bundle) rows.push(...bundle.companies);
    }
    allCompaniesCache = rows;
    return rows.map((row) => ({ ...row }));
  }

  const bundle = getBundle(countryId);
  return bundle ? bundle.companies.map((row) => ({ ...row })) : [];
}

export function getMarketplaceAgentById(id: string): (Agent & { _count: { properties: number } }) | null {
  if (!id.startsWith('mp-ag-')) return null;
  const countryId = id.split('-')[2];
  const bundle = getBundle(countryId);
  const row = bundle?.agents.find((agent) => agent.id === id);
  return row ? { ...row } : null;
}

export function getMarketplaceCompanyById(id: string): (Company & { _count?: { agents: number } }) | null {
  if (!id.startsWith('mp-co-')) return null;
  const countryId = id.split('-')[2];
  const bundle = getBundle(countryId);
  const row = bundle?.companies.find((company) => company.id === id);
  return row ? { ...row } : null;
}

export function listMarketplacePropertiesForCompany(companyId: string): Property[] {
  if (!companyId.startsWith('mp-co-')) return [];
  const countryId = companyId.split('-')[2];
  const suffix = companyId.split('-').pop() ?? '';
  const bundle = getBundle(countryId);
  if (!bundle) return [];
  return bundle.properties.filter((p) => p.id.includes(`-company-${suffix}-`));
}

export function listMarketplacePropertiesForAgent(agentId: string): Property[] {
  if (!agentId.startsWith('mp-ag-')) return [];
  const countryId = agentId.split('-')[2];
  const bundle = getBundle(countryId);
  if (!bundle) return [];
  return bundle.properties.filter((p) => p.agentId === agentId && p.id.includes('-agent-'));
}

export function getMarketplacePropertyById(id: string): Property | null {
  if (!id.startsWith('mp-pr-')) return null;
  const countryId = id.split('-')[2];
  const bundle = getBundle(countryId);
  const row = bundle?.properties.find((property) => property.id === id);
  return row ? { ...row } : null;
}

export function marketplaceStats() {
  const countries = getSeedCountriesCatalog().length;
  return {
    countries,
    agentsPerCountry: MARKETPLACE_AGENTS_PER_COUNTRY,
    companiesPerCountry: MARKETPLACE_COMPANIES_PER_COUNTRY,
    propertiesPerPartner: MARKETPLACE_PROPERTIES_PER_PARTNER,
    propertiesPerCountry:
      MARKETPLACE_AGENTS_PER_COUNTRY * MARKETPLACE_PROPERTIES_PER_PARTNER +
      MARKETPLACE_COMPANIES_PER_COUNTRY * MARKETPLACE_PROPERTIES_PER_PARTNER,
    totalProperties: getAllMarketplaceProperties().length,
  };
}
