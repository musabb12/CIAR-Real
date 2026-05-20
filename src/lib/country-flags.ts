import { ISO_ALPHA2_CODES } from '@/data/iso-alpha2-codes';

const FLAG_CDN = 'https://flagcdn.com';

/** PNG flag image URL (not emoji). */
export function flagImageUrl(code: string, width: 20 | 40 | 80 | 160 = 80): string {
  const c = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(c)) return '';
  return `${FLAG_CDN}/w${width}/${c}.png`;
}

/** Stored flag field may be ISO code, image URL, or legacy emoji — resolve to image URL when possible. */
export function resolveFlagImageUrl(
  flag: string | null | undefined,
  countryCode?: string | null,
): string | null {
  const raw = (flag ?? '').trim();
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (/^[a-zA-Z]{2}$/.test(raw)) return flagImageUrl(raw);
  if (countryCode && /^[a-zA-Z]{2}$/.test(countryCode)) return flagImageUrl(countryCode);
  return null;
}

export function isFlagEmoji(value: string | null | undefined): boolean {
  if (!value) return false;
  return /\p{Regional_Indicator}/u.test(value) || /[\u{1F1E6}-\u{1F1FF}]/u.test(value);
}

export function countryDisplayName(code: string, locale: 'ar' | 'en'): string {
  const upper = code.toUpperCase();
  try {
    const dn = new Intl.DisplayNames([locale], { type: 'region' });
    return dn.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

export interface WorldFlagOption {
  code: string;
  name: string;
  imageUrl: string;
}

export function listWorldFlagOptions(locale: 'ar' | 'en'): WorldFlagOption[] {
  return ISO_ALPHA2_CODES.map((code) => ({
    code,
    name: countryDisplayName(code, locale),
    imageUrl: flagImageUrl(code, 40),
  })).sort((a, b) => a.name.localeCompare(b.name, locale));
}

/** Persist ISO code in Firestore `flag` field for consistent CDN rendering. */
export function normalizeFlagStorage(
  flag: string | null | undefined,
  countryCode?: string | null,
): string | null {
  const raw = (flag ?? '').trim();
  if (!raw) return countryCode?.toUpperCase() ?? null;
  if (raw.startsWith('http')) {
    const m = raw.match(/\/([a-z]{2})\.png$/i);
    return m ? m[1].toUpperCase() : raw;
  }
  if (/^[a-zA-Z]{2}$/.test(raw)) return raw.toUpperCase();
  if (isFlagEmoji(raw) && countryCode) return countryCode.toUpperCase();
  return raw;
}
