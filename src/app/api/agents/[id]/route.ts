import { NextRequest, NextResponse } from 'next/server';
import {
  deleteAgentInFirestore,
  getAgentDetailFromFirestore,
  updateAgentInFirestore,
} from '@/lib/firestore-platform';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { getDemoAgentById } from '@/lib/demo-admin-data';
import { listDemoProperties } from '@/lib/demo-properties';
import { listMarketplacePropertiesForAgent } from '@/lib/demo-marketplace';
import { isFirestoreQuotaError } from '@/lib/firestore-read-cache';

function demoAgentProperties(id: string) {
  const marketplaceProps = listMarketplacePropertiesForAgent(id);
  if (marketplaceProps.length > 0) return marketplaceProps;
  return listDemoProperties({ agentId: id, admin: true, limit: 80 }).data.filter((p) =>
    p.id.includes('-agent-'),
  );
}

// GET /api/agents/[id] - Single agent with user info, company, and their properties
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isFirebaseAdminConfigured()) {
    const demo = getDemoAgentById(id);
    if (!demo) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json({ ...demo, properties: demoAgentProperties(id) });
  }

  try {
    const agent = await getAgentDetailFromFirestore(id);

    if (!agent) {
      const demo = getDemoAgentById(id);
      if (demo) {
        return NextResponse.json({ ...demo, properties: demoAgentProperties(id) });
      }
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    const demo = getDemoAgentById(id);
    if (demo) {
      return NextResponse.json({ ...demo, properties: demoAgentProperties(id) });
    }
    if (isFirestoreQuotaError(error)) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

// PUT /api/agents/[id] — Update agent (verify, bio, title, license, ratings, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getAgentDetailFromFirestore(id);
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = await updateAgentInFirestore(id, body);

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

// DELETE /api/agents/[id] — Delete an agent (sets agentId of properties to null)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await getAgentDetailFromFirestore(id);
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await deleteAgentInFirestore(id);

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
