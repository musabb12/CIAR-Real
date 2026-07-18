import { NextRequest, NextResponse } from 'next/server';
import { requireAiAdmin } from '@/lib/require-admin';
import { testAiProviderConnection } from '@/lib/ai/client';
import {
  appendAiAuditLog,
  appendAiUsageLog,
  readAiAdminSettings,
  saveAiAdminSettings,
} from '@/lib/ai/store';
import { nowIso } from '@/lib/firestore-shared';

export async function POST(request: NextRequest) {
  const admin = await requireAiAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  try {
    const settings = await readAiAdminSettings();
    const result = await testAiProviderConnection(settings);
    const latencyMs = Date.now() - started;

    await appendAiUsageLog({
      capability: 'provider_test',
      engine: result.ok ? 'llm' : 'error',
      success: result.ok,
      latencyMs,
      estimatedTokens: 8,
      estimatedCostUsd: result.ok ? 0.0001 : 0,
      errorCode: result.ok ? null : 'provider_test_failed',
      preview: result.message.slice(0, 80),
      actorId: admin.user.id,
      actorRole: admin.user.role,
    });

    if (result.ok && settings.provider.apiKeyEncrypted) {
      await saveAiAdminSettings(
        {
          ...settings,
          provider: {
            ...settings.provider,
            apiKeyVerifiedAt: nowIso(),
          },
        },
        admin.user.id,
      );
    }

    await appendAiAuditLog({
      action: 'ai.provider.test',
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      changedFields: result.ok ? ['provider.apiKeyVerifiedAt'] : [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI provider test failed:', error);
    return NextResponse.json(
      {
        ok: false,
        engine: 'none',
        message: error instanceof Error ? error.message : 'Provider test failed',
        latencyMs: Date.now() - started,
      },
      { status: 500 },
    );
  }
}
