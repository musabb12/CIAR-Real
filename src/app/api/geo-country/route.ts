import { NextRequest, NextResponse } from 'next/server';

function fromLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;
  const first = acceptLanguage.split(',')[0]?.trim();
  if (!first) return null;
  const region = first.split('-')[1];
  return region ? region.toUpperCase() : null;
}

export async function GET(request: NextRequest) {
  const headerCountry =
    request.headers.get('x-vercel-ip-country')
    || request.headers.get('cf-ipcountry')
    || request.headers.get('x-country-code');

  const code = (headerCountry || fromLanguage(request.headers.get('accept-language')) || '').toUpperCase();
  return NextResponse.json({ countryCode: code || null });
}
