import { NextRequest, NextResponse } from 'next/server';
import { completeChat, isAiLlmConfigured } from '@/lib/ai/client';
import { chatFallbackReply } from '@/lib/ai/heuristics';

const SYSTEM_AR = `أنت مساعد ذكي لمنصة CIAR العقارية والتجارية.
ساعد المستخدم باختصار ووضوح بالعربية حول: البحث عن عقارات، الوكلاء، الإعلانات التجارية (ملابس وغيرها)، الاشتراكات، الدفع، سياسة الخصوصية.
لا تختلق أسعاراً دقيقة لعقارات غير معروفة. وجّه المستخدم لصفحات: البحث، الوكلاء، تواصل معنا، لوحة الشريك.`;

const SYSTEM_EN = `You are the smart assistant for the CIAR real-estate & marketplace platform.
Help briefly about: property search, agents, commercial ads (clothing etc.), subscriptions, payments, privacy.
Do not invent exact prices for unknown listings. Guide users to Search, Agents, Contact, Partner hub.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body.message ?? '').trim();
    const locale = body.locale === 'ar' ? 'ar' : 'en';
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const messages = [
      { role: 'system' as const, content: locale === 'ar' ? SYSTEM_AR : SYSTEM_EN },
      ...history
        .filter(
          (m: { role?: string; content?: string }) =>
            (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
        )
        .slice(-8)
        .map((m: { role: 'user' | 'assistant'; content: string }) => ({
          role: m.role,
          content: m.content.slice(0, 2000),
        })),
      { role: 'user' as const, content: message.slice(0, 2000) },
    ];

    const llmReply = await completeChat(messages);
    if (llmReply) {
      return NextResponse.json({
        reply: llmReply,
        engine: 'llm',
        llmConfigured: true,
      });
    }

    return NextResponse.json({
      reply: chatFallbackReply(message, locale === 'ar'),
      engine: 'heuristic',
      llmConfigured: isAiLlmConfigured(),
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'AI chat failed' }, { status: 500 });
  }
}
