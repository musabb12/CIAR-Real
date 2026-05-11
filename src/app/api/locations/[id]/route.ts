import { NextRequest, NextResponse } from 'next/server';
import {
  deleteCountryInFirestore,
  updateCountryInFirestore,
} from '@/lib/firestore-platform';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateCountryInFirestore(id, {
      name: body?.name,
      code: body?.code ? String(body.code).toUpperCase() : undefined,
      flag: body?.flag,
      currency: body?.currency,
      isActive: typeof body?.isActive === 'boolean' ? body.isActive : undefined,
      isFeatured: typeof body?.isFeatured === 'boolean' ? body.isFeatured : undefined,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating country:', error);
    return NextResponse.json({ error: 'Failed to update country' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteCountryInFirestore(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting country:', error);
    return NextResponse.json({ error: 'Failed to delete country' }, { status: 500 });
  }
}
