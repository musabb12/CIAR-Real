import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/require-admin';
import { listAgentsFromFirestore } from '@/lib/firestore-platform';
import {
  listPartnerSubscriptions,
  readSubscriptionSettings,
  toSubscriptionView,
} from '@/lib/firestore-subscriptions';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { listDemoAgents } from '@/lib/demo-admin-data';

export async function GET(request: NextRequest) {
  const admin = await requireAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await readSubscriptionSettings();
    const subscriptions = await listPartnerSubscriptions();
    const subMap = new Map(subscriptions.map((sub) => [sub.agentId, sub]));

    let agents: Array<{
      id: string;
      userId?: string;
      user?: { name?: string; email?: string; role?: string };
    }> = [];

    if (isFirebaseAdminConfigured()) {
      const rows = await listAgentsFromFirestore(null, { skipCache: true });
      agents = rows.map((agent) => ({
        id: agent.id,
        userId: agent.userId,
        user: agent.user
          ? {
              name: agent.user.name,
              email: agent.user.email,
              role: agent.user.role,
            }
          : undefined,
      }));
    } else {
      agents = listDemoAgents(null).map((agent) => ({
        id: agent.id,
        userId: agent.userId,
        user: agent.user
          ? {
              name: agent.user.name,
              email: agent.user.email,
              role: agent.user.role,
            }
          : undefined,
      }));
    }

    const partners = agents.map((agent) => {
      const subscription = subMap.get(agent.id) ?? null;
      const view = toSubscriptionView(subscription, settings, {
        partnerName: agent.user?.name,
        partnerEmail: agent.user?.email,
        partnerRole: agent.user?.role,
      });
      return {
        ...view,
        id: subscription?.id || agent.id,
        agentId: agent.id,
        userId: subscription?.userId || agent.userId || '',
      };
    });

    return NextResponse.json({ settings, partners });
  } catch (error) {
    console.error('Admin subscriptions partners GET:', error);
    return NextResponse.json({ error: 'Failed to load partners' }, { status: 500 });
  }
}
