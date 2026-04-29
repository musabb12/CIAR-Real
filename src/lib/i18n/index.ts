import { translations, type Locale, type Translations } from './translations';

export type { Locale, Translations };

export const locales: { code: Locale; name: string; flag: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', name: 'English', flag: 'EN', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: 'AR', dir: 'rtl' },
  { code: 'fr', name: 'Français', flag: 'FR', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: 'ES', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', flag: 'TR', dir: 'ltr' },
];

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
