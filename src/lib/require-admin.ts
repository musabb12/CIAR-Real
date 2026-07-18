import type { NextRequest } from 'next/server';
import {
  canManageAiSecrets,
  getSessionUser,
  getSessionUserDetailed,
  type SessionUserKind,
} from '@/lib/auth-session';
import { isAdminRole } from '@/lib/auth-roles';
import type { User } from '@/types';

export async function requireAdminUser(request: NextRequest): Promise<User | null> {
  const user = await getSessionUser(request);
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

export async function requireAiAdmin(
  request: NextRequest,
): Promise<{ user: User; kind: SessionUserKind; canManageSecrets: boolean } | null> {
  const detailed = await getSessionUserDetailed(request);
  if (!detailed || !isAdminRole(detailed.user.role)) return null;
  return {
    user: detailed.user,
    kind: detailed.kind,
    canManageSecrets: canManageAiSecrets(detailed.kind),
  };
}
