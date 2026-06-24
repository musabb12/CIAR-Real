'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import {
  SITE_DISPLAY_CURRENCIES,
  formatPropertyPrice,
  getCurrencyName,
  getCurrencySymbol,
  type SiteCurrencyCode,
} from '@/lib/site-currency';
import type { Locale } from '@/lib/i18n';

export function useSiteCurrency() {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const setDisplayCurrency = useAppStore((s) => s.setDisplayCurrency);
  const locale = useAppStore((s) => s.locale) as Locale;

  const formatPrice = useCallback(
    (amount: number, sourceCurrency?: string | null) =>
      formatPropertyPrice(amount, sourceCurrency, displayCurrency, locale),
    [displayCurrency, locale],
  );

  return {
    displayCurrency,
    setDisplayCurrency,
    formatPrice,
    currencies: SITE_DISPLAY_CURRENCIES,
    currencySymbol: getCurrencySymbol(displayCurrency),
    getCurrencyName: (code: SiteCurrencyCode) => getCurrencyName(code, locale),
  };
}
