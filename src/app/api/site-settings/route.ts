import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { SiteContentSettings, SiteDesignSettings, SiteSocialSettings } from '@/types';

const SETTINGS_KEY = 'global-site-settings';

const defaultDesignSettings: SiteDesignSettings = {
  primaryColor: '#0D9488',
  accentColor: '#F59E0B',
  heroImageUrl:
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80&auto=format&fit=crop',
};

const defaultContentSettings: SiteContentSettings = {
  home: {},
  search: {},
  agents: {},
  contact: {},
  favorites: {},
  login: {},
  register: {},
  'admin-login': {},
};

type SiteSettingsPayload = {
  designSettings: SiteDesignSettings;
  contentSettings: SiteContentSettings;
  socialSettings: SiteSocialSettings;
};

const defaultSocialSettings: SiteSocialSettings = {
  website: '',
  email: '',
  phone: '',
  whatsapp: '',
  telegram: '',
  facebook: '',
  instagram: '',
  x: '',
  youtube: '',
  linkedin: '',
  tiktok: '',
};

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

async function readOrCreateSettings(): Promise<SiteSettingsPayload> {
  let row = await db.siteSetting.findUnique({ where: { key: SETTINGS_KEY } });

  if (!row) {
    const defaults = normalizePayload({});
    row = await db.siteSetting.create({
      data: {
        key: SETTINGS_KEY,
        value: JSON.stringify(defaults),
      },
    });
  }

  let parsed: unknown = {};
  try {
    parsed = JSON.parse(row.value);
  } catch {
    parsed = {};
  }

  return normalizePayload(parsed);
}

export async function GET() {
  try {
    const payload = await readOrCreateSettings();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'Failed to load site settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const normalized = normalizePayload(body);
    const updated = await db.siteSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: JSON.stringify(normalized),
      },
      update: {
        value: JSON.stringify(normalized),
      },
    });

    return NextResponse.json({
      ok: true,
      updatedAt: updated.updatedAt,
      ...normalized,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to save site settings' }, { status: 500 });
  }
}
