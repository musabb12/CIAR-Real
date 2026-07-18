import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth-token';
import { getAiAdminMode, isAuthSecretConfigured } from '@/lib/ai/settings';
import { getUserDetailFromFirestore } from '@/lib/firestore-platform';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import type { User } from '@/types';

export type SessionUserKind = 'firestore' | 'demo' | 'local';

export type SessionUserResult = {
  user: User;
  kind: SessionUserKind;
};

/**
 * Server-only: read session cookie and resolve user.
 * Distinguishes demo/local sessions from real Firestore admins.
 */
export async function getSessionUser(request: NextRequest): Promise<User | null> {
  const result = await getSessionUserDetailed(request);
  return result?.user ?? null;
}

export async function getSessionUserDetailed(
  request: NextRequest,
): Promise<SessionUserResult | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;

  // Demo admin token issued when Firestore is unreachable
  if (session.sub === 'demo-admin-local') {
    if (getAiAdminMode() === 'production') {
      // Production mode rejects demo admin sessions
      return null;
    }
    return {
      kind: 'demo',
      user: {
        id: 'demo-admin-local',
        email: session.email,
        name: 'Admin User',
        phone: null,
        avatar: null,
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  if (session.sub.startsWith('local-')) {
    if (getAiAdminMode() === 'production') return null;
    return {
      kind: 'local',
      user: {
        id: session.sub,
        email: session.email,
        name: session.email.split('@')[0] || 'Local User',
        phone: null,
        avatar: null,
        role: (session.role as User['role']) || 'USER',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  if (!isFirebaseAdminConfigured()) {
    // Cannot load real users without Firestore
    return null;
  }

  try {
    const user = await getUserDetailFromFirestore(session.sub);
    if (!user || !user.isActive) return null;
    return { user, kind: 'firestore' };
  } catch {
    return null;
  }
}

/**
 * Production AI admin requires AUTH_SECRET + a real Firestore admin.
 * Demo mode allows demo/local admin sessions with tighter budgets.
 */
export function canManageAiSecrets(kind: SessionUserKind): boolean {
  if (getAiAdminMode() === 'production') {
    return kind === 'firestore' && isAuthSecretConfigured();
  }
  // Demo: allow demo/local admins to store test keys
  return true;
}
