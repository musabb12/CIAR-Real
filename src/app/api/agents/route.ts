import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  createAgentWithUserInFirestore,
  listAgentsFromFirestore,
} from '@/lib/firestore-platform';
import { isFirestoreQuotaError } from '@/lib/firestore-read-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const fresh = searchParams.get('fresh') === '1';
    const agents = await listAgentsFromFirestore(countryId, { skipCache: fresh });
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    if (isFirestoreQuotaError(error)) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

/** POST /api/agents — Create agent account + profile */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const license = typeof body.license === 'string' ? body.license.trim() : '';
    const companyId =
      typeof body.companyId === 'string' && body.companyId.trim() ? body.companyId.trim() : null;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const agent = await createAgentWithUserInFirestore({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      title: title || null,
      license: license || null,
      companyId,
    });

    if (!agent) {
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    const message = error instanceof Error ? error.message : 'Failed to create agent';
    if (message.includes('already exists')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
