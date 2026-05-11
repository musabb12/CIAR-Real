import { NextRequest, NextResponse } from 'next/server';
import {
  createPropertyInFirestore,
  listPropertiesFromFirestore,
} from '@/lib/firestore-properties';

// GET /api/properties - List properties with filtering, sorting, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Filters
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

    // Sorting
    const sort = searchParams.get('sort') || 'newest';

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 30);
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
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
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
