export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
  label: SentimentLabel;
  score: number; // -1 .. 1
  summaryAr: string;
  summaryEn: string;
  engine: 'llm' | 'heuristic';
}

const POSITIVE = [
  'excellent', 'great', 'amazing', 'love', 'perfect', 'recommend', 'beautiful',
  'fantastic', 'wonderful', 'good', 'happy', 'satisfied', 'professional',
  'ممتاز', 'رائع', 'جميل', 'أنصح', 'مميز', 'احترافي', 'راضي', 'جيد', 'أفضل', 'شكرا',
];

const NEGATIVE = [
  'bad', 'poor', 'terrible', 'hate', 'worst', 'slow', 'scam', 'fraud', 'disappointed',
  'awful', 'dirty', 'broken', 'late', 'rude',
  'سيء', 'سيئ', 'فظيع', 'احتيال', 'خداع', 'بطيء', 'قذر', 'مشكلة', 'غالي', 'مخيب', 'لا أنصح',
];

export function analyzeSentimentHeuristic(text: string): SentimentResult {
  const lower = text.toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE) if (lower.includes(w)) pos += 1;
  for (const w of NEGATIVE) if (lower.includes(w)) neg += 1;
  const total = pos + neg || 1;
  const score = Math.max(-1, Math.min(1, (pos - neg) / total));
  const label: SentimentLabel =
    score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';
  return {
    label,
    score: Math.round(score * 100) / 100,
    summaryAr:
      label === 'positive'
        ? 'المراجعة إيجابية بشكل عام'
        : label === 'negative'
          ? 'المراجعة سلبية — يُفضّل المتابعة'
          : 'المراجعة محايدة',
    summaryEn:
      label === 'positive'
        ? 'Overall positive review'
        : label === 'negative'
          ? 'Negative review — follow up recommended'
          : 'Neutral review',
    engine: 'heuristic',
  };
}

export interface SeoKeywordResult {
  keywords: string[];
  titleSuggestions: string[];
  metaDescription: string;
  engine: 'llm' | 'heuristic';
}

export function seoKeywordsHeuristic(input: {
  title: string;
  description?: string;
  city?: string;
  country?: string;
  category?: string;
  locale?: string;
}): SeoKeywordResult {
  const isAr = input.locale === 'ar';
  const base = [
    input.title,
    input.city,
    input.country,
    input.category,
    isAr ? 'عقارات' : 'real estate',
    isAr ? 'للبيع' : 'for sale',
    isAr ? 'للايجار' : 'for rent',
  ]
    .filter(Boolean)
    .join(' ');

  const tokens = base
    .split(/[\s,|/\-_]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 2);

  const unique = [...new Set(tokens)].slice(0, 12);
  const city = input.city || (isAr ? 'مدينتك' : 'your city');
  const titleSuggestions = isAr
    ? [
        `${input.title} في ${city} | CIAR`,
        `أفضل ${input.category || 'عقارات'} — ${city}`,
        `${input.title} بسعر تنافسي في ${city}`,
      ]
    : [
        `${input.title} in ${city} | CIAR`,
        `Top ${input.category || 'listings'} — ${city}`,
        `${input.title} — competitive price in ${city}`,
      ];

  const metaDescription = isAr
    ? `اكتشف ${input.title} عبر CIAR. تصفح التفاصيل، تواصل مع المعلن، واحجز موعداً بسهولة في ${city}.`
    : `Discover ${input.title} on CIAR. Browse details, contact the advertiser, and book easily in ${city}.`;

  return {
    keywords: unique,
    titleSuggestions,
    metaDescription: metaDescription.slice(0, 160),
    engine: 'heuristic',
  };
}

export interface RecommendationItem {
  id: string;
  title: string;
  price: number;
  score: number;
  reasonAr: string;
  reasonEn: string;
}

