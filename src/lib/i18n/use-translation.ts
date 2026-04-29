'use client';

import { useAppStore } from '@/store/app-store';
import { getTranslations, isRTL } from './index';
import type { Locale, Translations } from './translations';

export function useTranslation() {
  const locale = useAppStore((s) => s.locale) as Locale;
  const t = getTranslations(locale) as Translations;
  const rtl = isRTL(locale);

  return {
    t,
    locale,
    rtl,
    setLocale: useAppStore.getState().setLocale as (locale: Locale) => void,
  };
}
