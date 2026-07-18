import { NextRequest, NextResponse } from 'next/server';
import { requireAiAdmin } from '@/lib/require-admin';
import { listAiAuditLogs, listAiUsageLogs } from '@/lib/ai/store';

export async function GET(request: NextRequest) {
  const admin = await requireAiAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'usage';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (type === 'audit') {
    const audit = await listAiAuditLogs(limit);
    return NextResponse.json({ audit });
  }

  const logs = await listAiUsageLogs({
    limit,
    capability: searchParams.get('capability') || undefined,
    engine: searchParams.get('engine') || undefined,
  });
  return NextResponse.json({ logs });
}
