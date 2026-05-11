import { NextRequest, NextResponse } from 'next/server';
import { deleteFavoriteByIdInFirestore } from '@/lib/firestore-platform';

/** DELETE /api/admin/favorites/[id] — Remove a favorite by its row id */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteFavoriteByIdInFirestore(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 });
  }
}
