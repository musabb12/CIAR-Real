import { NextRequest, NextResponse } from 'next/server';
import { isPartnerRole } from '@/lib/auth-roles';
import { getSessionUser } from '@/lib/auth-session';
import {
  createPartnerProfileForUser,
  getAgentDetailFromFirestore,
  getPartnerAgentIdForUser,
  updateAgentInFirestore,
} from '@/lib/firestore-platform';
import { isValidWhatsAppNumber } from '@/lib/whatsapp';

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
    const agent = await getAgentDetailFromFirestore(partner.agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Partner profile GET:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const partner = await requirePartner(request);
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const whatsapp =
      typeof body?.whatsapp === 'string' ? body.whatsapp.trim() : undefined;
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : undefined;
    const title = typeof body?.title === 'string' ? body.title.trim() : undefined;
    const bio = typeof body?.bio === 'string' ? body.bio.trim() : undefined;

    if (whatsapp !== undefined && whatsapp && !isValidWhatsAppNumber(whatsapp)) {
      return NextResponse.json(
        { error: 'Enter a valid WhatsApp number with country code' },
        { status: 400 },
      );
    }

    const agent = await updateAgentInFirestore(partner.agentId, {
      ...(whatsapp !== undefined ? { whatsapp: whatsapp || null } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(title !== undefined ? { title: title || null } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Partner profile PATCH:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
