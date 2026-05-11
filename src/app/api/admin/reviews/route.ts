import { NextResponse } from 'next/server';
import { listReviewsForAdminFromFirestore } from '@/lib/firestore-platform';

/** GET /api/admin/reviews — All property reviews (admin dashboard) */
export async function GET() {
  try {
    const reviews = await listReviewsForAdminFromFirestore();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
