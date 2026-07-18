import { NextRequest, NextResponse } from 'next/server';
import { requireAiAdmin } from '@/lib/require-admin';
import {
  listAiUsageLogs,
  purgeOldAiLogs,
  readAiAdminSettings,
  summarizeAiUsage,
} from '@/lib/ai/store';

export async function GET(request: NextRequest) {
  const admin = await requireAiAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const settings = await readAiAdminSettings();
  const summary = await summarizeAiUsage(settings);
  const logs = await listAiUsageLogs({
    limit: parseInt(searchParams.get('limit') || '50', 10),
    capability: searchParams.get('capability') || undefined,
    engine: searchParams.get('engine') || undefined,
  });

  return NextResponse.json({ summary, logs });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAiAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await readAiAdminSettings();
  const deleted = await purgeOldAiLogs(settings.safety.retentionDays);
  return NextResponse.json({ deleted, retentionDays: settings.safety.retentionDays });
}
