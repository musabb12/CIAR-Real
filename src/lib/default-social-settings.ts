import type { SiteSocialSettings } from '@/types';

/** Default social/contact links — shown until admin overrides them. */
export const DEFAULT_SOCIAL_SETTINGS: SiteSocialSettings = {
  website: 'https://ciar.com',
  email: 'info@ciar.com',
  phone: '+963 993 153 333',
  whatsapp: '+963993153333',
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

/** Previous default contact numbers — auto-upgraded to {@link DEFAULT_SOCIAL_SETTINGS}. */
const LEGACY_CONTACT_PHONES = new Set(['+971 4 123 4567', '+97141234567']);

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
  if (LEGACY_CONTACT_PHONES.has(result.phone)) {
    result.phone = DEFAULT_SOCIAL_SETTINGS.phone;
  }
  if (LEGACY_CONTACT_PHONES.has(result.whatsapp)) {
    result.whatsapp = DEFAULT_SOCIAL_SETTINGS.whatsapp;
  }
  return result;
}
