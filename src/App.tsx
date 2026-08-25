import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AppProvider, useApp } from './context/AppContext';
import { ProtocolsProvider } from './context/ProtocolsContext';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { NewRequest } from './pages/NewRequest';
import { CitizenMap } from './pages/CitizenMap';
import { CitizenProtocols } from './pages/CitizenProtocols';
import { CitizenServices } from './pages/CitizenServices';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMap } from './pages/AdminMap';
import { AdminRequestsQueue } from './pages/AdminRequestsQueue';
import { AdminReports } from './pages/AdminReports';
import { AdminReportDetails } from './pages/AdminReportDetails';
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
import { ChevronRight } from 'lucide-react';
import { TermsOfUse } from './pages/TermsOfUse';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AiChatbot } from './components/AiChatbot';

const Transparency = lazy(() =>
  import('./pages/Transparency').then((module) => ({ default: module.Transparency })),
);

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
  const isMapRoute = routeLocation.pathname === '/mapa' || routeLocation.pathname === '/admin/mapa';

  useKeyboardShortcuts(role);

  // A transparência é uma experiência pública e independente do painel, mesmo
  // quando o visitante já possui uma sessão autenticada no navegador.
  if (routeLocation.pathname === '/transparencia') {
    return (
      <>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F5F8FC] font-semibold text-slate-600">Carregando transparência…</div>}>
          <Transparency />
        </Suspense>
        <AiChatbot />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
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
        <AiChatbot />
      </>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[#080d12] text-white font-sans">
      <Sidebar />
      {isSidebarCollapsed && (
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className={`group fixed left-4 ${isMapRoute ? 'top-20' : 'top-4'} z-[700] hidden size-11 items-center justify-center rounded-full border border-blue-700 bg-blue-600 text-white shadow-xl transition-all hover:bg-blue-700 hover:shadow-2xl md:flex`}
          title="Abrir sidebar"
          aria-label="Abrir sidebar"
        >
          <ChevronRight aria-hidden="true" size={22} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
      <main className={`ml-0 flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-0' : 'md:ml-72'}`}>
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
          <Route path="/admin/relatorios/:id" element={role === 'admin' ? <AdminReportDetails /> : <Navigate to="/" replace />} />
          <Route path="/admin/ai-logs" element={role === 'admin' ? <AiLogsPage /> : <Navigate to="/" replace />} />

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
      <AiChatbot />
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
        {/* Dentro do AppProvider: o cache depende do usuário da sessão para
            saber quando buscar, reiniciar e limpar. */}
        <ProtocolsProvider>
          <Router>
            <AppContent />
          </Router>
        </ProtocolsProvider>
      </AppProvider>
    </A11yProvider>
  );
}
