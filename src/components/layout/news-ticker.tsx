'use client';

import { useEffect, useState, useRef, useCallback, type CSSProperties } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';
import { onInvalidate } from '@/lib/admin-events';
import { useAppStore } from '@/store/app-store';
import { resolveNewsContent } from '@/lib/news-locales';
import { resolveNewsTickerFontFamily } from '@/lib/news-ticker-fonts';

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
  { id: '1', type: 'info', text: 'منصة CIAR متاحة الآن في أكثر من 60 دولة حول العالم. اعثر على عقارك المثالي اليوم!' },
  { id: '2', type: 'promo', text: 'إعلانات جديدة يومياً — أكثر من 30,000 عقار موثّق حول العالم.' },
  { id: '3', type: 'info', text: 'وكلاء معتمدون في كل مدينة رئيسية. تواصل مع محترفين موثوقين.' },
  { id: '4', type: 'warning', text: 'تحديث السوق: أسعار العقارات الفاخرة في تصاعد في أبرز الوجهات.' },
  { id: '5', type: 'promo', text: 'أدوات تقييم عقاري بالذكاء الاصطناعي متاحة على كل إعلان.' },
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
  const fontFamily = resolveNewsTickerFontFamily(designSettings.newsTickerFontFamily);
  const tickerTextStyle: CSSProperties = {
    fontSize: fontSizePx,
    ...(fontFamily ? { fontFamily } : {}),
  };

  const loadNews = useCallback(() => {
    fetch('/api/news?fresh=1')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNews(
            (data as Array<{
              id: string;
              type: NewsItem['type'];
              content: string;
              contentByLocale?: Record<string, string>;
              link?: string | null;
            }>).map((item) => {
              const text = resolveNewsContent(item, locale);
              return {
                id: item.id,
                type: item.type,
                text,
                content: text,
                link: item.link ?? null,
              };
            }),
          );
        }
      })
      .catch(() => {
        // Use fallback news items
      });
  }, [locale]);

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
              ...tickerTextStyle,
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
                    ...tickerTextStyle,
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
