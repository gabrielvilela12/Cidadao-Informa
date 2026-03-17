import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { ProtocolDetails } from './pages/ProtocolDetails';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Profile } from './pages/Profile';
import { Accessibility } from './pages/Accessibility';
import { A11yProvider } from './context/A11yContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { PublicProtocol } from './pages/PublicProtocol';

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
  const { role, isAuthenticated } = useApp();

  useKeyboardShortcuts(role);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login initialMode={false} />} />
        <Route path="/cadastro" element={<Login initialMode={true} />} />
        <Route path="/p/:id" element={<PublicProtocol />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080d12] text-white font-sans">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden transition-all duration-300">
        <Routes>
          {/* Default Route when authenticated */}
          <Route path="/login" element={<Navigate to={role === 'citizen' ? '/' : '/admin'} replace />} />

          {/* Citizen Routes */}
          <Route path="/" element={<CitizenDashboard />} />
          <Route path="/nova-solicitacao" element={<NewRequest />} />
          <Route path="/mapa" element={<CitizenMap />} />
          <Route path="/meus-protocolos" element={<CitizenProtocols />} />
          <Route path="/servicos" element={<CitizenServices />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/solicitacoes" element={<AdminRequestsQueue />} />
          <Route path="/admin/mapa" element={<AdminMap />} />
          <Route path="/admin/relatorios" element={<AdminReports />} />

          {/* Shared Routes */}
          <Route path="/perfil" element={<Profile />} />
          <Route path="/protocolo/:id" element={<ProtocolDetails />} />
          <Route path="/p/:id" element={<PublicProtocol />} />
          <Route path="/acessibilidade" element={<Accessibility />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={role === 'citizen' ? '/' : '/admin'} replace />} />
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
