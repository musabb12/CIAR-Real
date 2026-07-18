import { NextRequest, NextResponse } from 'next/server';
import { requireAiAdmin } from '@/lib/require-admin';
import {
  appendAiAuditLog,
  readAiAdminSettings,
  saveAiAdminSettings,
} from '@/lib/ai/store';
import {
  normalizeAiAdminSettings,
  toPublicAiSettings,
} from '@/lib/ai/settings';
import { encryptSecret, secretLast4 } from '@/lib/ai/secrets';
import {
  listFeaturesFromFirestore,
  updateFeatureInFirestore,
} from '@/lib/firestore-platform';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import type { AiCapabilityConfig } from '@/types/ai-admin';

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
  return NextResponse.json({
    ...toPublicAiSettings(settings),
    canManageSecrets: admin.canManageSecrets,
    sessionKind: admin.kind,
  });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAiAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const current = await readAiAdminSettings();
    const mergedInput = {
      ...current,
      ...body,
      provider: {
        ...current.provider,
        ...(body.provider && typeof body.provider === 'object' ? body.provider : {}),
      },
      safety: {
        ...current.safety,
        ...(body.safety && typeof body.safety === 'object' ? body.safety : {}),
      },
      budget: {
        ...current.budget,
        ...(body.budget && typeof body.budget === 'object' ? body.budget : {}),
      },
      capabilities: Array.isArray(body.capabilities)
        ? body.capabilities
        : current.capabilities,
    };

    // Never accept ciphertext from the client
    if (mergedInput.provider) {
      delete (mergedInput.provider as { apiKeyEncrypted?: unknown }).apiKeyEncrypted;
    }

    const apiKeyPlain =
      typeof body?.provider?.apiKey === 'string' ? body.provider.apiKey.trim() : '';
    const clearApiKey = body?.provider?.clearApiKey === true;

    let next = normalizeAiAdminSettings({
      ...mergedInput,
      provider: {
        ...mergedInput.provider,
        apiKeyEncrypted: current.provider.apiKeyEncrypted,
        apiKeyLast4: current.provider.apiKeyLast4,
        apiKeyVerifiedAt: current.provider.apiKeyVerifiedAt,
      },
    });

    const changedFields: string[] = [];
    if (body.provider) changedFields.push('provider');
    if (body.safety) changedFields.push('safety');
    if (body.budget) changedFields.push('budget');
    if (body.capabilities) changedFields.push('capabilities');

    if (clearApiKey) {
      if (!admin.canManageSecrets) {
        return NextResponse.json(
          { error: 'Not allowed to manage API keys in this session mode' },
          { status: 403 },
        );
      }
      next = {
        ...next,
        provider: {
          ...next.provider,
          apiKeyEncrypted: null,
          apiKeyLast4: null,
          apiKeyVerifiedAt: null,
        },
      };
      changedFields.push('provider.apiKey');
    } else if (apiKeyPlain) {
      if (!admin.canManageSecrets) {
        return NextResponse.json(
          { error: 'Not allowed to manage API keys in this session mode' },
          { status: 403 },
        );
      }
      try {
        const encrypted = encryptSecret(apiKeyPlain);
        next = {
          ...next,
          provider: {
            ...next.provider,
            apiKeyEncrypted: encrypted,
            apiKeyLast4: secretLast4(apiKeyPlain),
            apiKeyVerifiedAt: null,
          },
        };
        changedFields.push('provider.apiKey');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to encrypt API key';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const saved = await saveAiAdminSettings(next, admin.user.id);
    if (body.capabilities) {
      await syncFeatureToggles(saved.capabilities);
    }
    await appendAiAuditLog({
      action: 'ai.settings.update',
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      changedFields: [...new Set(changedFields)],
    });

    return NextResponse.json({
      ...toPublicAiSettings(saved),
      canManageSecrets: admin.canManageSecrets,
      sessionKind: admin.kind,
    });
  } catch (error) {
    console.error('Admin AI settings PATCH:', error);
    return NextResponse.json({ error: 'Failed to save AI settings' }, { status: 500 });
  }
}
