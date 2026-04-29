import { PrismaClient, UserRole, ListingType, PropertyType, PropertyStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== UTILITY FUNCTIONS ====================

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// ==================== CONSTANTS ====================

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

const propertyTypes = [PropertyType.APARTMENT, PropertyType.VILLA, PropertyType.HOUSE, PropertyType.PENTHOUSE, PropertyType.OFFICE, PropertyType.LAND, PropertyType.STUDIO, PropertyType.TOWNHOUSE];
const listingTypes = [ListingType.SALE, ListingType.RENT, ListingType.SHORT_TERM];

const adjectives = ['Luxury', 'Modern', 'Premium', 'Elegant', 'Contemporary', 'Spacious', 'Stunning', 'Exquisite', 'Charming', 'Spectacular'];
const descriptionTemplates = [
  'Beautiful {type} located in the heart of {city}. Features {amenityList}. Perfect for {purpose}. This property offers a unique blend of comfort and style, making it an ideal choice for discerning buyers.',
  'Stunning {type} in {city} with {features}. {highlight}. Enjoy modern living with top-notch facilities and a prime location that puts you close to everything you need.',
  'This exquisite {type} in {city} boasts {features}. {highlight}. Recently renovated with high-quality finishes throughout. A rare opportunity to own in one of the most sought-after neighborhoods.',
  'Discover this magnificent {type} nestled in {city}. Offering {amenityList}, this property is perfect for {purpose}. Don\'t miss this exceptional opportunity to invest in a thriving market.',
  'Premium {type} in the vibrant city of {city}. Featuring {features}, this home combines luxury with convenience. {highlight}. Ideal for families and professionals alike.',
  'A remarkable {type} offering the best of {city} living. With {amenityList} and {features}, this property stands out for its quality and location. {highlight}.',
];

const purposes = ['families seeking comfort', 'professionals looking for convenience', 'investors seeking high returns', 'those who appreciate fine living', 'anyone looking for a dream home', 'discerning buyers who value quality'];

const highlights = [
  'Panoramic city views from the top floor await you.',
  'The open-plan layout maximizes natural light throughout the day.',
  'Located steps away from shopping, dining, and entertainment.',
  'Smart home features make daily living effortless and efficient.',
  'A private garden provides a peaceful retreat from city life.',
  'The rooftop terrace offers breathtaking sunset views.',
  'High-end finishes and designer touches throughout.',
  'Minutes from major transport links and business districts.',
];

// ==================== COUNTRY DATA (60 Countries) ====================

interface CountryData {
  name: string;
  code: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  regions: { name: string; cities: { name: string; lat?: number; lng?: number }[] }[];
  priceRange: { sale: [number, number]; rent: [number, number] };
}

const countriesData: CountryData[] = [
  // === ALL 22 ARAB LEAGUE COUNTRIES ===
  {
    name: 'Egypt', code: 'EG', flag: '🇪🇬', currency: 'EGP', currencySymbol: 'E£',
    regions: [
      { name: 'Cairo', cities: [{ name: 'Cairo', lat: 30.0444, lng: 31.2357 }, { name: 'Giza', lat: 29.9765, lng: 31.1313 }, { name: 'New Cairo', lat: 30.0131, lng: 31.4316 }] },
      { name: 'Alexandria', cities: [{ name: 'Alexandria', lat: 31.2001, lng: 29.9187 }, { name: 'Smouha', lat: 31.1915, lng: 29.8962 }] },
      { name: 'Red Sea', cities: [{ name: 'Hurghada', lat: 27.2579, lng: 33.8116 }, { name: 'Sharm El Sheikh', lat: 27.9158, lng: 34.3300 }] },
    ],
    priceRange: { sale: [2000000, 25000000], rent: [8000, 80000] },
  },
  {
    name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', currency: 'AED', currencySymbol: 'د.إ',
    regions: [
      { name: 'Dubai', cities: [{ name: 'Dubai', lat: 25.2048, lng: 55.2708 }, { name: 'Dubai Marina', lat: 25.0805, lng: 55.1403 }, { name: 'Downtown Dubai', lat: 25.1972, lng: 55.2744 }] },
      { name: 'Abu Dhabi', cities: [{ name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 }, { name: 'Al Reem Island', lat: 24.4813, lng: 54.3676 }] },
      { name: 'Sharjah', cities: [{ name: 'Sharjah', lat: 25.3463, lng: 55.4209 }] },
    ],
    priceRange: { sale: [500000, 20000000], rent: [30000, 350000] },
  },
  {
    name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', currency: 'SAR', currencySymbol: '﷼',
    regions: [
      { name: 'Riyadh', cities: [{ name: 'Riyadh', lat: 24.7136, lng: 46.6753 }, { name: 'Al Olaya', lat: 24.6877, lng: 46.7219 }] },
      { name: 'Makkah', cities: [{ name: 'Jeddah', lat: 21.4858, lng: 39.1925 }, { name: 'Mecca', lat: 21.3891, lng: 39.8579 }] },
      { name: 'Eastern Province', cities: [{ name: 'Dammam', lat: 26.3927, lng: 49.9777 }, { name: 'Khobar', lat: 26.2172, lng: 50.1971 }] },
    ],
    priceRange: { sale: [400000, 15000000], rent: [25000, 200000] },
  },
  {
    name: 'Kuwait', code: 'KW', flag: '🇰🇼', currency: 'KWD', currencySymbol: 'د.ك',
    regions: [
      { name: 'Al Asimah', cities: [{ name: 'Kuwait City', lat: 29.3759, lng: 47.9774 }] },
      { name: 'Hawalli', cities: [{ name: 'Salmiya', lat: 29.3340, lng: 48.0794 }, { name: 'Hawalli', lat: 29.3315, lng: 48.0301 }] },
      { name: 'Farwaniya', cities: [{ name: 'Farwaniya', lat: 29.2775, lng: 47.9367 }] },
    ],
    priceRange: { sale: [50000, 2000000], rent: [300, 3000] },
  },
  {
    name: 'Bahrain', code: 'BH', flag: '🇧🇭', currency: 'BHD', currencySymbol: 'د.ب',
    regions: [
      { name: 'Capital Governorate', cities: [{ name: 'Manama', lat: 26.2285, lng: 50.5860 }] },
      { name: 'Northern Governorate', cities: [{ name: 'Muharraq', lat: 26.2573, lng: 50.6148 }, { name: 'Budaiya', lat: 26.2327, lng: 50.5185 }] },
    ],
    priceRange: { sale: [40000, 1500000], rent: [300, 2500] },
  },
  {
    name: 'Qatar', code: 'QA', flag: '🇶🇦', currency: 'QAR', currencySymbol: '﷼',
    regions: [
      { name: 'Doha', cities: [{ name: 'Doha', lat: 25.2854, lng: 51.5310 }, { name: 'West Bay', lat: 25.2913, lng: 51.5297 }, { name: 'The Pearl', lat: 25.3854, lng: 51.5294 }] },
      { name: 'Al Rayyan', cities: [{ name: 'Al Rayyan', lat: 25.2919, lng: 51.4344 }] },
    ],
    priceRange: { sale: [400000, 15000000], rent: [5000, 60000] },
  },
  {
    name: 'Oman', code: 'OM', flag: '🇴🇲', currency: 'OMR', currencySymbol: '﷼',
    regions: [
      { name: 'Muscat', cities: [{ name: 'Muscat', lat: 23.5880, lng: 58.3829 }, { name: 'Seeb', lat: 23.6633, lng: 58.1908 }] },
      { name: 'Al Batinah', cities: [{ name: 'Sohar', lat: 24.3480, lng: 56.7364 }] },
    ],
    priceRange: { sale: [15000, 1000000], rent: [250, 3000] },
  },
  {
    name: 'Yemen', code: 'YE', flag: '🇾🇪', currency: 'YER', currencySymbol: '﷼',
    regions: [
      { name: 'Sana\'a', cities: [{ name: 'Sana\'a', lat: 15.3694, lng: 44.1910 }] },
      { name: 'Aden', cities: [{ name: 'Aden', lat: 12.7794, lng: 45.0367 }] },
    ],
    priceRange: { sale: [5000000, 100000000], rent: [30000, 500000] },
  },
  {
    name: 'Iraq', code: 'IQ', flag: '🇮🇶', currency: 'IQD', currencySymbol: 'ع.د',
    regions: [
      { name: 'Baghdad', cities: [{ name: 'Baghdad', lat: 33.3152, lng: 44.3661 }, { name: 'Erbil', lat: 36.1911, lng: 44.0091 }] },
      { name: 'Basra', cities: [{ name: 'Basra', lat: 30.5085, lng: 47.7964 }] },
    ],
    priceRange: { sale: [50000000, 1000000000], rent: [500000, 5000000] },
  },
  {
    name: 'Syria', code: 'SY', flag: '🇸🇾', currency: 'SYP', currencySymbol: 'ل.س',
    regions: [
      { name: 'Damascus', cities: [{ name: 'Damascus', lat: 33.5138, lng: 36.2765 }] },
      { name: 'Aleppo', cities: [{ name: 'Aleppo', lat: 36.2021, lng: 37.1343 }] },
    ],
    priceRange: { sale: [20000000, 500000000], rent: [100000, 2000000] },
  },
  {
    name: 'Jordan', code: 'JO', flag: '🇯🇴', currency: 'JOD', currencySymbol: 'د.أ',
    regions: [
      { name: 'Amman', cities: [{ name: 'Amman', lat: 31.9454, lng: 35.9284 }, { name: 'Abdoun', lat: 31.9469, lng: 35.8722 }] },
      { name: 'Aqaba', cities: [{ name: 'Aqaba', lat: 29.5267, lng: 35.0078 }] },
    ],
    priceRange: { sale: [50000, 2000000], rent: [400, 4000] },
  },
  {
    name: 'Lebanon', code: 'LB', flag: '🇱🇧', currency: 'LBP', currencySymbol: 'ل.ل',
    regions: [
      { name: 'Beirut', cities: [{ name: 'Beirut', lat: 33.8938, lng: 35.5018 }] },
      { name: 'Mount Lebanon', cities: [{ name: 'Jounieh', lat: 33.9800, lng: 35.6478 }] },
    ],
    priceRange: { sale: [50000000, 5000000000], rent: [1000000, 10000000] },
  },
  {
    name: 'Palestine', code: 'PS', flag: '🇵🇸', currency: 'ILS', currencySymbol: '₪',
    regions: [
      { name: 'West Bank', cities: [{ name: 'Ramallah', lat: 31.9028, lng: 35.2331 }, { name: 'Bethlehem', lat: 31.7079, lng: 35.2035 }] },
      { name: 'Gaza', cities: [{ name: 'Gaza City', lat: 31.3891, lng: 34.3431 }] },
    ],
    priceRange: { sale: [200000, 2000000], rent: [1500, 8000] },
  },
  {
    name: 'Libya', code: 'LY', flag: '🇱🇾', currency: 'LYD', currencySymbol: 'ل.د',
    regions: [
      { name: 'Tripoli', cities: [{ name: 'Tripoli', lat: 32.8872, lng: 13.1913 }] },
      { name: 'Benghazi', cities: [{ name: 'Benghazi', lat: 32.1194, lng: 20.0868 }] },
    ],
    priceRange: { sale: [50000, 1000000], rent: [300, 3000] },
  },
  {
    name: 'Tunisia', code: 'TN', flag: '🇹🇳', currency: 'TND', currencySymbol: 'د.ت',
    regions: [
      { name: 'Tunis', cities: [{ name: 'Tunis', lat: 36.8065, lng: 10.1815 }, { name: 'Sfax', lat: 34.7406, lng: 10.7603 }] },
      { name: 'Sousse', cities: [{ name: 'Sousse', lat: 35.8254, lng: 10.6369 }, { name: 'Hammamet', lat: 36.4000, lng: 10.6167 }] },
    ],
    priceRange: { sale: [100000, 2000000], rent: [600, 6000] },
  },
  {
    name: 'Algeria', code: 'DZ', flag: '🇩🇿', currency: 'DZD', currencySymbol: 'د.ج',
    regions: [
      { name: 'Algiers', cities: [{ name: 'Algiers', lat: 36.7538, lng: 3.0588 }] },
      { name: 'Oran', cities: [{ name: 'Oran', lat: 35.6969, lng: -0.6331 }, { name: 'Constantine', lat: 36.3650, lng: 6.6147 }] },
    ],
    priceRange: { sale: [8000000, 100000000], rent: [40000, 400000] },
  },
  {
    name: 'Morocco', code: 'MA', flag: '🇲🇦', currency: 'MAD', currencySymbol: 'د.م',
    regions: [
      { name: 'Casablanca', cities: [{ name: 'Casablanca', lat: 33.5731, lng: -7.5898 }, { name: 'Rabat', lat: 34.0209, lng: -6.8416 }] },
      { name: 'Marrakech', cities: [{ name: 'Marrakech', lat: 31.6295, lng: -7.9811 }, { name: 'Tangier', lat: 35.7595, lng: -5.8340 }] },
      { name: 'Fes', cities: [{ name: 'Fes', lat: 34.0181, lng: -5.0078 }] },
    ],
    priceRange: { sale: [500000, 15000000], rent: [3000, 30000] },
  },
  {
    name: 'Sudan', code: 'SD', flag: '🇸🇩', currency: 'SDG', currencySymbol: 'ج.س',
    regions: [
      { name: 'Khartoum', cities: [{ name: 'Khartoum', lat: 15.5007, lng: 32.5599 }] },
      { name: 'Omdurman', cities: [{ name: 'Omdurman', lat: 15.6445, lng: 32.4744 }] },
    ],
    priceRange: { sale: [50000000, 1000000000], rent: [100000, 2000000] },
  },
  {
    name: 'Somalia', code: 'SO', flag: '🇸🇴', currency: 'SOS', currencySymbol: 'Sh',
    regions: [
      { name: 'Mogadishu', cities: [{ name: 'Mogadishu', lat: 2.0469, lng: 45.3182 }] },
      { name: 'Hargeisa', cities: [{ name: 'Hargeisa', lat: 9.5600, lng: 44.0650 }] },
    ],
    priceRange: { sale: [10000, 500000], rent: [100, 2000] },
  },
  {
    name: 'Djibouti', code: 'DJ', flag: '🇩🇯', currency: 'DJF', currencySymbol: 'Fdj',
    regions: [
      { name: 'Djibouti', cities: [{ name: 'Djibouti City', lat: 11.5880, lng: 43.1456 }] },
    ],
    priceRange: { sale: [5000000, 100000000], rent: [30000, 300000] },
  },
  {
    name: 'Comoros', code: 'KM', flag: '🇰🇲', currency: 'KMF', currencySymbol: 'CF',
    regions: [
      { name: 'Grande Comore', cities: [{ name: 'Moroni', lat: -11.6885, lng: 43.2524 }] },
    ],
    priceRange: { sale: [5000000, 50000000], rent: [20000, 200000] },
  },
  {
    name: 'Mauritania', code: 'MR', flag: '🇲🇷', currency: 'MRU', currencySymbol: 'UM',
    regions: [
      { name: 'Nouakchott', cities: [{ name: 'Nouakchott', lat: 18.0735, lng: -15.9582 }] },
      { name: 'Nouadhibou', cities: [{ name: 'Nouadhibou', lat: 20.9311, lng: -17.0317 }] },
    ],
    priceRange: { sale: [500000, 10000000], rent: [3000, 30000] },
  },

  // === MAJOR COUNTRIES ===
  {
    name: 'United States', code: 'US', flag: '🇺🇸', currency: 'USD', currencySymbol: '$',
    regions: [
      { name: 'New York', cities: [{ name: 'New York City', lat: 40.7128, lng: -74.0060 }, { name: 'Brooklyn', lat: 40.6782, lng: -73.9442 }] },
      { name: 'California', cities: [{ name: 'Los Angeles', lat: 34.0522, lng: -118.2437 }, { name: 'San Francisco', lat: 37.7749, lng: -122.4194 }, { name: 'San Diego', lat: 32.7157, lng: -117.1611 }] },
      { name: 'Florida', cities: [{ name: 'Miami', lat: 25.7617, lng: -80.1918 }, { name: 'Orlando', lat: 28.5383, lng: -81.3792 }] },
      { name: 'Texas', cities: [{ name: 'Houston', lat: 29.7604, lng: -95.3698 }, { name: 'Dallas', lat: 32.7767, lng: -96.7970 }] },
    ],
    priceRange: { sale: [200000, 10000000], rent: [1500, 25000] },
  },
  {
    name: 'United Kingdom', code: 'GB', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£',
    regions: [
      { name: 'England', cities: [{ name: 'London', lat: 51.5074, lng: -0.1278 }, { name: 'Manchester', lat: 53.4808, lng: -2.2426 }] },
      { name: 'Scotland', cities: [{ name: 'Edinburgh', lat: 55.9533, lng: -3.1883 }] },
      { name: 'Wales', cities: [{ name: 'Cardiff', lat: 51.4816, lng: -3.1791 }] },
    ],
    priceRange: { sale: [150000, 15000000], rent: [1000, 15000] },
  },
  {
    name: 'Canada', code: 'CA', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$',
    regions: [
      { name: 'Ontario', cities: [{ name: 'Toronto', lat: 43.6532, lng: -79.3832 }, { name: 'Ottawa', lat: 45.4215, lng: -75.6972 }] },
      { name: 'British Columbia', cities: [{ name: 'Vancouver', lat: 49.2827, lng: -123.1207 }] },
      { name: 'Quebec', cities: [{ name: 'Montreal', lat: 45.5017, lng: -73.5673 }] },
    ],
    priceRange: { sale: [300000, 8000000], rent: [1500, 12000] },
  },
  {
    name: 'Australia', code: 'AU', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$',
    regions: [
      { name: 'New South Wales', cities: [{ name: 'Sydney', lat: -33.8688, lng: 151.2093 }] },
      { name: 'Victoria', cities: [{ name: 'Melbourne', lat: -37.8136, lng: 144.9631 }] },
      { name: 'Queensland', cities: [{ name: 'Brisbane', lat: -27.4698, lng: 153.0251 }] },
    ],
    priceRange: { sale: [400000, 10000000], rent: [2000, 15000] },
  },
  {
    name: 'Germany', code: 'DE', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Berlin', cities: [{ name: 'Berlin', lat: 52.5200, lng: 13.4050 }] },
      { name: 'Bavaria', cities: [{ name: 'Munich', lat: 48.1351, lng: 11.5820 }] },
      { name: 'Hesse', cities: [{ name: 'Frankfurt', lat: 50.1109, lng: 8.6821 }] },
    ],
    priceRange: { sale: [200000, 8000000], rent: [800, 8000] },
  },
  {
    name: 'France', code: 'FR', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Île-de-France', cities: [{ name: 'Paris', lat: 48.8566, lng: 2.3522 }] },
      { name: 'Provence-Alpes', cities: [{ name: 'Marseille', lat: 43.2965, lng: 5.3698 }, { name: 'Nice', lat: 43.7102, lng: 7.2620 }] },
      { name: 'Auvergne-Rhône-Alpes', cities: [{ name: 'Lyon', lat: 45.7640, lng: 4.8357 }] },
    ],
    priceRange: { sale: [200000, 15000000], rent: [800, 10000] },
  },
  {
    name: 'Spain', code: 'ES', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Madrid', cities: [{ name: 'Madrid', lat: 40.4168, lng: -3.7038 }] },
      { name: 'Catalonia', cities: [{ name: 'Barcelona', lat: 41.3874, lng: 2.1686 }] },
      { name: 'Andalusia', cities: [{ name: 'Malaga', lat: 36.7213, lng: -4.4214 }, { name: 'Seville', lat: 37.3891, lng: -5.9845 }] },
    ],
    priceRange: { sale: [100000, 8000000], rent: [600, 8000] },
  },
  {
    name: 'Italy', code: 'IT', flag: '🇮🇹', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Lombardy', cities: [{ name: 'Milan', lat: 45.4642, lng: 9.1900 }] },
      { name: 'Lazio', cities: [{ name: 'Rome', lat: 41.9028, lng: 12.4964 }] },
      { name: 'Tuscany', cities: [{ name: 'Florence', lat: 43.7696, lng: 11.2558 }] },
    ],
    priceRange: { sale: [150000, 10000000], rent: [700, 8000] },
  },
  {
    name: 'Turkey', code: 'TR', flag: '🇹🇷', currency: 'TRY', currencySymbol: '₺',
    regions: [
      { name: 'Istanbul', cities: [{ name: 'Istanbul', lat: 41.0082, lng: 28.9784 }] },
      { name: 'Ankara', cities: [{ name: 'Ankara', lat: 39.9334, lng: 32.8597 }] },
      { name: 'Antalya', cities: [{ name: 'Antalya', lat: 36.8969, lng: 30.7133 }] },
    ],
    priceRange: { sale: [1000000, 50000000], rent: [5000, 50000] },
  },
  {
    name: 'China', code: 'CN', flag: '🇨🇳', currency: 'CNY', currencySymbol: '¥',
    regions: [
      { name: 'Beijing', cities: [{ name: 'Beijing', lat: 39.9042, lng: 116.4074 }] },
      { name: 'Shanghai', cities: [{ name: 'Shanghai', lat: 31.2304, lng: 121.4737 }] },
      { name: 'Guangdong', cities: [{ name: 'Guangzhou', lat: 23.1291, lng: 113.2644 }, { name: 'Shenzhen', lat: 22.5431, lng: 114.0579 }] },
    ],
    priceRange: { sale: [1000000, 30000000], rent: [5000, 50000] },
  },
  {
    name: 'Japan', code: 'JP', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥',
    regions: [
      { name: 'Kanto', cities: [{ name: 'Tokyo', lat: 35.6762, lng: 139.6503 }] },
      { name: 'Kansai', cities: [{ name: 'Osaka', lat: 34.6937, lng: 135.5023 }] },
    ],
    priceRange: { sale: [20000000, 500000000], rent: [80000, 500000] },
  },
  {
    name: 'India', code: 'IN', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹',
    regions: [
      { name: 'Maharashtra', cities: [{ name: 'Mumbai', lat: 19.0760, lng: 72.8777 }] },
      { name: 'Delhi', cities: [{ name: 'New Delhi', lat: 28.6139, lng: 77.2090 }] },
      { name: 'Karnataka', cities: [{ name: 'Bangalore', lat: 12.9716, lng: 77.5946 }] },
      { name: 'Tamil Nadu', cities: [{ name: 'Chennai', lat: 13.0827, lng: 80.2707 }] },
    ],
    priceRange: { sale: [2000000, 100000000], rent: [15000, 200000] },
  },
  {
    name: 'Russia', code: 'RU', flag: '🇷🇺', currency: 'RUB', currencySymbol: '₽',
    regions: [
      { name: 'Moscow', cities: [{ name: 'Moscow', lat: 55.7558, lng: 37.6173 }] },
      { name: 'Saint Petersburg', cities: [{ name: 'Saint Petersburg', lat: 59.9343, lng: 30.3351 }] },
    ],
    priceRange: { sale: [5000000, 200000000], rent: [20000, 300000] },
  },
  {
    name: 'Brazil', code: 'BR', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$',
    regions: [
      { name: 'São Paulo', cities: [{ name: 'São Paulo', lat: -23.5505, lng: -46.6333 }] },
      { name: 'Rio de Janeiro', cities: [{ name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 }] },
    ],
    priceRange: { sale: [300000, 15000000], rent: [2000, 20000] },
  },
  {
    name: 'Mexico', code: 'MX', flag: '🇲🇽', currency: 'MXN', currencySymbol: '$',
    regions: [
      { name: 'Mexico City', cities: [{ name: 'Mexico City', lat: 19.4326, lng: -99.1332 }] },
      { name: 'Jalisco', cities: [{ name: 'Guadalajara', lat: 20.6597, lng: -103.3496 }] },
      { name: 'Quintana Roo', cities: [{ name: 'Cancún', lat: 21.1619, lng: -86.8515 }] },
    ],
    priceRange: { sale: [1000000, 20000000], rent: [8000, 60000] },
  },
  {
    name: 'Argentina', code: 'AR', flag: '🇦🇷', currency: 'ARS', currencySymbol: '$',
    regions: [
      { name: 'Buenos Aires', cities: [{ name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 }] },
      { name: 'Córdoba', cities: [{ name: 'Córdoba', lat: -31.4201, lng: -64.1888 }] },
    ],
    priceRange: { sale: [50000000, 500000000], rent: [150000, 1500000] },
  },
  {
    name: 'South Africa', code: 'ZA', flag: '🇿🇦', currency: 'ZAR', currencySymbol: 'R',
    regions: [
      { name: 'Gauteng', cities: [{ name: 'Johannesburg', lat: -26.2041, lng: 28.0473 }] },
      { name: 'Western Cape', cities: [{ name: 'Cape Town', lat: -33.9249, lng: 18.4241 }] },
    ],
    priceRange: { sale: [500000, 20000000], rent: [5000, 50000] },
  },
  {
    name: 'Nigeria', code: 'NG', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦',
    regions: [
      { name: 'Lagos', cities: [{ name: 'Lagos', lat: 6.5244, lng: 3.3792 }] },
      { name: 'Abuja', cities: [{ name: 'Abuja', lat: 9.0579, lng: 7.4951 }] },
    ],
    priceRange: { sale: [20000000, 500000000], rent: [200000, 5000000] },
  },
  {
    name: 'Kenya', code: 'KE', flag: '🇰🇪', currency: 'KES', currencySymbol: 'KSh',
    regions: [
      { name: 'Nairobi', cities: [{ name: 'Nairobi', lat: -1.2921, lng: 36.8219 }] },
      { name: 'Mombasa', cities: [{ name: 'Mombasa', lat: -4.0435, lng: 39.6682 }] },
    ],
    priceRange: { sale: [5000000, 200000000], rent: [30000, 500000] },
  },
  {
    name: 'Malaysia', code: 'MY', flag: '🇲🇾', currency: 'MYR', currencySymbol: 'RM',
    regions: [
      { name: 'Kuala Lumpur', cities: [{ name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869 }] },
      { name: 'Penang', cities: [{ name: 'Penang', lat: 5.4164, lng: 100.3327 }] },
    ],
    priceRange: { sale: [300000, 5000000], rent: [1500, 15000] },
  },
  {
    name: 'Indonesia', code: 'ID', flag: '🇮🇩', currency: 'IDR', currencySymbol: 'Rp',
    regions: [
      { name: 'Jakarta', cities: [{ name: 'Jakarta', lat: -6.2088, lng: 106.8456 }] },
      { name: 'Bali', cities: [{ name: 'Bali', lat: -8.3405, lng: 115.0920 }] },
      { name: 'Surabaya', cities: [{ name: 'Surabaya', lat: -7.2575, lng: 112.7521 }] },
    ],
    priceRange: { sale: [500000000, 20000000000], rent: [5000000, 100000000] },
  },
  {
    name: 'Thailand', code: 'TH', flag: '🇹🇭', currency: 'THB', currencySymbol: '฿',
    regions: [
      { name: 'Bangkok', cities: [{ name: 'Bangkok', lat: 13.7563, lng: 100.5018 }] },
      { name: 'Phuket', cities: [{ name: 'Phuket', lat: 7.8804, lng: 98.3923 }] },
      { name: 'Chiang Mai', cities: [{ name: 'Chiang Mai', lat: 18.7883, lng: 98.9853 }] },
    ],
    priceRange: { sale: [2000000, 50000000], rent: [15000, 150000] },
  },
  {
    name: 'Singapore', code: 'SG', flag: '🇸🇬', currency: 'SGD', currencySymbol: 'S$',
    regions: [
      { name: 'Central', cities: [{ name: 'Singapore', lat: 1.3521, lng: 103.8198 }] },
    ],
    priceRange: { sale: [500000, 20000000], rent: [2500, 20000] },
  },
  {
    name: 'Philippines', code: 'PH', flag: '🇵🇭', currency: 'PHP', currencySymbol: '₱',
    regions: [
      { name: 'Metro Manila', cities: [{ name: 'Manila', lat: 14.5995, lng: 120.9842 }, { name: 'Makati', lat: 14.5547, lng: 121.0244 }] },
      { name: 'Cebu', cities: [{ name: 'Cebu City', lat: 10.3157, lng: 123.8854 }] },
    ],
    priceRange: { sale: [2000000, 100000000], rent: [15000, 200000] },
  },
  {
    name: 'South Korea', code: 'KR', flag: '🇰🇷', currency: 'KRW', currencySymbol: '₩',
    regions: [
      { name: 'Seoul', cities: [{ name: 'Seoul', lat: 37.5665, lng: 126.9780 }] },
      { name: 'Busan', cities: [{ name: 'Busan', lat: 35.1796, lng: 129.0756 }] },
    ],
    priceRange: { sale: [200000000, 5000000000], rent: [500000, 5000000] },
  },
  {
    name: 'Netherlands', code: 'NL', flag: '🇳🇱', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'North Holland', cities: [{ name: 'Amsterdam', lat: 52.3676, lng: 4.9041 }] },
      { name: 'South Holland', cities: [{ name: 'Rotterdam', lat: 51.9244, lng: 4.4777 }] },
    ],
    priceRange: { sale: [200000, 5000000], rent: [1000, 6000] },
  },
  {
    name: 'Switzerland', code: 'CH', flag: '🇨🇭', currency: 'CHF', currencySymbol: 'CHF',
    regions: [
      { name: 'Zurich', cities: [{ name: 'Zurich', lat: 47.3769, lng: 8.5417 }] },
      { name: 'Geneva', cities: [{ name: 'Geneva', lat: 46.2044, lng: 6.1432 }] },
    ],
    priceRange: { sale: [400000, 15000000], rent: [2000, 15000] },
  },
  {
    name: 'Sweden', code: 'SE', flag: '🇸🇪', currency: 'SEK', currencySymbol: 'kr',
    regions: [
      { name: 'Stockholm', cities: [{ name: 'Stockholm', lat: 59.3293, lng: 18.0686 }] },
      { name: 'West Sweden', cities: [{ name: 'Gothenburg', lat: 57.7089, lng: 11.9746 }] },
    ],
    priceRange: { sale: [2000000, 30000000], rent: [8000, 50000] },
  },
  {
    name: 'Norway', code: 'NO', flag: '🇳🇴', currency: 'NOK', currencySymbol: 'kr',
    regions: [
      { name: 'Oslo', cities: [{ name: 'Oslo', lat: 59.9139, lng: 10.7522 }] },
    ],
    priceRange: { sale: [2000000, 30000000], rent: [10000, 60000] },
  },
  {
    name: 'Poland', code: 'PL', flag: '🇵🇱', currency: 'PLN', currencySymbol: 'zł',
    regions: [
      { name: 'Masovia', cities: [{ name: 'Warsaw', lat: 52.2297, lng: 21.0122 }] },
      { name: 'Lesser Poland', cities: [{ name: 'Krakow', lat: 50.0647, lng: 19.9450 }] },
    ],
    priceRange: { sale: [300000, 5000000], rent: [2000, 15000] },
  },
  {
    name: 'Portugal', code: 'PT', flag: '🇵🇹', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Lisbon', cities: [{ name: 'Lisbon', lat: 38.7223, lng: -9.1393 }] },
      { name: 'Porto', cities: [{ name: 'Porto', lat: 41.1579, lng: -8.6291 }] },
      { name: 'Algarve', cities: [{ name: 'Faro', lat: 37.0179, lng: -7.9304 }] },
    ],
    priceRange: { sale: [100000, 5000000], rent: [600, 6000] },
  },
  {
    name: 'Greece', code: 'GR', flag: '🇬🇷', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Attica', cities: [{ name: 'Athens', lat: 37.9838, lng: 23.7275 }] },
      { name: 'Central Macedonia', cities: [{ name: 'Thessaloniki', lat: 40.6401, lng: 22.9444 }] },
    ],
    priceRange: { sale: [80000, 5000000], rent: [400, 5000] },
  },
  {
    name: 'Austria', code: 'AT', flag: '🇦🇹', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Vienna', cities: [{ name: 'Vienna', lat: 48.2082, lng: 16.3738 }] },
      { name: 'Salzburg', cities: [{ name: 'Salzburg', lat: 47.8095, lng: 13.0550 }] },
    ],
    priceRange: { sale: [200000, 8000000], rent: [800, 8000] },
  },
  {
    name: 'New Zealand', code: 'NZ', flag: '🇳🇿', currency: 'NZD', currencySymbol: 'NZ$',
    regions: [
      { name: 'Auckland', cities: [{ name: 'Auckland', lat: -36.8485, lng: 174.7633 }] },
      { name: 'Wellington', cities: [{ name: 'Wellington', lat: -41.2865, lng: 174.7762 }] },
    ],
    priceRange: { sale: [400000, 5000000], rent: [2000, 10000] },
  },
  {
    name: 'Ireland', code: 'IE', flag: '🇮🇪', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Dublin', cities: [{ name: 'Dublin', lat: 53.3498, lng: -6.2603 }] },
      { name: 'Cork', cities: [{ name: 'Cork', lat: 51.8985, lng: -8.4756 }] },
    ],
    priceRange: { sale: [200000, 5000000], rent: [1000, 8000] },
  },
  {
    name: 'Colombia', code: 'CO', flag: '🇨🇴', currency: 'COP', currencySymbol: '$',
    regions: [
      { name: 'Bogotá', cities: [{ name: 'Bogotá', lat: 4.7110, lng: -74.0721 }] },
      { name: 'Medellín', cities: [{ name: 'Medellín', lat: 6.2442, lng: -75.5812 }] },
    ],
    priceRange: { sale: [200000000, 5000000000], rent: [1500000, 15000000] },
  },
  {
    name: 'Chile', code: 'CL', flag: '🇨🇱', currency: 'CLP', currencySymbol: '$',
    regions: [
      { name: 'Santiago', cities: [{ name: 'Santiago', lat: -33.4489, lng: -70.6693 }] },
      { name: 'Valparaíso', cities: [{ name: 'Valparaíso', lat: -33.0472, lng: -71.6127 }] },
    ],
    priceRange: { sale: [80000000, 2000000000], rent: [400000, 4000000] },
  },
  {
    name: 'Peru', code: 'PE', flag: '🇵🇪', currency: 'PEN', currencySymbol: 'S/',
    regions: [
      { name: 'Lima', cities: [{ name: 'Lima', lat: -12.0464, lng: -77.0428 }] },
      { name: 'Cusco', cities: [{ name: 'Cusco', lat: -13.5319, lng: -71.9675 }] },
    ],
    priceRange: { sale: [150000, 3000000], rent: [1000, 10000] },
  },
  {
    name: 'Pakistan', code: 'PK', flag: '🇵🇰', currency: 'PKR', currencySymbol: '₨',
    regions: [
      { name: 'Sindh', cities: [{ name: 'Karachi', lat: 24.8607, lng: 67.0011 }] },
      { name: 'Punjab', cities: [{ name: 'Lahore', lat: 31.5204, lng: 74.3587 }, { name: 'Islamabad', lat: 33.6844, lng: 73.0479 }] },
    ],
    priceRange: { sale: [5000000, 200000000], rent: [30000, 500000] },
  },
  {
    name: 'Bangladesh', code: 'BD', flag: '🇧🇩', currency: 'BDT', currencySymbol: '৳',
    regions: [
      { name: 'Dhaka', cities: [{ name: 'Dhaka', lat: 23.8103, lng: 90.4125 }] },
      { name: 'Chittagong', cities: [{ name: 'Chittagong', lat: 22.3569, lng: 91.7832 }] },
    ],
    priceRange: { sale: [5000000, 100000000], rent: [20000, 200000] },
  },
  {
    name: 'Ukraine', code: 'UA', flag: '🇺🇦', currency: 'UAH', currencySymbol: '₴',
    regions: [
      { name: 'Kyiv', cities: [{ name: 'Kyiv', lat: 50.4501, lng: 30.5234 }] },
      { name: 'Lviv', cities: [{ name: 'Lviv', lat: 49.8397, lng: 24.0297 }] },
    ],
    priceRange: { sale: [1000000, 20000000], rent: [5000, 50000] },
  },
  {
    name: 'Romania', code: 'RO', flag: '🇷🇴', currency: 'RON', currencySymbol: 'lei',
    regions: [
      { name: 'Bucharest', cities: [{ name: 'Bucharest', lat: 44.4268, lng: 26.1025 }] },
      { name: 'Cluj', cities: [{ name: 'Cluj-Napoca', lat: 46.7712, lng: 23.6236 }] },
    ],
    priceRange: { sale: [50000, 1000000], rent: [300, 3000] },
  },
  {
    name: 'Czech Republic', code: 'CZ', flag: '🇨🇿', currency: 'CZK', currencySymbol: 'Kč',
    regions: [
      { name: 'Prague', cities: [{ name: 'Prague', lat: 50.0755, lng: 14.4378 }] },
      { name: 'Brno', cities: [{ name: 'Brno', lat: 49.1951, lng: 16.6068 }] },
    ],
    priceRange: { sale: [2000000, 40000000], rent: [10000, 60000] },
  },
  {
    name: 'Hungary', code: 'HU', flag: '🇭🇺', currency: 'HUF', currencySymbol: 'Ft',
    regions: [
      { name: 'Budapest', cities: [{ name: 'Budapest', lat: 47.4979, lng: 19.0402 }] },
    ],
    priceRange: { sale: [15000000, 300000000], rent: [80000, 600000] },
  },
  {
    name: 'Denmark', code: 'DK', flag: '🇩🇰', currency: 'DKK', currencySymbol: 'kr',
    regions: [
      { name: 'Capital Region', cities: [{ name: 'Copenhagen', lat: 55.6761, lng: 12.5683 }] },
      { name: 'Aarhus', cities: [{ name: 'Aarhus', lat: 56.1629, lng: 10.2039 }] },
    ],
    priceRange: { sale: [1500000, 25000000], rent: [8000, 40000] },
  },
  {
    name: 'Finland', code: 'FI', flag: '🇫🇮', currency: 'EUR', currencySymbol: '€',
    regions: [
      { name: 'Uusimaa', cities: [{ name: 'Helsinki', lat: 60.1699, lng: 24.9384 }] },
    ],
    priceRange: { sale: [200000, 3000000], rent: [800, 6000] },
  },
];

