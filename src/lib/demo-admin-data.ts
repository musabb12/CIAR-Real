import { DEFAULT_FEATURES } from '@/lib/firestore-defaults';
import type { Agent, Banner, Company, FeatureToggle } from '@/types';

const ISO = new Date().toISOString();

const DEMO_COMPANIES: Array<
  Company & { _count?: { agents: number } }
> = [
  {
    id: 'demo-company-global',
    name: 'Global Realty Partners',
    logo: null,
    description: 'Leading international real estate firm across 30 countries.',
    phone: '+1-800-555-0101',
    email: 'info@globalrealty.com',
    website: 'https://globalrealty.com',
    address: '350 Fifth Avenue, New York, NY',
    founded: 2003,
    agentCount: 2,
    listingCount: 641,
    createdAt: ISO,
    updatedAt: ISO,
    _count: { agents: 2 },
  },
  {
    id: 'demo-company-prestige',
    name: 'Prestige Homes International',
    logo: null,
    description: 'Premium villas and waterfront properties in the Gulf and Europe.',
    phone: '+44-20-7946-0958',
    email: 'contact@prestigehomes.com',
    website: 'https://prestigehomes.com',
    address: 'Mayfair Place, London',
    founded: 2008,
    agentCount: 1,
    listingCount: 354,
    createdAt: ISO,
    updatedAt: ISO,
    _count: { agents: 1 },
  },
  {
    id: 'demo-company-arabian',
    name: 'Arabian Estates',
    logo: null,
    description: 'Trusted residential and commercial agency across the Arab world.',
    phone: '+971-4-555-0202',
    email: 'sales@arabianestates.ae',
    website: 'https://arabianestates.ae',
    address: 'DIFC, Dubai, UAE',
    founded: 2010,
    agentCount: 1,
    listingCount: 354,
    createdAt: ISO,
    updatedAt: ISO,
    _count: { agents: 1 },
  },
];

const DEMO_AGENTS: Array<Agent & { _count: { properties: number } }> = [
  {
    id: 'demo-agent-sarah',
    userId: 'demo-user-sarah',
    user: {
      id: 'demo-user-sarah',
      email: 'sarah.johnson@globalrealty.com',
      name: 'Sarah Johnson',
      phone: '+1-555-0101',
      avatar: null,
      role: 'AGENT',
      isActive: true,
      createdAt: ISO,
      updatedAt: ISO,
    },
    bio: 'Luxury residential specialist across North America and Europe.',
    title: 'Senior Real Estate Agent',
    license: 'REA-2010-4521',
    phone: '+1-555-0101',
    whatsapp: '+1-555-0101',
    experience: 15,
    rating: 4.9,
    totalListings: 354,
    totalSales: 38,
    verified: true,
    companyId: 'demo-company-global',
    company: DEMO_COMPANIES[0],
    createdAt: ISO,
    updatedAt: ISO,
    _count: { properties: 354 },
  },
  {
    id: 'demo-agent-ahmed',
    userId: 'demo-user-ahmed',
    user: {
      id: 'demo-user-ahmed',
      email: 'ahmed.hassan@arabianestates.ae',
      name: 'Ahmed Hassan',
      phone: '+971-555-0202',
      avatar: null,
      role: 'AGENT',
      isActive: true,
      createdAt: ISO,
      updatedAt: ISO,
    },
    bio: 'Gulf region expert in luxury villas and penthouses.',
    title: 'Luxury Property Specialist',
    license: 'DRE-2015-7832',
    phone: '+971-555-0202',
    whatsapp: '+971-555-0202',
    experience: 12,
    rating: 4.8,
    totalListings: 354,
    totalSales: 210,
    verified: true,
    companyId: 'demo-company-prestige',
    company: DEMO_COMPANIES[1],
    createdAt: ISO,
    updatedAt: ISO,
    _count: { properties: 354 },
  },
  {
    id: 'demo-agent-kenji',
    userId: 'demo-user-kenji',
    user: {
      id: 'demo-user-kenji',
      email: 'kenji.tanaka@horizonproperty.sg',
      name: 'Kenji Tanaka',
      phone: '+65-555-0404',
      avatar: null,
      role: 'AGENT',
      isActive: true,
      createdAt: ISO,
      updatedAt: ISO,
    },
    bio: 'Asia-Pacific market expert for premium investment properties.',
    title: 'Asia-Pacific Market Expert',
    license: 'SG-REA-2016-9012',
    phone: '+65-555-0404',
    whatsapp: '+65-555-0404',
    experience: 8,
    rating: 4.8,
    totalListings: 329,
    totalSales: 26,
    verified: true,
    companyId: 'demo-company-arabian',
    company: DEMO_COMPANIES[2],
    createdAt: ISO,
    updatedAt: ISO,
    _count: { properties: 329 },
  },
];

