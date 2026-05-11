import { NextResponse } from 'next/server';
import {
  defaultContentSettings,
  defaultDesignSettings,
  defaultSocialSettings,
  readOrCreateSiteSettingsFromFirestore,
  saveSiteSettingsToFirestore,
  type SiteSettingsPayload,
} from '@/lib/firestore-platform';
import type { SiteContentSettings, SiteDesignSettings, SiteSocialSettings } from '@/types';

function normalizePayload(input: unknown): SiteSettingsPayload {
  const value = (input ?? {}) as Partial<SiteSettingsPayload>;
  return {
    designSettings: {
      ...defaultDesignSettings,
      ...(value.designSettings ?? {}),
    },
    contentSettings: {
      ...defaultContentSettings,
      ...(value.contentSettings ?? {}),
    },
    socialSettings: {
      ...defaultSocialSettings,
      ...(value.socialSettings ?? {}),
    },
  };
}

export async function GET() {
  try {
    const payload = await readOrCreateSiteSettingsFromFirestore();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'Failed to load site settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const normalized = normalizePayload(body);
    await saveSiteSettingsToFirestore(normalized);

    return NextResponse.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      ...normalized,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to save site settings' }, { status: 500 });
  }
}
