import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth-token';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

// POST /api/auth - Validate email + password against database
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`auth:${ip}`, 10, 60_000);
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

    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        agent: {
          select: {
            id: true,
            title: true,
            verified: true,
            rating: true,
            totalListings: true,
            companyId: true,
          },
        },
      },
    });

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
        await db.user.update({
          where: { id: user.id },
          data: { password: upgradedHash },
        });
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
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
