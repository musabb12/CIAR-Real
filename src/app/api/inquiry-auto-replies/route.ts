import { NextRequest, NextResponse } from 'next/server';
import {
  createInquiryAutoReplyInFirestore,
  listInquiryAutoRepliesFromFirestore,
} from '@/lib/firestore-platform';

export async function GET() {
  try {
    const templates = await listInquiryAutoRepliesFromFirestore();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching inquiry auto-replies:', error);
    return NextResponse.json({ error: 'Failed to fetch auto-replies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const replyBody = typeof body.body === 'string' ? body.body.trim() : '';

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!replyBody) {
      return NextResponse.json({ error: 'Reply text is required' }, { status: 400 });
    }

    const template = await createInquiryAutoReplyInFirestore({
      title,
      body: replyBody,
      isActive: body.isActive !== false,
      sendOnNewInquiry: body.sendOnNewInquiry === true,
      order: typeof body.order === 'number' ? body.order : Number(body.order) || 0,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating inquiry auto-reply:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create auto-reply' },
      { status: 500 }
    );
  }
}
