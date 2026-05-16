'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { countryCodeFromClientGeo } from '@/lib/geo/country-code';
import { normalizeLocationsResponse } from '@/lib/normalize-locations';

async function resolveCountryCode(): Promise<string | null> {
  try {
    const res = await fetch('/api/geo-country', { cache: 'no-store' });
    if (res.ok) {
      const geo = (await res.json()) as { countryCode?: string | null };
      const fromServer = String(geo?.countryCode ?? '').trim().toUpperCase();
      if (fromServer) return fromServer;
    }
  } catch {
    // fall through to client geo
  }

  return countryCodeFromClientGeo();
}

async function matchCountryId(code: string): Promise<string | null> {
  const res = await fetch('/api/locations');
  if (!res.ok) return null;

  const data = await res.json();
  const list = normalizeLocationsResponse(data);
  const matched = list.find((c) => String(c.code ?? '').toUpperCase() === code);
  return matched?.id ?? null;
}

/**
 * Detects visitor country (CDN headers → server IP → browser IP) and sets `filters.countryId` once.
 */
export function useVisitorCountry() {
  const {
    filters,
    setFilters,
    visitorGeoResolved,
    setVisitorGeoResolved,
  } = useAppStore();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || visitorGeoResolved) return;
    startedRef.current = true;

    (async () => {
      try {
        if (filters.countryId) return;

        const code = await resolveCountryCode();
        if (!code) return;

        const countryId = await matchCountryId(code);
        if (countryId) {
          setFilters({ countryId, page: 1, limit: 30 });
        }
      } finally {
        setVisitorGeoResolved(true);
      }
    })();
  }, [
    filters.countryId,
    setFilters,
    setVisitorGeoResolved,
    visitorGeoResolved,
  ]);
}
