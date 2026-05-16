import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import { createTransactionInFirestore } from '@/lib/firestore-transactions';
import { getPropertyFromFirestore } from '@/lib/firestore-properties';
import type { TransactionType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyId,
      type,
      customerName,
      customerEmail,
      customerPhone,
      checkIn,
      checkOut,
      notes,
      paymentMethod,
    } = body;

    if (!propertyId || typeof propertyId !== 'string') {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    }

    const txnType = String(type || '').toUpperCase() as TransactionType;
    if (!['PURCHASE', 'RENT', 'SHORT_TERM_RENT'].includes(txnType)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: 'Customer name and email are required' }, { status: 400 });
    }

    const property = await getPropertyFromFirestore(propertyId, true);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const sessionUser = await getSessionUser(request);

    const transaction = await createTransactionInFirestore({
      propertyId,
      userId: sessionUser?.id ?? null,
      type: txnType,
      amount: property.price,
      currencySymbol: property.country?.currencySymbol ?? null,
      customerName: String(customerName),
      customerEmail: String(customerEmail),
      customerPhone: customerPhone ? String(customerPhone) : null,
      checkIn: checkIn ? String(checkIn) : null,
      checkOut: checkOut ? String(checkOut) : null,
      notes: notes ? String(notes) : null,
      paymentMethod: paymentMethod ? String(paymentMethod) : null,
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
