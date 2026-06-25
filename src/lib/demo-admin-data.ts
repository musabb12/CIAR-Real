import { DEFAULT_FEATURES } from '@/lib/firestore-defaults';
import {
  getMarketplaceAgentById,
  getMarketplaceCompanyById,
  listMarketplaceAgents,
  listMarketplaceCompanies,
} from '@/lib/demo-marketplace';
import type { Agent, Banner, Company, FeatureToggle } from '@/types';

const ISO = new Date().toISOString();

const DEMO_COMPANIES: Array<
  Company & { _count?: { agents: number } }
> = [
  {
    id: 'demo-company-global',
    name: 'شركة الشركاء العقاريون العالمية',
    logo: null,
    description: 'شركة عقارية دولية رائدة تعمل في أكثر من 30 دولة حول العالم.',
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
    name: 'شركة بريستيج للعقارات الدولية',
    logo: null,
    description: 'فلل فاخرة وعقارات على الواجهة البحرية في الخليج وأوروبا.',
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
    name: 'شركة العقارات العربية',
    logo: null,
    description: 'وكالة موثوقة للعقارات السكنية والتجارية في جميع أنحاء العالم العربي.',
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
      name: 'سارة جونسون',
      phone: '+1-555-0101',
      avatar: null,
      role: 'AGENT',
      isActive: true,
      createdAt: ISO,
      updatedAt: ISO,
    },
    bio: 'متخصصة في العقارات السكنية الفاخرة في أمريكا الشمالية وأوروبا.',
    title: 'وكيلة عقارات أولى',
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
      name: 'أحمد حسن',
      phone: '+971-555-0202',
      avatar: null,
      role: 'AGENT',
      isActive: true,
      createdAt: ISO,
      updatedAt: ISO,
    },
    bio: 'خبير في منطقة الخليج — فلل فاخرة وشقق بنتهاوس.',
    title: 'متخصص العقارات الفاخرة',
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
      name: 'كينجي تاناكا',
      phone: '+65-555-0404',
      avatar: null,
      role: 'AGENT',
      isActive: true,
      createdAt: ISO,
      updatedAt: ISO,
    },
    bio: 'خبير في سوق آسيا والمحيط الهادئ للعقارات الاستثمارية المميزة.',
    title: 'خبير سوق آسيا والمحيط الهادئ',
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

export function listDemoCompanies(countryId?: string | null): Array<Company & { _count?: { agents: number } }> {
  const marketplace = listMarketplaceCompanies(countryId);
  if (marketplace.length > 0) return marketplace;
  return DEMO_COMPANIES.map((row) => ({ ...row }));
}

export function listDemoAgents(countryId?: string | null): Array<Agent & { _count: { properties: number } }> {
  const marketplace = listMarketplaceAgents(countryId);
  if (marketplace.length > 0) return marketplace;
  return DEMO_AGENTS.map((row) => ({ ...row }));
}

/** Merge Firestore agents with marketplace demo agents (10 per country, Arabic). */
export function mergeMarketplaceAgents(
  live: Array<Agent & { _count: { properties: number } }>,
  countryId?: string | null,
): Array<Agent & { _count: { properties: number } }> {
  const demo = listDemoAgents(countryId);
  if (live.length === 0) return demo;

  const byId = new Map<string, Agent & { _count: { properties: number } }>();
  for (const agent of demo) byId.set(agent.id, agent);
  for (const agent of live) {
    if (!byId.has(agent.id)) byId.set(agent.id, agent);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aDemo = a.id.startsWith('mp-ag-') ? 0 : 1;
    const bDemo = b.id.startsWith('mp-ag-') ? 0 : 1;
    if (aDemo !== bDemo) return aDemo - bDemo;
    const ac = a.countryId ?? '';
    const bc = b.countryId ?? '';
    if (ac !== bc) return ac.localeCompare(bc);
    return (a.user?.name ?? '').localeCompare(b.user?.name ?? '', 'ar');
  });
}

/** Merge Firestore companies with marketplace demo companies (10 per country, Arabic). */
export function mergeMarketplaceCompanies(
  live: Array<Company & { _count?: { agents: number } }>,
  countryId?: string | null,
): Array<Company & { _count?: { agents: number } }> {
  const demo = listDemoCompanies(countryId);
  if (live.length === 0) return demo;

  const byId = new Map<string, Company & { _count?: { agents: number } }>();
  for (const company of demo) byId.set(company.id, company);
  for (const company of live) {
    if (!byId.has(company.id)) byId.set(company.id, company);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aDemo = a.id.startsWith('mp-co-') ? 0 : 1;
    const bDemo = b.id.startsWith('mp-co-') ? 0 : 1;
    if (aDemo !== bDemo) return aDemo - bDemo;
    const ac = a.countryId ?? '';
    const bc = b.countryId ?? '';
    if (ac !== bc) return ac.localeCompare(bc);
    return (a.name ?? '').localeCompare(b.name ?? '', 'ar');
  });
}

export function getDemoAgentById(id: string): (Agent & { _count: { properties: number } }) | null {
  const marketplace = getMarketplaceAgentById(id);
  if (marketplace) return marketplace;
  const row = DEMO_AGENTS.find((agent) => agent.id === id);
  return row ? { ...row } : null;
}

export function getDemoCompanyById(id: string): (Company & { _count?: { agents: number } }) | null {
  const marketplace = getMarketplaceCompanyById(id);
  if (marketplace) return marketplace;
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
