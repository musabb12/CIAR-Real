import { NextResponse } from 'next/server';
import { createNewsInFirestore, listNewsFromFirestore } from '@/lib/firestore-platform';
import { DEFAULT_NEWS_ITEMS } from '@/lib/firestore-defaults';

// GET /api/news/seed - Seed initial news items
export async function GET() {
  try {
    const existing = await listNewsFromFirestore(true);
    if (existing.length > 0) {
      return NextResponse.json({
        message: 'News items already exist',
        count: existing.length,
      });
    }

    for (const item of DEFAULT_NEWS_ITEMS) {
      await createNewsInFirestore({
        content: item.content,
        type: item.type,
        order: item.order,
      });
    }

    return NextResponse.json({
      message: `Seeded ${DEFAULT_NEWS_ITEMS.length} news items`,
    });
  } catch (error) {
    console.error('Error seeding news:', error);
    return NextResponse.json({ error: 'Failed to seed news' }, { status: 500 });
  }
}
