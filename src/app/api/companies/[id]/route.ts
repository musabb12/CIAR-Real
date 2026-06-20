import { NextRequest, NextResponse } from 'next/server';
import {
  getCompanyDetailFromFirestore,
  updateCompanyInFirestore,
} from '@/lib/firestore-platform';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { getDemoCompanyById } from '@/lib/demo-admin-data';
import { isFirestoreQuotaError } from '@/lib/firestore-read-cache';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isFirebaseAdminConfigured()) {
    const demo = getDemoCompanyById(id);
    if (!demo) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json(demo);
  }

  try {
    const company = await getCompanyDetailFromFirestore(id);
    if (!company) {
      const demo = getDemoCompanyById(id);
      if (demo) return NextResponse.json(demo);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    const demo = getDemoCompanyById(id);
    if (demo) return NextResponse.json(demo);
    if (isFirestoreQuotaError(error)) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await getCompanyDetailFromFirestore(id);
    if (!existing) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = await updateCompanyInFirestore(id, body);
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}
