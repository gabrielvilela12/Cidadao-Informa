import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { AdminScreenPermission } from '../services/serverPermissionService';
import type { UserRole } from '../context/AppContext';

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
  { key: 'Alt+1', label: 'Alt + 1', description: 'Dashboard', path: '/admin', roles: ['admin', 'master'] },
  { key: 'Alt+2', label: 'Alt + 2', description: 'Solicitações', path: '/admin/solicitacoes', roles: ['admin', 'master'] },
  { key: 'Alt+3', label: 'Alt + 3', description: 'Mapa', path: '/admin/mapa', roles: ['admin', 'master'] },
  { key: 'Alt+4', label: 'Alt + 4', description: 'Relatórios', path: '/admin/relatorios', roles: ['admin', 'master'], permission: 'REPORTS' },
];

export const SHARED_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+P', label: 'Alt + P', description: 'Perfil', path: '/perfil', roles: ['citizen', 'admin', 'master'] },
  { key: 'Alt+A', label: 'Alt + A', description: 'Acessibilidade', path: '/acessibilidade', roles: ['citizen', 'admin', 'master'] },
];

export function useKeyboardShortcuts(role: UserRole) {
  const navigate = useNavigate();
  const { hasAdminScreen } = useApp();

  useEffect(() => {
    const shortcuts = [
      ...(role === 'citizen' ? CITIZEN_SHORTCUTS : ADMIN_SHORTCUTS),
      ...SHARED_SHORTCUTS,
    ].filter((shortcut) => !shortcut.permission || hasAdminScreen(shortcut.permission));

    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      // Avoid interfering with inputs/textareas
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
