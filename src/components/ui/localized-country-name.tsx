'use client';

import { useLocalizedCountryName } from '@/hooks/use-localized-country-name';
import type { LocalizableCountry } from '@/lib/localize-country';

export function LocalizedCountryName({
  country,
  className,
  fallback = '—',
}: {
  country?: LocalizableCountry | null;
  className?: string;
  fallback?: string;
}) {
  const label = useLocalizedCountryName();
  if (!country?.name && !country?.code) return <span className={className}>{fallback}</span>;
  return <span className={className}>{label(country)}</span>;
}
