import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/admin/favorites — All favorites with user + property (admin dashboard) */
export async function GET() {
  try {
    const favorites = await db.favorite.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        property: {
          include: {
            country: { select: { name: true } },
            city: { select: { name: true } },
          },
        },
      },
    });
    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
