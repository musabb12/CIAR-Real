import { PrismaClient, UserRole, ListingType, PropertyType, PropertyStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Property image URLs from Unsplash (real estate themed)
const propertyImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop',
];

const villaImages = [
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
];

const apartmentImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop',
];

const landImages = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&h=600&fit=crop',
];

const officeImages = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop',
];

const penthouseImages = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop',
];

const amenitiesList = [
  { name: 'Swimming Pool', icon: 'Waves', category: 'exterior' },
  { name: 'Parking', icon: 'Car', category: 'exterior' },
  { name: 'Garden', icon: 'Flower2', category: 'exterior' },
  { name: 'Gym', icon: 'Dumbbell', category: 'community' },
  { name: 'Security', icon: 'Shield', category: 'community' },
  { name: 'Central AC', icon: 'Snowflake', category: 'interior' },
  { name: 'Heating', icon: 'Flame', category: 'interior' },
  { name: 'Elevator', icon: 'ArrowUpDown', category: 'community' },
  { name: 'Balcony', icon: 'Sun', category: 'exterior' },
  { name: 'Terrace', icon: 'Trees', category: 'exterior' },
  { name: 'Concierge', icon: 'BellRing', category: 'community' },
  { name: 'Laundry', icon: 'WashingMachine', category: 'interior' },
  { name: 'Storage', icon: 'Archive', category: 'interior' },
  { name: 'Wi-Fi', icon: 'Wifi', category: 'interior' },
  { name: 'Pet Friendly', icon: 'PawPrint', category: 'community' },
  { name: 'Furnished', icon: 'Sofa', category: 'interior' },
  { name: 'BBQ Area', icon: 'CookingPot', category: 'exterior' },
  { name: 'Kids Play Area', icon: 'Baby', category: 'community' },
  { name: 'Sauna', icon: 'Bath', category: 'community' },
  { name: 'Jacuzzi', icon: 'Bath', category: 'exterior' },
  { name: 'Smart Home', icon: 'Smartphone', category: 'interior' },
  { name: 'Fireplace', icon: 'Flame', category: 'interior' },
  { name: 'Mountain View', icon: 'Mountain', category: 'exterior' },
  { name: 'Sea View', icon: 'Waves', category: 'exterior' },
];

interface PropertyData {
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  yearBuilt: number | null;
  isFeatured: boolean;
  address: string;
  latitude: number;
  longitude: number;
  countryId: string;
  regionId: string;
  cityId: string;
  images: string[];
  amenityNames: string[];
}

