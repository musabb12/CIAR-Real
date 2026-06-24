'use client';

import { useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/use-translation';
import {
  getLocalizedCountryName,
  type LocalizableCountry,
} from '@/lib/localize-country';

export function useLocalizedCountryName() {
  const { locale } = useTranslation();

  return useCallback(
    (country: LocalizableCountry) => getLocalizedCountryName(country, locale),
    [locale],
  );
}
