import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Definição dos papéis (roles) suportados pela aplicação.
 */
type UserRole = 'citizen' | 'admin';

/**
 * Representação do Usuário autenticado na aplicação.
 */
interface AppUser {
  id: string;
  cpf: string;
  full_name: string;
  email: string;
  created_at?: string;
}

/**
 * Interface que define o contrato do Contexto Principal da Aplicação.
 * Centraliza estados como autenticação, dados do usuário e UI (menu mobile).
 */
interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  user: AppUser | null;
  loginSuccess: (token: string, user: AppUser, role: UserRole) => void;
  logout: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
  const [role, setRoleState] = useState<UserRole>('citizen');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('zeladoria_token');
      const savedRole = localStorage.getItem('zeladoria_role') as UserRole | null;

      if (token) {
        try {
          // Valida a sessão via Supabase (funciona em produção e local)
          const { api } = await import('../services/api');
          const userData = await api.getMe();

          setUser({
            id: userData.userId,
            cpf: userData.cpf,
            full_name: userData.name,
            email: userData.email,
            created_at: userData.createdAt
          });
          setRoleState((userData.role as UserRole) || savedRole || 'citizen');
          setIsAuthenticated(true);
        } catch (error) {
          // Sessão inválida: limpa o cache local
          console.warn("Sessão inválida, limpando cache...", error);
          localStorage.removeItem('zeladoria_token');
          localStorage.removeItem('zeladoria_user');
          localStorage.removeItem('zeladoria_role');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  const loginSuccess = (token: string, user: AppUser, role: UserRole) => {
    localStorage.setItem('zeladoria_token', token);
    localStorage.setItem('zeladoria_user', JSON.stringify(user));
    localStorage.setItem('zeladoria_role', role);
    setUser(user);
    setRoleState(role);
    setIsAuthenticated(true);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const logout = () => {
    localStorage.removeItem('zeladoria_token');
    localStorage.removeItem('zeladoria_user');
    localStorage.removeItem('zeladoria_role');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101922] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ role, setRole, isAuthenticated, user, loginSuccess, logout, isMobileMenuOpen, toggleMobileMenu }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
