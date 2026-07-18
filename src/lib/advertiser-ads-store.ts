import { randomUUID } from 'crypto';
import {
  DEFAULT_AD_SETTINGS,
  DEFAULT_PLATFORM_SETTINGS,
  DEMO_APPROVED_ADS,
  calcAdTotal,
  getPlacementById,
} from '@/lib/advertiser-ads-config';
import type {
  AdFieldDefinition,
  AdPlacementDefinition,
  AdPlacementId,
  AdvertiserAd,
  AdvertiserAdPlatformSettings,
  AdvertiserAdSettings,
  AdvertiserAdStatus,
  AdvertiserAdsStats,
} from '@/types/advertiser-ads';

const STORE_KEY = '__ciar_advertiser_ads_store__';

type Store = {
  settings: AdvertiserAdSettings;
  ads: AdvertiserAd[];
};

function nowIso() {
  return new Date().toISOString();
}

function ensureSettingsShape(raw: AdvertiserAdSettings): AdvertiserAdSettings {
  return {
    ...DEFAULT_AD_SETTINGS,
    ...raw,
    fields: raw.fields?.length ? raw.fields : DEFAULT_AD_SETTINGS.fields,
    placements: raw.placements?.length ? raw.placements : DEFAULT_AD_SETTINGS.placements,
    platform: { ...DEFAULT_PLATFORM_SETTINGS, ...(raw.platform ?? {}) },
  };
}

function getStore(): Store {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: Store };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      settings: structuredClone(DEFAULT_AD_SETTINGS),
      ads: structuredClone(DEMO_APPROVED_ADS),
    };
  } else {
    g[STORE_KEY].settings = ensureSettingsShape(g[STORE_KEY].settings);
    // Migrate older ads missing new fields
    g[STORE_KEY].ads = g[STORE_KEY].ads.map((a) => ({
      adminNotes: null,
      isFeatured: false,
      priority: 0,
      clicks: 0,
      videoUrl: null,
      ...a,
    }));
    // Seed any new default demos that are not yet in the store
    const existing = new Set(g[STORE_KEY].ads.map((a) => a.id));
    for (const demo of DEMO_APPROVED_ADS) {
      if (!existing.has(demo.id)) {
        g[STORE_KEY].ads.push(structuredClone(demo));
      }
    }
  }
  return g[STORE_KEY];
}

function cloneSettings(s: AdvertiserAdSettings): AdvertiserAdSettings {
  return structuredClone(ensureSettingsShape(s));
}

function autoExpireAds(store: Store): void {
  if (!store.settings.platform?.autoExpireEnabled) return;
  const now = Date.now();
  for (const ad of store.ads) {
    if (
      (ad.status === 'approved' || ad.status === 'paused') &&
      ad.expiresAt &&
      new Date(ad.expiresAt).getTime() <= now
    ) {
      ad.status = 'expired';
      ad.updatedAt = nowIso();
    }
  }
}

export function getAdvertiserAdSettings(): AdvertiserAdSettings {
  return cloneSettings(getStore().settings);
}

export function updateAdvertiserAdSettings(
  partial: Partial<AdvertiserAdSettings>,
): AdvertiserAdSettings {
  const store = getStore();
  if (partial.fields) store.settings.fields = partial.fields;
  if (partial.placements) store.settings.placements = partial.placements;
  if (partial.platform) {
    store.settings.platform = {
      ...DEFAULT_PLATFORM_SETTINGS,
      ...store.settings.platform,
      ...partial.platform,
    };
  }
  if (partial.defaultCategoryKey) store.settings.defaultCategoryKey = partial.defaultCategoryKey;
  if (partial.defaultCategoryLabelAr) {
    store.settings.defaultCategoryLabelAr = partial.defaultCategoryLabelAr;
  }
  if (partial.defaultCategoryLabelEn) {
    store.settings.defaultCategoryLabelEn = partial.defaultCategoryLabelEn;
  }
  return cloneSettings(store.settings);
}

export function updateAdFieldDefinition(
  fieldId: string,
  patch: Partial<AdFieldDefinition>,
): AdFieldDefinition | null {
  const store = getStore();
  const idx = store.settings.fields.findIndex((f) => f.id === fieldId);
  if (idx < 0) return null;
  store.settings.fields[idx] = { ...store.settings.fields[idx], ...patch };
  return { ...store.settings.fields[idx] };
}

export function updateAdPlacementDefinition(
  placementId: AdPlacementId,
  patch: Partial<AdPlacementDefinition>,
): AdPlacementDefinition | null {
  const store = getStore();
  const idx = store.settings.placements.findIndex((p) => p.id === placementId);
  if (idx < 0) return null;
  store.settings.placements[idx] = { ...store.settings.placements[idx], ...patch };
  return { ...store.settings.placements[idx] };
}

