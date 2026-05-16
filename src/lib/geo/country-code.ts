import type { NextRequest } from 'next/server';

const CDN_COUNTRY_HEADERS = [
  'x-nf-geo-country',
  'x-nf-country',
  'x-country',
  'x-vercel-ip-country',
  'cf-ipcountry',
  'x-country-code',
] as const;

const CLIENT_IP_HEADERS = [
  'x-nf-client-connection-ip',
  'x-forwarded-for',
  'x-real-ip',
] as const;

export function normalizeCountryCode(code: string | null | undefined): string | null {
  const normalized = String(code ?? '').trim().toUpperCase();
  if (!normalized || normalized === 'XX') return null;
  return normalized;
}

export function countryCodeFromCdnHeaders(request: NextRequest): string | null {
  for (const header of CDN_COUNTRY_HEADERS) {
    const value = normalizeCountryCode(request.headers.get(header));
    if (value) return value;
  }
  return null;
}

export function countryCodeFromNetlifyContext(): string | null {
  try {
    const netlify = (globalThis as {
      Netlify?: { context?: { geo?: { country?: { code?: string } } } };
    }).Netlify;
    return normalizeCountryCode(netlify?.context?.geo?.country?.code);
  } catch {
    return null;
  }
}

export function clientIpFromRequest(request: NextRequest): string | null {
  for (const header of CLIENT_IP_HEADERS) {
    const raw = request.headers.get(header);
    if (!raw) continue;

    const ip = header === 'x-forwarded-for'
      ? raw.split(',')[0]?.trim()
      : raw.trim();

    if (ip && !isPrivateOrLoopbackIp(ip)) return ip;
  }

  return null;
}

function isPrivateOrLoopbackIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;

  if (ip.startsWith('172.')) {
    const second = Number.parseInt(ip.split('.')[1] ?? '', 10);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

export function countryCodeFromAcceptLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;
  const first = acceptLanguage.split(',')[0]?.trim();
  if (!first) return null;
  const region = first.split('-')[1];
  return normalizeCountryCode(region);
}

export async function countryCodeFromIpLookup(ip: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: controller.signal, cache: 'no-store' },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { status?: string; countryCode?: string };
    if (data.status === 'success') {
      return normalizeCountryCode(data.countryCode);
    }
  } catch {
    // ignore lookup failures
  } finally {
    clearTimeout(timeout);
  }

  return null;
}

/** Browser-side fallback when the server only sees localhost. */
export async function countryCodeFromClientGeo(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { country_code?: string };
    return normalizeCountryCode(data.country_code);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
