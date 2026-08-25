import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminAccessProfile, AdminScreenPermission } from '../services/serverPermissionService';

/**
 * Definição dos papéis (roles) suportados pela aplicação.
 */
export type UserRole = 'citizen' | 'admin' | 'master';

/**
 * Representação do Usuário autenticado na aplicação.
 */
interface AppUser {
  id: string;
  cpf: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

/**
 * Interface que define o contrato do Contexto Principal da Aplicação.
 * Centraliza estados como autenticação, dados do usuário e UI (menu mobile).
 */
interface AppContextType {
  role: UserRole;
  isAuthenticated: boolean;
  user: AppUser | null;
  adminAccess: AdminAccessProfile | null;
  adminAccessLoading: boolean;
  hasAdminScreen: (screen: AdminScreenPermission) => boolean;
  refreshAdminAccess: () => Promise<void>;
  loginSuccess: (token: string, user: AppUser, role: UserRole) => void;
  logout: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function normalizeRole(role: unknown): UserRole {
  if (role === 'master') return 'master';
  return role === 'admin' ? 'admin' : 'citizen';
}

/**
 * Sessão otimista lida do localStorage.
 *
 * `loginSuccess` já gravava o usuário em `cidadaoinforma_user`, mas nada lia
 * esse cache: a aplicação inteira ficava atrás do spinner até `getMe()`
 * responder e só então as páginas montavam e buscavam os protocolos - duas
 * viagens ao servidor em série. Com o backend frio na Vercel isso custava mais
 * de 20 segundos de tela branca.
 *
 * Agora o cache renderiza a tela na hora e `getMe()` valida em segundo plano.
 * Se o token não valer mais, a sessão é derrubada no retorno da validação.
 *
 * O papel vindo do cache serve só para escolher o que desenhar. Ele nunca foi
 * fronteira de segurança: o escopo dos dados é decidido no servidor a partir do
 * token, então um `role` adulterado no localStorage muda a interface e não o
 * que a API entrega.
 */
function readCachedSession(): { user: AppUser; role: UserRole } | null {
  try {
    if (!localStorage.getItem('cidadaoinforma_token')) return null;

    const raw = localStorage.getItem('cidadaoinforma_user');
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AppUser> | null;
    if (!parsed?.id || !parsed.email) return null;

    return {
      user: {
        id: parsed.id,
        cpf: parsed.cpf ?? '',
        full_name: parsed.full_name ?? '',
        email: parsed.email,
        phone: parsed.phone,
        created_at: parsed.created_at,
      },
      role: normalizeRole(localStorage.getItem('cidadaoinforma_role')),
    };
  } catch {
    // JSON corrompido no cache não deve impedir o login.
    return null;
  }
}

function readCachedAdminAccess(): AdminAccessProfile | null {
  try {
    const raw = localStorage.getItem('cidadaoinforma_admin_access');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminAccessProfile>;
    if (!Array.isArray(parsed.states) || !Array.isArray(parsed.screens)) return null;
    return { states: parsed.states, screens: parsed.screens };
  } catch {
    return null;
  }
}

function isSameUser(a: AppUser | null, b: AppUser): boolean {
  return a !== null
    && a.id === b.id
    && a.cpf === b.cpf
    && a.full_name === b.full_name
    && a.email === b.email
    && a.phone === b.phone
    && a.created_at === b.created_at;
}

/**
 * Provedor de Contexto Global da Aplicação (AppProvider).
 * Deve ser instanciado no nível mais alto da árvore de componentes.
 * 
 * Gerencia o ciclo de vida da sessão do usuário recuperando os tokens armazenados
 * localmente (`localStorage`) no momento de montagem da aplicação.
 * 
 * @param children Elementos React filhos que terão acesso a este contexto.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  // Lido uma única vez, antes do primeiro render.
  const [cachedSession] = useState(readCachedSession);
  const [role, setRoleState] = useState<UserRole>(cachedSession?.role ?? 'citizen');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(cachedSession));
  const [user, setUser] = useState<AppUser | null>(cachedSession?.user ?? null);
  const [adminAccess, setAdminAccess] = useState<AdminAccessProfile | null>(() =>
    cachedSession?.role !== 'citizen' ? readCachedAdminAccess() : null,
  );
  const [adminAccessLoading, setAdminAccessLoading] = useState(cachedSession?.role !== 'citizen');
  // Só bloqueia a árvore quando há token sem usuário em cache: aí não há o que
  // desenhar antes da resposta. Visitante anônimo e sessão em cache renderizam
  // no primeiro frame.
  const [loading, setLoading] = useState(
    () => !cachedSession && Boolean(localStorage.getItem('cidadaoinforma_token')),
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const toggleSidebarCollapsed = () => setIsSidebarCollapsed(prev => !prev);

  useEffect(() => {
    const token = localStorage.getItem('cidadaoinforma_token');

    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const validateSession = async () => {
      try {
        // Valida a sessão pela API Java. Quando há sessão em cache isto roda em
        // segundo plano, em paralelo com o fetch de protocolos das páginas.
        const { api } = await import('../services/api');
        const userData = await api.getMe();
        if (cancelled) return;

        const validatedUser: AppUser = {
          id: userData.userId,
          cpf: userData.cpf,
          full_name: userData.name,
          email: userData.email,
          phone: userData.phone,
          created_at: userData.createdAt,
        };
        const validatedRole = normalizeRole(userData.role);

        localStorage.setItem('cidadaoinforma_user', JSON.stringify(validatedUser));
        localStorage.setItem('cidadaoinforma_role', validatedRole);

        // Mantém a referência quando nada mudou: useProtocols observa a
        // identidade de `user`, e um objeto novo dispararia um segundo fetch
        // dos protocolos a cada carregamento.
        setUser((current) => (isSameUser(current, validatedUser) ? current : validatedUser));
        setRoleState(validatedRole);
        setIsAuthenticated(true);
      } catch (error) {
        if (cancelled) return;
        // Sessão inválida: limpa o cache local e derruba a sessão otimista.
        console.warn('Sessão inválida, limpando cache...', error);
        localStorage.removeItem('cidadaoinforma_token');
        localStorage.removeItem('cidadaoinforma_user');
        localStorage.removeItem('cidadaoinforma_role');
        localStorage.removeItem('cidadaoinforma_admin_access');
        setIsAuthenticated(false);
        setUser(null);
        setAdminAccess(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshAdminAccess = async () => {
    if (!localStorage.getItem('cidadaoinforma_token')) return;
    setAdminAccessLoading(true);
    try {
      const { serverPermissionService } = await import('../services/serverPermissionService');
      const access = await serverPermissionService.myAccess();
      localStorage.setItem('cidadaoinforma_admin_access', JSON.stringify(access));
      setAdminAccess(access);
    } catch (error) {
      console.warn('Não foi possível atualizar as permissões administrativas.', error);
      setAdminAccess(null);
      localStorage.removeItem('cidadaoinforma_admin_access');
    } finally {
      setAdminAccessLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role === 'citizen' || !user?.id) {
      setAdminAccess(null);
      setAdminAccessLoading(false);
      localStorage.removeItem('cidadaoinforma_admin_access');
      return;
    }
    void refreshAdminAccess();
  }, [isAuthenticated, role, user?.id]);

  const loginSuccess = (token: string, user: AppUser, role: UserRole) => {
    const validatedRole = normalizeRole(role);
    localStorage.setItem('cidadaoinforma_token', token);
    localStorage.setItem('cidadaoinforma_user', JSON.stringify(user));
    localStorage.setItem('cidadaoinforma_role', validatedRole);
    localStorage.removeItem('cidadaoinforma_admin_access');
    setAdminAccess(null);
    setAdminAccessLoading(validatedRole !== 'citizen');
    setUser(user);
    setRoleState(validatedRole);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('cidadaoinforma_token');
    localStorage.removeItem('cidadaoinforma_user');
    localStorage.removeItem('cidadaoinforma_role');
    localStorage.removeItem('cidadaoinforma_admin_access');
    setIsAuthenticated(false);
    setUser(null);
    setAdminAccess(null);
    setAdminAccessLoading(false);
  };

  const hasAdminScreen = (screen: AdminScreenPermission) =>
    role !== 'citizen' && Boolean(adminAccess?.screens.includes(screen));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101922] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ role, isAuthenticated, user, adminAccess, adminAccessLoading, hasAdminScreen, refreshAdminAccess, loginSuccess, logout, isMobileMenuOpen, toggleMobileMenu, isSidebarCollapsed, toggleSidebarCollapsed }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
