import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ListingType, PropertyType, Prisma, PropertyStatus } from '@prisma/client';
import {
  listPropertiesFromFirestore,
  useFirestoreForPropertiesList,
} from '@/lib/firestore-properties';

const propertyInclude = {
  images: {
    orderBy: { order: 'asc' as const },
  },
  amenities: {
    include: {
      amenity: true,
    },
  },
  country: true,
  region: true,
  city: true,
  agent: {
    include: {
      user: true,
      company: true,
    },
  },
};

// GET /api/properties - List properties with filtering, sorting, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Filters
    const countryId = searchParams.get('countryId');
    const cityId = searchParams.get('cityId');
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
    const skip = (page - 1) * limit;

    if (useFirestoreForPropertiesList()) {
      try {
        const out = await listPropertiesFromFirestore({
          countryId,
          cityId,
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
      } catch (fireErr) {
        console.error('Firestore properties list failed, using Prisma:', fireErr);
      }
    }

    // Build where clause
    const where: Prisma.PropertyWhereInput = {};

    if (countryId) where.countryId = countryId;
    if (cityId) where.cityId = cityId;
    if (listingType && Object.values(ListingType).includes(listingType as ListingType)) {
      where.listingType = listingType as ListingType;
    }
    if (propertyType && Object.values(PropertyType).includes(propertyType as PropertyType)) {
      where.propertyType = propertyType as PropertyType;
    }
    if (priceMin) where.price = { ...((where.price as Prisma.FloatFilter) || {}), gte: parseFloat(priceMin) };
    if (priceMax) where.price = { ...((where.price as Prisma.FloatFilter) || {}), lte: parseFloat(priceMax) };
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms, 10) };
    if (bathrooms) where.bathrooms = { gte: parseInt(bathrooms, 10) };
    if (areaMin) where.area = { ...((where.area as Prisma.FloatFilter) || {}), gte: parseFloat(areaMin) };
    if (areaMax) where.area = { ...((where.area as Prisma.FloatFilter) || {}), lte: parseFloat(areaMax) };
    if (isFeatured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
      ];
    }

    // Build order by
    let orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };

    // Fetch data
    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        include: propertyInclude,
        orderBy,
        skip,
        take: limit,
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({
      data: properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
    const {
      title,
      description,
      price,
      listingType,
      propertyType,
      area,
      bedrooms,
      bathrooms,
      floors,
      yearBuilt,
      isFeatured,
      status,
      countryId,
      regionId,
      cityId,
      address,
      latitude,
      longitude,
      agentId,
      images,
      amenityIds,
    } = body;

    // Generate a slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const property = await db.property.create({
      data: {
        title,
        slug,
        description,
        price: parseFloat(price),
        listingType,
        propertyType,
        area: parseFloat(area),
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
        floors: floors ? parseInt(floors, 10) : null,
        yearBuilt: yearBuilt ? parseInt(yearBuilt, 10) : null,
        isFeatured: isFeatured || false,
        status:
          status && Object.values(PropertyStatus).includes(status as PropertyStatus)
            ? (status as PropertyStatus)
            : PropertyStatus.AVAILABLE,
        countryId,
        regionId,
        cityId,
        address: address || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        agentId: agentId || null,
        images: images?.length
          ? {
              create: images.map((img: { url: string; alt?: string; isCover?: boolean; order?: number }, index: number) => ({
                url: img.url,
                alt: img.alt || null,
                isCover: img.isCover || index === 0,
                order: img.order || index,
              })),
            }
          : undefined,
        amenities: amenityIds?.length
          ? {
              create: amenityIds.map((amenityId: string) => ({
                amenityId,
              })),
            }
          : undefined,
      },
      include: propertyInclude,
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
