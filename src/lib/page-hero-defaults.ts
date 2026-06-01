import type { ManagedPageKey, PageContentEntry } from '@/types';
import { getPageBackgroundImages, getPrimaryPageBackground } from '@/lib/page-backgrounds';

/** Default cover photos per page — each page has its own distinct look on the site. */
export const DEFAULT_PAGE_HERO_IMAGES: Record<ManagedPageKey, string[]> = {
  home: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=2000&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=2000&q=80&auto=format&fit=crop',
  ],
  search: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2000&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=2000&q=85&auto=format&fit=crop',
  ],
  agents: [
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=2000&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=2000&q=85&auto=format&fit=crop',
  ],
  contact: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2000&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=2000&q=80&auto=format&fit=crop',
  ],
  favorites: [
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=2000&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=2000&q=85&auto=format&fit=crop',
  ],
  login: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2000&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=2000&q=85&auto=format&fit=crop',
  ],
  register: [
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=2000&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=2000&q=85&auto=format&fit=crop',
  ],
  'admin-login': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2000&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=2000&q=85&auto=format&fit=crop',
  ],
};

/** Maps admin page keys to PageHero variant keys used on the public site. */
export function getPageHeroVariant(page: ManagedPageKey): string {
  if (page === 'home') return 'default';
  if (page === 'login' || page === 'register' || page === 'admin-login') return 'default';
  return page;
}

export function getPagePreviewImage(page: ManagedPageKey, entry?: PageContentEntry): string {
  const defaults = DEFAULT_PAGE_HERO_IMAGES[page];
  return getPrimaryPageBackground(entry, defaults[0] ?? '');
}

export function getPagePreviewImages(page: ManagedPageKey, entry?: PageContentEntry): string[] {
  return getPageBackgroundImages(entry, DEFAULT_PAGE_HERO_IMAGES[page]);
}

export const HERO_IMAGES_BY_VARIANT: Record<string, string[]> = {
  search: DEFAULT_PAGE_HERO_IMAGES.search,
  agents: DEFAULT_PAGE_HERO_IMAGES.agents,
  contact: DEFAULT_PAGE_HERO_IMAGES.contact,
  favorites: DEFAULT_PAGE_HERO_IMAGES.favorites,
  property: [
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=2400&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=2400&q=85&auto=format&fit=crop',
  ],
  default: DEFAULT_PAGE_HERO_IMAGES.home,
};
