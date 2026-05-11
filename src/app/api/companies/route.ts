import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/companies — List real-estate companies with agent counts */
export async function GET() {
  try {
    const companies = await db.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { agents: true } },
      },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
