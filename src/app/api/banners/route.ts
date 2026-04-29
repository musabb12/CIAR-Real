import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/banners - List banners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (position) where.position = position;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const banners = await db.banner.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

// POST /api/banners - Create a new banner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, image, link, position, order, isActive } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    const banner = await db.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        image: image || null,
        link: link || null,
        position: position || 'home',
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}