async function seed() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.inquiry.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.company.deleteMany();
  await prisma.property.deleteMany();
  await prisma.city.deleteMany();
  await prisma.region.deleteMany();
  await prisma.country.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data');

  // ==================== CREATE COUNTRIES ====================
  const usa = await prisma.country.create({
    data: {
      name: 'United States',
      code: 'US',
      flag: '🇺🇸',
      currency: 'USD',
      currencySymbol: '$',
    },
  });

  const uae = await prisma.country.create({
    data: {
      name: 'United Arab Emirates',
      code: 'AE',
      flag: '🇦🇪',
      currency: 'AED',
      currencySymbol: 'AED',
    },
  });

  const uk = await prisma.country.create({
    data: {
      name: 'United Kingdom',
      code: 'GB',
      flag: '🇬🇧',
      currency: 'GBP',
      currencySymbol: '£',
    },
  });

  const egypt = await prisma.country.create({
    data: {
      name: 'Egypt',
      code: 'EG',
      flag: '🇪🇬',
      currency: 'EGP',
      currencySymbol: 'E£',
    },
  });

  const saudi = await prisma.country.create({
    data: {
      name: 'Saudi Arabia',
      code: 'SA',
      flag: '🇸🇦',
      currency: 'SAR',
      currencySymbol: 'SAR',
    },
  });

  // ==================== CREATE REGIONS & CITIES ====================

  // USA
  const california = await prisma.region.create({ data: { name: 'California', countryId: usa.id } });
  const newYork = await prisma.region.create({ data: { name: 'New York', countryId: usa.id } });
  const florida = await prisma.region.create({ data: { name: 'Florida', countryId: usa.id } });
  const texas = await prisma.region.create({ data: { name: 'Texas', countryId: usa.id } });

  const la = await prisma.city.create({ data: { name: 'Los Angeles', regionId: california.id } });
  const sf = await prisma.city.create({ data: { name: 'San Francisco', regionId: california.id } });
  const nyc = await prisma.city.create({ data: { name: 'New York City', regionId: newYork.id } });
  const miami = await prisma.city.create({ data: { name: 'Miami', regionId: florida.id } });
  const dallas = await prisma.city.create({ data: { name: 'Dallas', regionId: texas.id } });
  const sanDiego = await prisma.city.create({ data: { name: 'San Diego', regionId: california.id } });

  // UAE
  const dubaiRegion = await prisma.region.create({ data: { name: 'Dubai', countryId: uae.id } });
  const abuDhabiRegion = await prisma.region.create({ data: { name: 'Abu Dhabi', countryId: uae.id } });
  const sharjahRegion = await prisma.region.create({ data: { name: 'Sharjah', countryId: uae.id } });

  const dubai = await prisma.city.create({ data: { name: 'Dubai', regionId: dubaiRegion.id } });
  const abuDhabi = await prisma.city.create({ data: { name: 'Abu Dhabi', regionId: abuDhabiRegion.id } });
  const sharjah = await prisma.city.create({ data: { name: 'Sharjah', regionId: sharjahRegion.id } });

  // UK
  const england = await prisma.region.create({ data: { name: 'England', countryId: uk.id } });
  const scotland = await prisma.region.create({ data: { name: 'Scotland', countryId: uk.id } });

  const london = await prisma.city.create({ data: { name: 'London', regionId: england.id } });
  const manchester = await prisma.city.create({ data: { name: 'Manchester', regionId: england.id } });
  const edinburgh = await prisma.city.create({ data: { name: 'Edinburgh', regionId: scotland.id } });

  // Egypt
  const cairoRegion = await prisma.region.create({ data: { name: 'Cairo', countryId: egypt.id } });
  const alexRegion = await prisma.region.create({ data: { name: 'Alexandria', countryId: egypt.id } });
  const gizaRegion = await prisma.region.create({ data: { name: 'Giza', countryId: egypt.id } });

  const cairo = await prisma.city.create({ data: { name: 'Cairo', regionId: cairoRegion.id } });
  const alexandria = await prisma.city.create({ data: { name: 'Alexandria', regionId: alexRegion.id } });
  const giza = await prisma.city.create({ data: { name: 'Giza', regionId: gizaRegion.id } });
  const newCairo = await prisma.city.create({ data: { name: 'New Cairo', regionId: cairoRegion.id } });

  // Saudi Arabia
  const riyadhRegion = await prisma.region.create({ data: { name: 'Riyadh', countryId: saudi.id } });
  const jeddahRegion = await prisma.region.create({ data: { name: 'Jeddah', countryId: saudi.id } });

  const riyadh = await prisma.city.create({ data: { name: 'Riyadh', regionId: riyadhRegion.id } });
  const jeddah = await prisma.city.create({ data: { name: 'Jeddah', regionId: jeddahRegion.id } });

  console.log('🌍 Created countries, regions, and cities');

  // ==================== CREATE AMENITIES ====================
  const amenities = [];
  for (const a of amenitiesList) {
    const amenity = await prisma.amenity.create({ data: a });
    amenities.push(amenity);
  }
  console.log('✨ Created amenities');

  // ==================== CREATE COMPANIES ====================
  const companies = await Promise.all([
    prisma.company.create({
      data: { name: 'Luxury Estates International', description: 'Premium real estate services worldwide', phone: '+1-800-555-0101', email: 'info@luxuryestates.com', website: 'https://luxuryestates.com', founded: 2005, agentCount: 45, listingCount: 320 },
    }),
    prisma.company.create({
      data: { name: 'Gulf Properties', description: 'Leading real estate agency in the Middle East', phone: '+971-4-555-0102', email: 'info@gulfproperties.ae', website: 'https://gulfproperties.ae', founded: 2010, agentCount: 32, listingCount: 250 },
    }),
    prisma.company.create({
      data: { name: 'Metro Homes', description: 'Urban living specialists', phone: '+44-20-555-0103', email: 'info@metrohomes.co.uk', website: 'https://metrohomes.co.uk', founded: 2015, agentCount: 28, listingCount: 180 },
    }),
    prisma.company.create({
      data: { name: 'Nile Valley Realty', description: 'Egypt\'s premier property consultancy', phone: '+20-2-555-0104', email: 'info@nilevalley.eg', website: 'https://nilevalley.eg', founded: 2012, agentCount: 20, listingCount: 150 },
    }),
    prisma.company.create({
      data: { name: 'Desert Crown Properties', description: 'Luxury living in Saudi Arabia', phone: '+966-11-555-0105', email: 'info@desertcrown.sa', website: 'https://desertcrown.sa', founded: 2018, agentCount: 15, listingCount: 120 },
    }),
  ]);
  console.log('🏢 Created companies');

  // ==================== CREATE USERS & AGENTS ====================

  // Admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@propertyfinder.com',
      name: 'Admin User',
      password: 'admin123',
      role: UserRole.ADMIN,
    },
  });

  // Regular users
  const user1 = await prisma.user.create({
    data: { email: 'john.doe@email.com', name: 'John Doe', phone: '+1-555-0201', role: UserRole.USER },
  });
  const user2 = await prisma.user.create({
    data: { email: 'sarah.smith@email.com', name: 'Sarah Smith', phone: '+1-555-0202', role: UserRole.USER },
  });

  // Agent users
  const agentUser1 = await prisma.user.create({
    data: { email: 'agent1@luxuryestates.com', name: 'Michael Chen', phone: '+1-310-555-0301', role: UserRole.AGENT, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
  });
  const agentUser2 = await prisma.user.create({
    data: { email: 'agent2@gulfproperties.ae', name: 'Ahmed Al-Rashid', phone: '+971-50-555-0302', role: UserRole.AGENT, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
  });
  const agentUser3 = await prisma.user.create({
    data: { email: 'agent3@metrohomes.co.uk', name: 'Emma Thompson', phone: '+44-7700-555-0303', role: UserRole.AGENT, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
  });
  const agentUser4 = await prisma.user.create({
    data: { email: 'agent4@nilevalley.eg', name: 'Omar Hassan', phone: '+20-100-555-0304', role: UserRole.AGENT, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
  });
  const agentUser5 = await prisma.user.create({
    data: { email: 'agent5@desertcrown.sa', name: 'Fatima Al-Saud', phone: '+966-55-555-0305', role: UserRole.AGENT, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face' },
  });
  const agentUser6 = await prisma.user.create({
    data: { email: 'agent6@luxuryestates.com', name: 'James Wilson', phone: '+1-415-555-0306', role: UserRole.AGENT, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
  });

  // Create agents
  const agent1 = await prisma.agent.create({
    data: { userId: agentUser1.id, companyId: companies[0].id, bio: 'Specializing in luxury properties in Los Angeles and Beverly Hills for over 15 years. Top-rated agent with 200+ successful transactions.', title: 'Senior Luxury Agent', license: 'CA-DRE-01234567', experience: 15, rating: 4.9, totalListings: 85, totalSales: 210, verified: true },
  });
  const agent2 = await prisma.agent.create({
    data: { userId: agentUser2.id, companyId: companies[1].id, bio: 'Expert in Dubai Marina, Downtown Dubai, and Palm Jumeirah properties. Fluent in Arabic and English.', title: 'Luxury Property Specialist', license: 'RERA-12345', experience: 10, rating: 4.8, totalListings: 120, totalSales: 180, verified: true },
  });
  const agent3 = await prisma.agent.create({
    data: { userId: agentUser3.id, companyId: companies[2].id, bio: 'London property market specialist with deep knowledge of Mayfair, Kensington, and Chelsea.', title: 'London Property Expert', license: 'EAA-98765', experience: 8, rating: 4.7, totalListings: 65, totalSales: 140, verified: true },
  });
  const agent4 = await prisma.agent.create({
    data: { userId: agentUser4.id, companyId: companies[3].id, bio: 'Cairo and New Cairo real estate expert. Specializing in compounds and gated communities.', title: 'Senior Real Estate Consultant', license: 'EGR-54321', experience: 12, rating: 4.6, totalListings: 95, totalSales: 160, verified: true },
  });
  const agent5 = await prisma.agent.create({
    data: { userId: agentUser5.id, companyId: companies[4].id, bio: 'Riyadh luxury property specialist. Expert in diplomatic quarter and premium residential areas.', title: 'Premium Properties Advisor', license: 'SRA-67890', experience: 6, rating: 4.5, totalListings: 45, totalSales: 90, verified: true },
  });
  const agent6 = await prisma.agent.create({
    data: { userId: agentUser6.id, companyId: companies[0].id, bio: 'Miami and South Florida real estate expert. Waterfront property specialist.', title: 'Waterfront Property Specialist', license: 'FL-DRE-34567890', experience: 11, rating: 4.8, totalListings: 72, totalSales: 165, verified: true },
  });

  console.log('👤 Created users and agents');

  // ==================== CREATE PROPERTIES ====================

  const propertyData: PropertyData[] = [
    // === DUBAI PROPERTIES ===
    {
      title: 'Ultra-Luxury Penthouse in Downtown Dubai',
      description: 'Breathtaking penthouse with panoramic views of the Burj Khalifa and Dubai Fountain. Features premium Italian marble flooring, a private elevator, state-of-the-art smart home system, and an expansive rooftop terrace with infinity pool. Fully furnished with designer furniture throughout. Located steps from Dubai Mall.',
      price: 12500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.PENTHOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 450,
      bedrooms: 5,
      bathrooms: 6,
      floors: 45,
      yearBuilt: 2022,
      isFeatured: true,
      address: 'Burj Khalifa District, Downtown Dubai',
      latitude: 25.1972,
      longitude: 55.2744,
      countryId: uae.id,
      regionId: dubaiRegion.id,
      cityId: dubai.id,
      images: penthouseImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Gym', 'Security', 'Central AC', 'Elevator', 'Balcony', 'Terrace', 'Concierge', 'Smart Home', 'Sauna', 'Jacuzzi'],
    },
    {
      title: 'Modern Apartment in Dubai Marina',
      description: 'Stylish 2-bedroom apartment with stunning marina views. Open-plan living with floor-to-ceiling windows, modern kitchen with integrated appliances, and access to world-class amenities including pool, gym, and spa. Walking distance to Marina Walk restaurants and tram.',
      price: 3200000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 140,
      bedrooms: 2,
      bathrooms: 3,
      floors: 22,
      yearBuilt: 2020,
      isFeatured: true,
      address: 'Damac Heights, Dubai Marina',
      latitude: 25.0805,
      longitude: 55.1403,
      countryId: uae.id,
      regionId: dubaiRegion.id,
      cityId: dubai.id,
      images: apartmentImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Gym', 'Security', 'Central AC', 'Elevator', 'Balcony', 'Concierge', 'Sauna'],
    },
    {
      title: 'Luxury Villa in Palm Jumeirah',
      description: 'Exclusive beachfront villa on the iconic Palm Jumeirah. Private beach access, infinity pool overlooking the Arabian Gulf, 7 bedrooms with en-suite bathrooms, home cinema, and a fully equipped modern kitchen. Landscaped gardens with BBQ area.',
      price: 45000000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.VILLA,
      status: PropertyStatus.AVAILABLE,
      area: 1200,
      bedrooms: 7,
      bathrooms: 8,
      floors: 3,
      yearBuilt: 2021,
      isFeatured: true,
      address: 'Frond N, Palm Jumeirah',
      latitude: 25.1124,
      longitude: 55.1390,
      countryId: uae.id,
      regionId: dubaiRegion.id,
      cityId: dubai.id,
      images: villaImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Central AC', 'Balcony', 'Terrace', 'Concierge', 'BBQ Area', 'Kids Play Area', 'Jacuzzi', 'Sea View'],
    },
    {
      title: 'Studio Apartment for Rent in JVC',
      description: 'Fully furnished studio apartment in Jumeirah Village Circle. Modern design, well-equipped kitchen, built-in wardrobes, and access to community pool and gym. Close to supermarkets, restaurants, and public transport.',
      price: 45000,
      listingType: ListingType.RENT,
      propertyType: PropertyType.STUDIO,
      status: PropertyStatus.AVAILABLE,
      area: 45,
      bedrooms: null,
      bathrooms: 1,
      floors: 5,
      yearBuilt: 2019,
      isFeatured: false,
      address: 'Bloom Heights, Jumeirah Village Circle',
      latitude: 25.0657,
      longitude: 55.2094,
      countryId: uae.id,
      regionId: dubaiRegion.id,
      cityId: dubai.id,
      images: apartmentImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Gym', 'Central AC', 'Elevator', 'Furnished', 'Wi-Fi'],
    },
    {
      title: 'Executive Office Space in DIFC',
      description: 'Premium Grade A office space in the Dubai International Financial Centre. Fully fitted with high-end finishes, boardrooms, reception area, and panoramic city views. 24/7 security and access to DIFC amenities.',
      price: 2800000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.OFFICE,
      status: PropertyStatus.AVAILABLE,
      area: 320,
      bedrooms: null,
      bathrooms: 4,
      floors: 18,
      yearBuilt: 2023,
      isFeatured: false,
      address: 'Gate District, DIFC',
      latitude: 25.2117,
      longitude: 55.2811,
      countryId: uae.id,
      regionId: dubaiRegion.id,
      cityId: dubai.id,
      images: officeImages,
      amenityNames: ['Parking', 'Security', 'Central AC', 'Elevator', 'Wi-Fi', 'Concierge'],
    },
    {
      title: 'Beachfront Apartment in Abu Dhabi',
      description: 'Spectacular 3-bedroom apartment on Abu Dhabi Corniche with direct beach access. Spacious living areas, modern kitchen, maid\'s room, and 2 parking spaces. Building amenities include pool, gym, and children\'s play area.',
      price: 4200000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 210,
      bedrooms: 3,
      bathrooms: 4,
      floors: 15,
      yearBuilt: 2021,
      isFeatured: true,
      address: 'Corniche Road, Abu Dhabi',
      latitude: 24.4539,
      longitude: 54.3773,
      countryId: uae.id,
      regionId: abuDhabiRegion.id,
      cityId: abuDhabi.id,
      images: apartmentImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Gym', 'Security', 'Central AC', 'Elevator', 'Balcony', 'Kids Play Area', 'Sea View'],
    },

    // === LOS ANGELES PROPERTIES ===
    {
      title: 'Hollywood Hills Modern Villa',
      description: 'Architecturally stunning villa in the Hollywood Hills with sweeping views from downtown to the Pacific. Features a wine cellar, home theater, infinity pool, outdoor kitchen, and smart home automation. The ultimate LA lifestyle.',
      price: 8500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.VILLA,
      status: PropertyStatus.AVAILABLE,
      area: 580,
      bedrooms: 6,
      bathrooms: 7,
      floors: 3,
      yearBuilt: 2021,
      isFeatured: true,
      address: 'Mulholland Drive, Hollywood Hills',
      latitude: 34.1178,
      longitude: -118.3617,
      countryId: usa.id,
      regionId: california.id,
      cityId: la.id,
      images: villaImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Central AC', 'Heating', 'Balcony', 'Terrace', 'Smart Home', 'BBQ Area', 'Mountain View'],
    },
    {
      title: 'Santa Monica Beach House',
      description: 'Charming beachfront home just steps from Santa Monica Beach. Open floor plan with ocean views, updated kitchen, hardwood floors, and a private deck. Perfect for those seeking the California beach lifestyle.',
      price: 6200000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 350,
      bedrooms: 4,
      bathrooms: 4,
      floors: 2,
      yearBuilt: 2018,
      isFeatured: false,
      address: 'Pacific Coast Highway, Santa Monica',
      latitude: 34.0195,
      longitude: -118.4912,
      countryId: usa.id,
      regionId: california.id,
      cityId: la.id,
      images: propertyImages.slice(0, 4),
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Central AC', 'Balcony', 'Terrace', 'Sea View', 'Fireplace'],
    },
    {
      title: 'Downtown LA Luxury Loft',
      description: 'Industrial-chic loft in the heart of Downtown LA\'s Arts District. Exposed brick walls, 16-foot ceilings, oversized windows, and an open-concept layout. Building features rooftop pool and fitness center.',
      price: 850000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 160,
      bedrooms: 2,
      bathrooms: 2,
      floors: 8,
      yearBuilt: 2019,
      isFeatured: false,
      address: 'Arts District, Downtown LA',
      latitude: 34.0407,
      longitude: -118.2346,
      countryId: usa.id,
      regionId: california.id,
      cityId: la.id,
      images: apartmentImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Gym', 'Central AC', 'Elevator', 'Balcony'],
    },

    // === NEW YORK PROPERTIES ===
    {
      title: 'Manhattan Luxury Penthouse',
      description: 'Exceptional full-floor penthouse in a prestigious Upper East Side co-op. Grand scale rooms, stunning Central Park views, chef\'s kitchen, library, and formal dining room. White-glove building with 24-hour doorman.',
      price: 18500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.PENTHOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 520,
      bedrooms: 5,
      bathrooms: 6,
      floors: 20,
      yearBuilt: 2017,
      isFeatured: true,
      address: 'Park Avenue, Upper East Side',
      latitude: 40.7644,
      longitude: -73.9732,
      countryId: usa.id,
      regionId: newYork.id,
      cityId: nyc.id,
      images: penthouseImages,
      amenityNames: ['Parking', 'Security', 'Central AC', 'Heating', 'Elevator', 'Concierge', 'Smart Home', 'Laundry', 'Storage'],
    },
    {
      title: 'Brooklyn Heights Brownstone',
      description: 'Beautifully renovated 4-story brownstone in historic Brooklyn Heights. Original details preserved with modern updates. Garden, rooftop terrace, chef\'s kitchen, and 4 bedrooms. Steps from the Brooklyn Heights Promenade.',
      price: 4800000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 380,
      bedrooms: 4,
      bathrooms: 3,
      floors: 4,
      yearBuilt: 1899,
      isFeatured: false,
      address: 'Pierrepont Street, Brooklyn Heights',
      latitude: 40.6960,
      longitude: -73.9936,
      countryId: usa.id,
      regionId: newYork.id,
      cityId: nyc.id,
      images: propertyImages.slice(4, 8),
      amenityNames: ['Garden', 'Heating', 'Terrace', 'Laundry', 'Storage', 'Fireplace'],
    },

    // === LONDON PROPERTIES ===
    {
      title: 'Mayfair Luxury Apartment',
      description: 'Exquisite apartment in the heart of Mayfair, one of London\'s most prestigious addresses. Meticulously designed with the finest materials, the property features 3 bedrooms, a grand reception room, and views over Grosvenor Square.',
      price: 12500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 280,
      bedrooms: 3,
      bathrooms: 3,
      floors: 4,
      yearBuilt: 2020,
      isFeatured: true,
      address: 'Grosvenor Square, Mayfair',
      latitude: 51.5125,
      longitude: -0.1488,
      countryId: uk.id,
      regionId: england.id,
      cityId: london.id,
      images: apartmentImages,
      amenityNames: ['Parking', 'Security', 'Central AC', 'Heating', 'Elevator', 'Concierge', 'Smart Home', 'Laundry'],
    },
    {
      title: 'Chelsea Riverside Townhouse',
      description: 'Stunning 5-bedroom townhouse on the Chelsea Embankment with direct River Thames views. Private garden, off-street parking, and beautifully appointed interiors. A rare opportunity in one of London\'s most desirable locations.',
      price: 9800000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.TOWNHOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 420,
      bedrooms: 5,
      bathrooms: 5,
      floors: 4,
      yearBuilt: 1885,
      isFeatured: false,
      address: 'Chelsea Embankment, Chelsea',
      latitude: 51.4869,
      longitude: -0.1667,
      countryId: uk.id,
      regionId: england.id,
      cityId: london.id,
      images: propertyImages.slice(8, 12),
      amenityNames: ['Garden', 'Parking', 'Security', 'Heating', 'Storage', 'Fireplace', 'Sea View'],
    },
    {
      title: 'Canary Wharf Modern Flat',
      description: 'Contemporary 2-bedroom apartment in Canary Wharf with stunning views of the O2 Arena and River Thames. Modern open-plan living, access to gym, pool, and 24-hour concierge. Steps from the DLR and Jubilee Line.',
      price: 750000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 95,
      bedrooms: 2,
      bathrooms: 2,
      floors: 12,
      yearBuilt: 2022,
      isFeatured: false,
      address: 'South Quay, Canary Wharf',
      latitude: 51.5033,
      longitude: -0.0195,
      countryId: uk.id,
      regionId: england.id,
      cityId: london.id,
      images: apartmentImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Gym', 'Security', 'Central AC', 'Elevator', 'Concierge', 'Laundry', 'Sea View'],
    },

    // === CAIRO PROPERTIES ===
    {
      title: 'Luxury Villa in New Cairo',
      description: 'Magnificent villa in Katameya Heights with 6 bedrooms, private pool, landscaped garden, and maid\'s quarters. Premium finishing, imported Italian marble, and smart home system. Gated community with 24/7 security, golf course, and clubhouse.',
      price: 25000000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.VILLA,
      status: PropertyStatus.AVAILABLE,
      area: 650,
      bedrooms: 6,
      bathrooms: 7,
      floors: 3,
      yearBuilt: 2022,
      isFeatured: true,
      address: 'Katameya Heights, New Cairo',
      latitude: 29.9857,
      longitude: 31.4403,
      countryId: egypt.id,
      regionId: cairoRegion.id,
      cityId: newCairo.id,
      images: villaImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Central AC', 'Balcony', 'Terrace', 'BBQ Area', 'Kids Play Area', 'Smart Home'],
    },
    {
      title: 'Modern Apartment in New Cairo',
      description: 'Contemporary 3-bedroom apartment in Madinaty. Open-plan design with large windows, modern kitchen, and built-in wardrobes. Complex features pool, gym, and landscaped gardens. Close to schools and shopping centers.',
      price: 5500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 200,
      bedrooms: 3,
      bathrooms: 3,
      floors: 8,
      yearBuilt: 2023,
      isFeatured: false,
      address: 'Madinaty, New Cairo',
      latitude: 30.0757,
      longitude: 31.4403,
      countryId: egypt.id,
      regionId: cairoRegion.id,
      cityId: newCairo.id,
      images: apartmentImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Central AC', 'Elevator', 'Kids Play Area'],
    },
    {
      title: 'Penthouse in Sheikh Zayed',
      description: 'Luxurious duplex penthouse in Beverly Hills, Sheikh Zayed. 4 bedrooms with en-suite bathrooms, spacious living and dining areas, private roof garden with pool. Premium finishing throughout with smart home features.',
      price: 18000000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.PENTHOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 380,
      bedrooms: 4,
      bathrooms: 5,
      floors: 12,
      yearBuilt: 2021,
      isFeatured: false,
      address: 'Beverly Hills, Sheikh Zayed',
      latitude: 29.9819,
      longitude: 31.0078,
      countryId: egypt.id,
      regionId: gizaRegion.id,
      cityId: giza.id,
      images: penthouseImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Central AC', 'Terrace', 'Smart Home', 'BBQ Area'],
    },
    {
      title: 'Studio for Rent in Zamalek',
      description: 'Charming furnished studio in the heart of Zamalek with Nile views. Walking distance to restaurants, cafés, and the Cairo Opera House. Building with elevator and 24/7 doorman.',
      price: 15000,
      listingType: ListingType.RENT,
      propertyType: PropertyType.STUDIO,
      status: PropertyStatus.AVAILABLE,
      area: 55,
      bedrooms: null,
      bathrooms: 1,
      floors: 3,
      yearBuilt: 2015,
      isFeatured: false,
      address: '26th July Street, Zamalek',
      latitude: 30.0561,
      longitude: 31.2243,
      countryId: egypt.id,
      regionId: cairoRegion.id,
      cityId: cairo.id,
      images: apartmentImages,
      amenityNames: ['Central AC', 'Elevator', 'Furnished', 'Wi-Fi'],
    },

    // === RIYADH PROPERTIES ===
    {
      title: 'Luxury Villa in Al-Olaya District',
      description: 'Magnificent palace-style villa in Riyadh\'s prestigious Al-Olaya district. Grand entrance hall, majlis, 8 bedrooms, private pool, and landscaped gardens. Impeccable finishing with Arabian-inspired modern design throughout.',
      price: 28000000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.VILLA,
      status: PropertyStatus.AVAILABLE,
      area: 950,
      bedrooms: 8,
      bathrooms: 10,
      floors: 3,
      yearBuilt: 2022,
      isFeatured: true,
      address: 'Al-Olaya District, Riyadh',
      latitude: 24.7136,
      longitude: 46.6753,
      countryId: saudi.id,
      regionId: riyadhRegion.id,
      cityId: riyadh.id,
      images: villaImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Central AC', 'Heating', 'Balcony', 'Terrace', 'Smart Home', 'BBQ Area', 'Kids Play Area'],
    },
    {
      title: 'Modern Apartment in King Abdullah Financial District',
      description: 'Sleek 2-bedroom apartment in KAFD, Riyadh\'s new business hub. Floor-to-ceiling windows, modern finishes, and access to premium amenities. Walking distance to offices, retail, and the metro station.',
      price: 1800000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 135,
      bedrooms: 2,
      bathrooms: 2,
      floors: 15,
      yearBuilt: 2023,
      isFeatured: false,
      address: 'KAFD, Riyadh',
      latitude: 24.7550,
      longitude: 46.6639,
      countryId: saudi.id,
      regionId: riyadhRegion.id,
      cityId: riyadh.id,
      images: apartmentImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Gym', 'Security', 'Central AC', 'Elevator', 'Concierge'],
    },

    // === JEDDAH PROPERTIES ===
    {
      title: 'Seafront Villa in North Obhur',
      description: 'Breathtaking seafront villa with private beach access in Jeddah\'s upscale North Obhur area. Infinity pool, outdoor majlis, modern kitchen, and stunning Red Sea views. Perfect for family living.',
      price: 22000000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.VILLA,
      status: PropertyStatus.AVAILABLE,
      area: 780,
      bedrooms: 7,
      bathrooms: 8,
      floors: 3,
      yearBuilt: 2021,
      isFeatured: false,
      address: 'North Obhur, Jeddah',
      latitude: 21.7584,
      longitude: 39.0871,
      countryId: saudi.id,
      regionId: jeddahRegion.id,
      cityId: jeddah.id,
      images: villaImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Security', 'Central AC', 'Balcony', 'Terrace', 'BBQ Area', 'Kids Play Area', 'Sea View', 'Jacuzzi'],
    },

    // === MORE DUBAI PROPERTIES ===
    {
      title: 'Short-Term Rental Apartment in Marina',
      description: 'Fully furnished 1-bedroom apartment available for short-term rental. Hotel-style amenities, housekeeping available, and stunning marina views. Perfect for business travelers or holiday stays.',
      price: 12000,
      listingType: ListingType.SHORT_TERM,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 75,
      bedrooms: 1,
      bathrooms: 2,
      floors: 18,
      yearBuilt: 2020,
      isFeatured: false,
      address: 'Marina Heights, Dubai Marina',
      latitude: 25.0780,
      longitude: 55.1388,
      countryId: uae.id,
      regionId: dubaiRegion.id,
      cityId: dubai.id,
      images: apartmentImages,
      amenityNames: ['Swimming Pool', 'Gym', 'Central AC', 'Elevator', 'Furnished', 'Wi-Fi', 'Sea View'],
    },
    {
      title: 'Commercial Shop in Downtown Dubai',
      description: 'Prime retail space in Downtown Dubai with high foot traffic. Located near Dubai Mall and Burj Khalifa. Ideal for luxury brand or restaurant. Open plan with high ceilings.',
      price: 5500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.COMMERCIAL,
      status: PropertyStatus.AVAILABLE,
      area: 180,
      bedrooms: null,
      bathrooms: 2,
      floors: 1,
      yearBuilt: 2020,
      isFeatured: false,
      address: 'Emaar Boulevard, Downtown Dubai',
      latitude: 25.1954,
      longitude: 55.2774,
      countryId: uae.id,
      regionId: dubaiRegion.id,
      cityId: dubai.id,
      images: officeImages,
      amenityNames: ['Parking', 'Central AC', 'Security', 'Elevator'],
    },

    // === SAN FRANCISCO PROPERTIES ===
    {
      title: 'Pacific Heights Victorian Home',
      description: 'Beautifully restored Victorian home in San Francisco\'s prestigious Pacific Heights neighborhood. Original details with modern amenities, stunning Bay views, and a landscaped garden.',
      price: 7200000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 420,
      bedrooms: 5,
      bathrooms: 4,
      floors: 3,
      yearBuilt: 1905,
      isFeatured: false,
      address: 'Broadway, Pacific Heights',
      latitude: 37.7928,
      longitude: -122.4340,
      countryId: usa.id,
      regionId: california.id,
      cityId: sf.id,
      images: propertyImages.slice(12, 16),
      amenityNames: ['Garden', 'Parking', 'Heating', 'Terrace', 'Fireplace', 'Sea View'],
    },

    // === MIAMI PROPERTIES ===
    {
      title: 'Miami Beach Waterfront Condo',
      description: 'Ultra-modern waterfront condo with direct ocean access. Floor-to-ceiling windows, Italian kitchen, spa bathroom, and private balcony. Resort-style amenities including pool, spa, beach club, and concierge.',
      price: 4800000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 220,
      bedrooms: 3,
      bathrooms: 4,
      floors: 35,
      yearBuilt: 2023,
      isFeatured: true,
      address: 'Collins Avenue, Miami Beach',
      latitude: 25.7826,
      longitude: -80.1340,
      countryId: usa.id,
      regionId: florida.id,
      cityId: miami.id,
      images: penthouseImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Gym', 'Security', 'Central AC', 'Elevator', 'Balcony', 'Concierge', 'Sauna', 'Jacuzzi', 'Sea View', 'Pet Friendly'],
    },

    // === DALLAS ===
    {
      title: 'Highland Park Estate',
      description: 'Grand estate in exclusive Highland Park. Formal living and dining, gourmet kitchen, home office, wine room, resort-style pool with cabana, and manicured grounds. Minutes from downtown Dallas.',
      price: 5500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 650,
      bedrooms: 6,
      bathrooms: 7,
      floors: 2,
      yearBuilt: 2019,
      isFeatured: false,
      address: 'Preston Road, Highland Park',
      latitude: 32.8362,
      longitude: -96.8000,
      countryId: usa.id,
      regionId: texas.id,
      cityId: dallas.id,
      images: villaImages,
      amenityNames: ['Swimming Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Central AC', 'Heating', 'Balcony', 'Terrace', 'BBQ Area', 'Smart Home'],
    },

    // === ALEXANDRIA ===
    {
      title: 'Sea View Apartment in Stanley',
      description: 'Elegant 3-bedroom apartment with panoramic Mediterranean Sea views in Alexandria\'s Stanley district. Renovated with modern finishes, spacious balcony, and close to Stanley Bridge and restaurants.',
      price: 6500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 220,
      bedrooms: 3,
      bathrooms: 3,
      floors: 6,
      yearBuilt: 2016,
      isFeatured: false,
      address: 'Stanley Bridge, Alexandria',
      latitude: 31.2156,
      longitude: 29.9553,
      countryId: egypt.id,
      regionId: alexRegion.id,
      cityId: alexandria.id,
      images: apartmentImages,
      amenityNames: ['Parking', 'Balcony', 'Sea View', 'Central AC', 'Elevator'],
    },

    // === EDINBURGH ===
    {
      title: 'Georgian Townhouse in New Town',
      description: 'Stunning Georgian townhouse in Edinburgh\'s UNESCO World Heritage New Town. Original period features, 4 bedrooms, private garden, and views of the Firth of Forth. A rare gem in the heart of the city.',
      price: 2200000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.TOWNHOUSE,
      status: PropertyStatus.AVAILABLE,
      area: 310,
      bedrooms: 4,
      bathrooms: 3,
      floors: 4,
      yearBuilt: 1820,
      isFeatured: false,
      address: 'Princes Street, New Town',
      latitude: 55.9521,
      longitude: -3.1896,
      countryId: uk.id,
      regionId: scotland.id,
      cityId: edinburgh.id,
      images: propertyImages.slice(0, 4),
      amenityNames: ['Garden', 'Heating', 'Storage', 'Fireplace'],
    },

    // === MANCHESTER ===
    {
      title: 'City Centre Apartment in Spinningfields',
      description: 'Contemporary 2-bedroom apartment in Manchester\'s vibrant Spinningfields district. High-quality finishes, balcony with city views, and access to on-site gym and concierge. Walking distance to shops and restaurants.',
      price: 450000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      area: 85,
      bedrooms: 2,
      bathrooms: 2,
      floors: 10,
      yearBuilt: 2022,
      isFeatured: false,
      address: 'Spinningfields, Manchester',
      latitude: 53.4794,
      longitude: -2.2490,
      countryId: uk.id,
      regionId: england.id,
      cityId: manchester.id,
      images: apartmentImages,
      amenityNames: ['Parking', 'Gym', 'Central AC', 'Elevator', 'Concierge', 'Balcony'],
    },

    // === LAND PLOTS ===
    {
      title: 'Premium Land Plot in Dubai Hills',
      description: 'Prime residential plot in Dubai Hills Estate. Ideal for building a custom villa. Mature landscaping, gated community with golf course access. Plot size allows for up to 15,000 sqft built-up area.',
      price: 4500000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.LAND,
      status: PropertyStatus.AVAILABLE,
      area: 1200,
      bedrooms: null,
      bathrooms: null,
      floors: null,
      yearBuilt: null,
      isFeatured: false,
      address: 'Dubai Hills Estate',
      latitude: 25.1042,
      longitude: 55.2270,
      countryId: uae.id,
      regionId: dubaiRegion.id,
      cityId: dubai.id,
      images: landImages,
      amenityNames: ['Garden', 'Security'],
    },
    {
      title: 'Agricultural Land in Giza',
      description: 'Fertile agricultural land on the Cairo-Alexandria desert road. Suitable for farming or development. Access to water and electricity. Clear title deed.',
      price: 3000000,
      listingType: ListingType.SALE,
      propertyType: PropertyType.LAND,
      status: PropertyStatus.AVAILABLE,
      area: 5000,
      bedrooms: null,
      bathrooms: null,
      floors: null,
      yearBuilt: null,
      isFeatured: false,
      address: 'Cairo-Alexandria Road, Giza',
      latitude: 30.0131,
      longitude: 31.0128,
      countryId: egypt.id,
      regionId: gizaRegion.id,
      cityId: giza.id,
      images: landImages,
      amenityNames: [],
    },
  ];

  // Agent assignment
  const agentsByCountry: Record<string, string> = {
    [uae.id]: agent2.id,
    [usa.id]: agent1.id,
    [uk.id]: agent3.id,
    [egypt.id]: agent4.id,
    [saudi.id]: agent5.id,
  };

  // Create properties
  for (const pd of propertyData) {
    const slug = pd.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const agentId = agentsByCountry[pd.countryId] || agent1.id;

    const property = await prisma.property.create({
      data: {
        title: pd.title,
        slug,
        description: pd.description,
        price: pd.price,
        listingType: pd.listingType,
        propertyType: pd.propertyType,
        status: pd.status,
        area: pd.area,
        bedrooms: pd.bedrooms,
        bathrooms: pd.bathrooms,
        floors: pd.floors,
        yearBuilt: pd.yearBuilt,
        isFeatured: pd.isFeatured,
        address: pd.address,
        latitude: pd.latitude,
        longitude: pd.longitude,
        countryId: pd.countryId,
        regionId: pd.regionId,
        cityId: pd.cityId,
        agentId,
        images: {
          create: pd.images.map((url, index) => ({
            url,
            alt: pd.title,
            isCover: index === 0,
            order: index,
          })),
        },
        amenities: {
          create: pd.amenityNames.map(name => {
            const amenity = amenities.find(a => a.name === name);
            return amenity ? { amenityId: amenity.id } : null;
          }).filter(Boolean) as { amenityId: string }[],
        },
      },
    });

    console.log(`  🏠 Created: ${pd.title}`);
  }

  // ==================== CREATE FAVORITES ====================
  await prisma.favorite.createMany({
    data: [
      { userId: user1.id, propertyId: (await prisma.property.findFirst({ where: { title: 'Ultra-Luxury Penthouse in Downtown Dubai' } }))!.id },
      { userId: user1.id, propertyId: (await prisma.property.findFirst({ where: { title: 'Manhattan Luxury Penthouse' } }))!.id },
      { userId: user2.id, propertyId: (await prisma.property.findFirst({ where: { title: 'Luxury Villa in Palm Jumeirah' } }))!.id },
      { userId: user2.id, propertyId: (await prisma.property.findFirst({ where: { title: 'Mayfair Luxury Apartment' } }))!.id },
    ],
  });

  // ==================== CREATE INQUIRIES ====================
  await prisma.inquiry.createMany({
    data: [
      { propertyId: (await prisma.property.findFirst({ where: { title: 'Ultra-Luxury Penthouse in Downtown Dubai' } }))!.id, userId: user1.id, name: 'John Doe', email: 'john.doe@email.com', phone: '+1-555-0201', message: 'I am very interested in this penthouse. Can we schedule a viewing this week?', status: 'NEW' },
      { propertyId: (await prisma.property.findFirst({ where: { title: 'Luxury Villa in Palm Jumeirah' } }))!.id, userId: user2.id, name: 'Sarah Smith', email: 'sarah.smith@email.com', phone: '+1-555-0202', message: 'What is the current asking price and is it negotiable? Also, does it come furnished?', status: 'READ' },
      { propertyId: (await prisma.property.findFirst({ where: { title: 'Mayfair Luxury Apartment' } }))!.id, userId: null, name: 'David Brown', email: 'david.brown@email.com', phone: '+44-7700-900123', message: 'Hello, I would like to arrange a viewing of this property next Monday if possible.', status: 'NEW' },
    ],
  });

  // ==================== CREATE BANNERS ====================
  await prisma.banner.createMany({
    data: [
      { title: 'Find Your Dream Home', subtitle: 'Explore thousands of properties worldwide', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=600&fit=crop', link: null, position: 'home', order: 1, isActive: true },
      { title: 'Luxury Living in Dubai', subtitle: 'Discover premium properties in the most prestigious locations', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&h=600&fit=crop', link: null, position: 'home', order: 2, isActive: true },
      { title: 'Invest in Real Estate', subtitle: 'Professional guidance for property investors', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=600&fit=crop', link: null, position: 'home', order: 3, isActive: true },
    ],
  });

  // ==================== UPDATE VIEW COUNTS (simulate) ====================
  const allProperties = await prisma.property.findMany();
  for (const prop of allProperties) {
    const views = prop.isFeatured ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 1000) + 100;
    await prisma.property.update({
      where: { id: prop.id },
      data: { views },
    });
  }

  console.log(`\n✅ Seed completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`  - Countries: 5`);
  console.log(`  - Regions: ${await prisma.region.count()}`);
  console.log(`  - Cities: ${await prisma.city.count()}`);
  console.log(`  - Properties: ${await prisma.property.count()}`);
  console.log(`  - Agents: ${await prisma.agent.count()}`);
  console.log(`  - Users: ${await prisma.user.count()}`);
  console.log(`  - Amenities: ${await prisma.amenity.count()}`);
  console.log(`  - Favorites: ${await prisma.favorite.count()}`);
  console.log(`  - Inquiries: ${await prisma.inquiry.count()}`);
  console.log(`  - Banners: ${await prisma.banner.count()}`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
