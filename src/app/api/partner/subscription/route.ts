import { NextRequest, NextResponse } from 'next/server';
import { isPartnerRole } from '@/lib/auth-roles';
import { getSessionUser } from '@/lib/auth-session';
import {
  createPartnerProfileForUser,
  getPartnerAgentIdForUser,
} from '@/lib/firestore-platform';
import {
  activatePartnerSubscription,
  partnerCanPublishListings,
  readSubscriptionSettings,
  toSubscriptionView,
} from '@/lib/firestore-subscriptions';
import type { SubscriptionPlanId } from '@/types/subscription';

async function requirePartner(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user || !isPartnerRole(user.role)) return null;

  let agentId = await getPartnerAgentIdForUser(user.id);
  if (!agentId) {
    await createPartnerProfileForUser({
      userId: user.id,
      role: user.role,
      name: user.name?.trim() || user.email,
      phone: user.phone,
    });
    agentId = await getPartnerAgentIdForUser(user.id);
  }
  if (!agentId) return null;
  return { user, agentId };
}

export async function GET(request: NextRequest) {
  const partner = await requirePartner(request);
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { allowed, settings, subscription } = await partnerCanPublishListings(
      partner.agentId,
    );
    const view = toSubscriptionView(subscription, settings, {
      partnerName: partner.user.name ?? undefined,
      partnerEmail: partner.user.email,
      partnerRole: partner.user.role,
    });

    return NextResponse.json({
      ...view,
      agentId: partner.agentId,
      canPublish: allowed,
      settings,
    });
  } catch (error) {
    console.error('Partner subscription GET:', error);
    return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const partner = await requirePartner(request);
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const planId = String(body?.planId ?? '').trim() as SubscriptionPlanId;
    const paymentMethod = String(body?.paymentMethod ?? '').trim();

    if (!planId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Plan and payment method are required' },
        { status: 400 },
      );
    }

    const settings = await readSubscriptionSettings();
    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Subscriptions are currently disabled' },
        { status: 400 },
      );
    }

    const subscription = await activatePartnerSubscription({
      agentId: partner.agentId,
      userId: partner.user.id,
      planId,
      paymentMethod,
    });

    const view = toSubscriptionView(subscription, settings, {
      partnerName: partner.user.name ?? undefined,
      partnerEmail: partner.user.email,
      partnerRole: partner.user.role,
    });

    return NextResponse.json({
      ...view,
      agentId: partner.agentId,
      canPublish: true,
      settings,
    });
  } catch (error) {
    console.error('Partner subscription POST:', error);
    const message = error instanceof Error ? error.message : 'Failed to subscribe';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
