import { NextRequest, NextResponse } from 'next/server';
import { replyToInquiryInFirestore } from '@/lib/firestore-platform';

/** POST /api/inquiries/[id]/reply — Save admin reply and mark inquiry as replied */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const adminReply = typeof body.adminReply === 'string' ? body.adminReply.trim() : '';

    if (!adminReply) {
      return NextResponse.json({ error: 'Reply message is required' }, { status: 400 });
    }

    const inquiry = await replyToInquiryInFirestore(id, {
      adminReply,
      replySource: 'manual',
      autoReplyTemplateId:
        typeof body.templateId === 'string' && body.templateId.trim() ? body.templateId.trim() : null,
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Error replying to inquiry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reply' },
      { status: 500 }
    );
  }
}
