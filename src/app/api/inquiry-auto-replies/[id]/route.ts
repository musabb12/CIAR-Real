import { NextRequest, NextResponse } from 'next/server';
import {
  deleteInquiryAutoReplyInFirestore,
  updateInquiryAutoReplyInFirestore,
} from '@/lib/firestore-platform';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const template = await updateInquiryAutoReplyInFirestore(id, {
      ...(typeof body.title === 'string' ? { title: body.title.trim() } : {}),
      ...(typeof body.body === 'string' ? { body: body.body.trim() } : {}),
      ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
      ...(typeof body.sendOnNewInquiry === 'boolean' ? { sendOnNewInquiry: body.sendOnNewInquiry } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) || 0 } : {}),
    });

    if (!template) {
      return NextResponse.json({ error: 'Auto-reply not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating inquiry auto-reply:', error);
    return NextResponse.json({ error: 'Failed to update auto-reply' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const removed = await deleteInquiryAutoReplyInFirestore(id);

    if (!removed) {
      return NextResponse.json({ error: 'Auto-reply not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting inquiry auto-reply:', error);
    return NextResponse.json({ error: 'Failed to delete auto-reply' }, { status: 500 });
  }
}
