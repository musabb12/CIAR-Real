import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/amenities - List all amenities
export async function GET() {
  try {
    const amenities = await db.amenity.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(amenities);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}