// ==================== AMENITY DATA (24 Amenities) ====================

const amenitiesData = [
  { name: 'Swimming Pool', icon: 'waves', category: 'exterior' },
  { name: 'Parking', icon: 'car', category: 'exterior' },
  { name: 'Garden', icon: 'trees', category: 'exterior' },
  { name: 'Gym', icon: 'dumbbell', category: 'community' },
  { name: 'Security', icon: 'shield', category: 'community' },
  { name: 'Central AC', icon: 'thermometer', category: 'interior' },
  { name: 'Heating', icon: 'flame', category: 'interior' },
  { name: 'Elevator', icon: 'arrow-up', category: 'community' },
  { name: 'Balcony', icon: 'sun', category: 'exterior' },
  { name: 'Terrace', icon: 'home', category: 'exterior' },
  { name: 'Concierge', icon: 'bell', category: 'community' },
  { name: 'Laundry', icon: 'shirt', category: 'interior' },
  { name: 'Storage', icon: 'box', category: 'interior' },
  { name: 'Wi-Fi', icon: 'wifi', category: 'interior' },
  { name: 'Pet Friendly', icon: 'heart', category: 'community' },
  { name: 'Furnished', icon: 'sofa', category: 'interior' },
  { name: 'BBQ Area', icon: 'flame', category: 'exterior' },
  { name: 'Kids Play Area', icon: 'baby', category: 'community' },
  { name: 'Sauna', icon: 'droplets', category: 'community' },
  { name: 'Jacuzzi', icon: 'bath', category: 'exterior' },
  { name: 'Smart Home', icon: 'cpu', category: 'interior' },
  { name: 'Fireplace', icon: 'flame-kindling', category: 'interior' },
  { name: 'Mountain View', icon: 'mountain', category: 'exterior' },
  { name: 'Sea View', icon: 'sailboat', category: 'exterior' },
];