export function getAdvertiserAdsStats(): AdvertiserAdsStats {
  const store = getStore();
  autoExpireAds(store);
  const ads = store.ads;
  const count = (s: AdvertiserAdStatus) => ads.filter((a) => a.status === s).length;
  return {
    total: ads.length,
    pendingReview: count('pending_review'),
    pendingPayment: count('pending_payment'),
    approved: count('approved'),
    paused: count('paused'),
    rejected: count('rejected'),
    expired: count('expired'),
    draft: count('draft'),
    revenuePaid: ads.reduce((sum, a) => sum + (a.isPaid ? a.amountPaid : 0), 0),
    totalViews: ads.reduce((sum, a) => sum + (a.views || 0), 0),
    totalClicks: ads.reduce((sum, a) => sum + (a.clicks || 0), 0),
  };
}

export function listAdvertiserAds(filters?: {
  advertiserId?: string;
  status?: AdvertiserAdStatus | AdvertiserAdStatus[];
  placementId?: AdPlacementId;
  publicOnly?: boolean;
  search?: string;
}): AdvertiserAd[] {
  const store = getStore();
  autoExpireAds(store);
  let rows = [...store.ads];
  const now = Date.now();

  if (filters?.advertiserId) {
    rows = rows.filter((a) => a.advertiserId === filters.advertiserId);
  }

  if (filters?.placementId) {
    rows = rows.filter((a) => a.placementId === filters.placementId);
  }

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    rows = rows.filter((a) => statuses.includes(a.status));
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.advertiserName ?? '').toLowerCase().includes(q) ||
        (a.advertiserEmail ?? '').toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q),
    );
  }

  if (filters?.publicOnly) {
    rows = rows.filter((a) => {
      if (a.status !== 'approved') return false;
      if (a.expiresAt && new Date(a.expiresAt).getTime() <= now) return false;
      return true;
    });
    rows.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return rows;
  }

  return rows.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getAdvertiserAdById(id: string): AdvertiserAd | null {
  autoExpireAds(getStore());
  return getStore().ads.find((a) => a.id === id) ?? null;
}

export interface CreateAdvertiserAdInput {
  advertiserId: string;
  advertiserName?: string | null;
  advertiserEmail?: string | null;
  categoryKey?: string;
  title: string;
  description?: string | null;
  images?: string[];
  videoUrl?: string | null;
  placementId: AdPlacementId;
  durationDays: number;
  fields: Record<string, string | number | boolean | string[]>;
  submitForReview?: boolean;
  markPaid?: boolean;
}

