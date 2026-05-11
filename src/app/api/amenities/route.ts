import { NextResponse } from 'next/server';
import { listAmenitiesFromFirestore } from '@/lib/firestore-platform';

// GET /api/amenities - List all amenities
export async function GET() {
  try {
    const amenities = await listAmenitiesFromFirestore();

    return NextResponse.json(amenities);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}
