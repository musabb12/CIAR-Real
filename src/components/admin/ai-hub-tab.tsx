'use client';

import { useEffect, useState } from 'react';
import {
  Brain,
  MessageCircle,
  Search,
  Heart,
  Package,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  Target,
  Users,
  Megaphone,
} from 'lucide-react';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

const CATEGORIES = [
  {
    id: 'cx',
    ar: '1. تجربة العملاء',
    en: '1. Customer experience',
    items: [
      {
        key: 'ai_chatbot',
        icon: MessageCircle,
        ar: 'الدردشة الذكية',
        en: 'Smart chatbot',
        descAr: 'رد فوري على الاستفسارات وتوجيه للتواصل البشري',
        descEn: 'Instant Q&A with human handoff',
        endpoint: '/api/ai/chat',
      },
      {
        key: 'ai_sentiment',
        icon: Heart,
        ar: 'تحليل المشاعر',
        en: 'Sentiment analysis',
        descAr: 'تحليل نبرة المراجعات ووصف العقارات',
        descEn: 'Analyze review & listing tone',
        endpoint: '/api/ai/sentiment',
      },
    ],
  },
  {
    id: 'marketing',
    ar: '2. التسويق والاستهداف',
    en: '2. Marketing & targeting',
    items: [
      {
        key: 'ai_recommendations',
        icon: Sparkles,
        ar: 'التوصيات المخصصة',
        en: 'Personalized recommendations',
        descAr: 'عقارات مشابهة حسب السعر والموقع والنوع',
        descEn: 'Similar listings by price, location & type',
        endpoint: '/api/ai/recommendations',
      },
      {
        key: 'ai_ad_targeting',
        icon: Target,
        ar: 'استهداف الإعلانات',
        en: 'Ad targeting',
        descAr: 'اقتراح أفضل أماكن الظهور للحملات',
        descEn: 'Suggest best placements for campaigns',
        endpoint: '/api/ai/ad-targeting',
      },
    ],
  },
  {
    id: 'ops',
    ar: '3. الأتمتة والعمليات',
    en: '3. Automation & operations',
    items: [
      {
        key: 'ai_inventory',
        icon: Package,
        ar: 'توقع المخزون',
        en: 'Inventory forecast',
        descAr: 'تنبؤ الطلب وإعادة التوريد لإعلانات المنتجات',
        descEn: 'Demand & reorder hints for product ads',
        endpoint: '/api/ai/inventory-forecast',
      },
      {
        key: 'ai_fraud',
        icon: Shield,
        ar: 'كشف الاحتيال المالي',
        en: 'Payment fraud detection',
        descAr: 'تقييم مخاطر الدفع والحجز قبل الإتمام',
        descEn: 'Score payment & booking risk before completion',
        endpoint: '/api/ai/fraud-check',
      },
    ],
  },
  {
    id: 'seo',
    ar: '4. SEO والظهور الرقمي',
    en: '4. SEO & visibility',
    items: [
      {
        key: 'ai_seo',
        icon: Search,
        ar: 'كلمات SEO',
        en: 'SEO keywords',
        descAr: 'اقتراح كلمات مفتاحية وعناوين ووصف meta',
        descEn: 'Keywords, titles & meta descriptions',
        endpoint: '/api/ai/seo-keywords',
      },
    ],
  },
] as const;

export function AiHubTab({ isAr }: { isAr: boolean }) {
  const [llmReady, setLlmReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping', locale: isAr ? 'ar' : 'en' }),
    })
      .then((r) => r.json())
      .then((d) => setLlmReady(Boolean(d.llmConfigured) || d.engine === 'llm'))
      .catch(() => setLlmReady(false));
  }, [isAr]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#f5c97b]" />
          {tx(isAr, 'مركز الذكاء الاصطناعي', 'AI Hub')}
        </h2>
        <p className="text-sm text-[var(--admin-text-mute)] mt-1 max-w-3xl">
          {tx(
            isAr,
            'دمج AI لتحسين تجربة العملاء، التسويق، الأتمتة، وSEO. فعّل/عطّل كل ميزة من تبويب الميزات.',
            'AI for CX, marketing, automation & SEO. Toggle each capability from the Features tab.',
          )}
        </p>
      </div>

      <div
        className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
          llmReady
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-amber-500/30 bg-amber-500/10'
        }`}
      >
        {llmReady ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
        )}
        <div className="text-sm">
          <p className="font-semibold text-white">
            {llmReady === null
              ? tx(isAr, 'جارٍ فحص محرك LLM...', 'Checking LLM engine...')
              : llmReady
                ? tx(isAr, 'محرك LLM مفعّل (ZAI / OpenAI)', 'LLM engine active (ZAI / OpenAI)')
                : tx(isAr, 'وضع الخوارزميات المحلية (بدون مفتاح API)', 'Local heuristics mode (no API key)')}
          </p>
          <p className="text-xs text-[var(--admin-text-mute)] mt-0.5">
            {tx(
              isAr,
              'أضف ZAI_API_KEY أو OPENAI_API_KEY في .env لتفعيل الردود المتقدمة. بدون مفتاح تعمل الخوارزميات المحلية.',
              'Add ZAI_API_KEY or OPENAI_API_KEY in .env for advanced replies. Without a key, local heuristics still work.',
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
          <Users className="h-5 w-5 text-[#f5c97b] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">
              {tx(isAr, 'واجهة العملاء', 'Customer surface')}
            </p>
            <p className="text-xs text-[var(--admin-text-mute)] mt-1">
              {tx(
                isAr,
                'شات عائم + توصيات ومشاعر وSEO في صفحة العقار + فحص مخاطر عند الدفع.',
                'Floating chat + property insights (recs/sentiment/SEO) + checkout risk check.',
              )}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
          <Megaphone className="h-5 w-5 text-[#f5c97b] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">
              {tx(isAr, 'لوحة المعلن', 'Advertiser surface')}
            </p>
            <p className="text-xs text-[var(--admin-text-mute)] mt-1">
              {tx(
                isAr,
                'اقتراح أماكن الظهور، كلمات SEO، وتوقع المخزون لإعلانات المنتجات.',
                'Placement suggestions, SEO keywords, and inventory forecast for product ads.',
              )}
            </p>
          </div>
        </div>
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="space-y-3">
          <h3 className="text-sm font-semibold text-[#f5c97b]">{isAr ? cat.ar : cat.en}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cat.items.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.key}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#f5c97b]" />
                    <p className="font-semibold text-white">{isAr ? cap.ar : cap.en}</p>
                  </div>
                  <p className="text-xs text-[var(--admin-text-mute)]">
                    {isAr ? cap.descAr : cap.descEn}
                  </p>
                  <code className="block text-[10px] text-[var(--admin-text-faint)]">
                    {cap.endpoint}
                  </code>
                  <p className="text-[10px] text-emerald-300/80">feature: {cap.key}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
