import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/agents/[id] - Single agent with user info, company, and their properties
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const agent = await db.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        company: true,
        properties: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              take: 1,
            },
            country: true,
            city: true,
            _count: {
              select: { favorites: true, inquiries: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { properties: true },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

// PUT /api/agents/[id] — Update agent (verify, bio, title, license, ratings, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.bio === 'string' || body.bio === null) updateData.bio = body.bio;
    if (typeof body.title === 'string' || body.title === null) updateData.title = body.title;
    if (typeof body.license === 'string' || body.license === null) updateData.license = body.license;
    if (typeof body.phone === 'string' || body.phone === null) updateData.phone = body.phone;
    if (typeof body.whatsapp === 'string' || body.whatsapp === null) updateData.whatsapp = body.whatsapp;
    if (typeof body.experience === 'number') updateData.experience = body.experience;
    if (typeof body.rating === 'number') updateData.rating = body.rating;
    if (typeof body.totalListings === 'number') updateData.totalListings = body.totalListings;
    if (typeof body.totalSales === 'number') updateData.totalSales = body.totalSales;
    if (typeof body.verified === 'boolean') updateData.verified = body.verified;
    if (typeof body.companyId === 'string' || body.companyId === null) updateData.companyId = body.companyId;

    const agent = await db.agent.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        company: true,
        _count: { select: { properties: true } },
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

// DELETE /api/agents/[id] — Delete an agent (sets agentId of properties to null)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await db.property.updateMany({ where: { agentId: id }, data: { agentId: null } });
    await db.agent.delete({ where: { id } });

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
