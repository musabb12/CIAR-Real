import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const features = await db.featureToggle.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(features);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isEnabled } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = await db.featureToggle.update({
      where: { id },
      data: { isEnabled },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, name, description, category, icon, isEnabled, order } = body;
    if (!key || !name) return NextResponse.json({ error: 'Key and name required' }, { status: 400 });

    const feature = await db.featureToggle.create({
      data: { key, name, description, category: category || 'general', icon, isEnabled: isEnabled ?? true, order: order ?? 0 },
    });
    return NextResponse.json(feature, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create feature';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