// ==================== COMPANY DATA (5 Companies) ====================

const companiesData = [
  { name: 'Global Realty Partners', logo: null, description: 'Leading international real estate firm with over 20 years of experience in residential and commercial properties across 30 countries.', phone: '+1-800-555-0101', email: 'info@globalrealty.com', website: 'https://globalrealty.com', address: '350 Fifth Avenue, New York, NY 10118', founded: 2003, agentCount: 2, listingCount: 25 },
  { name: 'Prestige Homes International', logo: null, description: 'Premium property specialists focusing on luxury villas, penthouses, and waterfront properties in the Middle East and Europe.', phone: '+44-20-7946-0958', email: 'contact@prestigehomes.com', website: 'https://prestigehomes.com', address: '1 Mayfair Place, London W1K 3QT', founded: 2008, agentCount: 1, listingCount: 18 },
  { name: 'Arabian Estates', logo: null, description: 'The Gulf region\'s most trusted real estate agency, specializing in premium residential and commercial properties across the Arab world.', phone: '+971-4-555-0202', email: 'sales@arabianestates.ae', website: 'https://arabianestates.ae', address: 'DIFC, Gate Avenue, Dubai, UAE', founded: 2010, agentCount: 1, listingCount: 15 },
  { name: 'Horizon Property Group', logo: null, description: 'Award-winning real estate agency connecting buyers and sellers across Asia-Pacific with a portfolio of over 2,000 properties.', phone: '+65-6555-0303', email: 'hello@horizonproperty.sg', website: 'https://horizonproperty.sg', address: '1 Raffles Place, Tower 2, Singapore', founded: 2012, agentCount: 1, listingCount: 12 },
  { name: 'Meridian Real Estate', logo: null, description: 'Full-service real estate company providing comprehensive property solutions across Africa and the Middle East since 2005.', phone: '+27-21-555-0404', email: 'info@meridianre.co.za', website: 'https://meridianre.co.za', address: 'V&A Waterfront, Cape Town, South Africa', founded: 2005, agentCount: 1, listingCount: 10 },
];

