import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/require-admin';
import {
  readSubscriptionSettings,
  saveSubscriptionSettings,
} from '@/lib/firestore-subscriptions';

export async function GET(request: NextRequest) {
  const admin = await requireAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await readSubscriptionSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Admin subscription settings GET:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const current = await readSubscriptionSettings();
    const merged = {
      ...current,
      ...body,
      plans: Array.isArray(body?.plans)
        ? body.plans.map((plan: Record<string, unknown>) => {
            const existing = current.plans.find((p) => p.id === plan.id);
            return { ...existing, ...plan };
          })
        : current.plans,
      paymentMethods: Array.isArray(body?.paymentMethods)
        ? body.paymentMethods.map((method: Record<string, unknown>) => {
            const existing = current.paymentMethods.find((m) => m.id === method.id);
            return { ...existing, ...method };
          })
        : current.paymentMethods,
    };
    const saved = await saveSubscriptionSettings(merged);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Admin subscription settings PATCH:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
