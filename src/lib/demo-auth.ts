import type { User } from '@/types';

/** Known demo admin used in seeds and header hints. */
export const DEMO_ADMIN_EMAIL = 'admin@realtyhub.com';
export const DEMO_ADMIN_PASSWORD = 'admin123';

const DEMO_ADMIN_USER: User = {
  id: 'demo-admin-local',
  email: DEMO_ADMIN_EMAIL,
  name: 'Admin User',
  phone: '+1-555-0001',
  avatar: null,
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function isDemoAdminCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_ADMIN_EMAIL &&
    password === DEMO_ADMIN_PASSWORD
  );
}

export function getDemoAdminUser(): User {
  return { ...DEMO_ADMIN_USER };
}
