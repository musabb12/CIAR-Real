import { NextRequest, NextResponse } from 'next/server';

/** Forward geocode (address → lat/lng) for property maps. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CIAR-Real-Estate/1.0 (property map)',
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding service error' }, { status: 502 });
    }

    const rows = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
    const hit = rows[0];
    if (!hit?.lat || !hit?.lon) {
      return NextResponse.json({ error: 'No results' }, { status: 404 });
    }

    const lat = Number.parseFloat(hit.lat);
    const lng = Number.parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 502 });
    }

    return NextResponse.json({
      lat,
      lng,
      displayName: hit.display_name ?? q,
    });
  } catch {
    return NextResponse.json({ error: 'Forward geocode failed' }, { status: 502 });
  }
}
