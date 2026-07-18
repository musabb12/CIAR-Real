'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Megaphone, MessageCircle, Phone, Tag, Video } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { formatNumberEn } from '@/lib/format-numbers';
import { fieldLabel } from '@/lib/advertiser-ads-config';
import type { AdPlacementId, AdvertiserAd, AdvertiserAdSettings } from '@/types/advertiser-ads';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

function trackAdEvent(adId: string, event: 'view' | 'click') {
  void fetch(`/api/advertiser-ads/${adId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}

interface AdPlacementSlotProps {
  placementId: AdPlacementId;
  isAr?: boolean;
  variant?: 'strip' | 'grid' | 'sidebar' | 'banner';
  className?: string;
}

export function AdPlacementSlot({
  placementId,
  isAr = false,
  variant = 'grid',
  className = '',
}: AdPlacementSlotProps) {
  const [ads, setAds] = useState<AdvertiserAd[]>([]);
  const [settings, setSettings] = useState<AdvertiserAdSettings | null>(null);

  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [adsRes, settingsRes] = await Promise.all([
          fetch(`/api/advertiser-ads?public=1&placementId=${placementId}`),
          fetch('/api/advertiser-ads/settings'),
        ]);
        if (cancelled) return;
        const list = (await adsRes.json()) as AdvertiserAd[];
        setAds(list);
        setSettings((await settingsRes.json()) as AdvertiserAdSettings);
        for (const ad of list) {
          if (!viewedRef.current.has(ad.id)) {
            viewedRef.current.add(ad.id);
            trackAdEvent(ad.id, 'view');
          }
        }
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placementId]);

  if (ads.length === 0) return null;

  if (variant === 'strip') {
    const ad = ads[0];
    return (
      <div className={`estate-ad-strip ${className}`}>
        <AdvertiserAdStripCard ad={ad} isAr={isAr} settings={settings} />
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`space-y-3 ${className}`}>
        {ads.slice(0, 2).map((ad) => (
          <AdSidebarCard key={ad.id} ad={ad} isAr={isAr} settings={settings} />
        ))}
      </div>
    );
  }

  if (variant === 'banner') {
    const ad = ads[0];
    return (
      <div className={className}>
        <AdBannerCard ad={ad} isAr={isAr} settings={settings} />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {ads.slice(0, 6).map((ad) => (
        <AdvertiserAdGridCard key={ad.id} ad={ad} isAr={isAr} settings={settings} />
      ))}
    </div>
  );
}

export function AdvertiserAdGridCard({
  ad,
  isAr,
  settings,
  detailed = false,
  showPlacement = false,
}: {
  ad: AdvertiserAd;
  isAr: boolean;
  settings: AdvertiserAdSettings | null;
  detailed?: boolean;
  showPlacement?: boolean;
}) {
  const whatsapp = String(ad.fields.whatsapp ?? '');
  const waUrl = buildWhatsAppUrl(whatsapp, tx(isAr, `استفسار عن: ${ad.title}`, `Inquiry: ${ad.title}`));
  const phone = String(ad.fields.phone ?? '');
  const price = ad.fields.price;
  const discount = ad.fields.discountPercent;
  const placement = settings?.placements.find((item) => item.id === ad.placementId);

  return (
    <article className="estate-ad-card group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
      {ad.videoUrl ? (
        <div className="relative">
          <video
            src={ad.videoUrl}
            poster={ad.images[0]}
            controls
            playsInline
            preload="metadata"
            className="h-48 w-full bg-black object-cover"
          />
          <span className="pointer-events-none absolute start-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
            <Video className="h-3 w-3" />
            {tx(isAr, 'فيديو', 'Video')}
          </span>
        </div>
      ) : ad.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.images[0]} alt={ad.title} className="h-40 w-full object-cover" />
      ) : null}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
          <Megaphone className="h-3 w-3" />
          {tx(isAr, 'إعلان', 'Sponsored')}
        </div>
        <h3 className="font-bold text-sm line-clamp-1">{ad.title}</h3>
        {ad.advertiserName && (
          <p className="text-[11px] font-medium text-muted-foreground">{ad.advertiserName}</p>
        )}
        {showPlacement && placement && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {isAr ? placement.labelAr : placement.labelEn}
          </p>
        )}
        {ad.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-foreground/80">
          {price != null && (
            <span className="font-bold tabular-nums">${formatNumberEn(Number(price))}</span>
          )}
          {discount != null && Number(discount) > 0 && (
            <span className="flex items-center gap-0.5 text-rose-500">
              <Tag className="h-3 w-3" />
              -{formatNumberEn(Number(discount))}%
            </span>
          )}
        </div>
        {renderFieldChips(ad, settings, isAr, detailed ? 20 : 3)}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAdEvent(ad.id, 'click')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {tx(isAr, 'واتساب', 'WhatsApp')}
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={() => trackAdEvent(ad.id, 'click')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {phone}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function AdvertiserAdStripCard({
  ad,
  isAr,
  settings,
}: {
  ad: AdvertiserAd;
  isAr: boolean;
  settings: AdvertiserAdSettings | null;
}) {
  const waUrl = buildWhatsAppUrl(String(ad.fields.whatsapp ?? ''));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-500/20 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {ad.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide">
            {tx(isAr, 'إعلان مميز', 'Featured ad')}
          </p>
          <p className="font-bold text-sm truncate">{ad.title}</p>
        </div>
      </div>
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAdEvent(ad.id, 'click')}
          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {tx(isAr, 'تواصل', 'Contact')}
        </a>
      )}
    </div>
  );
}

function AdSidebarCard({
  ad,
  isAr,
}: {
  ad: AdvertiserAd;
  isAr: boolean;
  settings: AdvertiserAdSettings | null;
}) {
  const waUrl = buildWhatsAppUrl(String(ad.fields.whatsapp ?? ''));
  return (
    <div className="rounded-xl border border-border/50 bg-card/80 p-3 text-sm">
      {ad.videoUrl ? (
        <video
          src={ad.videoUrl}
          poster={ad.images[0]}
          controls
          playsInline
          preload="metadata"
          className="mb-2 h-28 w-full rounded-lg bg-black object-cover"
        />
      ) : ad.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.images[0]} alt="" className="h-24 w-full object-cover rounded-lg mb-2" />
      ) : null}
      <p className="font-semibold line-clamp-2">{ad.title}</p>
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAdEvent(ad.id, 'click')}
          className="text-xs text-emerald-600 mt-2 inline-block"
        >
          WhatsApp
        </a>
      )}
    </div>
  );
}

function AdBannerCard({
  ad,
  isAr,
}: {
  ad: AdvertiserAd;
  isAr: boolean;
  settings: AdvertiserAdSettings | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl h-32 sm:h-40">
      {ad.videoUrl ? (
        <video
          src={ad.videoUrl}
          poster={ad.images[0]}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : ad.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center p-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-300 mb-1">
            {tx(isAr, 'إعلان', 'Ad')}
          </p>
          <p className="text-lg font-bold text-white">{ad.title}</p>
        </div>
      </div>
    </div>
  );
}

function renderFieldChips(
  ad: AdvertiserAd,
  settings: AdvertiserAdSettings | null,
  isAr: boolean,
  maxItems = 3,
) {
  if (!settings) return null;
  const chips: string[] = [];
  for (const field of settings.fields) {
    if (!field.enabled) continue;
    const v = ad.fields[field.key];
    if (v == null || v === '') continue;
    if (['price', 'whatsapp', 'phone', 'discountPercent'].includes(field.key)) continue;
    const values = Array.isArray(v) ? v : [v];
    const display = values
      .map((item) => {
        const option = field.options?.find((candidate) => candidate.value === String(item));
        return option ? (isAr ? option.labelAr : option.labelEn) : String(item);
      })
      .join(', ');
    chips.push(`${fieldLabel(field, isAr)}: ${display}`);
  }
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.slice(0, maxItems).map((c) => (
        <span key={c} className="text-[10px] rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
          {c}
        </span>
      ))}
    </div>
  );
}
