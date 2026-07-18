import { NextRequest, NextResponse } from 'next/server';
import {
  createBannerInFirestore,
  listBannersFromFirestore,
} from '@/lib/firestore-platform';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { listDemoBanners } from '@/lib/demo-admin-data';
import { isFirestoreQuotaError } from '@/lib/firestore-read-cache';

// GET /api/banners - List banners
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get('position');
  const isActive = searchParams.get('isActive');
  const filters = { position, isActive };

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(listDemoBanners(filters));
  }

  try {
    const banners = await listBannersFromFirestore(filters);
    if (banners.length === 0) {
      return NextResponse.json(listDemoBanners(filters));
    }
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    // Any Firestore failure → demo banners.
    return NextResponse.json(listDemoBanners(filters));
  }
}

// POST /api/banners - Create a new banner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, image, link, position, order, isActive } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    const banner = await createBannerInFirestore({
      title,
      subtitle: subtitle || null,
      image: image || null,
      link: link || null,
      position: position || 'home',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}
