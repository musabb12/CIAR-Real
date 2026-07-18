'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Megaphone,
  Plus,
  Loader2,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ImageUrlInput } from '@/components/admin/image-url-input';
import {
  AD_DURATION_OPTIONS,
  calcAdTotal,
  enabledFields,
  fieldLabel,
  placementLabel,
} from '@/lib/advertiser-ads-config';
import { formatNumberEn } from '@/lib/format-numbers';
import { AiInventoryHint } from '@/components/feature/ai-insights-panel';
import { AiAdTargetingHint } from '@/components/feature/ai-ad-targeting-hint';
import type {
  AdFieldDefinition,
  AdPlacementId,
  AdvertiserAd,
  AdvertiserAdSettings,
} from '@/types/advertiser-ads';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

interface AdvertiserAdsPanelProps {
  isAr: boolean;
  advertiserId: string;
  advertiserName: string | null;
  advertiserEmail: string | null;
}

export function AdvertiserAdsPanel({
  isAr,
  advertiserId,
  advertiserName,
  advertiserEmail,
}: AdvertiserAdsPanelProps) {
  const [settings, setSettings] = useState<AdvertiserAdSettings | null>(null);
  const [ads, setAds] = useState<AdvertiserAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [placementId, setPlacementId] = useState<AdPlacementId>('home_featured_grid');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [fieldValues, setFieldValues] = useState<Record<string, string | number | string[]>>({});
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch('/api/advertiser-ads/settings'),
        fetch(`/api/advertiser-ads?advertiserId=${encodeURIComponent(advertiserId)}`),
      ]);
      const s = (await sRes.json()) as AdvertiserAdSettings;
      setSettings(s);
      setAds((await aRes.json()) as AdvertiserAd[]);
      const firstPlacement = s.placements.find((p) => p.enabled);
      if (firstPlacement) setPlacementId(firstPlacement.id);
    } finally {
      setLoading(false);
    }
  }, [advertiserId]);

  useEffect(() => {
    load();
  }, [load]);

  const fields = useMemo(
    () => (settings ? enabledFields(settings) : []),
    [settings],
  );

  const placement = useMemo(
    () => settings?.placements.find((p) => p.id === placementId && p.enabled),
    [settings, placementId],
  );

  const total = placement ? calcAdTotal(placement.pricePerDay, durationDays) : 0;

  const setField = (key: string, value: string | number | string[]) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (field: AdFieldDefinition) => {
    const value = fieldValues[field.key];

    if (field.type === 'textarea') {
      return (
        <textarea
          className="partner-input min-h-[80px] w-full rounded-xl"
          value={String(value ?? '')}
          onChange={(e) => setField(field.key, e.target.value)}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <select
          className="partner-input w-full rounded-xl"
          value={String(value ?? '')}
          onChange={(e) => setField(field.key, e.target.value)}
        >
          <option value="">{tx(isAr, '— اختر —', '— Select —')}</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {isAr ? o.labelAr : o.labelEn}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'multiselect') {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  setField(
                    field.key,
                    on ? selected.filter((v) => v !== o.value) : [...selected, o.value],
                  );
                }}
                className={`rounded-lg px-2.5 py-1 text-xs border ${
                  on
                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                    : 'border-white/15 text-white/60'
                }`}
              >
                {isAr ? o.labelAr : o.labelEn}
              </button>
            );
          })}
        </div>
      );
    }

    const inputType =
      field.type === 'number' || field.type === 'price' || field.type === 'percent'
        ? 'number'
        : field.type === 'phone' || field.type === 'whatsapp'
          ? 'tel'
          : 'text';

    return (
      <input
        type={inputType}
        className="partner-input w-full rounded-xl"
        value={value != null ? String(value) : ''}
        onChange={(e) =>
          setField(
            field.key,
            inputType === 'number' ? Number(e.target.value) : e.target.value,
          )
        }
        placeholder={isAr ? field.placeholderAr : field.placeholderEn}
      />
    );
  };

  const submit = async (payNow: boolean) => {
    if (!title.trim()) {
      toast.error(tx(isAr, 'العنوان مطلوب', 'Title is required'));
      return;
    }
    for (const field of fields) {
      if (!field.required) continue;
      const v = fieldValues[field.key];
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
        toast.error(`${fieldLabel(field, isAr)} ${tx(isAr, 'مطلوب', 'is required')}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/advertiser-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiserId,
          advertiserName,
          advertiserEmail,
          title,
          description,
          images: imageUrl ? [imageUrl] : [],
          videoUrl: videoUrl.trim() || null,
          placementId,
          durationDays,
          fields: fieldValues,
          submitForReview: true,
          markPaid: payNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed');

      if (!payNow && data.status === 'pending_payment') {
        await fetch(`/api/advertiser-ads/${data.id}/pay`, { method: 'POST' });
      }

      toast.success(
        tx(
          isAr,
          'تم إرسال الإعلان للمراجعة. بعد الموافقة يظهر في صفحة الإعلانات وفي المكان الذي اخترته داخل الموقع.',
          'Ad submitted for review. After approval it appears on the Ads page and in your chosen site placement.',
        ),
      );
      setShowForm(false);
      setTitle('');
      setDescription('');
      setImageUrl('');
      setVideoUrl('');
      setFieldValues({});
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">
            {tx(isAr, 'إعلان جديد', 'New advertiser ad')}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {tx(
              isAr,
              'مثال: ملابس — أنواع القماش، الألوان، المقاسات، الكمية، السعر، الواتساب، الحسم، والشحن',
              'Example: clothing — fabric, colors, sizes, stock, price, WhatsApp, discount & shipping',
            )}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Field label={tx(isAr, 'عنوان الإعلان', 'Ad title')}>
            <input
              className="partner-input w-full rounded-xl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label={tx(isAr, 'الوصف', 'Description')}>
            <textarea
              className="partner-input min-h-[80px] w-full rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label={tx(isAr, 'صورة الإعلان', 'Ad image')}>
            <ImageUrlInput isAr={isAr} value={imageUrl} onChange={setImageUrl} folder="ads" />
          </Field>
          <Field label={tx(isAr, 'رابط فيديو الإعلان (اختياري)', 'Ad video URL (optional)')}>
            <div className="relative">
              <Video className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="url"
                className="partner-input w-full rounded-xl ps-10"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/ad-video.mp4"
              />
            </div>
            <p className="mt-1.5 text-xs text-white/45">
              {tx(
                isAr,
                'يدعم رابط فيديو مباشر بصيغة MP4 أو WebM، ويخضع لمراجعة الإدارة قبل النشر.',
                'Supports direct MP4 or WebM URLs and remains subject to admin review.',
              )}
            </p>
          </Field>

          <Field label={tx(isAr, 'أين يظهر الإعلان؟', 'Where should this ad appear?')}>
            <select
              className="partner-input w-full rounded-xl"
              value={placementId}
              onChange={(e) => setPlacementId(e.target.value as AdPlacementId)}
            >
              {settings?.placements
                .filter((p) => p.enabled)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {placementLabel(p, isAr)} — ${formatNumberEn(p.pricePerDay)}/{tx(isAr, 'يوم', 'day')}
                  </option>
                ))}
            </select>
            {placement && (
              <p className="text-xs text-white/45 mt-1.5">
                {isAr ? placement.descriptionAr : placement.descriptionEn}
              </p>
            )}
            <AiAdTargetingHint
              isAr={isAr}
              durationDays={durationDays}
              budget={total}
              hasVideo={Boolean(videoUrl.trim())}
              hasDiscount={
                fieldValues.discountPercent != null && Number(fieldValues.discountPercent) > 0
              }
              currentPlacementId={placementId}
              onSelectPlacement={(id) => setPlacementId(id)}
            />
          </Field>

          <Field label={tx(isAr, 'مدة الإعلان', 'Ad duration')}>
            <div className="flex flex-wrap gap-2">
              {AD_DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationDays(d)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium border ${
                    durationDays === d
                      ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                      : 'border-white/15 text-white/60'
                  }`}
                >
                  {d} {tx(isAr, 'يوم', 'days')}
                </button>
              ))}
            </div>
          </Field>

          {fields.map((field) => (
            <Field key={field.id} label={fieldLabel(field, isAr)}>
              {renderField(field)}
            </Field>
          ))}

          {typeof fieldValues.stockRemaining === 'number' && (
            <AiInventoryHint
              isAr={isAr}
              stockRemaining={Number(fieldValues.stockRemaining)}
              discountPercent={
                fieldValues.discountPercent != null
                  ? Number(fieldValues.discountPercent)
                  : undefined
              }
              durationDays={durationDays}
            />
          )}

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              disabled={seoLoading || !title.trim()}
              onClick={async () => {
                setSeoLoading(true);
                try {
                  const res = await fetch('/api/ai/seo-keywords', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title,
                      description,
                      category: 'clothing',
                      locale: isAr ? 'ar' : 'en',
                    }),
                  });
                  const data = await res.json();
                  setSeoKeywords(Array.isArray(data.keywords) ? data.keywords : []);
                  if (data.metaDescription && !description.trim()) {
                    setDescription(String(data.metaDescription));
                  }
                  toast.success(tx(isAr, 'تم اقتراح كلمات مفتاحية', 'SEO keywords suggested'));
                } catch {
                  toast.error(tx(isAr, 'فشل تحليل SEO', 'SEO analysis failed'));
                } finally {
                  setSeoLoading(false);
                }
              }}
            >
              {seoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <Sparkles className="h-4 w-4 me-2" />
              )}
              {tx(isAr, 'اقتراح كلمات SEO بالذكاء الاصطناعي', 'Suggest SEO keywords with AI')}
            </Button>
            {seoKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {seoKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/70"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-400/25 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-100">
              <CreditCard className="h-5 w-5" />
              <span className="font-semibold">{tx(isAr, 'المبلغ الإجمالي', 'Total')}</span>
            </div>
            <span className="text-xl font-bold text-amber-200 tabular-nums">
              ${formatNumberEn(total)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              className="checkout-pay-btn rounded-xl border-0"
              disabled={submitting}
              onClick={() => submit(true)}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : tx(isAr, 'ادفع وأرسل للمراجعة', 'Pay & submit')}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-white/15 bg-white/5 text-white"
              disabled={submitting}
              onClick={() => setShowForm(false)}
            >
              {tx(isAr, 'إلغاء', 'Cancel')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-amber-400" />
            {tx(isAr, 'إعلاناتي التجارية', 'My marketplace ads')}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {tx(isAr, 'أنشئ إعلاناً، اختر مكانه في الموقع، وادفع لمدة محددة', 'Create an ad, pick placement, pay for a duration')}
          </p>
        </div>
        <Button className="checkout-pay-btn rounded-xl border-0" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 me-2" />
          {tx(isAr, 'إعلان جديد', 'New ad')}
        </Button>
      </div>

      {ads.length === 0 ? (
        <p className="text-sm text-white/45 py-8 text-center">
          {tx(isAr, 'لا توجد إعلانات بعد', 'No ads yet')}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} settings={settings} isAr={isAr} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdCard({
  ad,
  settings,
  isAr,
}: {
  ad: AdvertiserAd;
  settings: AdvertiserAdSettings | null;
  isAr: boolean;
}) {
  const placement = settings?.placements.find((p) => p.id === ad.placementId);
  const statusIcon =
    ad.status === 'approved' ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    ) : ad.status === 'rejected' ? (
      <XCircle className="h-4 w-4 text-rose-400" />
    ) : (
      <Clock className="h-4 w-4 text-amber-400" />
    );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {ad.videoUrl ? (
        <video
          src={ad.videoUrl}
          poster={ad.images[0]}
          controls
          preload="metadata"
          className="h-36 w-full bg-black object-cover"
        />
      ) : ad.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.images[0]} alt="" className="h-36 w-full object-cover" />
      ) : null}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white line-clamp-1">{ad.title}</h3>
          {statusIcon}
        </div>
        {placement && (
          <p className="text-xs text-white/45 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {placementLabel(placement, isAr)}
          </p>
        )}
        <p className="text-xs text-amber-200/80 tabular-nums">
          ${formatNumberEn(ad.totalAmount)} · {ad.durationDays}d
        </p>
        {ad.rejectionReason && (
          <p className="text-xs text-rose-300/80">{ad.rejectionReason}</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/70 text-sm">{label}</Label>
      {children}
    </div>
  );
}
