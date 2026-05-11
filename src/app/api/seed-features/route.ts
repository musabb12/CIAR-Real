import { NextResponse } from 'next/server';
import { createFeatureInFirestore, listFeaturesFromFirestore } from '@/lib/firestore-platform';
import { DEFAULT_FEATURES } from '@/lib/firestore-defaults';

export async function POST() {
  try {
    const existingFeatures = new Set((await listFeaturesFromFirestore()).map((item) => item.key));
    let created = 0;
    for (const feature of DEFAULT_FEATURES) {
      if (!existingFeatures.has(feature.key)) {
        await createFeatureInFirestore({
          key: feature.key,
          name: feature.name,
          description: feature.description,
          category: feature.category,
          icon: feature.icon,
          order: feature.order,
        });
        created++;
      }
    }
    return NextResponse.json({
      message: `Seeded ${created} new features`,
      total: DEFAULT_FEATURES.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Seed failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
