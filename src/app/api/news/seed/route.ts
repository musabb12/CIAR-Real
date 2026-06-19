import { NextResponse } from 'next/server';
import { createNewsInFirestore, listNewsFromFirestore } from '@/lib/firestore-platform';
import { DEFAULT_NEWS_ITEMS } from '@/lib/firestore-defaults';

// GET /api/news/seed - Seed initial news items when collection is empty
export async function GET() {
  try {
    const cached = await listNewsFromFirestore(true);
    if (cached.length > 0) {
      return NextResponse.json({
        message: 'News items already exist',
        count: cached.length,
        items: cached,
      });
    }

    const existing = await listNewsFromFirestore(true, { skipCache: true });
    if (existing.length > 0) {
      return NextResponse.json({
        message: 'News items already exist',
        count: existing.length,
        items: existing,
      });
    }

    const created = [];
    for (const item of DEFAULT_NEWS_ITEMS) {
      const row = await createNewsInFirestore({
        content: item.content,
        type: item.type,
        order: item.order,
      });
      created.push(row);
    }

    return NextResponse.json({
      message: `Seeded ${created.length} news items`,
      count: created.length,
      items: created,
    });
  } catch (error) {
    console.error('Error seeding news:', error);
    return NextResponse.json({ error: 'Failed to seed news' }, { status: 500 });
  }
}
