import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AppProvider, useApp } from './context/AppContext';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { NewRequest } from './pages/NewRequest';
import { CitizenMap } from './pages/CitizenMap';
import { CitizenProtocols } from './pages/CitizenProtocols';
import { CitizenServices } from './pages/CitizenServices';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMap } from './pages/AdminMap';
import { AdminRequestsQueue } from './pages/AdminRequestsQueue';
import { AdminReports } from './pages/AdminReports';
import { AiLogsPage } from './pages/AiLogsPage';
import { ProtocolDetails } from './pages/ProtocolDetails';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Profile } from './pages/Profile';
import { Accessibility } from './pages/Accessibility';
import { A11yProvider } from './context/A11yContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { PublicProtocol } from './pages/PublicProtocol';
import { NotFound } from './pages/NotFound';
import { PanelLeftOpen } from 'lucide-react';
import { Finance } from './pages/Finance';
import { TermsOfUse } from './pages/TermsOfUse';
import { PrivacyPolicy } from './pages/PrivacyPolicy';

function getHashRoutePath() {
  const hashPath = window.location.hash.replace(/^#/, '');
  return hashPath.startsWith('/') ? hashPath : '';
}

function useHashRoutePath() {
  const [hashPath, setHashPath] = useState(getHashRoutePath);

  useEffect(() => {
    const syncHashPath = () => setHashPath(getHashRoutePath());
    window.addEventListener('hashchange', syncHashPath);
    return () => window.removeEventListener('hashchange', syncHashPath);
  }, []);

  return hashPath;
}

/**
 * Componente principal de roteamento e layout da aplicação.
 * Responsável por gerenciar a navegação baseada no estado de autenticação e no perfil (role) do usuário.
 * 
 * - Se o usuário não estiver autenticado, restringe o acesso apenas à rota `/login`.
 * - Se autenticado, renderiza o layout principal com a `Sidebar` e o conteúdo específico das rotas.
 * - Trata o direcionamento padrão (Citizens para `/` e Admins para `/admin`).
 * 
 * @returns O layout e as rotas mapeadas de acordo com as permissões do usuário em sessão.
 */
function AppContent() {
  const { role, isAuthenticated, isSidebarCollapsed, toggleSidebarCollapsed } = useApp();
  const location = useLocation();
  const hashPath = useHashRoutePath();
  const routeLocation = hashPath ? { ...location, pathname: hashPath, search: '', hash: '' } : location;

  useKeyboardShortcuts(role);

  if (!isAuthenticated) {
    return (
      <Routes location={routeLocation}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login initialMode={false} />} />
        <Route path="/cadastro" element={<Login initialMode={true} />} />
        <Route path="/termos-de-uso" element={<TermsOfUse />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/acessibilidade" element={<Accessibility />} />
        <Route path="/p/:id" element={<PublicProtocol />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080d12] text-white font-sans">
      <Sidebar />
      {isSidebarCollapsed && (
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className="hidden md:flex fixed left-4 top-4 z-40 size-10 items-center justify-center rounded-xl bg-[#0d1520]/90 border border-white/10 text-slate-300 shadow-xl backdrop-blur hover:text-white hover:bg-[#111c29] transition-colors"
          title="Abrir sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}
      <main className={`flex-1 ml-0 ${isSidebarCollapsed ? 'md:ml-0' : 'md:ml-72'} flex flex-col h-screen overflow-hidden transition-all duration-300`}>
        <Routes location={routeLocation}>
          {/* Default Route when authenticated */}
          <Route path="/login" element={<Navigate to={role === 'citizen' ? '/' : '/admin'} replace />} />

          {/* Citizen Routes */}
          <Route path="/" element={<CitizenDashboard />} />
          <Route path="/nova-solicitacao" element={<NewRequest />} />
          <Route path="/mapa" element={<CitizenMap />} />
          <Route path="/meus-protocolos" element={<CitizenProtocols />} />
          <Route path="/servicos" element={<CitizenServices />} />

          <Route path="/admin" element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
          <Route path="/admin/solicitacoes" element={role === 'admin' ? <AdminRequestsQueue /> : <Navigate to="/" replace />} />
          <Route path="/admin/mapa" element={role === 'admin' ? <AdminMap /> : <Navigate to="/" replace />} />
          <Route path="/admin/relatorios" element={role === 'admin' ? <AdminReports /> : <Navigate to="/" replace />} />
          <Route path="/admin/ai-logs" element={role === 'admin' ? <AiLogsPage /> : <Navigate to="/" replace />} />
          <Route path="/finance" element={role === 'admin' ? <Finance /> : <Navigate to="/" replace />} />

          {/* Shared Routes */}
          <Route path="/perfil" element={<Profile />} />
          <Route path="/protocolo/:id" element={<ProtocolDetails />} />
          <Route path="/p/:id" element={<PublicProtocol />} />
          <Route path="/acessibilidade" element={<Accessibility />} />
          <Route path="/termos-de-uso" element={<TermsOfUse />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

/**
 * Ponto de entrada (Entrypoint) do React para a aplicação Cidadão Informa.
 * Engloba a aplicação com os provedores de contexto necessários (Acessibilidade, Aplicação global e Roteador).
 * 
 * @returns O componente App que provê os contextos e renderiza o conteúdo principal.
 */
export default function App() {
  return (
    <A11yProvider>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </A11yProvider>
  );
}
