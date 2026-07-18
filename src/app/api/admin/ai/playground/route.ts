import { NextRequest, NextResponse } from 'next/server';
import { requireAiAdmin } from '@/lib/require-admin';
import { completeChat } from '@/lib/ai/client';
import {
  appendAiUsageLog,
  readAiAdminSettings,
} from '@/lib/ai/store';
import {
  chatFallbackReply,
  analyzeSentimentHeuristic,
  seoKeywordsHeuristic,
  inventoryForecastHeuristic,
  fraudCheckHeuristic,
  adTargetingHeuristic,
} from '@/lib/ai/heuristics';
import { getAdvertiserAdSettings } from '@/lib/advertiser-ads-store';
import type { AiCapabilityKey } from '@/types/ai-admin';
import { AI_CAPABILITY_KEYS } from '@/lib/ai/settings';

export async function POST(request: NextRequest) {
  const admin = await requireAiAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  try {
    const body = await request.json();
    const capability = String(body.capability || 'ai_chatbot') as AiCapabilityKey;
    if (!AI_CAPABILITY_KEYS.includes(capability)) {
      return NextResponse.json({ error: 'Unknown capability' }, { status: 400 });
    }

    const settings = await readAiAdminSettings();
    const locale = body.locale === 'en' ? 'en' : 'ar';
    const input = String(body.input ?? '').trim() || (locale === 'ar' ? 'مرحبا' : 'Hello');
    let result: unknown;
    let engine: 'llm' | 'heuristic' = 'heuristic';

    switch (capability) {
      case 'ai_chatbot': {
        const llm = await completeChat(
          [
            {
              role: 'system',
              content:
                locale === 'ar'
                  ? settings.safety.systemPromptAr
                  : settings.safety.systemPromptEn,
            },
            { role: 'user', content: input.slice(0, settings.provider.maxInputChars) },
          ],
          { settings },
        );
        if (llm) {
          engine = 'llm';
          result = { reply: llm };
        } else {
          result = { reply: chatFallbackReply(input, locale === 'ar') };
        }
        break;
      }
      case 'ai_sentiment':
        result = analyzeSentimentHeuristic(input);
        break;
      case 'ai_seo':
        result = seoKeywordsHeuristic({
          title: input,
          description: String(body.description ?? ''),
          category: String(body.propertyType ?? body.category ?? 'APARTMENT'),
          city: String(body.city ?? ''),
          locale: locale === 'ar' ? 'ar' : 'en',
        });
        break;
      case 'ai_inventory':
        result = inventoryForecastHeuristic({
          stockRemaining: Number(body.stock ?? body.stockRemaining ?? 10),
          views: Number(body.clicks ?? body.views ?? 50),
          discountPercent: Number(body.discountPercent ?? 0),
        });
        break;
      case 'ai_fraud':
        result = fraudCheckHeuristic({
          amount: Number(body.amount ?? 1000),
          paymentMethod: String(body.paymentMethod ?? 'card'),
          customerEmail: String(body.email ?? admin.user.email),
        });
        break;
      case 'ai_ad_targeting': {
        const adSettings = getAdvertiserAdSettings();
        result = adTargetingHeuristic({
          category: String(body.category ?? 'clothing'),
          placements: adSettings.placements.map((p) => ({
            id: p.id,
            pricePerDay: p.pricePerDay,
            enabled: p.enabled,
            labelAr: p.labelAr,
            labelEn: p.labelEn,
          })),
        });
        break;
      }
      case 'ai_recommendations':
        result = {
          note:
            locale === 'ar'
              ? 'اختبر التوصيات من صفحة العقار؛ المختبر يعيد تأكيداً فقط.'
              : 'Test recommendations from a property page; playground returns confirmation only.',
          ok: true,
        };
        break;
      default:
        result = { ok: true };
    }

    const latencyMs = Date.now() - started;
    await appendAiUsageLog({
      capability: 'playground',
      engine,
      success: true,
      latencyMs,
      estimatedTokens: Math.ceil(input.length / 4),
      estimatedCostUsd: engine === 'llm' ? 0.0002 : 0,
      errorCode: null,
      preview: input.slice(0, 80),
      actorId: admin.user.id,
      actorRole: admin.user.role,
    });

    return NextResponse.json({ capability, engine, latencyMs, result });
  } catch (error) {
    console.error('AI playground error:', error);
    return NextResponse.json({ error: 'Playground request failed' }, { status: 500 });
  }
}
