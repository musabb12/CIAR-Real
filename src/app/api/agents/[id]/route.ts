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
