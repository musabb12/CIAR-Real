import bcrypt from 'bcryptjs';
import type { User, UserRole } from '@/types';
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  getDemoAdminUser,
} from '@/lib/demo-auth';

type StoredUser = User & { password: string };

type LocalAuthState = {
  usersByEmail: Map<string, StoredUser>;
  seeded: boolean;
};

const STORE_KEY = '__ciarLocalAuthStore__';

function getState(): LocalAuthState {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: LocalAuthState };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = { usersByEmail: new Map(), seeded: false };
  }
  return g[STORE_KEY];
}

async function ensureSeeded(): Promise<void> {
  const state = getState();
  if (state.seeded) return;
  const email = DEMO_ADMIN_EMAIL.trim().toLowerCase();
  if (!state.usersByEmail.has(email)) {
    const admin = getDemoAdminUser();
    const password = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);
    state.usersByEmail.set(email, { ...admin, password });
  }
  state.seeded = true;
}

export async function getLocalUserByEmail(email: string): Promise<StoredUser | null> {
  await ensureSeeded();
  return getState().usersByEmail.get(email.trim().toLowerCase()) ?? null;
}

export async function createLocalUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: UserRole;
}): Promise<User> {
  await ensureSeeded();
  const normalizedEmail = input.email.trim().toLowerCase();
  const state = getState();

  if (state.usersByEmail.has(normalizedEmail)) {
    throw new Error('An account with this email already exists');
  }

  const id = `local-user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user: StoredUser = {
    id,
    name: input.name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: input.phone?.trim() || null,
    avatar: null,
    role: input.role ?? 'USER',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  state.usersByEmail.set(normalizedEmail, user);
  const { password: _p, ...safe } = user;
  return safe;
}

export function toSafeLocalUser(user: StoredUser): User {
  const { password: _p, ...safe } = user;
  return safe;
}
