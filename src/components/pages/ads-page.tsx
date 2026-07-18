'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, Loader2, MapPin, Megaphone, Search, ShieldCheck, Video } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import {
  AdvertiserAdGridCard,
  AdvertiserAdStripCard,
} from '@/components/advertiser/ad-placement-slot';
import { placementLabel } from '@/lib/advertiser-ads-config';
import { formatNumberEn } from '@/lib/format-numbers';
import { useTranslation } from '@/lib/i18n/use-translation';
import { navigateToAddListing } from '@/lib/navigate-add-listing';
import { useAppStore } from '@/store/app-store';
import type { AdPlacementId, AdvertiserAd, AdvertiserAdSettings } from '@/types/advertiser-ads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdsPage() {
  const { t, rtl, locale } = useTranslation();
  const isAr = rtl || locale === 'ar';
  const {
    currentUser,
    setCurrentPage,
    setAdminTab,
    setRegisterAccountTypePreset,
    setPartnerPendingAddListing,
  } = useAppStore();

  const [ads, setAds] = useState<AdvertiserAd[]>([]);
  const [settings, setSettings] = useState<AdvertiserAdSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [placementFilter, setPlacementFilter] = useState<AdPlacementId | 'all'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [adsRes, settingsRes] = await Promise.all([
          fetch('/api/advertiser-ads?public=1'),
          fetch('/api/advertiser-ads/settings'),
        ]);
        if (cancelled) return;
        const list = (await adsRes.json()) as AdvertiserAd[];
        setAds(Array.isArray(list) ? list : []);
        setSettings((await settingsRes.json()) as AdvertiserAdSettings);
        for (const ad of list) {
          if (!viewedRef.current.has(ad.id)) {
            viewedRef.current.add(ad.id);
            void fetch(`/api/advertiser-ads/${ad.id}/track`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: 'view' }),
            }).catch(() => {});
          }
        }
      } catch {
        if (!cancelled) setAds([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = useMemo(
    () => ads.filter((a) => a.isFeatured).slice(0, 3),
    [ads],
  );

  const filtered = useMemo(() => {
    let rows = [...ads];
    if (placementFilter !== 'all') {
      rows = rows.filter((a) => a.placementId === placementFilter);
    }
    if (mediaFilter === 'video') rows = rows.filter((a) => Boolean(a.videoUrl));
    if (mediaFilter === 'image') rows = rows.filter((a) => !a.videoUrl && a.images.length > 0);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q) ||
          (a.advertiserName ?? '').toLowerCase().includes(q),
      );
    }
    return rows;
  }, [ads, placementFilter, mediaFilter, search]);

  const handleAdvertise = () => {
    navigateToAddListing({
      currentUser,
      setCurrentPage,
      setAdminTab,
      setRegisterAccountTypePreset,
      setPartnerPendingAddListing,
    });
  };

  return (
    <div className="min-h-screen">
      <PageHero
        variant="agents"
        icon={Megaphone}
        badgeText={isAr ? 'إعلانات المعلنين' : 'Advertiser ads'}
        title={isAr ? 'الإعلانات' : t.nav.ads}
        subtitle={
          isAr
            ? 'تصفّح إعلانات المعلنين المعتمدة — عروض وخصومات وتواصل مباشر عبر واتساب'
            : 'Browse approved advertiser listings — offers, discounts, and direct WhatsApp contact'
        }
      />

      <section className="px-4 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                ar: 'لا يظهر إلا الإعلان المدفوع والمعتمد من الإدارة',
                en: 'Only paid, admin-approved ads are shown',
              },
              {
                icon: Video,
                ar: 'دعم إعلانات الصور والفيديو',
                en: 'Image and video ads supported',
              },
              {
                icon: MapPin,
                ar: 'يظهر هنا وفي المكان الذي اختاره المعلن داخل الموقع',
                en: 'Shown here and in the selected site placement',
              },
            ].map(({ icon: Icon, ar, en }) => (
              <div
                key={en}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-xs font-medium leading-5">{isAr ? ar : en}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isAr ? 'إعلانات منشورة:' : 'Published ads:'}{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {formatNumberEn(filtered.length)}
              </span>
            </p>
            <Button
              type="button"
              onClick={handleAdvertise}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-white hover:opacity-95"
            >
              <Megaphone className="me-2 h-4 w-4" />
              {isAr ? 'أضف إعلانك' : t.nav.addYourListing}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث في الإعلانات...' : 'Search ads...'}
                className="ps-10"
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value as AdPlacementId | 'all')}
            >
              <option value="all">{isAr ? 'كل الأماكن' : 'All placements'}</option>
              {settings?.placements
                .filter((p) => p.enabled)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {placementLabel(p, isAr)}
                  </option>
                ))}
            </select>
            <div className="flex items-center rounded-lg border border-input bg-background p-1">
              {(
                [
                  ['all', Megaphone, isAr ? 'الكل' : 'All'],
                  ['image', ImageIcon, isAr ? 'صور' : 'Images'],
                  ['video', Video, isAr ? 'فيديو' : 'Video'],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMediaFilter(value)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
                    mediaFilter === value
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {featured.length > 0 && placementFilter === 'all' && !search.trim() && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                {isAr ? 'إعلانات مميزة' : 'Featured ads'}
              </h2>
              <div className="space-y-2">
                {featured.map((ad) => (
                  <AdvertiserAdStripCard key={ad.id} ad={ad} isAr={isAr} settings={settings} />
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 py-16 text-center">
              <Megaphone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {isAr ? 'لا توجد إعلانات مطابقة حالياً' : 'No matching ads right now'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((ad) => (
                <AdvertiserAdGridCard
                  key={ad.id}
                  ad={ad}
                  isAr={isAr}
                  settings={settings}
                  detailed
                  showPlacement
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
