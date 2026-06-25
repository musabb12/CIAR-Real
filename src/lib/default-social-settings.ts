import type { SiteSocialSettings } from '@/types';

/** Default social/contact links — shown until admin overrides them. */
export const DEFAULT_SOCIAL_SETTINGS: SiteSocialSettings = {
  website: 'https://ciar.com',
  email: 'info@ciar.com',
  phone: '+971 4 123 4567',
  whatsapp: '+97141234567',
  telegram: 'https://t.me/ciar',
  facebook: 'https://facebook.com/ciar',
  instagram: 'https://instagram.com/ciar',
  x: 'https://x.com/ciar',
  youtube: 'https://youtube.com/@ciar',
  linkedin: 'https://linkedin.com/company/ciar',
  tiktok: 'https://tiktok.com/@ciar',
  snapchat: 'https://snapchat.com/add/ciar',
  threads: 'https://threads.net/@ciar',
  pinterest: 'https://pinterest.com/ciar',
};

const SOCIAL_KEYS = Object.keys(DEFAULT_SOCIAL_SETTINGS) as (keyof SiteSocialSettings)[];

/** Merge layers; later non-empty values win. Empty strings fall back to defaults. */
export function mergeSocialSettings(
  ...layers: Array<Partial<SiteSocialSettings> | undefined | null>
): SiteSocialSettings {
  const result = { ...DEFAULT_SOCIAL_SETTINGS };
  for (const layer of layers) {
    if (!layer) continue;
    for (const key of SOCIAL_KEYS) {
      const value = layer[key];
      if (typeof value === 'string' && value.trim()) {
        result[key] = value.trim();
      }
    }
  }
  return result;
}
