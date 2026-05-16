import {
  FIRESTORE_COLLECTIONS,
  asNullableString,
  asNumber,
  asString,
  cleanUndefined,
  col,
  makeId,
  nowIso,
  toIso,
} from '@/lib/firestore-shared';
import { getPropertyFromFirestore } from '@/lib/firestore-properties';
import type { Transaction, TransactionStatus, TransactionType } from '@/types';

function transactionCollection() {
  return col(FIRESTORE_COLLECTIONS.transactions);
}

function docToTransaction(id: string, raw: Record<string, unknown>): Transaction {
  return {
    id,
    propertyId: asString(raw.propertyId),
    userId: asNullableString(raw.userId),
    type: asString(raw.type) as TransactionType,
    status: asString(raw.status, 'PENDING') as TransactionStatus,
    amount: asNumber(raw.amount, 0),
    currencySymbol: asNullableString(raw.currencySymbol),
    customerName: asString(raw.customerName),
    customerEmail: asString(raw.customerEmail),
    customerPhone: asNullableString(raw.customerPhone),
    checkIn: asNullableString(raw.checkIn),
    checkOut: asNullableString(raw.checkOut),
    notes: asNullableString(raw.notes),
    paymentMethod: asNullableString(raw.paymentMethod),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export async function createTransactionInFirestore(input: {
  propertyId: string;
  userId?: string | null;
  type: TransactionType;
  amount: number;
  currencySymbol?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string | null;
  paymentMethod?: string | null;
}): Promise<Transaction | null> {
  const property = await getPropertyFromFirestore(input.propertyId, true);
  if (!property) return null;

  const id = makeId('txn');
  const payload = {
    id,
    propertyId: input.propertyId,
    userId: input.userId ?? null,
    type: input.type,
    status: 'PENDING' as TransactionStatus,
    amount: input.amount,
    currencySymbol: input.currencySymbol ?? property.country?.currencySymbol ?? null,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerPhone: input.customerPhone?.trim() || null,
    checkIn: input.checkIn ?? null,
    checkOut: input.checkOut ?? null,
    notes: input.notes?.trim() || null,
    paymentMethod: input.paymentMethod?.trim() || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await transactionCollection().doc(id).set(payload);
  return { ...docToTransaction(id, payload), property };
}

export async function getTransactionFromFirestore(id: string): Promise<Transaction | null> {
  const snap = await transactionCollection().doc(id).get();
  if (!snap.exists) return null;
  const txn = docToTransaction(snap.id, snap.data() as Record<string, unknown>);
  const property = await getPropertyFromFirestore(txn.propertyId, true);
  return { ...txn, property: property ?? undefined };
}

export async function completeTransactionInFirestore(
  id: string,
  status: TransactionStatus = 'PAID',
): Promise<Transaction | null> {
  const snap = await transactionCollection().doc(id).get();
  if (!snap.exists) return null;

  await transactionCollection().doc(id).update(
    cleanUndefined({
      status,
      updatedAt: nowIso(),
    }),
  );

  return getTransactionFromFirestore(id);
}
