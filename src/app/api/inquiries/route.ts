import { NextRequest, NextResponse } from 'next/server';
import {
  createInquiryInFirestore,
  listInquiriesFromFirestore,
} from '@/lib/firestore-platform';

// GET /api/inquiries - List inquiries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    const inquiries = await listInquiriesFromFirestore({
      propertyId,
      status,
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

// POST /api/inquiries - Create a new inquiry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, userId, name, email, phone, message } = body;

    if (!propertyId || !name || !email || !message) {
      return NextResponse.json(
        { error: 'propertyId, name, email, and message are required' },
        { status: 400 }
      );
    }

    const inquiry = await createInquiryInFirestore({
      propertyId,
      userId: userId || null,
      name,
      email,
      phone: phone || null,
      message,
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create inquiry' },
      { status: error instanceof Error && /not found/i.test(error.message) ? 404 : 500 }
    );
  }
}
