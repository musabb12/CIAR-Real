import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth-token';
import { checkAuthRateLimit } from '@/lib/rate-limit';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  getDemoAdminUser,
  isDemoAdminCredentials,
} from '@/lib/demo-auth';
import { isFirebaseQuotaError } from '@/lib/firebase-errors';
import {
  getLocalUserByEmail,
  toSafeLocalUser,
} from '@/lib/in-memory-auth-store';
import {
  getUserByEmail,
  updateUserInFirestore,
} from '@/lib/firestore-platform';
import type { User } from '@/types';

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

async function passwordMatches(storedPassword: string, password: string): Promise<boolean> {
  if (BCRYPT_HASH_REGEX.test(storedPassword)) {
    return bcrypt.compare(password, storedPassword);
  }
  return password === storedPassword;
}

async function loginViaLocalStore(email: string, password: string) {
  const stored = await getLocalUserByEmail(email);
  if (!stored) return null;
  if (!stored.isActive) return { deactivated: true as const };
  const valid = await passwordMatches(stored.password, password);
  if (!valid) return null;
  return { user: toSafeLocalUser(stored) };
}

function sessionResponse(safeUser: User, extra?: Record<string, unknown>) {
  const sessionToken = createSessionToken({
    id: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
  });
  const response = NextResponse.json({
    user: safeUser,
    token: sessionToken,
    ...extra,
  });
  const cookieOptions = getSessionCookieOptions();
  response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);
  return response;
}

// POST /api/auth - Validate email + password (Firestore or local fallback)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  try {
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const rate = checkAuthRateLimit(request, email);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rate.retryAfterSec),
          },
        }
      );
    }

    if (!isFirebaseAdminConfigured()) {
      const local = await loginViaLocalStore(email, password);
      if (local && 'deactivated' in local) {
        return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
      }
      if (!local?.user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      return sessionResponse(local.user, {
        localAuth: true,
        warning:
          'Signed in with local account storage (Firebase not configured on server).',
      });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'This account has no password set' },
        { status: 401 }
      );
    }

    let isValidPassword = await passwordMatches(user.password, password);
    if (!isValidPassword && !BCRYPT_HASH_REGEX.test(user.password) && password === user.password) {
      const upgradedHash = await bcrypt.hash(password, 12);
      await updateUserInFirestore(user.id, { password: upgradedHash });
      isValidPassword = true;
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { password: _password, ...safeUser } = user;
    return sessionResponse(safeUser);
  } catch (error) {
    console.error('Error during login:', error);
    const quota = isFirebaseQuotaError(error);

    // Firestore is unreachable (quota, bad credentials, network) — fall back
    // to local storage or the demo admin so the site stays usable.
    if (email) {
      const local = await loginViaLocalStore(email, password);
      if (local && 'deactivated' in local) {
        return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
      }
      if (local?.user) {
        return sessionResponse(local.user, {
          quotaExceeded: quota,
          localAuth: true,
          warning: quota
            ? 'Signed in via local account storage because Firestore quota is exceeded.'
            : 'Signed in via local account storage because Firestore is unreachable.',
        });
      }
      if (isDemoAdminCredentials(email, password)) {
        return sessionResponse(getDemoAdminUser(), {
          quotaExceeded: quota,
          demoAuth: true,
          warning: quota
            ? 'Signed in with demo admin because Firestore quota is exceeded. Dashboard data may be limited until quota resets.'
            : 'Signed in with demo admin because Firestore is unreachable. Dashboard data may be limited.',
        });
      }
    }

    if (quota) {
      return NextResponse.json({ error: 'firebase_quota_exceeded' }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Login failed';
    const isFirebaseConfig =
      message.includes('FIREBASE') || message.includes('Firebase');
    return NextResponse.json(
      {
        error: isFirebaseConfig
          ? message
          : process.env.NODE_ENV === 'development'
            ? message
            : 'Login failed',
      },
      { status: 500 }
    );
  }
}
