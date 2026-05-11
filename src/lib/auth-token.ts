import crypto from 'crypto';

type SessionPayload = {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

const SESSION_COOKIE_NAME = 'ciar_session';
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
