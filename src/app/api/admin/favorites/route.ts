import { NextResponse } from 'next/server';
import { listAllFavoritesForAdmin } from '@/lib/firestore-platform';

/** GET /api/admin/favorites — All favorites with user + property (admin dashboard) */
export async function GET() {
  try {
    const favorites = await listAllFavoritesForAdmin();
    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
