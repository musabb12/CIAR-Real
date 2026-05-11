import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.country.update({
      where: { id },
      data: {
        name: body?.name,
        code: body?.code ? String(body.code).toUpperCase() : undefined,
        flag: body?.flag,
        currency: body?.currency,
        isActive: typeof body?.isActive === 'boolean' ? body.isActive : undefined,
        isFeatured: typeof body?.isFeatured === 'boolean' ? body.isFeatured : undefined,
      },
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
    const linkedProperties = await db.property.count({ where: { countryId: id } });

    if (linkedProperties > 0) {
      return NextResponse.json(
        {
          error:
            'This country still has properties assigned to it. Turn off the country instead of deleting it.',
        },
        { status: 400 },
      );
    }

    await db.country.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting country:', error);
    return NextResponse.json({ error: 'Failed to delete country' }, { status: 500 });
  }
}
