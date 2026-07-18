/** Dynamic field types configurable by admin */
export type AdFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'price'
  | 'percent'
  | 'phone'
  | 'whatsapp'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'image';

export interface AdFieldOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

export interface AdFieldDefinition {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string;
  type: AdFieldType;
  options?: AdFieldOption[];
  required: boolean;
  enabled: boolean;
  order: number;
  placeholderAr?: string;
  placeholderEn?: string;
}

/** Where an approved ad can appear on the public site */
export type AdPlacementId =
  | 'home_hero_strip'
  | 'home_featured_grid'
  | 'search_top'
  | 'search_sidebar'
  | 'property_detail_sidebar'
  | 'agents_page_banner';

export interface AdPlacementDefinition {
  id: AdPlacementId;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /** Base price per day in USD */
  pricePerDay: number;
  enabled: boolean;
  maxSlots: number;
}

export type AdvertiserAdStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_review'
  | 'approved'
  | 'paused'
  | 'rejected'
  | 'expired';

export interface AdvertiserAd {
  id: string;
  advertiserId: string;
  advertiserName: string | null;
  advertiserEmail: string | null;
  categoryKey: string;
  title: string;
  description: string | null;
  images: string[];
  /** Optional public video URL (MP4/WebM or browser-playable media). */
  videoUrl: string | null;
  placementId: AdPlacementId;
  durationDays: number;
  pricePerDay: number;
  totalAmount: number;
  amountPaid: number;
  isPaid: boolean;
  status: AdvertiserAdStatus;
  rejectionReason: string | null;
  /** Internal admin notes (not shown publicly) */
  adminNotes: string | null;
  /** Boost ordering among approved ads */
  isFeatured: boolean;
  /** Display priority (higher = first) */
  priority: number;
  /** Dynamic field values keyed by field `key` */
  fields: Record<string, string | number | boolean | string[]>;
  startsAt: string | null;
  expiresAt: string | null;
  views: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertiserAdPlatformSettings {
  /** Ads must be paid before entering review queue */
  requirePaymentBeforeReview: boolean;
  /** Auto-mark expired when expiresAt passed (on list) */
  autoExpireEnabled: boolean;
  /** Allow advertisers to edit pending ads */
  allowAdvertiserEditPending: boolean;
  /** Default duration offered in advertiser form */
  defaultDurationDays: number;
  /** Max images per ad */
  maxImages: number;
  /** New ads start as featured after approve */
  featureOnApprove: boolean;
}

export interface AdvertiserAdSettings {
  fields: AdFieldDefinition[];
  placements: AdPlacementDefinition[];
  platform: AdvertiserAdPlatformSettings;
  /** Example category label shown to advertisers */
  defaultCategoryKey: string;
  defaultCategoryLabelAr: string;
  defaultCategoryLabelEn: string;
}

export interface AdvertiserAdsStats {
  total: number;
  pendingReview: number;
  pendingPayment: number;
  approved: number;
  paused: number;
  rejected: number;
  expired: number;
  draft: number;
  revenuePaid: number;
  totalViews: number;
  totalClicks: number;
}
