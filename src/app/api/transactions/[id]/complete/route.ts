import { NextRequest, NextResponse } from 'next/server';
import { completeTransactionInFirestore, getTransactionFromFirestore } from '@/lib/firestore-transactions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body?.status === 'FAILED' ? 'FAILED' : 'PAID';

    const existing = await getTransactionFromFirestore(id);
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updated = await completeTransactionInFirestore(id, status);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error completing transaction:', error);
    return NextResponse.json({ error: 'Failed to complete payment' }, { status: 500 });
  }
}