// ==================== AGENT DATA (6 Agents) ====================

const agentsData = [
  { email: 'sarah.johnson@globalrealty.com', name: 'Sarah Johnson', title: 'Senior Real Estate Agent', bio: 'With over 15 years of experience in luxury real estate, Sarah specializes in high-end residential properties across North America and Europe. Her client-first approach and deep market knowledge have earned her multiple industry awards.', license: 'REA-2010-4521', phone: '+1-555-0101', whatsapp: '+1-555-0101', experience: 15, rating: 4.9, totalListings: 42, totalSales: 38, verified: true },
  { email: 'ahmed.hassan@arabianestates.ae', name: 'Ahmed Hassan', title: 'Luxury Property Specialist', bio: 'Ahmed is a leading real estate expert in the Gulf region with expertise in luxury villas and penthouses. He has successfully closed over 200 deals worth over $500 million in the past decade.', license: 'DRE-2015-7832', phone: '+971-555-0202', whatsapp: '+971-555-0202', experience: 12, rating: 4.8, totalListings: 35, totalSales: 210, verified: true },
  { email: 'emma.williams@prestigehomes.com', name: 'Emma Williams', title: 'European Property Advisor', bio: 'Emma brings a wealth of knowledge about European real estate markets, with particular expertise in London, Paris, and Mediterranean properties. Her multilingual skills make her the go-to agent for international clients.', license: 'UK-EA-2012-3345', phone: '+44-555-0303', whatsapp: '+44-555-0303', experience: 10, rating: 4.7, totalListings: 28, totalSales: 24, verified: true },
  { email: 'kenji.tanaka@horizonproperty.sg', name: 'Kenji Tanaka', title: 'Asia-Pacific Market Expert', bio: 'Kenji specializes in premium properties across Japan, Singapore, and Southeast Asia. His understanding of Asian real estate dynamics and investment opportunities is unmatched in the industry.', license: 'SG-REA-2016-9012', phone: '+65-555-0404', whatsapp: '+65-555-0404', experience: 8, rating: 4.8, totalListings: 30, totalSales: 26, verified: true },
  { email: 'fatima.alraeesi@meridianre.co.za', name: 'Fatima Al-Raeesi', title: 'Middle East & Africa Specialist', bio: 'Fatima bridges the Middle East and African real estate markets with deep expertise in both regions. She has been instrumental in connecting GCC investors with emerging African property opportunities.', license: 'ZA-PP-2014-5567', phone: '+27-555-0505', whatsapp: '+27-555-0505', experience: 9, rating: 4.6, totalListings: 22, totalSales: 18, verified: true },
  { email: 'carlos.mendoza@globalrealty.com', name: 'Carlos Mendoza', title: 'Americas Property Consultant', bio: 'Carlos covers the Latin American real estate market with extensive experience in Mexico, Brazil, Argentina, and Colombia. His network of local contacts ensures clients get the best deals.', license: 'MX-RA-2017-2234', phone: '+52-555-0606', whatsapp: '+52-555-0606', experience: 7, rating: 4.5, totalListings: 20, totalSales: 15, verified: true },
];

