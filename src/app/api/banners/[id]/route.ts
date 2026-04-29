import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/banners/[id] - Update a banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    const { title, subtitle, image, link, position, order, isActive } = body;

    const banner = await db.banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(image !== undefined && { image }),
        ...(link !== undefined && { link }),
        ...(position !== undefined && { position }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    );
  }
}

// DELETE /api/banners/[id] - Delete a banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    await db.banner.delete({ where: { id } });

    return NextResponse.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
