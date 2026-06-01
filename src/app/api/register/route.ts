import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth-token';
import { checkRegisterRateLimit } from '@/lib/rate-limit';
import type { AccountType } from '@/types';
import {
  getFirebaseAdminConfigError,
  isFirebaseAdminConfigured,
} from '@/lib/firebase-admin';
import { isFirebaseQuotaError } from '@/lib/firebase-errors';
import {
  createLocalUser,
  getLocalUserByEmail,
  toSafeLocalUser,
} from '@/lib/local-auth-store';
import {
  accountTypeToRole,
  createPartnerProfileForUser,
  createUserInFirestore,
  getUserByEmail,
} from '@/lib/firestore-platform';

async function registerWithLocalStore(input: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: ReturnType<typeof accountTypeToRole>;
}) {
  const user = await createLocalUser({
    name: input.name,
    email: input.email,
    password: input.password,
    phone: input.phone,
    role: input.role,
  });
  return {
    user: { ...user, _count: { favorites: 0, inquiries: 0 } },
    localAuth: true as const,
  };
}

async function registerWithFirestore(input: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: ReturnType<typeof accountTypeToRole>;
  companyName?: string;
}) {
  const existingUser = await getUserByEmail(input.email.toLowerCase());
  if (existingUser) {
    return { conflict: true as const };
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const user = await createUserInFirestore({
    name: input.name,
    email: input.email.toLowerCase(),
    password: hashedPassword,
    phone: input.phone,
    role: input.role,
    isActive: true,
  });

  if (input.role === 'OWNER' || input.role === 'COMPANY') {
    await createPartnerProfileForUser({
      userId: user.id,
      role: input.role,
      name: input.name,
      phone: input.phone,
      companyName: input.companyName ?? null,
    });
  }

  const { password: _password, ...safeUser } = user;
  return {
    user: { ...safeUser, _count: { favorites: 0, inquiries: 0 } },
    localAuth: false as const,
  };
}

// POST /api/register - Create a new user account (Firestore or local fallback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, accountType, companyName } = body;

    if (email && typeof email === 'string') {
      const rate = checkRegisterRateLimit(request, email);
      if (!rate.allowed) {
        return NextResponse.json(
          { error: 'Too many registration attempts. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(rate.retryAfterSec),
            },
          }
        );
      }
    }

    const normalizedAccountType: AccountType =
      accountType === 'OWNER' || accountType === 'COMPANY' ? accountType : 'CLIENT';
    const role = accountTypeToRole(normalizedAccountType);

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (normalizedAccountType === 'COMPANY') {
      const cn = typeof companyName === 'string' ? companyName.trim() : '';
      if (!cn) {
        return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
      }
    }

    const normalizedEmail = email.toLowerCase().trim();
    const payload = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: typeof phone === 'string' && phone.trim().length > 0 ? phone.trim() : null,
      role,
      companyName: typeof companyName === 'string' ? companyName.trim() : undefined,
    };

    const useLocalOnly = !isFirebaseAdminConfigured();
    let result: Awaited<ReturnType<typeof registerWithFirestore>> | null = null;

    if (useLocalOnly) {
      const existing = await getLocalUserByEmail(normalizedEmail);
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      result = await registerWithLocalStore(payload);
    } else {
      try {
        result = await registerWithFirestore(payload);
        if ('conflict' in result && result.conflict) {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 409 }
          );
        }
      } catch (firestoreError) {
        if (isFirebaseQuotaError(firestoreError)) {
          const existing = await getLocalUserByEmail(normalizedEmail);
          if (existing) {
            return NextResponse.json(
              { error: 'An account with this email already exists' },
              { status: 409 }
            );
          }
          result = await registerWithLocalStore(payload);
        } else {
          throw firestoreError;
        }
      }
    }

    if (!result) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }

    const sessionToken = createSessionToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });
    const response = NextResponse.json({
      user: result.user,
      token: sessionToken,
      ...(result.localAuth
        ? {
            localAuth: true,
            warning:
              'Account saved locally on this server (Firebase unavailable). Data may not sync to the cloud until Firebase is connected.',
          }
        : {}),
    });
    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);
    return response;
  } catch (error) {
    console.error('Error during registration:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    if (message === 'An account with this email already exists') {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    const configHint = getFirebaseAdminConfigError();
    if (configHint && !isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development' ? message : 'Registration failed',
      },
      { status: 500 }
    );
  }
}
