import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import { isAdminRole } from '@/lib/auth-roles';
import type { User } from '@/types';

export async function requireAdminUser(request: NextRequest): Promise<User | null> {
  const user = await getSessionUser(request);
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}
