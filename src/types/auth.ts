export type UserRole = 'platform_owner' | 'establishment_owner' | 'admin' | 'citizen';

export function normalizeRole(role: unknown): UserRole {
  const normalized = String(role ?? '').trim().toLowerCase().replaceAll('_', '-');

  switch (normalized) {
    case 'platform-owner':
    case 'admin-master':
    case 'master':
    case 'dono':
    case 'donos':
    case 'owner':
      return 'platform_owner';
    case 'establishment-owner':
    case 'admin-dono':
    case 'owner-admin':
    case 'dono-estabelecimento':
    case 'diretor':
      return 'establishment_owner';
    case 'admin':
    case 'servidor':
      return 'admin';
    default:
      return 'citizen';
  }
}

export function isPlatformOwner(role: UserRole) {
  return role === 'platform_owner';
}

export function canAccessOperationalAdmin(role: UserRole) {
  return role === 'platform_owner' || role === 'establishment_owner' || role === 'admin';
}

export function getDefaultRouteForRole(role: UserRole) {
  if (role === 'platform_owner') return '/admin-master';
  if (role === 'establishment_owner') return '/admin-dono';
  if (role === 'admin') return '/admin';
  return '/';
}

export function getRoleDisplayName(role: UserRole) {
  if (role === 'platform_owner') return 'Dono da Plataforma';
  if (role === 'establishment_owner') return 'Diretor do Estabelecimento';
  if (role === 'admin') return 'Servidor';
  return 'Cidadão';
}

export function getRolePortalLabel(role: UserRole) {
  if (role === 'platform_owner') return 'Admin Master';
  if (role === 'establishment_owner') return 'Portal do Diretor';
  if (role === 'admin') return 'Portal do Servidor';
  return 'Portal do Cidadão';
}
