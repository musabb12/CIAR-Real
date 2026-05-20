import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth-token';
import { checkAuthRateLimit } from '@/lib/rate-limit';
import {
  getFirebaseAdminConfigError,
  isFirebaseAdminConfigured,
} from '@/lib/firebase-admin';
import {
  getDemoAdminUser,
  isDemoAdminCredentials,
} from '@/lib/demo-auth';
import { isFirebaseQuotaError } from '@/lib/firebase-errors';
import {
  getUserByEmail,
  updateUserInFirestore,
} from '@/lib/firestore-platform';

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

// POST /api/auth - Validate email + password against database
export async function POST(request: NextRequest) {
  const body = await request.json();
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            getFirebaseAdminConfigError() ??
            'FIREBASE_SERVICE_ACCOUNT_JSON is not set',
        },
        { status: 503 }
      );
    }

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

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'This account has no password set' },
        { status: 401 }
      );
    }

    const storedPassword = user.password;
    let isValidPassword = false;

    if (BCRYPT_HASH_REGEX.test(storedPassword)) {
      isValidPassword = await bcrypt.compare(password, storedPassword);
    } else {
      // Backward compatibility for old seeded plaintext passwords.
      isValidPassword = password === storedPassword;
      if (isValidPassword) {
        const upgradedHash = await bcrypt.hash(password, 12);
        await updateUserInFirestore(user.id, { password: upgradedHash });
      }
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { password: _password, ...safeUser } = user;

    const sessionToken = createSessionToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });
    const response = NextResponse.json({
      user: safeUser,
      token: sessionToken,
    });
    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);
    return response;
  } catch (error) {
    console.error('Error during login:', error);

    if (
      isFirebaseQuotaError(error) &&
      email &&
      isDemoAdminCredentials(email, password)
    ) {
      const safeUser = getDemoAdminUser();
      const sessionToken = createSessionToken({
        id: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
      });
      const response = NextResponse.json({
        user: safeUser,
        token: sessionToken,
        quotaExceeded: true,
        demoAuth: true,
        warning:
          'Signed in with demo admin because Firestore quota is exceeded. Dashboard data may be limited until quota resets.',
      });
      const cookieOptions = getSessionCookieOptions();
      response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);
      return response;
    }

    if (isFirebaseQuotaError(error)) {
      return NextResponse.json(
        { error: 'firebase_quota_exceeded' },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Login failed';
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
