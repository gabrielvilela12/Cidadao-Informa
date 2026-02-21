import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type UserRole = 'citizen' | 'admin';

interface AppUser {
  id: string;
  cpf: string;
  full_name: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  user: AppUser | null;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('citizen');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = (session: any) => {
    if (session && session.user) {
      const meta = session.user.user_metadata || {};

      setUser({
        id: session.user.id,
        cpf: meta.cpf || '',
        full_name: meta.full_name || 'Usuário',
      });
      // Currently enforcing citizen role based on metadata, but keeping the setter local for testing both panels
      setRoleState(meta.role === 'admin' ? 'admin' : 'citizen');
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
    <AppContext.Provider value={{ role, setRole, isAuthenticated, user, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
