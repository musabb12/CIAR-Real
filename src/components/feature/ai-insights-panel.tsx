'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Search,
  Loader2,
  MessageSquareHeart,
  Package,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { formatNumberEn } from '@/lib/format-numbers';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

interface AiInsightsPanelProps {
  propertyId?: string;
  price?: number;
  bedrooms?: number | null;
  propertyType?: string;
  cityId?: string;
  countryId?: string;
  title?: string;
  description?: string;
  cityName?: string;
  countryName?: string;
}

export function AiInsightsPanel({
  propertyId,
  price = 0,
  bedrooms,
  propertyType,
  cityId,
  countryId,
  title = '',
  description = '',
  cityName,
  countryName,
}: AiInsightsPanelProps) {
  const { isFeatureEnabled, setCurrentPage, setSelectedPropertyId } = useAppStore();
  const { rtl, locale } = useTranslation();
  const isAr = rtl;

  const showRecs = isFeatureEnabled('similarity') || isFeatureEnabled('ai_recommendations');
  const showSeo = isFeatureEnabled('ai_seo');
  const showSentiment = isFeatureEnabled('ai_sentiment') || isFeatureEnabled('reviews');

  const [recs, setRecs] = useState<
    Array<{ id: string; title: string; price: number; score: number; reasonAr: string; reasonEn: string }>
  >([]);
  const [seo, setSeo] = useState<{ keywords: string[]; titleSuggestions: string[]; metaDescription: string } | null>(
    null,
  );
  const [sentimentDemo, setSentimentDemo] = useState<{
    label: string;
    score: number;
    summaryAr: string;
    summaryEn: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!showRecs && !showSeo && !showSentiment) return;
    setLoading(true);
    try {
      const tasks: Promise<void>[] = [];

      if (showRecs) {
        tasks.push(
          (async () => {
            const params = new URLSearchParams({
              price: String(price || 0),
              limit: '4',
            });
            if (propertyId) params.set('propertyId', propertyId);
            if (bedrooms != null) params.set('bedrooms', String(bedrooms));
            if (propertyType) params.set('propertyType', propertyType);
            if (cityId) params.set('cityId', cityId);
            if (countryId) params.set('countryId', countryId);
            const res = await fetch(`/api/ai/recommendations?${params}`);
            const data = await res.json();
            setRecs(Array.isArray(data.recommendations) ? data.recommendations : []);
          })(),
        );
      }

      if (showSeo && title) {
        tasks.push(
          (async () => {
            const res = await fetch('/api/ai/seo-keywords', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                description,
                city: cityName,
                country: countryName,
                category: propertyType,
                locale,
              }),
            });
            const data = await res.json();
            if (Array.isArray(data.keywords)) setSeo(data);
          })(),
        );
      }

      if (showSentiment && description) {
        tasks.push(
          (async () => {
            const res = await fetch('/api/ai/sentiment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: description }),
            });
            const data = await res.json();
            if (data.label) setSentimentDemo(data);
          })(),
        );
      }

      await Promise.all(tasks);
    } finally {
      setLoading(false);
    }
  }, [
    showRecs,
    showSeo,
    showSentiment,
    price,
    propertyId,
    bedrooms,
    propertyType,
    cityId,
    countryId,
    title,
    description,
    cityName,
    countryName,
    locale,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  if (!showRecs && !showSeo && !showSentiment) return null;

  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-heading text-lg font-bold">
          {tx(isAr, 'رؤى الذكاء الاصطناعي', 'AI Insights')}
        </h3>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ms-auto" />}
      </div>

      {showRecs && recs.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {tx(isAr, 'عقارات مشابهة موصى بها', 'Recommended similar properties')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recs.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedPropertyId(r.id);
                  setCurrentPage('property-detail');
                }}
                className="text-start rounded-xl border border-border/60 bg-card/80 p-3 hover:border-emerald-500/40 transition-colors"
              >
                <p className="text-sm font-semibold line-clamp-1">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ${formatNumberEn(r.price)} · {tx(isAr, 'تطابق', 'Match')} {formatNumberEn(r.score)}%
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                  {isAr ? r.reasonAr : r.reasonEn}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {showSeo && seo && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <Search className="h-3.5 w-3.5" />
            {tx(isAr, 'كلمات مفتاحية SEO', 'SEO keywords')}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {seo.keywords.slice(0, 10).map((k) => (
              <span
                key={k}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {k}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{seo.metaDescription}</p>
        </div>
      )}

      {showSentiment && sentimentDemo && (
        <div className="flex items-start gap-2 rounded-xl bg-card/60 border border-border/50 p-3">
          <MessageSquareHeart className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold">
              {tx(isAr, 'تحليل نبرة الوصف', 'Description sentiment')}:{' '}
              <span className="text-foreground">{sentimentDemo.label}</span>
              {' · '}
              <span className="tabular-nums">{formatNumberEn(sentimentDemo.score)}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? sentimentDemo.summaryAr : sentimentDemo.summaryEn}
            </p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        {tx(
          isAr,
          'يعمل بالذكاء الاصطناعي عند توفر مفتاح API، وإلا بخوارزميات ذكية محلية.',
          'Uses LLM when an API key is set; otherwise smart local heuristics.',
        )}
      </p>
    </section>
  );
}

/** Compact inventory AI widget for advertiser ad forms */
export function AiInventoryHint({
  stockRemaining,
  discountPercent,
  views,
  durationDays,
  isAr,
}: {
  stockRemaining: number;
  discountPercent?: number;
  views?: number;
  durationDays?: number;
  isAr: boolean;
}) {
  const { isFeatureEnabled } = useAppStore();
  const enabled = isFeatureEnabled('ai_inventory');
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHint(null);
      return;
    }
    if (!Number.isFinite(stockRemaining) || stockRemaining < 0) {
      setHint(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/ai/inventory-forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockRemaining, discountPercent, views, durationDays }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setHint(isAr ? data.suggestionAr : data.suggestionEn);
      })
      .catch(() => {
        if (!cancelled) setHint(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, stockRemaining, discountPercent, views, durationDays, isAr]);

  if (!enabled) return null;
  if (!hint && !loading) return null;

  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 flex items-start gap-2">
      <Package className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      {loading ? (
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          {tx(isAr, 'تحليل المخزون...', 'Analyzing inventory...')}
        </span>
      ) : (
        hint
      )}
    </div>
  );
}
