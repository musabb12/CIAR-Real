import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseAdminConfigError,
  isFirebaseAdminConfigured,
} from '@/lib/firebase-admin';
import { listDemoProperties } from '@/lib/demo-properties';
import { isFirebaseQuotaError } from '@/lib/firebase-errors';
import {
  createPropertyInFirestore,
  listPropertiesFromFirestore,
} from '@/lib/firestore-properties';

// GET /api/properties - List properties with filtering, sorting, pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 30);

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 1,
      },
      backendConfigured: false,
      backendMessage: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured',
    });
  }

  const countryId = searchParams.get('countryId');
  const cityId = searchParams.get('cityId');
  const agentId = searchParams.get('agentId');
  const listingType = searchParams.get('listingType');
  const propertyType = searchParams.get('propertyType');
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  const bedrooms = searchParams.get('bedrooms');
  const bathrooms = searchParams.get('bathrooms');
  const areaMin = searchParams.get('areaMin');
  const areaMax = searchParams.get('areaMax');
  const isFeatured = searchParams.get('isFeatured');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'newest';

  try {
    const out = await listPropertiesFromFirestore({
      countryId,
      cityId,
      agentId,
      listingType,
      propertyType,
      priceMin,
      priceMax,
      bedrooms,
      bathrooms,
      areaMin,
      areaMax,
      isFeatured,
      search,
      sort,
      page,
      limit,
    });

    return NextResponse.json({
      data: out.data,
      pagination: out.pagination,
      backendConfigured: true,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);

    if (isFirebaseQuotaError(error)) {
      const out = listDemoProperties({
        countryId,
        cityId,
        agentId,
        listingType,
        propertyType,
        isFeatured,
        search,
        sort,
        page,
        limit,
      });
      return NextResponse.json({
        data: out.data,
        pagination: out.pagination,
        backendConfigured: true,
        quotaExceeded: true,
        dataSource: 'demo',
        backendMessage:
          'Firestore quota exceeded — showing demo listings. Upgrade your Firebase plan or wait for the daily reset.',
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: getFirebaseAdminConfigError() ?? 'Firebase Admin is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const property = await createPropertyInFirestore({
      title: body.title,
      description: body.description,
      price: body.price,
      listingType: body.listingType,
      propertyType: body.propertyType,
      area: body.area,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      floors: body.floors,
      yearBuilt: body.yearBuilt,
      isFeatured: body.isFeatured,
      status: body.status,
      countryId: body.countryId,
      regionId: body.regionId,
      cityId: body.cityId,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      agentId: body.agentId,
      images: body.images,
      amenityIds: body.amenityIds,
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
