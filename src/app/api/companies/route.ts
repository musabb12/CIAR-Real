import { NextResponse } from 'next/server';
import { listCompaniesFromFirestore } from '@/lib/firestore-platform';

/** GET /api/companies — List real-estate companies with agent counts */
export async function GET() {
  try {
    const companies = await listCompaniesFromFirestore();
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
