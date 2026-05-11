import { NextRequest, NextResponse } from 'next/server';
import { listUsersFromFirestore } from '@/lib/firestore-platform';

// GET /api/users - List all users (admin use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const users = await listUsersFromFirestore(role);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
