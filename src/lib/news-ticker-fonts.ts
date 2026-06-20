export type NewsTickerFontKey =
  | ''
  | 'cairo'
  | 'tajawal'
  | 'el-messiri'
  | 'geist'
  | 'playfair'
  | 'geist-mono';

export type NewsTickerFontOption = {
  key: NewsTickerFontKey;
  labelAr: string;
  labelEn: string;
};

/** Fonts already loaded in root layout — safe to use via CSS variables. */
export const NEWS_TICKER_FONT_OPTIONS: NewsTickerFontOption[] = [
  { key: '', labelAr: 'افتراضي الموقع (Cairo)', labelEn: 'Site default (Cairo)' },
  { key: 'cairo', labelAr: 'Cairo — عصري', labelEn: 'Cairo — modern' },
  { key: 'tajawal', labelAr: 'Tajawal — واضح', labelEn: 'Tajawal — clean' },
  { key: 'el-messiri', labelAr: 'El Messiri — أنيق', labelEn: 'El Messiri — elegant' },
  { key: 'geist', labelAr: 'Geist — لاتيني', labelEn: 'Geist — Latin' },
  { key: 'playfair', labelAr: 'Playfair — كلاسيكي', labelEn: 'Playfair — classic' },
  { key: 'geist-mono', labelAr: 'Geist Mono — أحادي', labelEn: 'Geist Mono — monospace' },
];

export function resolveNewsTickerFontFamily(key: string | undefined | null): string | undefined {
  switch ((key ?? '').trim()) {
    case 'cairo':
      return "var(--font-cairo), 'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif";
    case 'tajawal':
      return "var(--font-tajawal), 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, sans-serif";
    case 'el-messiri':
      return "var(--font-el-messiri), 'El Messiri', 'Cairo', sans-serif";
    case 'geist':
      return "var(--font-geist-sans), system-ui, -apple-system, sans-serif";
    case 'playfair':
      return "var(--font-playfair), 'Playfair Display', Georgia, 'Times New Roman', serif";
    case 'geist-mono':
      return "var(--font-geist-mono), ui-monospace, 'Cascadia Code', monospace";
    default:
      return undefined;
  }
}

export function newsTickerFontLabel(key: string | undefined | null, isAr: boolean): string {
  const option = NEWS_TICKER_FONT_OPTIONS.find((row) => row.key === (key ?? '').trim());
  if (!option) return isAr ? 'افتراضي الموقع' : 'Site default';
  return isAr ? option.labelAr : option.labelEn;
}
