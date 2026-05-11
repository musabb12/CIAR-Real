import { NextRequest, NextResponse } from 'next/server';
import {
  addFavoriteInFirestore,
  listFavoritesForUser,
  removeFavoriteInFirestore,
} from '@/lib/firestore-platform';

// GET /api/favorites - List favorites for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const favorites = await listFavoritesForUser(userId);

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a favorite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, propertyId } = body;

    if (!userId || !propertyId) {
      return NextResponse.json(
        { error: 'userId and propertyId are required' },
        { status: 400 }
      );
    }

    const favorite = await addFavoriteInFirestore(userId, propertyId);

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add favorite' },
      { status: error instanceof Error && /already|not found/i.test(error.message) ? 409 : 500 }
    );
  }
}

// DELETE /api/favorites - Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const propertyId = searchParams.get('propertyId');

    if (!userId || !propertyId) {
      return NextResponse.json(
        { error: 'userId and propertyId query parameters are required' },
        { status: 400 }
      );
    }

    const removed = await removeFavoriteInFirestore(userId, propertyId);

    if (!removed) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