// ==================== USER DATA ====================

const usersData = [
  { email: 'admin@realtyhub.com', name: 'Admin User', password: 'admin123', phone: '+1-555-0001', avatar: null, role: UserRole.ADMIN, isActive: true },
  { email: 'john.doe@example.com', name: 'John Doe', password: 'user123', phone: '+1-555-0002', avatar: null, role: UserRole.USER, isActive: true },
  { email: 'jane.smith@example.com', name: 'Jane Smith', password: 'user123', phone: '+1-555-0003', avatar: null, role: UserRole.USER, isActive: true },
];

// ==================== BANNER DATA (3 Banners) ====================

const bannersData = [
  {
    title: 'Discover Luxury Living',
    subtitle: 'Explore premium properties across 60 countries worldwide',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=600&fit=crop',
    link: '/properties?type=VILLA&listing=SALE',
    position: 'home',
    order: 0,
    isActive: true,
  },
  {
    title: 'Find Your Dream Home',
    subtitle: 'Over 80 verified listings with virtual tours available',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=600&fit=crop',
    link: '/properties?listing=SALE',
    position: 'home',
    order: 1,
    isActive: true,
  },
  {
    title: 'Invest in Prime Locations',
    subtitle: 'Expert guidance for your next real estate investment',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=600&fit=crop',
    link: '/properties?type=APARTMENT',
    position: 'home',
    order: 2,
    isActive: true,
  },
];

