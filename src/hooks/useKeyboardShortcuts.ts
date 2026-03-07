import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface ShortcutDefinition {
  key: string;
  label: string;
  description: string;
  path: string;
  roles: ('citizen' | 'admin')[];
}

export const CITIZEN_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+1', label: 'Alt + 1', description: 'Dashboard', path: '/', roles: ['citizen'] },
  { key: 'Alt+2', label: 'Alt + 2', description: 'Nova Solicitação', path: '/nova-solicitacao', roles: ['citizen'] },
  { key: 'Alt+3', label: 'Alt + 3', description: 'Mapa', path: '/mapa', roles: ['citizen'] },
  { key: 'Alt+4', label: 'Alt + 4', description: 'Meus Protocolos', path: '/meus-protocolos', roles: ['citizen'] },
  { key: 'Alt+5', label: 'Alt + 5', description: 'Serviços', path: '/servicos', roles: ['citizen'] },
];

export const ADMIN_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+1', label: 'Alt + 1', description: 'Dashboard', path: '/admin', roles: ['admin'] },
  { key: 'Alt+2', label: 'Alt + 2', description: 'Solicitações', path: '/admin/solicitacoes', roles: ['admin'] },
  { key: 'Alt+3', label: 'Alt + 3', description: 'Mapa', path: '/admin/mapa', roles: ['admin'] },
  { key: 'Alt+4', label: 'Alt + 4', description: 'Relatórios', path: '/admin/relatorios', roles: ['admin'] },
];

export const SHARED_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'Alt+P', label: 'Alt + P', description: 'Perfil', path: '/perfil', roles: ['citizen', 'admin'] },
  { key: 'Alt+A', label: 'Alt + A', description: 'Acessibilidade', path: '/acessibilidade', roles: ['citizen', 'admin'] },
];

export function useKeyboardShortcuts(role: 'citizen' | 'admin') {
  const navigate = useNavigate();

  useEffect(() => {
    const shortcuts = [
      ...(role === 'citizen' ? CITIZEN_SHORTCUTS : ADMIN_SHORTCUTS),
      ...SHARED_SHORTCUTS,
    ];

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
  }, [role, navigate]);
}
