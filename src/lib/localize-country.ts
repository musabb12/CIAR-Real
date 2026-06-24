import type { Locale } from '@/lib/i18n';
import { countryDisplayName } from '@/lib/country-flags';
import { getSeedCountriesCatalog } from '@/lib/seed-countries-catalog';

export type LocalizableCountry = {
  name: string;
  code?: string | null;
  id?: string | null;
};

let nameToIsoCache: Map<string, string> | null = null;

function buildNameToIsoMap(): Map<string, string> {
  if (nameToIsoCache) return nameToIsoCache;
  const map = new Map<string, string>();
  const add = (label: string | null | undefined, iso: string) => {
    const key = (label ?? '').trim().toLowerCase();
    if (key) map.set(key, iso.toUpperCase());
  };

  for (const country of getSeedCountriesCatalog()) {
    const iso = country.code.toUpperCase();
    add(country.name, iso);
    add(country.id, iso);
    add(countryDisplayName(iso, 'en'), iso);
    add(countryDisplayName(iso, 'ar'), iso);
    add(countryDisplayName(iso, 'fr'), iso);
    add(countryDisplayName(iso, 'es'), iso);
    add(countryDisplayName(iso, 'tr'), iso);
  }

  nameToIsoCache = map;
  return map;
}

function resolveCountryCode(country: LocalizableCountry): string | null {
  const code = (country.code ?? '').trim();
  if (/^[a-zA-Z]{2}$/.test(code)) return code.toUpperCase();
  const id = (country.id ?? '').trim();
  if (/^[a-zA-Z]{2}$/.test(id)) return id.toUpperCase();
  const fromName = buildNameToIsoMap().get((country.name ?? '').trim().toLowerCase());
  if (fromName) return fromName;
  return null;
}

/** Localized country label for dropdowns and property locations. */
export function getLocalizedCountryName(
  country: LocalizableCountry,
  locale: Locale,
): string {
  const iso = resolveCountryCode(country);
  if (iso) return countryDisplayName(iso, locale);
  return country.name;
}

export function sortCountriesByLabel<T extends LocalizableCountry>(
  countries: T[],
  locale: Locale,
): T[] {
  const collator = locale === 'ar' ? 'ar' : locale;
  return [...countries].sort((a, b) =>
    getLocalizedCountryName(a, locale).localeCompare(
      getLocalizedCountryName(b, locale),
      collator,
    ),
  );
}
