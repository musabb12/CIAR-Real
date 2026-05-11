import { NextResponse } from 'next/server';
import {
  createFeatureInFirestore,
  createNewsInFirestore,
  listFeaturesFromFirestore,
  listNewsFromFirestore,
  readOrCreateSiteSettingsFromFirestore,
} from '@/lib/firestore-platform';
import { DEFAULT_FEATURES, DEFAULT_NEWS_ITEMS } from '@/lib/firestore-defaults';

// POST /api/seed - Seed Firestore defaults used by the app
export async function POST() {
  try {
    const existingFeatureKeys = new Set((await listFeaturesFromFirestore()).map((item) => item.key));
    const existingNews = await listNewsFromFirestore(true);

    let createdFeatures = 0;
    for (const feature of DEFAULT_FEATURES) {
      if (!existingFeatureKeys.has(feature.key)) {
        await createFeatureInFirestore({
          key: feature.key,
          name: feature.name,
          description: feature.description,
          category: feature.category,
          icon: feature.icon,
          order: feature.order,
        });
        createdFeatures++;
      }
    }

    let createdNews = 0;
    if (existingNews.length === 0) {
      for (const item of DEFAULT_NEWS_ITEMS) {
        await createNewsInFirestore({
          content: item.content,
          type: item.type,
          order: item.order,
        });
        createdNews++;
      }
    }

    const siteSettings = await readOrCreateSiteSettingsFromFirestore();

    return NextResponse.json({
      ok: true,
      message: 'Firestore defaults are ready',
      createdFeatures,
      createdNews,
      siteSettingsReady: Boolean(siteSettings),
    });
  } catch (error: unknown) {
    console.error('Error seeding Firestore defaults:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to seed Firestore defaults';
    return NextResponse.json(
      { error: 'Failed to seed Firestore defaults', details: errorMessage },
      { status: 500 }
    );
  }
}
