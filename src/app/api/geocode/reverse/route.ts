import { NextRequest, NextResponse } from 'next/server';

/** Proxy reverse-geocode for admin map (Nominatim usage policy: server-side + identifiable UA). */
export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lon = request.nextUrl.searchParams.get('lon');
  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const latN = parseFloat(lat);
  const lonN = parseFloat(lon);
  if (!Number.isFinite(latN) || !Number.isFinite(lonN)) {
    return NextResponse.json({ error: 'invalid coordinates' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(latN))}&lon=${encodeURIComponent(String(lonN))}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CIAR-Real-Estate-Admin/1.0 (property editor)',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding service error' }, { status: 502 });
    }
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };
    return NextResponse.json({
      displayName: data.display_name ?? '',
      address: data.address ?? {},
    });
  } catch {
    return NextResponse.json({ error: 'Reverse geocode failed' }, { status: 502 });
  }
}
