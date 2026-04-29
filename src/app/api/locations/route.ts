import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/locations - Return nested countries → regions → cities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProperties = searchParams.get('includeProperties') === 'true';

    const countriesInclude: Prisma.CountryInclude = {
      regions: {
        orderBy: { name: 'asc' },
        include: {
          cities: {
            orderBy: { name: 'asc' },
          },
        },
      },
    };

    if (includeProperties) {
      countriesInclude.regions.include = {
        cities: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { properties: true },
            },
          },
        },
        _count: {
          select: { properties: true },
        },
      };
      countriesInclude._count = {
        select: { properties: true },
      };
    }

    const countries = await db.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: countriesInclude,
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
