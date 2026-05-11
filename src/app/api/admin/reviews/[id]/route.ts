import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/admin/reviews/[id] — Approve/hide/verify a property review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.propertyReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
    if (typeof body.isVerified === 'boolean') updateData.isVerified = body.isVerified;
    if (typeof body.rating === 'number') updateData.rating = body.rating;
    if (typeof body.title === 'string' || body.title === null) updateData.title = body.title;
    if (typeof body.comment === 'string' || body.comment === null) updateData.comment = body.comment;

    const review = await db.propertyReview.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE /api/admin/reviews/[id] — Permanently delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.propertyReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    await db.propertyReview.delete({ where: { id } });
    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
