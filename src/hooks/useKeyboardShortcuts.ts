import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { AdminScreenPermission } from '../services/serverPermissionService';
import type { UserRole } from '../types/auth';

export interface ShortcutDefinition {
  key: string;
  label: string;
  description: string;
  path: string;
  roles: UserRole[];
  permission?: AdminScreenPermission;
}

export const CITIZEN_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+1', label: 'Alt + 1', description: 'Dashboard', path: '/', roles: ['citizen'] },
  { key: 'Alt+2', label: 'Alt + 2', description: 'Nova Solicitação', path: '/nova-solicitacao', roles: ['citizen'] },
  { key: 'Alt+3', label: 'Alt + 3', description: 'Mapa', path: '/mapa', roles: ['citizen'] },
  { key: 'Alt+4', label: 'Alt + 4', description: 'Meus Protocolos', path: '/meus-protocolos', roles: ['citizen'] },
];

export const ADMIN_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+1', label: 'Alt + 1', description: 'Dashboard', path: '/admin', roles: ['admin', 'establishment_owner', 'platform_owner'] },
  { key: 'Alt+2', label: 'Alt + 2', description: 'Solicitações', path: '/admin/solicitacoes', roles: ['admin', 'establishment_owner', 'platform_owner'] },
  { key: 'Alt+3', label: 'Alt + 3', description: 'Mapa', path: '/admin/mapa', roles: ['admin', 'establishment_owner', 'platform_owner'] },
  { key: 'Alt+4', label: 'Alt + 4', description: 'Relatórios', path: '/admin/relatorios', roles: ['admin', 'establishment_owner', 'platform_owner'], permission: 'REPORTS' },
  { key: 'Alt+5', label: 'Alt + 5', description: 'Alertas', path: '/admin/alertas', roles: ['admin', 'establishment_owner', 'platform_owner'] },
];

export const OWNER_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+0', label: 'Alt + 0', description: 'Painel do Diretor', path: '/admin-dono', roles: ['establishment_owner'] },
];

export const MASTER_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+0', label: 'Alt + 0', description: 'Admin Master', path: '/admin-master', roles: ['platform_owner'] },
];

export const SHARED_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+P', label: 'Alt + P', description: 'Perfil', path: '/perfil', roles: ['citizen', 'admin', 'establishment_owner', 'platform_owner'] },
  { key: 'Alt+A', label: 'Alt + A', description: 'Acessibilidade', path: '/acessibilidade', roles: ['citizen', 'admin', 'establishment_owner', 'platform_owner'] },
];

export function getShortcutsForRole(role: UserRole) {
  if (role === 'platform_owner') return [...MASTER_SHORTCUTS, ...ADMIN_SHORTCUTS];
  if (role === 'establishment_owner') return [...OWNER_SHORTCUTS, ...ADMIN_SHORTCUTS];
  if (role === 'admin') return ADMIN_SHORTCUTS;
  return CITIZEN_SHORTCUTS;
}

export function useKeyboardShortcuts(role: UserRole) {
  const navigate = useNavigate();
  const { hasAdminScreen } = useApp();

  useEffect(() => {
    const shortcuts = [
      ...getShortcutsForRole(role),
      ...SHARED_SHORTCUTS,
    ].filter((shortcut) => !shortcut.permission || hasAdminScreen(shortcut.permission));

    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const key = e.key.toUpperCase();

      for (const shortcut of shortcuts) {
        const shortcutKey = shortcut.key.replace('Alt+', '').toUpperCase();
        if (key === shortcutKey) {
          e.preventDefault();
          navigate(shortcut.path);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [role, navigate, hasAdminScreen]);
}
