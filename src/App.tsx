/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
import { Accessibility } from './pages/Accessibility';
import { A11yProvider } from './context/A11yContext';

function AppContent() {
  const { role, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#101922] text-white font-sans">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
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
          <Route path="/protocolo/:id" element={<ProtocolDetails />} />
          <Route path="/acessibilidade" element={<Accessibility />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={role === 'citizen' ? '/' : '/admin'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

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
