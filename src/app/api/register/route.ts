import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth-token';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { AccountType } from '@/types';
import {
  accountTypeToRole,
  createPartnerProfileForUser,
  createUserInFirestore,
  getUserByEmail,
  getUserDetailFromFirestore,
} from '@/lib/firestore-platform';

// POST /api/register - Create a new user account
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`register:${ip}`, 5, 60_000);
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

    const body = await request.json();
    const { name, email, password, phone, accountType, companyName } = body;

    const normalizedAccountType: AccountType =
      accountType === 'OWNER' || accountType === 'COMPANY' ? accountType : 'CLIENT';
    const role = accountTypeToRole(normalizedAccountType);

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: 'Company name is required' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email.toLowerCase());

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user
    const user = await createUserInFirestore({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: (typeof phone === 'string' && phone.trim().length > 0) ? phone.trim() : null,
      role,
      isActive: true,
    });

    if (role === 'OWNER' || role === 'COMPANY') {
      await createPartnerProfileForUser({
        userId: user.id,
        role,
        name: name.trim(),
        phone: (typeof phone === 'string' && phone.trim().length > 0) ? phone.trim() : null,
        companyName: typeof companyName === 'string' ? companyName.trim() : null,
      });
    }

    const fullUser = (await getUserDetailFromFirestore(user.id)) ?? user;

    const sessionToken = createSessionToken({
      id: fullUser.id,
      email: fullUser.email,
      role: fullUser.role,
    });
    const response = NextResponse.json({
      user: fullUser,
      token: sessionToken,
    });
    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);
    return response;
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
