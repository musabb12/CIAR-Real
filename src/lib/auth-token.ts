import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'ciar_session';
export type SessionPayload = {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // Dev-safe fallback; set AUTH_SECRET in production.
    return 'dev-insecure-secret-change-me';
  }
  return secret;
}

export function createSessionToken(user: { id: string; email: string; role: string }) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest();

  return `${data}.${base64Url(signature)}`;
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest();
  const pad = encodedSig.length % 4 === 0 ? '' : '='.repeat(4 - (encodedSig.length % 4));
  const actual = Buffer.from(
    encodedSig.replace(/-/g, '+').replace(/_/g, '/') + pad,
    'base64',
  );
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    maxAge: SESSION_TTL_SECONDS,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}
