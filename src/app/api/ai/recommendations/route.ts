import { NextRequest, NextResponse } from 'next/server';
import { recommendPropertiesHeuristic } from '@/lib/ai/heuristics';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { listPropertiesFromFirestore } from '@/lib/firestore-properties';
import { listDemoProperties } from '@/lib/demo-properties';
import { gateAiCapability, logAiCall } from '@/lib/ai/runtime';
import type { Property } from '@/types';

function toCatalog(rows: Property[]) {
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    bedrooms: p.bedrooms,
    propertyType: p.propertyType,
    cityId: p.cityId,
    countryId: p.countryId,
  }));
}

export async function GET(request: NextRequest) {
  const started = Date.now();
  try {
    const gate = await gateAiCapability(request, 'ai_recommendations');
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const price = Number(searchParams.get('price') || 0);
    const bedrooms = searchParams.get('bedrooms')
      ? Number(searchParams.get('bedrooms'))
      : null;
    const propertyType = searchParams.get('propertyType') || undefined;
    const cityId = searchParams.get('cityId') || undefined;
    const countryId = searchParams.get('countryId') || undefined;
    const limit = Math.min(Number(searchParams.get('limit') || 6), 12);

    let catalog: ReturnType<typeof toCatalog> = [];

    if (isFirebaseAdminConfigured()) {
      try {
        const listed = await listPropertiesFromFirestore({
          page: 1,
          limit: 80,
          countryId: countryId ?? null,
          cityId: cityId ?? null,
          listingType: null,
          propertyType: propertyType ?? null,
          priceMin: null,
          priceMax: null,
          bedrooms: bedrooms != null ? String(bedrooms) : null,
          bathrooms: null,
          areaMin: null,
          areaMax: null,
          isFeatured: null,
          search: null,
          sort: 'newest',
        });
        catalog = toCatalog(listed.data ?? []);
      } catch {
        catalog = [];
      }
    }

    if (catalog.length === 0) {
      const demo = listDemoProperties({
        page: 1,
        limit: 80,
        countryId: countryId ?? null,
      });
      catalog = toCatalog(demo.data ?? []);
    }

    if (propertyId) {
      catalog = catalog.filter((p) => p.id !== propertyId);
    }

    const seed = {
      price: price || catalog[0]?.price || 250000,
      bedrooms,
      propertyType,
      cityId,
      countryId,
    };

    const recommendations = recommendPropertiesHeuristic(seed, catalog, limit);
    await logAiCall({
      request,
      capability: 'ai_recommendations',
      engine: 'heuristic',
      success: true,
      latencyMs: Date.now() - started,
    });
    return NextResponse.json({ recommendations, engine: 'heuristic' });
  } catch (error) {
    console.error('AI recommendations error:', error);
    return NextResponse.json({ error: 'Recommendations failed' }, { status: 500 });
  }
}
