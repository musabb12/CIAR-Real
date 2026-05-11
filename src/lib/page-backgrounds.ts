import type { PageContentEntry } from '@/types';

export function getPageBackgroundImages(
  entry: PageContentEntry | undefined,
  fallbackImages: string[] = []
) {
  const fromList = Array.isArray(entry?.backgroundImageUrls)
    ? entry!.backgroundImageUrls
    : [];
  const merged = [
    ...(entry?.backgroundImageUrl ? [entry.backgroundImageUrl] : []),
    ...fromList,
    ...fallbackImages,
  ]
    .map((url) => String(url ?? '').trim())
    .filter(Boolean);

  return Array.from(new Set(merged));
}

export function getPrimaryPageBackground(
  entry: PageContentEntry | undefined,
  fallbackImage = ''
) {
  const images = getPageBackgroundImages(entry, fallbackImage ? [fallbackImage] : []);
  return images[0] ?? fallbackImage;
}