export function recommendPropertiesHeuristic(
  seed: {
    price: number;
    bedrooms?: number | null;
    propertyType?: string;
    cityId?: string;
    countryId?: string;
  },
  catalog: Array<{
    id: string;
    title: string;
    price: number;
    bedrooms?: number | null;
    propertyType?: string;
    cityId?: string;
    countryId?: string;
  }>,
  limit = 6,
): RecommendationItem[] {
  return catalog
    .filter((p) => p.id)
    .map((p) => {
      let score = 0;
      const priceDelta = Math.abs(p.price - seed.price) / Math.max(seed.price, 1);
      score += Math.max(0, 40 - priceDelta * 40);
      if (seed.propertyType && p.propertyType === seed.propertyType) score += 25;
      if (seed.cityId && p.cityId === seed.cityId) score += 20;
      if (seed.countryId && p.countryId === seed.countryId) score += 10;
      if (
        seed.bedrooms != null &&
        p.bedrooms != null &&
        Math.abs(seed.bedrooms - p.bedrooms) <= 1
      ) {
        score += 15;
      }
      return {
        id: p.id,
        title: p.title,
        price: p.price,
        score: Math.round(score),
        reasonAr:
          score >= 60
            ? 'تطابق قوي في السعر والموقع والنوع'
            : 'خيارات مشابهة ضمن نطاقك',
        reasonEn:
          score >= 60
            ? 'Strong match on price, location & type'
            : 'Similar options in your range',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface InventoryForecast {
  stockRemaining: number;
  daysOfCover: number;
  demandLevel: 'low' | 'medium' | 'high';
  reorderSuggested: boolean;
  suggestionAr: string;
  suggestionEn: string;
  engine: 'llm' | 'heuristic';
}

export function inventoryForecastHeuristic(input: {
  stockRemaining: number;
  views?: number;
  discountPercent?: number;
  placementId?: string;
  durationDays?: number;
}): InventoryForecast {
  const stock = Math.max(0, Number(input.stockRemaining) || 0);
  const views = Math.max(0, Number(input.views) || 0);
  const discount = Math.max(0, Number(input.discountPercent) || 0);
  const dailyDemand = Math.max(0.5, views / Math.max(input.durationDays || 14, 1) + discount / 20);
  const daysOfCover = stock <= 0 ? 0 : Math.round((stock / dailyDemand) * 10) / 10;
  const demandLevel: InventoryForecast['demandLevel'] =
    dailyDemand >= 4 ? 'high' : dailyDemand >= 1.5 ? 'medium' : 'low';
  const reorderSuggested = daysOfCover < 7 || stock < 10;

  return {
    stockRemaining: stock,
    daysOfCover,
    demandLevel,
    reorderSuggested,
    suggestionAr: reorderSuggested
      ? `الطلب ${demandLevel === 'high' ? 'مرتفع' : demandLevel === 'medium' ? 'متوسط' : 'منخفض'} — غطّي المخزون (~${daysOfCover} يوم تغطية).`
      : `المخزون كافٍ حالياً (~${daysOfCover} يوم تغطية) مع طلب ${demandLevel === 'high' ? 'مرتفع' : demandLevel === 'medium' ? 'متوسط' : 'منخفض'}.`,
    suggestionEn: reorderSuggested
      ? `Demand is ${demandLevel} — restock soon (~${daysOfCover} days of cover).`
      : `Stock looks healthy (~${daysOfCover} days of cover) with ${demandLevel} demand.`,
    engine: 'heuristic',
  };
}

export interface FraudCheckResult {
  riskScore: number;
  level: 'low' | 'medium' | 'high';
  flags: string[];
  allowProceed: boolean;
  summaryAr: string;
  summaryEn: string;
  engine: 'llm' | 'heuristic';
}

/** Lightweight payment / booking fraud heuristics (demo-safe). */
export function fraudCheckHeuristic(input: {
  amount: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  paymentMethod?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  isPurchase?: boolean;
}): FraudCheckResult {
  const flags: string[] = [];
  let risk = 0;

  const email = (input.customerEmail ?? '').trim().toLowerCase();
  const phone = (input.customerPhone ?? '').replace(/[^\d+]/g, '');
  const name = (input.customerName ?? '').trim();
  const amount = Number(input.amount) || 0;

  if (!email || !email.includes('@') || email.endsWith('.test') || email.includes('tempmail')) {
    risk += 35;
    flags.push('suspicious_email');
  }
  if (phone && phone.replace(/\D/g, '').length < 8) {
    risk += 20;
    flags.push('invalid_phone');
  }
  if (!name || name.length < 2) {
    risk += 15;
    flags.push('weak_name');
  }
  if (amount <= 0) {
    risk += 40;
    flags.push('invalid_amount');
  } else if (amount > 5_000_000) {
    risk += 25;
    flags.push('unusually_high_amount');
  }

  if (!input.isPurchase && input.checkIn && input.checkOut) {
    const start = new Date(input.checkIn).getTime();
    const end = new Date(input.checkOut).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      risk += 30;
      flags.push('invalid_dates');
    } else if (end - start > 365 * 86400000) {
      risk += 15;
      flags.push('extreme_stay_length');
    }
  }

  const method = (input.paymentMethod ?? '').toLowerCase();
  if (
    method &&
    !['visa', 'mastercard', 'paypal', 'apple_pay', 'google_pay', 'bank', 'cash'].some((m) =>
      method.includes(m),
    )
  ) {
    risk += 10;
    flags.push('uncommon_payment_method');
  }

  risk = Math.min(100, risk);
  const level: FraudCheckResult['level'] =
    risk >= 60 ? 'high' : risk >= 30 ? 'medium' : 'low';

  return {
    riskScore: risk,
    level,
    flags,
    allowProceed: level !== 'high',
    summaryAr:
      level === 'high'
        ? 'مخاطر عالية — يُفضّل التحقق اليدوي قبل إتمام الدفع'
        : level === 'medium'
          ? 'مخاطر متوسطة — راقب المعاملة'
          : 'مخاطر منخفضة — المعاملة تبدو طبيعية',
    summaryEn:
      level === 'high'
        ? 'High risk — manual review recommended before completing payment'
        : level === 'medium'
          ? 'Medium risk — monitor this transaction'
          : 'Low risk — transaction looks normal',
    engine: 'heuristic',
  };
}

export interface AdTargetingSuggestion {
  placementId: string;
  score: number;
  reasonAr: string;
  reasonEn: string;
}

export interface AdTargetingResult {
  suggestions: AdTargetingSuggestion[];
  campaignTipAr: string;
  campaignTipEn: string;
  engine: 'llm' | 'heuristic';
}

/** Suggest best ad placements for clothing / product campaigns. */
export function adTargetingHeuristic(input: {
  category?: string;
  budget?: number;
  durationDays?: number;
  hasVideo?: boolean;
  hasDiscount?: boolean;
  placements: Array<{
    id: string;
    pricePerDay: number;
    enabled: boolean;
    labelAr: string;
    labelEn: string;
  }>;
}): AdTargetingResult {
  const enabled = input.placements.filter((p) => p.enabled);
  const budget = Number(input.budget) || 0;
  const days = Math.max(1, Number(input.durationDays) || 14);

  const scored = enabled.map((p) => {
    let score = 40;
    const total = p.pricePerDay * days;
    if (budget > 0 && total <= budget) score += 25;
    else if (budget > 0 && total > budget * 1.4) score -= 20;

    if (p.id === 'home_hero_strip') score += input.hasVideo ? 20 : 10;
    if (p.id === 'home_featured_grid') score += 18;
    if (p.id === 'search_top') score += input.hasDiscount ? 16 : 8;
    if (p.id === 'search_sidebar') score += 6;
    if (p.id === 'property_detail_sidebar') score += 12;
    if (p.id === 'agents_page_banner') score += 5;

    if (input.category?.includes('cloth') || input.category === 'clothing') {
      if (p.id.includes('home') || p.id.includes('search')) score += 8;
    }

    return {
      placementId: p.id,
      score: Math.max(0, Math.round(score)),
      reasonAr:
        total <= budget || budget === 0
          ? `مناسب لميزانيتك (~$${Math.round(total)}) مع ظهور قوي`
          : `ظهور قوي لكن أعلى من الميزانية (~$${Math.round(total)})`,
      reasonEn:
        total <= budget || budget === 0
          ? `Fits your budget (~$${Math.round(total)}) with strong visibility`
          : `Strong visibility but above budget (~$${Math.round(total)})`,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    suggestions: scored.slice(0, 3),
    campaignTipAr: input.hasDiscount
      ? 'اعرض نسبة الحسم بوضوح في العنوان والصورة — يزيد النقرات على أماكن البحث والشبكة المميزة.'
      : 'أضف خصماً بسيطاً أو عرضاً محدود المدة لرفع معدل النقر، وفضّل الشبكة المميزة أو شريط الرئيسية.',
    campaignTipEn: input.hasDiscount
      ? 'Highlight the discount in the title and creative — it boosts clicks on search and featured placements.'
      : 'Add a small discount or limited-time offer to lift CTR; prefer featured grid or home strip.',
    engine: 'heuristic',
  };
}

/** Local FAQ-style assistant when no LLM key is configured */
export function chatFallbackReply(userMessage: string, isAr: boolean): string {
  const q = userMessage.toLowerCase();
  if (/سعر|price|cost|كم/.test(q)) {
    return isAr
      ? 'يمكنك تصفية العقارات حسب السعر من صفحة البحث، أو تغيير عملة العرض من الشريط العلوي. هل تريد مساعدة في نطاق سعري محدد؟'
      : 'You can filter properties by price on the Search page, or change the display currency from the header. Do you have a specific budget range?';
  }
  if (/وكيل|agent|تواصل|whatsapp|واتس/.test(q)) {
    return isAr
      ? 'كل عقار يعرض زر تواصل مع المعلن (واتساب/هاتف). يمكنك أيضاً زيارة صفحة الوكلاء أو «تواصل معنا».'
      : 'Each listing shows a contact button (WhatsApp/phone). You can also visit Agents or Contact us.';
  }
  if (/إعلان|ad|advertise|ملابس|clothes/.test(q)) {
    return isAr
      ? 'لنشر إعلان تجاري: ادخل لوحة الشريك ← إعلاناتي ← أنشئ إعلاناً، اختر مكان الظهور، ادفع، ثم نراجع ونوافق قبل النشر. بعد الموافقة يظهر في صفحة الإعلانات والمكان المختار.'
      : 'To publish a commercial ad: Partner hub → My ads → create an ad, pick placement, pay, then we review & approve. After approval it appears on the Ads page and your chosen placement.';
  }
  if (/اشتراك|subscription|partner|شريك/.test(q)) {
    return isAr
      ? 'اشتراكات الشركاء تفتح نشر العقارات ولوحة التحكم. من القائمة: لوحة الشريك ← الاشتراك.'
      : 'Partner subscriptions unlock listing publish & dashboard. Go to Partner hub → Subscription.';
  }
  if (/مفضلة|favorite|compare|مقارنة/.test(q)) {
    return isAr
      ? 'احفظ العقارات في المفضلة من بطاقة العقار، ثم راجعها من قائمة «المفضلة».'
      : 'Save listings from any property card, then open Favorites from the menu.';
  }
  if (/دفع|payment|checkout|حجز|book/.test(q)) {
    return isAr
      ? 'من صفحة العقار اختر شراء أو إيجار، أكمل بياناتك وطريقة الدفع. النظام يراجع المخاطر قبل الإتمام.'
      : 'From a property page choose Buy or Rent, fill your details and payment method. The system runs a risk check before completion.';
  }
  return isAr
    ? 'أنا مساعد CIAR. أستطيع المساعدة في البحث عن عقارات، الإعلانات التجارية، الاشتراكات، الدفع، أو توجيهك للتواصل البشري. بماذا أبدأ؟'
    : 'I am the CIAR assistant. I can help with property search, commercial ads, subscriptions, payments, or connect you to a human. How can I start?';
}
