import type { Locale } from '@/lib/i18n/translations';

export type NewsContentByLocale = Partial<Record<Locale, string>>;

export const NEWS_LOCALE_FIELDS: Array<{ code: Locale; labelAr: string; labelEn: string }> = [
  { code: 'ar', labelAr: 'العربية', labelEn: 'Arabic' },
  { code: 'en', labelAr: 'الإنجليزية', labelEn: 'English' },
  { code: 'fr', labelAr: 'الفرنسية', labelEn: 'French' },
  { code: 'es', labelAr: 'الإسبانية', labelEn: 'Spanish' },
  { code: 'tr', labelAr: 'التركية', labelEn: 'Turkish' },
];

const LOCALE_ORDER: Locale[] = ['ar', 'en', 'fr', 'es', 'tr'];

export function resolveNewsContent(
  item: { content?: string; contentByLocale?: NewsContentByLocale | null },
  locale: Locale,
): string {
  const map = item.contentByLocale ?? {};
  if (map[locale]?.trim()) return map[locale]!.trim();
  for (const code of LOCALE_ORDER) {
    if (map[code]?.trim()) return map[code]!.trim();
  }
  return item.content?.trim() ?? '';
}

export function emptyNewsContentByLocale(): NewsContentByLocale {
  return { ar: '', en: '', fr: '', es: '', tr: '' };
}

export function normalizeNewsInput(input: {
  content?: string;
  contentByLocale?: NewsContentByLocale | null;
}) {
  const contentByLocale: NewsContentByLocale = {};
  for (const { code } of NEWS_LOCALE_FIELDS) {
    const raw = input.contentByLocale?.[code] ?? (code === 'ar' ? input.content : undefined);
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (trimmed) contentByLocale[code] = trimmed;
  }
  const content = resolveNewsContent({ content: input.content, contentByLocale }, 'ar');
  return { content, contentByLocale };
}

export function hasAnyNewsLocale(contentByLocale?: NewsContentByLocale | null): boolean {
  return NEWS_LOCALE_FIELDS.some(({ code }) => Boolean(contentByLocale?.[code]?.trim()));
}