export function createAdvertiserAd(input: CreateAdvertiserAdInput): AdvertiserAd {
  const settings = getAdvertiserAdSettings();
  const placement = getPlacementById(settings, input.placementId);
  if (!placement) throw new Error('Invalid or disabled placement');

  const pricePerDay = placement.pricePerDay;
  const totalAmount = calcAdTotal(pricePerDay, input.durationDays);
  const isPaid = Boolean(input.markPaid);
  const requirePay = settings.platform.requirePaymentBeforeReview;
  let status: AdvertiserAdStatus = 'draft';
  if (input.submitForReview) {
    if (requirePay && !isPaid) status = 'pending_payment';
    else status = 'pending_review';
  }

  const ad: AdvertiserAd = {
    id: randomUUID(),
    advertiserId: input.advertiserId,
    advertiserName: input.advertiserName ?? null,
    advertiserEmail: input.advertiserEmail ?? null,
    categoryKey: input.categoryKey ?? settings.defaultCategoryKey,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    images: (input.images ?? []).slice(0, settings.platform.maxImages),
    videoUrl: input.videoUrl?.trim() || null,
    placementId: input.placementId,
    durationDays: input.durationDays,
    pricePerDay,
    totalAmount,
    amountPaid: isPaid ? totalAmount : 0,
    isPaid,
    status,
    rejectionReason: null,
    adminNotes: null,
    isFeatured: false,
    priority: 0,
    fields: input.fields,
    startsAt: null,
    expiresAt: null,
    views: 0,
    clicks: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  getStore().ads.unshift(ad);
  return { ...ad };
}

export type AdvertiserAdPatch = Partial<
  Pick<
    AdvertiserAd,
    | 'title'
    | 'description'
    | 'images'
    | 'videoUrl'
    | 'placementId'
    | 'durationDays'
    | 'fields'
    | 'status'
    | 'rejectionReason'
    | 'adminNotes'
    | 'isFeatured'
    | 'priority'
    | 'isPaid'
    | 'amountPaid'
    | 'startsAt'
    | 'expiresAt'
    | 'clicks'
    | 'views'
  >
>;

export function updateAdvertiserAd(id: string, patch: AdvertiserAdPatch): AdvertiserAd | null {
  const store = getStore();
  const idx = store.ads.findIndex((a) => a.id === id);
  if (idx < 0) return null;

  const current = store.ads[idx];
  const placementId = patch.placementId ?? current.placementId;
  const durationDays = patch.durationDays ?? current.durationDays;
  const settings = getAdvertiserAdSettings();
  const placement = getPlacementById(settings, placementId);
  const pricePerDay = placement?.pricePerDay ?? current.pricePerDay;
  const totalAmount = calcAdTotal(pricePerDay, durationDays);

  const next: AdvertiserAd = {
    ...current,
    ...patch,
    placementId,
    durationDays,
    pricePerDay,
    totalAmount,
    updatedAt: nowIso(),
  };

  store.ads[idx] = next;
  return { ...next };
}

export function markAdvertiserAdPaid(id: string): AdvertiserAd | null {
  const ad = getAdvertiserAdById(id);
  if (!ad) return null;
  return updateAdvertiserAd(id, {
    isPaid: true,
    amountPaid: ad.totalAmount,
    status: ad.status === 'pending_payment' ? 'pending_review' : ad.status,
  });
}

export function approveAdvertiserAd(id: string): AdvertiserAd | null {
  const ad = getAdvertiserAdById(id);
  if (!ad) return null;
  const settings = getAdvertiserAdSettings();
  const startsAt = nowIso();
  const expiresAt = new Date(Date.now() + ad.durationDays * 86400000).toISOString();
  return updateAdvertiserAd(id, {
    status: 'approved',
    rejectionReason: null,
    startsAt,
    expiresAt,
    isFeatured: settings.platform.featureOnApprove ? true : ad.isFeatured,
  });
}

export function rejectAdvertiserAd(id: string, reason: string): AdvertiserAd | null {
  return updateAdvertiserAd(id, {
    status: 'rejected',
    rejectionReason: reason.trim() || null,
  });
}

export function pauseAdvertiserAd(id: string): AdvertiserAd | null {
  const ad = getAdvertiserAdById(id);
  if (!ad || ad.status !== 'approved') return null;
  return updateAdvertiserAd(id, { status: 'paused' });
}

export function resumeAdvertiserAd(id: string): AdvertiserAd | null {
  const ad = getAdvertiserAdById(id);
  if (!ad || ad.status !== 'paused') return null;
  if (ad.expiresAt && new Date(ad.expiresAt).getTime() <= Date.now()) {
    return updateAdvertiserAd(id, { status: 'expired' });
  }
  return updateAdvertiserAd(id, { status: 'approved' });
}

export function expireAdvertiserAd(id: string): AdvertiserAd | null {
  return updateAdvertiserAd(id, {
    status: 'expired',
    expiresAt: nowIso(),
  });
}

export function extendAdvertiserAd(id: string, extraDays: number): AdvertiserAd | null {
  const ad = getAdvertiserAdById(id);
  if (!ad) return null;
  const days = Math.max(1, Math.round(extraDays));
  const base = ad.expiresAt ? new Date(ad.expiresAt).getTime() : Date.now();
  const from = Math.max(base, Date.now());
  const expiresAt = new Date(from + days * 86400000).toISOString();
  const durationDays = ad.durationDays + days;
  return updateAdvertiserAd(id, {
    durationDays,
    expiresAt,
    status: ad.status === 'expired' || ad.status === 'paused' ? 'approved' : ad.status,
    startsAt: ad.startsAt ?? nowIso(),
  });
}

export function deleteAdvertiserAd(id: string): boolean {
  const store = getStore();
  const before = store.ads.length;
  store.ads = store.ads.filter((a) => a.id !== id);
  return store.ads.length < before;
}

export function bulkUpdateAdvertiserAds(
  ids: string[],
  action: 'approve' | 'reject' | 'pause' | 'resume' | 'expire' | 'delete' | 'feature' | 'unfeature',
  reason?: string,
): { ok: number; failed: number } {
  let ok = 0;
  let failed = 0;
  for (const id of ids) {
    let result: unknown = null;
    switch (action) {
      case 'approve':
        result = approveAdvertiserAd(id);
        break;
      case 'reject':
        result = rejectAdvertiserAd(id, reason ?? '');
        break;
      case 'pause':
        result = pauseAdvertiserAd(id);
        break;
      case 'resume':
        result = resumeAdvertiserAd(id);
        break;
      case 'expire':
        result = expireAdvertiserAd(id);
        break;
      case 'delete':
        result = deleteAdvertiserAd(id) ? true : null;
        break;
      case 'feature':
        result = updateAdvertiserAd(id, { isFeatured: true, priority: 10 });
        break;
      case 'unfeature':
        result = updateAdvertiserAd(id, { isFeatured: false, priority: 0 });
        break;
    }
    if (result) ok += 1;
    else failed += 1;
  }
  return { ok, failed };
}

export function incrementAdViews(id: string): void {
  const store = getStore();
  const ad = store.ads.find((a) => a.id === id);
  if (ad) ad.views += 1;
}

export function incrementAdClicks(id: string): void {
  const store = getStore();
  const ad = store.ads.find((a) => a.id === id);
  if (ad) ad.clicks += 1;
}

export type { AdvertiserAdPlatformSettings };
