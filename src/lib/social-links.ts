import type { SiteSocialSettings } from '@/types';

export type SocialPlatformKey = keyof SiteSocialSettings;

export type SocialLinkItem = {
  key: SocialPlatformKey;
  labelEn: string;
  labelAr: string;
  href: string;
};

function trim(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureHttps(url: string): string {
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  return `https://${url.replace(/^\/+/, '')}`;
}

function resolveTelegram(value: string): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('@')) return `https://t.me/${value.slice(1)}`;
  if (value.startsWith('t.me/')) return ensureHttps(value);
  return `https://t.me/${value.replace(/^@/, '')}`;
}

export function resolveSocialHref(key: SocialPlatformKey, raw: string): string {
  const value = trim(raw);
  if (!value) return '';

  switch (key) {
    case 'email':
      return value.includes('mailto:') ? value : `mailto:${value}`;
    case 'phone':
      return value.includes('tel:') ? value : `tel:${value.replace(/\s/g, '')}`;
    case 'whatsapp': {
      const digits = value.replace(/[^\d]/g, '');
      return digits ? `https://wa.me/${digits}` : '';
    }
    case 'telegram':
      return resolveTelegram(value);
    case 'website':
    case 'facebook':
    case 'instagram':
    case 'x':
    case 'youtube':
    case 'linkedin':
    case 'tiktok':
    case 'snapchat':
    case 'threads':
    case 'pinterest':
      return ensureHttps(value);
    default:
      return ensureHttps(value);
  }
}

const PLATFORM_META: Array<{ key: SocialPlatformKey; labelEn: string; labelAr: string }> = [
  { key: 'website', labelEn: 'Website', labelAr: 'الموقع' },
  { key: 'email', labelEn: 'Email', labelAr: 'البريد' },
  { key: 'phone', labelEn: 'Phone', labelAr: 'الهاتف' },
  { key: 'whatsapp', labelEn: 'WhatsApp', labelAr: 'واتساب' },
  { key: 'telegram', labelEn: 'Telegram', labelAr: 'تيليجرام' },
  { key: 'facebook', labelEn: 'Facebook', labelAr: 'فيسبوك' },
  { key: 'instagram', labelEn: 'Instagram', labelAr: 'إنستغرام' },
  { key: 'x', labelEn: 'X', labelAr: 'إكس' },
  { key: 'youtube', labelEn: 'YouTube', labelAr: 'يوتيوب' },
  { key: 'linkedin', labelEn: 'LinkedIn', labelAr: 'لينكدإن' },
  { key: 'tiktok', labelEn: 'TikTok', labelAr: 'تيك توك' },
  { key: 'snapchat', labelEn: 'Snapchat', labelAr: 'سناب شات' },
  { key: 'threads', labelEn: 'Threads', labelAr: 'ثريدز' },
  { key: 'pinterest', labelEn: 'Pinterest', labelAr: 'بنترست' },
];

/** Social + contact channels configured in admin — only non-empty links are returned. */
export function buildSocialLinkItems(settings: SiteSocialSettings): SocialLinkItem[] {
  return PLATFORM_META.map(({ key, labelEn, labelAr }) => ({
    key,
    labelEn,
    labelAr,
    href: resolveSocialHref(key, settings[key] ?? ''),
  })).filter((item) => Boolean(item.href));
}

/** Channels typically shown as "social media" (excludes email/phone/website). */
export function buildSocialMediaLinkItems(settings: SiteSocialSettings): SocialLinkItem[] {
  const socialKeys = new Set<SocialPlatformKey>([
    'whatsapp',
    'telegram',
    'facebook',
    'instagram',
    'x',
    'youtube',
    'linkedin',
    'tiktok',
    'snapchat',
    'threads',
    'pinterest',
  ]);
  return buildSocialLinkItems(settings).filter((item) => socialKeys.has(item.key));
}
