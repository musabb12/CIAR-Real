import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/locations - Return nested countries → regions → cities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProperties = searchParams.get('includeProperties') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';

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
      where: includeInactive ? undefined : { isActive: true },
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

// POST /api/locations - create country (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const code = String(body?.code ?? '').trim().toUpperCase();
    const flag = String(body?.flag ?? '').trim() || null;
    const currency = String(body?.currency ?? '').trim() || null;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const created = await db.country.create({
      data: {
        name,
        code,
        flag,
        currency,
        isActive: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json({ error: 'Failed to create country' }, { status: 500 });
  }
}
