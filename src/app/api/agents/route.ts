import { NextRequest, NextResponse } from 'next/server';
import { listAgentsFromFirestore } from '@/lib/firestore-platform';

// GET /api/agents - List agents with user info, company info, and property count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');

    const agents = await listAgentsFromFirestore(countryId);

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
