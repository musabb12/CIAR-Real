import { NextRequest, NextResponse } from 'next/server';
import { isPartnerRole } from '@/lib/auth-roles';
import { getSessionUser } from '@/lib/auth-session';
import {
  createPropertyInFirestore,
  deletePropertyInFirestore,
  getPropertyFromFirestore,
  listAllPropertiesFromFirestore,
  updatePropertyInFirestore,
} from '@/lib/firestore-properties';
import {
  createPartnerProfileForUser,
  getPartnerAgentIdForUser,
} from '@/lib/firestore-platform';

async function requirePartner(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user || !isPartnerRole(user.role)) {
    return null;
  }

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

function partnerErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function partnerErrorStatus(message: string): number {
  if (/not found/i.test(message)) return 400;
  if (/required/i.test(message)) return 400;
  return 500;
}

export async function GET(request: NextRequest) {
  const partner = await requirePartner(request);
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const all = await listAllPropertiesFromFirestore();
  const data = all.filter((p) => p.agentId === partner.agentId);
  return NextResponse.json({ data, agentId: partner.agentId });
}

export async function POST(request: NextRequest) {
  const partner = await requirePartner(request);
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = String(body?.title ?? '').trim();
    const countryId = String(body?.countryId ?? '').trim();
    const regionId = String(body?.regionId ?? '').trim();
    const cityId = String(body?.cityId ?? '').trim();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!countryId || !regionId || !cityId) {
      return NextResponse.json(
        { error: 'Country, region, and city are required' },
        { status: 400 },
      );
    }

    const property = await createPropertyInFirestore({
      title,
      description: String(body?.description ?? ''),
      price: body.price,
      listingType: body.listingType,
      propertyType: body.propertyType,
      area: body.area,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      floors: body.floors,
      yearBuilt: body.yearBuilt,
      status: body.status,
      countryId,
      regionId,
      cityId,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      agentId: partner.agentId,
      images: body.images,
      amenityIds: body.amenityIds,
      isFeatured: Boolean(body?.isFeatured),
    });
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Partner create property:', error);
    const message = partnerErrorMessage(error, 'Failed to create property');
    return NextResponse.json({ error: message }, { status: partnerErrorStatus(message) });
  }
}

export async function PUT(request: NextRequest) {
  const partner = await requirePartner(request);
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body?.id ?? '');
    if (!id) {
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 });
    }

    const existing = await getPropertyFromFirestore(id, true);
    if (!existing || existing.agentId !== partner.agentId) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const updated = await updatePropertyInFirestore(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Partner update property:', error);
    const message = partnerErrorMessage(error, 'Failed to update property');
    return NextResponse.json({ error: message }, { status: partnerErrorStatus(message) });
  }
}

export async function DELETE(request: NextRequest) {
  const partner = await requirePartner(request);
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const existing = await getPropertyFromFirestore(id, true);
  if (!existing || existing.agentId !== partner.agentId) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  await deletePropertyInFirestore(id);
  return NextResponse.json({ ok: true });
}
