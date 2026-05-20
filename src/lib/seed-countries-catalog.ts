import catalogJson from '@/data/seed-countries-catalog.json';
import type { City, Country, Region } from '@/types';

export type CatalogCountry = Country & {
  regions?: Array<Region & { cities?: City[] }>;
};

const CATALOG = catalogJson as CatalogCountry[];

export function getSeedCountriesCatalog(): CatalogCountry[] {
  return CATALOG;
}

export function getSeedCountryById(id: string): CatalogCountry | null {
  const key = id.trim().toLowerCase();
  return CATALOG.find((c) => c.id === key || c.code.toLowerCase() === key) ?? null;
}

export function getSeedCountriesCount(): number {
  return CATALOG.length;
}
