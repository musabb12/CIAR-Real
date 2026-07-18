'use client';

import { useEffect, useState } from 'react';
import { Loader2, Target } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import type { AdPlacementId } from '@/types/advertiser-ads';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

interface AiAdTargetingHintProps {
  isAr: boolean;
  durationDays: number;
  budget?: number;
  hasVideo?: boolean;
  hasDiscount?: boolean;
  currentPlacementId: AdPlacementId;
  onSelectPlacement: (id: AdPlacementId) => void;
}

export function AiAdTargetingHint({
  isAr,
  durationDays,
  budget,
  hasVideo,
  hasDiscount,
  currentPlacementId,
  onSelectPlacement,
}: AiAdTargetingHintProps) {
  const { isFeatureEnabled } = useAppStore();
  const enabled = isFeatureEnabled('ai_ad_targeting');
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    Array<{ placementId: string; score: number; reasonAr: string; reasonEn: string }>
  >([]);

  useEffect(() => {
    if (!enabled) {
      setTip(null);
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/ai/ad-targeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'clothing',
        durationDays,
        budget,
        hasVideo,
        hasDiscount,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setTip(isAr ? data.campaignTipAr : data.campaignTipEn);
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      })
      .catch(() => {
        if (!cancelled) {
          setTip(null);
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, durationDays, budget, hasVideo, hasDiscount, isAr]);

  if (!enabled) return null;
  if (!loading && !tip && suggestions.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2.5 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
        <Target className="h-3.5 w-3.5" />
        {tx(isAr, 'اقتراح استهداف AI', 'AI targeting tip')}
      </div>
      {loading ? (
        <p className="text-xs text-emerald-100/80 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {tx(isAr, 'تحليل أفضل أماكن الظهور...', 'Analyzing best placements...')}
        </p>
      ) : (
        <>
          {tip && <p className="text-xs text-emerald-50/90 leading-5">{tip}</p>}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.placementId}
                  type="button"
                  onClick={() => onSelectPlacement(s.placementId as AdPlacementId)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] border transition-colors ${
                    currentPlacementId === s.placementId
                      ? 'border-emerald-300/60 bg-emerald-400/25 text-white'
                      : 'border-white/15 bg-white/5 text-emerald-50 hover:bg-white/10'
                  }`}
                  title={isAr ? s.reasonAr : s.reasonEn}
                >
                  {s.placementId.replace(/_/g, ' ')} · {s.score}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
