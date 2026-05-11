import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** DELETE /api/admin/favorites/[id] — Remove a favorite by its row id */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.favorite.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }
    await db.favorite.delete({ where: { id } });
    return NextResponse.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 });
  }
}
