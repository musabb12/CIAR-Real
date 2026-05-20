import type { NextRequest } from 'next/server';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(limit - current.count, 0),
    retryAfterSec: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
  };
}

/** Client IP for rate limiting (supports proxies and Next.js request.ip). */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;

  if (request.ip) return request.ip;

  return 'unknown';
}

/**
 * Registration limits: always per-email; per-IP only when IP is known.
 * Avoids lumping all LAN/mobile clients into one "unknown" bucket.
 */
export function checkRegisterRateLimit(
  request: NextRequest,
  email: string
): { allowed: boolean; retryAfterSec: number } {
  const normalizedEmail = email.trim().toLowerCase();
  const isDev = process.env.NODE_ENV !== 'production';
  const emailLimit = isDev ? 30 : 8;
  const emailWindowMs = isDev ? 60_000 : 15 * 60_000;

  const emailRate = checkRateLimit(
    `register:email:${normalizedEmail}`,
    emailLimit,
    emailWindowMs
  );
  if (!emailRate.allowed) {
    return { allowed: false, retryAfterSec: emailRate.retryAfterSec };
  }

  const ip = getClientIp(request);
  if (ip !== 'unknown') {
    const ipRate = checkRateLimit(
      `register:ip:${ip}`,
      isDev ? 40 : 15,
      60_000
    );
    if (!ipRate.allowed) {
      return { allowed: false, retryAfterSec: ipRate.retryAfterSec };
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}

/** Login limits: per-email always; per-IP when IP is known. */
export function checkAuthRateLimit(
  request: NextRequest,
  email: string
): { allowed: boolean; retryAfterSec: number } {
  const normalizedEmail = email.trim().toLowerCase();
  const isDev = process.env.NODE_ENV !== 'production';

  const emailRate = checkRateLimit(
    `auth:email:${normalizedEmail}`,
    isDev ? 50 : 15,
    60_000
  );
  if (!emailRate.allowed) {
    return { allowed: false, retryAfterSec: emailRate.retryAfterSec };
  }

  const ip = getClientIp(request);
  if (ip !== 'unknown') {
    const ipRate = checkRateLimit(`auth:ip:${ip}`, isDev ? 60 : 20, 60_000);
    if (!ipRate.allowed) {
      return { allowed: false, retryAfterSec: ipRate.retryAfterSec };
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}
