import { NextRequest, NextResponse } from 'next/server';
import { fraudCheckHeuristic } from '@/lib/ai/heuristics';
import {
  gateAiCapability,
  logAiCall,
  runLlmIfAllowed,
} from '@/lib/ai/runtime';

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const body = await request.json();
    const gate = await gateAiCapability(
      request,
      'ai_fraud',
      String(body.customerEmail ?? body.paymentMethod ?? 'checkout'),
    );
    if (!gate.ok) return gate.response;
    const { ctx } = gate;

    const heuristic = fraudCheckHeuristic({
      amount: Number(body.amount) || 0,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerName: body.customerName,
      paymentMethod: body.paymentMethod,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      isPurchase: Boolean(body.isPurchase),
    });

    const { reply: raw } = await runLlmIfAllowed(
      ctx,
      [
        {
          role: 'system',
          content:
            'You are a payment fraud analyst. Reply ONLY valid JSON: {"riskScore":0-100,"level":"low|medium|high","flags":string[],"allowProceed":boolean,"summaryAr":"...","summaryEn":"..."}',
        },
        {
          role: 'user',
          content: JSON.stringify({
            amount: body.amount,
            customerEmail: body.customerEmail,
            customerPhone: body.customerPhone,
            customerName: body.customerName,
            paymentMethod: body.paymentMethod,
            checkIn: body.checkIn,
            checkOut: body.checkOut,
            isPurchase: body.isPurchase,
            heuristic,
          }),
        },
      ],
      { temperature: 0.1 },
    );

    const latencyMs = Date.now() - started;

    if (raw) {
      try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as Partial<typeof heuristic>;
        await logAiCall({
          request,
          capability: 'ai_fraud',
          engine: 'llm',
          success: true,
          latencyMs,
        });
        return NextResponse.json({
          riskScore: Number(parsed.riskScore ?? heuristic.riskScore),
          level: parsed.level ?? heuristic.level,
          flags: Array.isArray(parsed.flags) ? parsed.flags.map(String) : heuristic.flags,
          allowProceed:
            typeof parsed.allowProceed === 'boolean' ? parsed.allowProceed : heuristic.allowProceed,
          summaryAr: parsed.summaryAr ?? heuristic.summaryAr,
          summaryEn: parsed.summaryEn ?? heuristic.summaryEn,
          engine: 'llm' as const,
        });
      } catch {
        // fall through
      }
    }

    await logAiCall({
      request,
      capability: 'ai_fraud',
      engine: 'heuristic',
      success: true,
      latencyMs,
    });
    return NextResponse.json(heuristic);
  } catch (error) {
    console.error('AI fraud-check error:', error);
    return NextResponse.json({ error: 'Fraud check failed' }, { status: 500 });
  }
}
