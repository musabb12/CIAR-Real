import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/admin/reviews — All property reviews (admin dashboard) */
export async function GET() {
  try {
    const reviews = await db.propertyReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        property: {
          select: { id: true, title: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
