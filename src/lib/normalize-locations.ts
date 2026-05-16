import type { Country } from '@/types';

/** `/api/locations` returns a Country[] or occasionally `{ countries: Country[] }`. */
export function normalizeLocationsResponse(data: unknown): Country[] {
  if (Array.isArray(data)) return data as Country[];
  if (data && typeof data === 'object') {
    const countries = (data as { countries?: unknown }).countries;
    if (Array.isArray(countries)) return countries as Country[];
  }
  return [];
}
