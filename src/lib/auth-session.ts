import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth-token';
import { getUserDetailFromFirestore } from '@/lib/firestore-platform';
import type { User } from '@/types';

/** Server-only: read session cookie and load user from Firestore. */
export async function getSessionUser(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;

  const user = await getUserDetailFromFirestore(session.sub);
  if (!user || !user.isActive) return null;
  return user;
}
