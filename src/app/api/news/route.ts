import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseAdminConfigError,
  isFirebaseAdminConfigured,
} from '@/lib/firebase-admin';
import {
  createNewsInFirestore,
  deleteNewsInFirestore,
  listNewsFromFirestore,
  updateNewsInFirestore,
} from '@/lib/firestore-platform';
import { isFirestoreQuotaError } from '@/lib/firestore-read-cache';
import { getDefaultNewsForApi } from '@/lib/firestore-defaults';

// GET /api/news — Active items by default. Use ?all=1 for admin (includes inactive).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === '1';

  if (!isFirebaseAdminConfigured()) {
    const demo = getDefaultNewsForApi();
    return NextResponse.json(all ? demo : demo.filter((item) => item.isActive));
  }

  try {
    const fresh = searchParams.get('fresh') === '1';

    const news = await listNewsFromFirestore(all, { skipCache: fresh });
    if (news.length === 0) {
      const demo = getDefaultNewsForApi();
      return NextResponse.json(all ? demo : demo.filter((item) => item.isActive));
    }
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    if (isFirestoreQuotaError(error)) {
      const demo = getDefaultNewsForApi();
      return NextResponse.json(all ? demo : demo.filter((item) => item.isActive));
    }
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST /api/news - Create a new news item
export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { content, link, type, order, isActive } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const news = await createNewsInFirestore({
      content: content.trim(),
      link: link || null,
      type: type || 'info',
      order: order ?? 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}

// PUT /api/news - Update a news item
export async function PUT(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const news = await updateNewsInFirestore(id, data);

    if (!news) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
  }
}

// DELETE /api/news?id=xxx - Delete a news item
export async function DELETE(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const deleted = await deleteNewsInFirestore(id);
    if (!deleted) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
