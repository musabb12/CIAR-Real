import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { getPropertyFromFirestore } from '@/lib/firestore-properties';

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
  favorites: true,
  inquiries: {
    orderBy: { createdAt: 'desc' as const },
  },
};

// GET /api/properties/[id] - Get single property and increment views
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const skipView = request.nextUrl.searchParams.get('skipView') === '1';

    if (isFirebaseAdminConfigured()) {
      try {
        const fromFs = await getPropertyFromFirestore(id, skipView);
        if (fromFs) {
          return NextResponse.json(fromFs);
        }
      } catch (fireErr) {
        console.error('Firestore property fetch failed, using Prisma:', fireErr);
      }
    }

    const property = await db.property.findUnique({
      where: { id },
      include: propertyInclude,
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (!skipView) {
      await db.property.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      property.views += 1;
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if property exists
    const existing = await db.property.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Build update data
    const {
      title,
      description,
      price,
      listingType,
      propertyType,
      status,
      area,
      bedrooms,
      bathrooms,
      floors,
      yearBuilt,
      isFeatured,
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

    // Update slug if title changed
    const updateData: Record<string, unknown> = {};
    if (title && title !== existing.title) {
      updateData.title = title;
      updateData.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (listingType) updateData.listingType = listingType;
    if (propertyType) updateData.propertyType = propertyType;
    if (status) updateData.status = status;
    if (area !== undefined) updateData.area = parseFloat(area);
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms ? parseInt(bedrooms, 10) : null;
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms ? parseInt(bathrooms, 10) : null;
    if (floors !== undefined) updateData.floors = floors ? parseInt(floors, 10) : null;
    if (yearBuilt !== undefined) updateData.yearBuilt = yearBuilt ? parseInt(yearBuilt, 10) : null;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (countryId) updateData.countryId = countryId;
    if (regionId) updateData.regionId = regionId;
    if (cityId) updateData.cityId = cityId;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (agentId !== undefined) updateData.agentId = agentId;

    // Handle image replacement
    if (images !== undefined) {
      await db.propertyImage.deleteMany({ where: { propertyId: id } });
      if (images.length > 0) {
        updateData.images = {
          create: images.map((img: { url: string; alt?: string; isCover?: boolean; order?: number }, index: number) => ({
            url: img.url,
            alt: img.alt || null,
            isCover: img.isCover || index === 0,
            order: img.order || index,
          })),
        };
      }
    }

    // Handle amenity replacement
    if (amenityIds !== undefined) {
      await db.propertyAmenity.deleteMany({ where: { propertyId: id } });
      if (amenityIds.length > 0) {
        updateData.amenities = {
          create: amenityIds.map((amenityId: string) => ({
            amenityId,
          })),
        };
      }
    }

    const property = await db.property.update({
      where: { id },
      data: updateData,
      include: propertyInclude,
    });

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.property.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Delete related records first (cascading)
    await db.inquiry.deleteMany({ where: { propertyId: id } });
    await db.favorite.deleteMany({ where: { propertyId: id } });
    await db.propertyAmenity.deleteMany({ where: { propertyId: id } });
    await db.propertyImage.deleteMany({ where: { propertyId: id } });
    await db.property.delete({ where: { id } });

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
