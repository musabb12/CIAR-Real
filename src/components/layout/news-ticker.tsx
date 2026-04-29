'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';

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
  const [news, setNews] = useState<NewsItem[]>(fallbackNews);
  const [paused, setPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNews(data);
        }
      })
      .catch(() => {
        // Use fallback news items
      });
  }, []);

  const label = typeLabels[locale] || 'Breaking';
  const animDuration = `${Math.max(news.length * 6, 20)}s`;
  const animName = rtl ? 'ticker-scroll-rtl' : 'ticker-scroll-ltr';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="news-ticker-bar relative z-40 w-full glass-nav overflow-hidden"
      style={{ height: '40px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex h-full items-center">
        {/* Left label area */}
        <div className="relative z-10 flex h-full items-center gap-2 border-r border-border/40 bg-gradient-to-r from-primary/10 to-transparent px-4 dark:from-primary/5">
          <Bell size={14} className="text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-primary">
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
                <span className="text-xs text-foreground/80">{item.content || item.text}</span>
                <span className="text-foreground/20 mx-1">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
