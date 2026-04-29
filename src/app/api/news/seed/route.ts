import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/news/seed - Seed initial news items
export async function GET() {
  try {
    const existing = await db.newsItem.count();
    if (existing > 0) {
      return NextResponse.json({ message: 'News items already exist', count: existing });
    }

    const newsItems = [
      { content: 'CIAR launches new AI-powered property valuation tool across 60 countries', type: 'promo', order: 0 },
      { content: 'Dubai real estate market records 15% growth in Q1 2025', type: 'info', order: 1 },
      { content: 'New luxury villa listings available in Riyadh and Jeddah', type: 'info', order: 2 },
      { content: 'CIAR now supports secure online payments via multiple methods', type: 'promo', order: 3 },
      { content: 'Morocco emerging as top investment destination for 2025', type: 'info', order: 4 },
    ];

    for (const item of newsItems) {
      await db.newsItem.create({ data: item });
    }

    return NextResponse.json({ message: `Seeded ${newsItems.length} news items` });
  } catch (error) {
    console.error('Error seeding news:', error);
    return NextResponse.json({ error: 'Failed to seed news' }, { status: 500 });
  }
}
