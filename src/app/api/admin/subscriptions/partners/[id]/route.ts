import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/require-admin';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { listDemoAgents } from '@/lib/demo-admin-data';
import { getAgentDetailFromFirestore } from '@/lib/firestore-platform';
import {
  readSubscriptionSettings,
  setPartnerSubscriptionExempt,
  toSubscriptionView,
} from '@/lib/firestore-subscriptions';

type RouteContext = { params: Promise<{ id: string }> };

async function resolveAgent(agentId: string) {
  if (isFirebaseAdminConfigured()) {
    return getAgentDetailFromFirestore(agentId);
  }
  const demo = listDemoAgents(null).find((agent) => agent.id === agentId);
  return demo ?? null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await requireAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: agentId } = await context.params;
  if (!agentId) {
    return NextResponse.json({ error: 'Agent id is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const exempt = Boolean(body?.exempt);
    const exemptNote =
      typeof body?.exemptNote === 'string' ? body.exemptNote.trim() : null;

    const agent = await resolveAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const subscription = await setPartnerSubscriptionExempt({
      agentId,
      userId: agent.userId,
      exempt,
      exemptNote,
      grantedBy: admin.id,
    });

    const settings = await readSubscriptionSettings();
    const view = toSubscriptionView(subscription, settings, {
      partnerName: agent.user?.name,
      partnerEmail: agent.user?.email,
      partnerRole: agent.user?.role,
    });

    return NextResponse.json(view);
  } catch (error) {
    console.error('Admin partner subscription PATCH:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
