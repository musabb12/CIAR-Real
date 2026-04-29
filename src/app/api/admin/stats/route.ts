import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/admin/stats - Return dashboard stats
export async function GET() {
  try {
    const [
      totalProperties,
      totalUsers,
      totalAgents,
      totalInquiries,
      totalViews,
      propertiesByType,
      inquiriesByStatus,
      recentInquiries,
      featuredProperties,
      monthlyListings,
    ] = await Promise.all([
      // Total properties
      db.property.count(),

      // Total users
      db.user.count(),

      // Total agents
      db.agent.count(),

      // Total inquiries
      db.inquiry.count(),

      // Total views (aggregate)
      db.property.aggregate({
        _sum: { views: true },
      }),

      // Properties by type
      db.property.groupBy({
        by: ['propertyType'],
        _count: { id: true },
      }),

      // Inquiries by status
      db.inquiry.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Recent inquiries (last 10)
      db.inquiry.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: { id: true, title: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),

      // Featured properties count
      db.property.count({ where: { isFeatured: true } }),

      // Monthly listing counts (last 6 months)
      db.property.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      totals: {
        properties: totalProperties,
        users: totalUsers,
        agents: totalAgents,
        inquiries: totalInquiries,
        views: totalViews._sum.views || 0,
        featuredProperties,
      },
      propertiesByType: propertiesByType.map((item) => ({
        type: item.propertyType,
        count: item._count.id,
      })),
      inquiriesByStatus: inquiriesByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      recentInquiries,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
