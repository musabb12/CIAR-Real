import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/auth-token';

// POST /api/logout - Clear server session cookie
export async function POST() {
  const response = NextResponse.json({ ok: true });
  const cookieOptions = getSessionCookieOptions();

  response.cookies.set(cookieOptions.name, '', {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