// ==================== PROPERTY GENERATION HELPERS ====================

function generateTitle(city: string, type: PropertyType): string {
  const adj = pick(adjectives);
  const typeName = type.charAt(0) + type.slice(1).toLowerCase();
  const patterns = [
    `${adj} ${typeName} in ${city}`,
    `${city} ${adj} ${typeName}`,
    `Premium ${typeName} in ${city}`,
    `${typeName} for Sale in ${city}`,
    `${adj} ${city} Residence`,
  ];
  return pick(patterns);
}

function generateDescription(type: PropertyType, city: string, amenities: string[]): string {
  const typeName = type.charAt(0) + type.slice(1).toLowerCase();
  const amenityList = amenities.slice(0, 4).join(', ');
  const features = amenities.slice(0, 3).join(', ');
  const purpose = pick(purposes);
  const highlight = pick(highlights);

  return pick(descriptionTemplates)
    .replace(/{type}/g, typeName)
    .replace(/{city}/g, city)
    .replace(/{amenityList}/g, amenityList)
    .replace(/{features}/g, features)
    .replace(/{purpose}/g, purpose)
    .replace(/{highlight}/g, highlight);
}

// ==================== MAIN SEED FUNCTION ====================

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ==================== STEP 1: Clear All Tables ====================
  console.log('🗑️  Clearing all existing data...');
  await prisma.$transaction([
    prisma.favorite.deleteMany(),
    prisma.propertyAmenity.deleteMany(),
    prisma.propertyImage.deleteMany(),
    prisma.inquiry.deleteMany(),
    prisma.property.deleteMany(),
    prisma.agent.deleteMany(),
    prisma.user.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.amenity.deleteMany(),
    prisma.city.deleteMany(),
    prisma.region.deleteMany(),
    prisma.country.deleteMany(),
    prisma.company.deleteMany(),
  ]);
  console.log('✅ All tables cleared.\n');

  // ==================== STEP 2: Create Countries ====================
  console.log(`🌍 Creating ${countriesData.length} countries...`);
  const createdCountries: Record<string, { id: string; data: CountryData }> = {};

  for (const c of countriesData) {
    const country = await prisma.country.create({
      data: {
        name: c.name,
        code: c.code,
        flag: c.flag,
        currency: c.currency,
        currencySymbol: c.currencySymbol,
        isActive: true,
      },
    });
    createdCountries[c.code] = { id: country.id, data: c };
  }
  console.log(`✅ ${countriesData.length} countries created.\n`);

  // ==================== STEP 3: Create Regions and Cities ====================
  console.log('🗺️  Creating regions and cities...');
  const regionCityMap: Record<string, { regionId: string; cityId: string }[]> = {};

  for (const [, { id: countryId, data }] of Object.entries(createdCountries)) {
    regionCityMap[countryId] = [];
    for (const region of data.regions) {
      const createdRegion = await prisma.region.create({
        data: {
          name: region.name,
          countryId,
        },
      });
      for (const city of region.cities) {
        const createdCity = await prisma.city.create({
          data: {
            name: city.name,
            regionId: createdRegion.id,
          },
        });
        regionCityMap[countryId].push({
          regionId: createdRegion.id,
          cityId: createdCity.id,
          ...city,
        } as { regionId: string; cityId: string } & { lat?: number; lng?: number; name: string });
      }
    }
  }

  let totalRegions = 0;
  let totalCities = 0;
  for (const [, { data }] of Object.entries(createdCountries)) {
    totalRegions += data.regions.length;
    for (const r of data.regions) totalCities += r.cities.length;
  }
  console.log(`✅ ${totalRegions} regions and ${totalCities} cities created.\n`);

  // ==================== STEP 4: Create Amenities ====================
  console.log('🎯 Creating 24 amenities...');
  const amenityRecords = await Promise.all(
    amenitiesData.map((a) =>
      prisma.amenity.create({
        data: { name: a.name, icon: a.icon, category: a.category },
      })
    )
  );
  const allAmenityNames = amenityRecords.map((a) => a.name);
  console.log('✅ 24 amenities created.\n');

  // ==================== STEP 5: Create Companies ====================
  console.log('🏢 Creating 5 companies...');
  const createdCompanies = await Promise.all(
    companiesData.map((c) =>
      prisma.company.create({
        data: {
          name: c.name,
          description: c.description,
          phone: c.phone,
          email: c.email,
          website: c.website,
          address: c.address,
          founded: c.founded,
          agentCount: c.agentCount,
          listingCount: c.listingCount,
        },
      })
    )
  );
  console.log('✅ 5 companies created.\n');

  // ==================== STEP 6: Create Users and Agents ====================
  console.log('👤 Creating users and agents...');

  // Create admin + 2 regular users
  const createdUsers = await Promise.all(
    usersData.map((u) =>
      prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          password: u.password,
          phone: u.phone,
          avatar: u.avatar,
          role: u.role,
          isActive: u.isActive,
        },
      })
    )
  );

  // Create agent users + agents
  const createdAgents: { userId: string; agentId: string }[] = [];
  for (let i = 0; i < agentsData.length; i++) {
    const agentData = agentsData[i];
    const companyId = createdCompanies[i % createdCompanies.length].id;

    const agentUser = await prisma.user.create({
      data: {
        email: agentData.email,
        name: agentData.name,
        password: 'agent123',
        phone: agentData.phone,
        role: UserRole.AGENT,
        isActive: true,
      },
    });

    const agent = await prisma.agent.create({
      data: {
        userId: agentUser.id,
        bio: agentData.bio,
        title: agentData.title,
        license: agentData.license,
        phone: agentData.phone,
        whatsapp: agentData.whatsapp,
        experience: agentData.experience,
        rating: agentData.rating,
        totalListings: agentData.totalListings,
        totalSales: agentData.totalSales,
        verified: agentData.verified,
        companyId,
      },
    });

    createdAgents.push({ userId: agentUser.id, agentId: agent.id });
  }

  console.log(`✅ ${createdUsers.length} users and ${createdAgents.length} agents created.\n`);

  // ==================== STEP 7: Create Banners ====================
  console.log('🖼️  Creating banners...');
  await prisma.banner.createMany({ data: bannersData });
  console.log('✅ 3 banners created.\n');

  // ==================== STEP 8: Create Properties ====================
  console.log('🏠 Creating properties across all countries...');
  const allProperties: { id: string; countryId: string }[] = [];

  let propertyIndex = 0;
  const featuredCount = 18; // ~15-20 featured
  const featuredIndices = new Set<number>();

  // Pre-select which properties will be featured
  while (featuredIndices.size < featuredCount) {
    featuredIndices.add(rand(0, countriesData.length * 2 - 1));
  }

  for (const [code, { id: countryId, data }] of Object.entries(createdCountries)) {
    const cities = regionCityMap[countryId];
    if (cities.length === 0) continue;

    // Create 1-3 properties per country
    const numProperties = rand(1, 3);
    for (let p = 0; p < numProperties; p++) {
      const cityInfo = cities[p % cities.length];
      const countryRegion = data.regions.find((r) =>
        r.cities.some((c) => c.name === (cityInfo as any).name)
      );
      const cityData = countryRegion?.cities.find((c) => c.name === (cityInfo as any).name);
      const cityName = (cityInfo as any).name || data.regions[0].cities[0].name;

      const type = pick(propertyTypes);
      const listingType = pick(listingTypes);
      const isFeatured = featuredIndices.has(propertyIndex);

      let price: number;
      if (listingType === ListingType.SALE) {
        price = rand(data.priceRange.sale[0], data.priceRange.sale[1]);
      } else if (listingType === ListingType.RENT) {
        price = rand(data.priceRange.rent[0], data.priceRange.rent[1]);
      } else {
        // SHORT_TERM — higher than rent
        price = Math.round(rand(data.priceRange.rent[0], data.priceRange.rent[1]) * 1.5);
      }

      const title = generateTitle(cityName, type);
      const selectedAmenities = pickN(allAmenityNames, rand(3, 8));
      const description = generateDescription(type, cityName, selectedAmenities);

      const bedrooms = [PropertyType.LAND, PropertyType.OFFICE].includes(type) ? null : rand(1, 5);
      const bathrooms = [PropertyType.LAND, PropertyType.OFFICE].includes(type) ? null : rand(1, 4);
      const area = type === PropertyType.LAND ? randFloat(200, 5000) : randFloat(40, 600);
      const floors = [PropertyType.APARTMENT, PropertyType.PENTHOUSE, PropertyType.OFFICE].includes(type) ? rand(1, 30) : null;
      const yearBuilt = rand(1980, 2024);

      const agentInfo = createdAgents[propertyIndex % createdAgents.length];

      const property = await prisma.property.create({
        data: {
          title,
          slug: `${slugify(title)}-${rand(100, 9999)}`,
          description,
          price,
          listingType,
          propertyType: type,
          status: isFeatured ? PropertyStatus.AVAILABLE : pick([PropertyStatus.AVAILABLE, PropertyStatus.AVAILABLE, PropertyStatus.AVAILABLE, PropertyStatus.PENDING]),
          area,
          bedrooms,
          bathrooms,
          floors,
          yearBuilt,
          isFeatured,
          views: isFeatured ? rand(1000, 5000) : rand(100, 1000),
          countryId,
          regionId: cityInfo.regionId,
          cityId: cityInfo.cityId,
          address: `${rand(1, 200)} ${pick(['Main St', 'Elm St', 'Oak Ave', 'Park Blvd', 'King Fahd Rd', 'Sheikh Zayed Rd', 'Rue de la Paix', 'Paseo de la Reforma', 'Bahnhofstrasse', 'Bund'])}, ${cityName}`,
          latitude: cityData?.lat ?? null,
          longitude: cityData?.lng ?? null,
          agentId: agentInfo.agentId,
        },
      });

      // Create 2-4 images per property
      const numImages = rand(2, 4);
      const imageUrls = pickN(propertyImages, numImages);
      await prisma.propertyImage.createMany({
        data: imageUrls.map((url, idx) => ({
          url,
          alt: `${title} - Photo ${idx + 1}`,
          isCover: idx === 0,
          order: idx,
          propertyId: property.id,
        })),
      });

      // Create property amenities
      const amenityIds = amenityRecords
        .filter((a) => selectedAmenities.includes(a.name))
        .map((a) => a.id);
      await prisma.propertyAmenity.createMany({
        data: amenityIds.map((amenityId) => ({
          propertyId: property.id,
          amenityId,
        })),
      });

      allProperties.push({ id: property.id, countryId });
      propertyIndex++;
    }
  }

  console.log(`✅ ${allProperties.length} properties created with images and amenities.\n`);

  // ==================== STEP 9: Create Favorites ====================
  console.log('❤️  Creating favorites...');
  const favorites = [
    { userId: createdUsers[1].id, propertyId: allProperties[0]?.id },
    { userId: createdUsers[1].id, propertyId: allProperties[3]?.id },
    { userId: createdUsers[1].id, propertyId: allProperties[7]?.id },
    { userId: createdUsers[2].id, propertyId: allProperties[1]?.id },
    { userId: createdUsers[2].id, propertyId: allProperties[5]?.id },
    { userId: createdUsers[2].id, propertyId: allProperties[10]?.id },
    { userId: createdUsers[2].id, propertyId: allProperties[15]?.id },
  ].filter((f) => f.propertyId);

  await prisma.favorite.createMany({
    data: favorites.map((f) => ({
      userId: f.userId,
      propertyId: f.propertyId!,
    })),
  });
  console.log(`✅ ${favorites.length} favorites created.\n`);

  // ==================== STEP 10: Create Inquiries ====================
  console.log('📨 Creating inquiries...');
  const inquiries = [
    { propertyId: allProperties[0]?.id, userId: createdUsers[1].id, name: 'John Doe', email: 'john.doe@example.com', phone: '+1-555-0002', message: 'I am very interested in this property. Could you please provide more details about the neighborhood and schedule a viewing?', status: 'NEW' },
    { propertyId: allProperties[2]?.id, userId: createdUsers[2].id, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1-555-0003', message: 'What is the current availability of this property? I would like to arrange a virtual tour.', status: 'READ' },
    { propertyId: allProperties[5]?.id, userId: createdUsers[1].id, name: 'John Doe', email: 'john.doe@example.com', phone: null, message: 'Can you share the floor plan and recent inspection reports for this property?', status: 'NEW' },
    { propertyId: allProperties[8]?.id, userId: null, name: 'Michael Brown', email: 'michael.brown@email.com', phone: '+44-555-0004', message: 'I am relocating for work and interested in this property. What are the lease terms?', status: 'REPLIED' },
    { propertyId: allProperties[12]?.id, userId: createdUsers[2].id, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1-555-0003', message: 'Is the property furnished? What appliances are included in the sale?', status: 'NEW' },
  ].filter((inq) => inq.propertyId);

  await prisma.inquiry.createMany({
    data: inquiries.map((inq) => ({
      propertyId: inq.propertyId!,
      userId: inq.userId,
      name: inq.name,
      email: inq.email,
      phone: inq.phone,
      message: inq.message,
      status: inq.status,
    })),
  });
  console.log(`✅ ${inquiries.length} inquiries created.\n`);

  // ==================== FINAL SUMMARY ====================
  console.log('═══════════════════════════════════════════');
  console.log('          🌱 SEED COMPLETE SUMMARY          ');
  console.log('═══════════════════════════════════════════');

  const [countryCount, regionCount, cityCount, propertyCount, amenityCount, imageCount, propAmenityCount, companyCount, agentCount, userCount, favoriteCount, inquiryCount, bannerCount] = await Promise.all([
    prisma.country.count(),
    prisma.region.count(),
    prisma.city.count(),
    prisma.property.count(),
    prisma.amenity.count(),
    prisma.propertyImage.count(),
    prisma.propertyAmenity.count(),
    prisma.company.count(),
    prisma.agent.count(),
    prisma.user.count(),
    prisma.favorite.count(),
    prisma.inquiry.count(),
    prisma.banner.count(),
  ]);

  console.log(`🌍 Countries:      ${countryCount}`);
  console.log(`🗺️  Regions:        ${regionCount}`);
  console.log(`🏙️  Cities:         ${cityCount}`);
  console.log(`🏠 Properties:     ${propertyCount}`);
  console.log(`📸 Property Images: ${imageCount}`);
  console.log(`🎯 Amenities:      ${amenityCount}`);
  console.log(`🔗 Prop-Amenities: ${propAmenityCount}`);
  console.log(`🏢 Companies:      ${companyCount}`);
  console.log(`🤝 Agents:         ${agentCount}`);
  console.log(`👤 Users:          ${userCount}`);
  console.log(`❤️  Favorites:      ${favoriteCount}`);
  console.log(`📨 Inquiries:      ${inquiryCount}`);
  console.log(`🖼️  Banners:        ${bannerCount}`);
  console.log('═══════════════════════════════════════════');
  console.log('✅ Database seeded successfully!\n');
}

// ==================== RUN ====================

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
