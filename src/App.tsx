import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AppProvider, useApp } from './context/AppContext';
import { ProtocolsProvider } from './context/ProtocolsContext';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { NewRequest } from './pages/NewRequest';
import { CitizenMap } from './pages/CitizenMap';
import { CitizenProtocols } from './pages/CitizenProtocols';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMasterDashboard } from './pages/AdminMasterDashboard';
import { AdminMasterEstablishmentDetails } from './pages/AdminMasterEstablishmentDetails';
import { AdminOwnerDashboard } from './pages/AdminOwnerDashboard';
import { AdminMap } from './pages/AdminMap';
import { AdminRequestsQueue } from './pages/AdminRequestsQueue';
import { AdminRecurringAlerts } from './pages/AdminRecurringAlerts';
import { AdminReports } from './pages/AdminReports';
import { AdminReportDetails } from './pages/AdminReportDetails';
import { AiLogsPage } from './pages/AiLogsPage';
import { AdminCitizens } from './pages/AdminCitizens';
import { AdminCitizenDetails } from './pages/AdminCitizenDetails';
import { AdminPermissions } from './pages/AdminPermissions';
import { ProtocolDetails } from './pages/ProtocolDetails';
import { Login } from './pages/Login';
import { OwnerBackofficeLanding } from './pages/OwnerBackofficeLanding';
import { PrefeituraRegistration } from './pages/PrefeituraRegistration';
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
import type { AdminScreenPermission } from './services/serverPermissionService';
import { canAccessOperationalAdmin, getDefaultRouteForRole, isPlatformOwner } from './types/auth';

const Transparency = lazy(() =>
  import('./pages/Transparency').then((module) => ({ default: module.Transparency })),
);

function AdminScreenRoute({ permission, children }: { permission: AdminScreenPermission; children: ReactNode }) {
  const { role, adminAccessLoading, hasAdminScreen } = useApp();
  if (!canAccessOperationalAdmin(role)) return <Navigate to={getDefaultRouteForRole(role)} replace />;
  if (adminAccessLoading) {
    return <div className="flex h-full items-center justify-center bg-[#F4F8FC] font-semibold text-slate-600">Carregando permissões…</div>;
  }
  return hasAdminScreen(permission) ? children : <Navigate to="/admin" replace />;
}

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
 * - Trata o direcionamento padrão de cada perfil autenticado.
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

  if (routeLocation.pathname === '/cadastro-prefeitura') {
    return (
      <>
        <PrefeituraRegistration />
        <AiChatbot />
      </>
    );
  }

  if (routeLocation.pathname === '/dono') {
    return (
      <>
        <OwnerBackofficeLanding />
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
          <Route path="/login-servidor" element={<Login portal="server" />} />
          <Route path="/login-dono" element={<Login portal="owner" />} />
          <Route path="/dono" element={<OwnerBackofficeLanding />} />
          <Route path="/backoffice" element={<Login portal="owner" />} />
          <Route path="/cadastro" element={<Login initialMode={true} />} />
          <Route path="/cadastro-prefeitura" element={<PrefeituraRegistration />} />
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
          <Route path="/login" element={<Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/login-servidor" element={<Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/login-dono" element={<Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/dono" element={<OwnerBackofficeLanding />} />
          <Route path="/cadastro" element={<Navigate to={getDefaultRouteForRole(role)} replace />} />

          {/* Citizen Routes */}
          <Route path="/" element={role === 'citizen' ? <CitizenDashboard /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/nova-solicitacao" element={role === 'citizen' ? <NewRequest /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/mapa" element={role === 'citizen' ? <CitizenMap /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/meus-protocolos" element={role === 'citizen' ? <CitizenProtocols /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/servicos" element={role === 'citizen' ? <Navigate to="/nova-solicitacao" replace /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />

          {/* Owner Routes */}
          <Route path="/backoffice" element={isPlatformOwner(role) ? <AdminMasterDashboard /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/backoffice/estabelecimentos/:establishmentId" element={isPlatformOwner(role) ? <AdminMasterEstablishmentDetails /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/admin-master" element={isPlatformOwner(role) ? <AdminMasterDashboard /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/admin-master/estabelecimentos/:establishmentId" element={isPlatformOwner(role) ? <AdminMasterEstablishmentDetails /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/admin-dono" element={role === 'establishment_owner' ? <AdminOwnerDashboard /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />

          <Route path="/admin" element={canAccessOperationalAdmin(role) ? <AdminDashboard /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/admin/solicitacoes" element={canAccessOperationalAdmin(role) ? <AdminRequestsQueue /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/admin/alertas" element={canAccessOperationalAdmin(role) ? <AdminRecurringAlerts /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/admin/cidadaos" element={<AdminScreenRoute permission="CITIZENS"><AdminCitizens /></AdminScreenRoute>} />
          <Route path="/admin/cidadaos/:id" element={<AdminScreenRoute permission="CITIZENS"><AdminCitizenDetails /></AdminScreenRoute>} />
          <Route path="/admin/usuarios" element={<AdminScreenRoute permission="USER_MANAGEMENT"><AdminPermissions /></AdminScreenRoute>} />
          <Route path="/admin/permissoes" element={<AdminScreenRoute permission="USER_MANAGEMENT"><Navigate to="/admin/usuarios" replace /></AdminScreenRoute>} />
          <Route path="/admin/mapa" element={canAccessOperationalAdmin(role) ? <AdminMap /> : <Navigate to={getDefaultRouteForRole(role)} replace />} />
          <Route path="/admin/relatorios" element={<AdminScreenRoute permission="REPORTS"><AdminReports /></AdminScreenRoute>} />
          <Route path="/admin/relatorios/:id" element={<AdminScreenRoute permission="REPORTS"><AdminReportDetails /></AdminScreenRoute>} />
          <Route path="/admin/ia" element={<AdminScreenRoute permission="AI"><AiLogsPage /></AdminScreenRoute>} />
          <Route path="/admin/ai-logs" element={<AdminScreenRoute permission="AI"><Navigate to="/admin/ia" replace /></AdminScreenRoute>} />

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
      {!isMapRoute && <AiChatbot />}
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