export function listDemoCompanies(): Array<Company & { _count?: { agents: number } }> {
  return DEMO_COMPANIES.map((row) => ({ ...row }));
}

export function listDemoAgents(countryId?: string | null): Array<Agent & { _count: { properties: number } }> {
  void countryId;
  return DEMO_AGENTS.map((row) => ({ ...row }));
}

export function getDemoAgentById(id: string): (Agent & { _count: { properties: number } }) | null {
  const row = DEMO_AGENTS.find((agent) => agent.id === id);
  return row ? { ...row } : null;
}

export function getDemoCompanyById(id: string): (Company & { _count?: { agents: number } }) | null {
  const row = DEMO_COMPANIES.find((company) => company.id === id);
  return row ? { ...row } : null;
}

export function getDefaultFeaturesForApi(): FeatureToggle[] {
  return DEFAULT_FEATURES.map((feature, index) => ({
    id: `demo-feature-${feature.key}`,
    key: feature.key,
    name: feature.name,
    description: feature.description,
    category: feature.category,
    icon: feature.icon,
    isEnabled: true,
    order: feature.order ?? index,
    createdAt: ISO,
    updatedAt: ISO,
  }));
}

const DEMO_BANNERS: Banner[] = [
  {
    id: 'demo-banner-home-hero',
    title: 'اكتشف أفضل العقارات العالمية',
    subtitle: 'شقق وفيلات ومكاتب في أكثر من ٦٨ دولة',
    image: null,
    link: '/properties',
    position: 'home',
    order: 0,
    isActive: true,
    createdAt: ISO,
    updatedAt: ISO,
  },
  {
    id: 'demo-banner-luxury',
    title: 'عقارات فاخرة في الخليج وأوروبا',
    subtitle: 'فلل وقصور مع وكلاء معتمدين',
    image: null,
    link: '/properties?listingType=sale',
    position: 'home',
    order: 1,
    isActive: true,
    createdAt: ISO,
    updatedAt: ISO,
  },
  {
    id: 'demo-banner-invest',
    title: 'استثمر بثقة',
    subtitle: 'فرص عقارية مدروسة للمستثمرين',
    image: null,
    link: '/agents',
    position: 'sidebar',
    order: 0,
    isActive: true,
    createdAt: ISO,
    updatedAt: ISO,
  },
];

export function listDemoBanners(filters?: {
  position?: string | null;
  isActive?: string | null;
}): Banner[] {
  let rows = DEMO_BANNERS.map((row) => ({ ...row }));
  if (filters?.position) {
    rows = rows.filter((banner) => banner.position === filters.position);
  }
  if (filters?.isActive !== null && filters?.isActive !== undefined) {
    rows = rows.filter((banner) => banner.isActive === (filters.isActive === 'true'));
  }
  return rows.sort((a, b) => a.order - b.order || (b.createdAt > a.createdAt ? 1 : -1));
}

export function getDemoBannerById(id: string): Banner | null {
  const row = DEMO_BANNERS.find((banner) => banner.id === id);
  return row ? { ...row } : null;
}
