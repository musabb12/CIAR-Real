import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/news - Get all active news items
export async function GET() {
  try {
    const news = await db.newsItem.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST /api/news - Create a new news item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, link, type, order, isActive } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const news = await db.newsItem.create({
      data: {
        content: content.trim(),
        link: link || null,
        type: type || 'info',
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}

// PUT /api/news - Update a news item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const news = await db.newsItem.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content.trim() }),
        ...(data.link !== undefined && { link: data.link || null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
  }
}

// DELETE /api/news?id=xxx - Delete a news item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.newsItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
