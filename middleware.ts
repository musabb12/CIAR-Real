import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'ciar_session';

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function verifyAdminSession(token: string | undefined) {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const headerJson = JSON.parse(decodeBase64Url(encodedHeader));
    if (headerJson?.alg !== 'HS256') return false;

    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as {
      role?: string;
      exp?: number;
    };

    if (!payload?.role || payload.role !== 'ADMIN') return false;
    if (!payload?.exp || Math.floor(Date.now() / 1000) >= payload.exp) return false;

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-insecure-secret-change-me';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signed = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signed)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return expectedSig === encodedSignature;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAdmin = await verifyAdminSession(token);

  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/admin/:path*'],
};
