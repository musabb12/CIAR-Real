import type { Locale } from '@/lib/i18n';

/** USD-based exchange rates (display / conversion). */
export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  JPY: 149.5,
  TRY: 30.25,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  BRL: 4.97,
  KRW: 1320,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  MAD: 10.05,
  JOD: 0.71,
  DZD: 134.5,
  SDG: 600,
  SYP: 13000,
  // Used for conversion only — not shown in site picker
  AED: 3.67,
  EGP: 30.9,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: '﷼',
  JPY: '¥',
  TRY: '₺',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  KRW: '₩',
  QAR: '﷼',
  KWD: 'د.ك',
  BHD: 'د.ب',
  OMR: '﷼',
  MAD: 'د.م',
  JOD: 'د.أ',
  DZD: 'د.ج',
  SDG: 'ج.س',
  SYP: 'ل.س',
  AED: 'د.إ',
  EGP: 'E£',
};

/** Currencies users can select in the header (no EGP, no AED). */
export const SITE_DISPLAY_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'SAR',
  'SDG',
  'SYP',
  'JOD',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
  'DZD',
  'MAD',
  'TRY',
  'INR',
  'CNY',
  'JPY',
  'KRW',
  'CAD',
  'AUD',
  'CHF',
  'BRL',
] as const;

export type SiteCurrencyCode = (typeof SITE_DISPLAY_CURRENCIES)[number];

const CURRENCY_NAMES: Record<string, { en: string; ar: string }> = {
  USD: { en: 'US Dollar', ar: 'دولار أمريكي' },
  EUR: { en: 'Euro', ar: 'يورو' },
  GBP: { en: 'British Pound', ar: 'جنيه إسترليني' },
  SAR: { en: 'Saudi Riyal', ar: 'ريال سعودي' },
  SDG: { en: 'Sudanese Pound', ar: 'جنيه سوداني' },
  SYP: { en: 'Syrian Pound', ar: 'ليرة سورية' },
  JOD: { en: 'Jordanian Dinar', ar: 'دينار أردني' },
  QAR: { en: 'Qatari Riyal', ar: 'ريال قطري' },
  KWD: { en: 'Kuwaiti Dinar', ar: 'دينار كويتي' },
  BHD: { en: 'Bahraini Dinar', ar: 'دينار بحريني' },
  OMR: { en: 'Omani Rial', ar: 'ريال عماني' },
  DZD: { en: 'Algerian Dinar', ar: 'دينار جزائري' },
  MAD: { en: 'Moroccan Dirham', ar: 'درهم مغربي' },
  TRY: { en: 'Turkish Lira', ar: 'ليرة تركية' },
  INR: { en: 'Indian Rupee', ar: 'روبية هندية' },
  CNY: { en: 'Chinese Yuan', ar: 'يوان صيني' },
  JPY: { en: 'Japanese Yen', ar: 'ين ياباني' },
  KRW: { en: 'South Korean Won', ar: 'وون كوري' },
  CAD: { en: 'Canadian Dollar', ar: 'دولار كندي' },
  AUD: { en: 'Australian Dollar', ar: 'دولار أسترالي' },
  CHF: { en: 'Swiss Franc', ar: 'فرنك سويسري' },
  BRL: { en: 'Brazilian Real', ar: 'ريال برازيلي' },
};

export function isSiteCurrencyCode(value: string): value is SiteCurrencyCode {
  return (SITE_DISPLAY_CURRENCIES as readonly string[]).includes(value);
}

export function resolveCurrencyCode(input?: string | null): string {
  const raw = (input ?? '').trim().toUpperCase();
  if (raw && CURRENCY_RATES[raw]) return raw;
  return 'USD';
}

export function convertAmount(amount: number, from: string, to: string): number {
  if (!Number.isFinite(amount)) return 0;
  const fromCode = resolveCurrencyCode(from);
  const toCode = resolveCurrencyCode(to);
  const fromRate = CURRENCY_RATES[fromCode] ?? 1;
  const toRate = CURRENCY_RATES[toCode] ?? 1;
  return (amount / fromRate) * toRate;
}

export function getCurrencySymbol(code: string): string {
  const key = resolveCurrencyCode(code);
  return CURRENCY_SYMBOLS[key] ?? key;
}

export function getCurrencyName(code: string, locale: Locale): string {
  const key = resolveCurrencyCode(code);
  const row = CURRENCY_NAMES[key];
  if (!row) return key;
  return locale === 'ar' ? row.ar : row.en;
}

export function formatMoneyValue(
  amount: number,
  currencyCode: string,
  locale: Locale = 'en',
): string {
  const code = resolveCurrencyCode(currencyCode);
  const symbol = getCurrencySymbol(code);
  const isZeroDecimal = code === 'JPY' || code === 'KRW';
  const value = isZeroDecimal ? Math.round(amount) : amount;
  const formatted = value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: isZeroDecimal ? 0 : 0,
    maximumFractionDigits: isZeroDecimal ? 0 : value >= 1000 ? 0 : 2,
  });
  return `${symbol}${formatted}`;
}

export function formatPropertyPrice(
  price: number,
  sourceCurrency: string | null | undefined,
  displayCurrency: SiteCurrencyCode,
  locale: Locale = 'en',
): string {
  const from = resolveCurrencyCode(sourceCurrency);
  const converted = convertAmount(price, from, displayCurrency);
  return formatMoneyValue(converted, displayCurrency, locale);
}
