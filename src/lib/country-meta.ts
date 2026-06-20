import { getSeedCountriesCatalog } from '@/lib/seed-countries-catalog';
import { countryDisplayName } from '@/lib/country-flags';

export type CurrencyMeta = {
  currency: string;
  currencySymbol: string;
};

const CURRENCY_BY_CODE = new Map<string, CurrencyMeta>(
  getSeedCountriesCatalog().map((country) => [
    country.code.toUpperCase(),
    {
      currency: country.currency ?? '',
      currencySymbol: country.currencySymbol ?? '',
    },
  ]),
);

/** Common international dial codes for admin reference. */
const DIAL_BY_CODE: Record<string, string> = {
  SA: '+966',
  AE: '+971',
  EG: '+20',
  DZ: '+213',
  MA: '+212',
  TN: '+216',
  JO: '+962',
  LB: '+961',
  IQ: '+964',
  KW: '+965',
  QA: '+974',
  BH: '+973',
  OM: '+968',
  YE: '+967',
  PS: '+970',
  US: '+1',
  GB: '+44',
  FR: '+33',
  DE: '+49',
  TR: '+90',
  IN: '+91',
  CN: '+86',
  JP: '+81',
  AU: '+61',
  CA: '+1',
};

export function getCurrencyMeta(code: string | null | undefined): CurrencyMeta | null {
  const key = (code ?? '').trim().toUpperCase();
  if (!key) return null;
  const row = CURRENCY_BY_CODE.get(key);
  if (!row || !row.currency) return null;
  return row;
}

export function getDialCode(code: string | null | undefined): string | null {
  const key = (code ?? '').trim().toUpperCase();
  return DIAL_BY_CODE[key] ?? null;
}

export function getCountryNativeNames(code: string): { ar: string; en: string } {
  const upper = code.trim().toUpperCase();
  return {
    ar: countryDisplayName(upper, 'ar'),
    en: countryDisplayName(upper, 'en'),
  };
}

export const COMMON_CURRENCIES: Array<CurrencyMeta & { label: string }> = [
  { label: 'USD — US Dollar', currency: 'USD', currencySymbol: '$' },
  { label: 'EUR — Euro', currency: 'EUR', currencySymbol: '€' },
  { label: 'GBP — British Pound', currency: 'GBP', currencySymbol: '£' },
  { label: 'SAR — Saudi Riyal', currency: 'SAR', currencySymbol: '﷼' },
  { label: 'AED — UAE Dirham', currency: 'AED', currencySymbol: 'د.إ' },
  { label: 'EGP — Egyptian Pound', currency: 'EGP', currencySymbol: 'E£' },
  { label: 'DZD — Algerian Dinar', currency: 'DZD', currencySymbol: 'د.ج' },
  { label: 'MAD — Moroccan Dirham', currency: 'MAD', currencySymbol: 'د.م' },
  { label: 'TRY — Turkish Lira', currency: 'TRY', currencySymbol: '₺' },
  { label: 'INR — Indian Rupee', currency: 'INR', currencySymbol: '₹' },
];
