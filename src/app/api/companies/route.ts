import { NextRequest, NextResponse } from 'next/server';
import {
  createCompanyInFirestore,
  listCompaniesFromFirestore,
} from '@/lib/firestore-platform';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { listDemoCompanies, mergeMarketplaceCompanies } from '@/lib/demo-admin-data';
import { isFirestoreQuotaError } from '@/lib/firestore-read-cache';

/** GET /api/companies — List real-estate companies with agent counts */
export async function GET(request: NextRequest) {
  const countryId = new URL(request.url).searchParams.get('countryId');

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(listDemoCompanies(countryId));
  }

  try {
    const companies = await listCompaniesFromFirestore();
    let merged = mergeMarketplaceCompanies(companies, countryId);
    if (countryId) {
      merged = merged.filter((c) => !c.countryId || c.countryId === countryId);
    }
    return NextResponse.json(merged);
  } catch (error) {
    console.error('Error fetching companies:', error);
    // Any Firestore failure → demo companies so the page keeps working.
    return NextResponse.json(mergeMarketplaceCompanies([], countryId));
  }
}

/** POST /api/companies — Add a new company */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const company = await createCompanyInFirestore({
      name,
      email: typeof body.email === 'string' ? body.email.trim() : null,
      phone: typeof body.phone === 'string' ? body.phone.trim() : null,
      website: typeof body.website === 'string' ? body.website.trim() : null,
      description: typeof body.description === 'string' ? body.description.trim() : null,
      address: typeof body.address === 'string' ? body.address.trim() : null,
    });

    if (!company) {
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    const message = error instanceof Error ? error.message : 'Failed to create company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
