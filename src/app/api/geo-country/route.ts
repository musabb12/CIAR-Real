import { NextRequest, NextResponse } from 'next/server';
import {
  clientIpFromRequest,
  countryCodeFromAcceptLanguage,
  countryCodeFromCdnHeaders,
  countryCodeFromIpLookup,
  countryCodeFromNetlifyContext,
} from '@/lib/geo/country-code';

export async function GET(request: NextRequest) {
  const fromCdn = countryCodeFromCdnHeaders(request);
  if (fromCdn) {
    return NextResponse.json({ countryCode: fromCdn, source: 'cdn' });
  }

  const fromNetlify = countryCodeFromNetlifyContext();
  if (fromNetlify) {
    return NextResponse.json({ countryCode: fromNetlify, source: 'netlify' });
  }

  const clientIp = clientIpFromRequest(request);
  if (clientIp) {
    const fromIp = await countryCodeFromIpLookup(clientIp);
    if (fromIp) {
      return NextResponse.json({ countryCode: fromIp, source: 'ip' });
    }
  }

  const fromLanguage = countryCodeFromAcceptLanguage(request.headers.get('accept-language'));
  if (fromLanguage) {
    return NextResponse.json({ countryCode: fromLanguage, source: 'language' });
  }

  return NextResponse.json({ countryCode: null, source: null });
}
