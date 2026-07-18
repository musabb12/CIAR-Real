import { NextRequest, NextResponse } from 'next/server';
import { requireAiAdmin } from '@/lib/require-admin';
import {
  appendAiAuditLog,
  readAiAdminSettings,
  saveAiAdminSettings,
} from '@/lib/ai/store';
import { AI_CAPABILITY_KEYS, normalizeAiAdminSettings } from '@/lib/ai/settings';
import type { AiCapabilityConfig, AiCapabilityKey, AiEngineMode } from '@/types/ai-admin';
import {
  listFeaturesFromFirestore,
  updateFeatureInFirestore,
} from '@/lib/firestore-platform';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';

function asEngine(value: unknown): AiEngineMode | null {
  if (value === 'llm' || value === 'heuristic' || value === 'hybrid') return value;
  return null;
}

async function syncFeatureToggles(capabilities: AiCapabilityConfig[]) {
  if (!isFirebaseAdminConfigured()) return;
  try {
    const features = await listFeaturesFromFirestore();
    await Promise.all(
      capabilities.map(async (cap) => {
        const feature = features.find((f) => f.key === cap.key);
        if (feature && feature.isEnabled !== cap.enabled) {
          await updateFeatureInFirestore(feature.id, { isEnabled: cap.enabled });
        }
      }),
    );
  } catch (error) {
    console.warn('[ai] syncFeatureToggles failed:', error);
  }
}

export async function GET(request: NextRequest) {
  const admin = await requireAiAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const settings = await readAiAdminSettings();
  return NextResponse.json({ capabilities: settings.capabilities });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAiAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = await readAiAdminSettings();
    const updates: unknown[] = Array.isArray(body?.capabilities)
      ? body.capabilities
      : body?.key
        ? [body]
        : [];

    if (!updates.length) {
      return NextResponse.json({ error: 'No capability updates provided' }, { status: 400 });
    }

    const map = new Map<AiCapabilityKey, AiCapabilityConfig>();
    for (const cap of settings.capabilities) map.set(cap.key, { ...cap });

    for (const raw of updates) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const key = String(item.key || '') as AiCapabilityKey;
      if (!AI_CAPABILITY_KEYS.includes(key)) continue;
      const current = map.get(key)!;
      const engine = asEngine(item.engine);
      map.set(key, {
        ...current,
        enabled: typeof item.enabled === 'boolean' ? item.enabled : current.enabled,
        engine: engine ?? current.engine,
        rateLimitPerMinute:
          typeof item.rateLimitPerMinute === 'number'
            ? item.rateLimitPerMinute
            : current.rateLimitPerMinute,
        options:
          item.options && typeof item.options === 'object'
            ? (item.options as Record<string, number | string | boolean>)
            : current.options,
      });
    }

    const next = normalizeAiAdminSettings({
      ...settings,
      capabilities: AI_CAPABILITY_KEYS.map((k) => map.get(k)!),
    });

    const saved = await saveAiAdminSettings(next, admin.user.id);
    await syncFeatureToggles(saved.capabilities);
    await appendAiAuditLog({
      action: 'ai.capabilities.update',
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      changedFields: ['capabilities'],
    });

    return NextResponse.json({ capabilities: saved.capabilities });
  } catch (error) {
    console.error('AI capabilities PATCH:', error);
    return NextResponse.json({ error: 'Failed to update capabilities' }, { status: 500 });
  }
}
