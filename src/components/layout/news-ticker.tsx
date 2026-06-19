'use client';

import { useEffect, useState, useRef, useCallback, type CSSProperties } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';
import { onInvalidate } from '@/lib/admin-events';
import { useAppStore } from '@/store/app-store';

interface NewsItem {
  id: string;
  type: 'info' | 'warning' | 'urgent' | 'promo';
  text: string;
  content?: string;
  link?: string | null;
}

const typeColors: Record<NewsItem['type'], string> = {
  info: 'bg-sky-500',
  warning: 'bg-amber-500',
  urgent: 'bg-red-500',
  promo: 'bg-emerald-500',
};

const typeLabels: Record<string, string> = {
  en: 'Breaking',
  ar: 'عاجل',
  fr: 'Flash',
  es: 'Ultima hora',
  tr: 'Son dakika',
};

const fallbackNews: NewsItem[] = [
  { id: '1', type: 'info', text: 'CIAR platform now available in 60+ countries worldwide. Find your dream property today!' },
  { id: '2', type: 'promo', text: 'New listings added daily. Over 30,000+ verified properties across the globe.' },
  { id: '3', type: 'info', text: 'Verified agents in every major city. Connect with trusted professionals.' },
  { id: '4', type: 'warning', text: 'Market update: Prime real estate prices trending upward in top destinations.' },
  { id: '5', type: 'promo', text: 'Smart AI valuation tools now available on every property listing.' },
];

export function NewsTicker() {
  const { locale, rtl } = useTranslation();
  const designSettings = useAppStore((s) => s.designSettings);
  const [news, setNews] = useState<NewsItem[]>(fallbackNews);
  const [paused, setPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  const heightPx =
    typeof designSettings.newsTickerHeightPx === 'number' && designSettings.newsTickerHeightPx > 0
      ? designSettings.newsTickerHeightPx
      : 40;
  const fontSizePx =
    typeof designSettings.newsTickerFontSizePx === 'number' && designSettings.newsTickerFontSizePx > 0
      ? designSettings.newsTickerFontSizePx
      : 12;
  const barBg = designSettings.newsTickerBackground?.trim() ?? '';
  const textColor = designSettings.newsTickerTextColor?.trim() ?? '';
  const labelTextColor = designSettings.newsTickerLabelTextColor?.trim() ?? '';
  const labelBg = designSettings.newsTickerLabelBackground?.trim() ?? '';
  const sepColor = designSettings.newsTickerSeparatorColor?.trim() ?? '';

  const loadNews = useCallback(() => {
    fetch('/api/news?fresh=1')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNews(
            (data as Array<{ id: string; type: NewsItem['type']; content: string; link?: string | null }>).map(
              (item) => ({
                id: item.id,
                type: item.type,
                text: item.content,
                content: item.content,
                link: item.link ?? null,
              }),
            ),
          );
        }
      })
      .catch(() => {
        // Use fallback news items
      });
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  useEffect(() => {
    return onInvalidate('news', loadNews);
  }, [loadNews]);

  const label = typeLabels[locale] || 'Breaking';
  const animDuration = `${Math.max(news.length * 6, 20)}s`;
  const animName = rtl ? 'ticker-scroll-rtl' : 'ticker-scroll-ltr';

  const barStyle: CSSProperties = {
    height: heightPx,
    ...(barBg ? { background: barBg } : {}),
  };

  const labelBlockStyle: CSSProperties = labelBg ? { background: labelBg } : {};
  const labelBlockClass = labelBg
    ? 'relative z-10 flex h-full items-center gap-2 border-r border-border/40 px-4'
    : 'relative z-10 flex h-full items-center gap-2 border-r border-border/40 bg-gradient-to-r from-primary/10 to-transparent px-4 dark:from-primary/5';

  const bellSize = Math.max(12, Math.round(fontSizePx + 2));

  return (
    <div
      className="news-ticker-bar relative z-40 w-full glass-nav overflow-hidden"
      style={barStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex h-full items-center">
        {/* Left label area */}
        <div className={labelBlockClass} style={labelBlockStyle}>
          <Bell
            size={bellSize}
            className={labelTextColor ? '' : 'text-primary'}
            style={labelTextColor ? { color: labelTextColor } : undefined}
          />
          <span
            className={`font-semibold tracking-wide uppercase ${labelTextColor ? '' : 'text-primary'}`}
            style={{
              fontSize: fontSizePx,
              ...(labelTextColor ? { color: labelTextColor } : {}),
            }}
          >
            {label}
          </span>
        </div>

        {/* Ticker track */}
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={tickerRef}
            className="news-ticker-track flex items-center h-full whitespace-nowrap"
            style={{
              animationPlayState: paused ? 'paused' : 'running',
              animationName: animName,
              animationDuration: animDuration,
            }}
          >
            {/* Duplicate items for seamless loop */}
            {[...news, ...news].map((item, idx) => (
              <span key={`${item.id}-${idx}`} className="inline-flex items-center gap-2 px-6">
                <span className={`inline-block h-2 w-2 rounded-full ${typeColors[item.type]} flex-shrink-0`} />
                <span
                  className={textColor ? '' : 'text-foreground/80'}
                  style={{
                    fontSize: fontSizePx,
                    ...(textColor ? { color: textColor } : {}),
                  }}
                >
                  {item.content || item.text}
                </span>
                <span
                  className={`mx-1 ${sepColor ? '' : 'text-foreground/20'}`}
                  style={sepColor ? { color: sepColor } : undefined}
                >
                  |
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
