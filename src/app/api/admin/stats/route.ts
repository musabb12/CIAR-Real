import { NextResponse } from 'next/server';
import { getAdminStatsFromFirestore } from '@/lib/firestore-platform';

// GET /api/admin/stats - Return dashboard stats
export async function GET() {
  try {
    return NextResponse.json(await getAdminStatsFromFirestore());
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
