import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText, Map as MapIcon, Briefcase, User, LogOut, BarChart3, List, Accessibility as A11yIcon, X, Database, PanelLeftClose } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CidadaoBrand } from './CidadaoBrand';

export function Sidebar() {
  const { role, logout, user, isMobileMenuOpen, toggleMobileMenu, isSidebarCollapsed, toggleSidebarCollapsed } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const citizenLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/nova-solicitacao', icon: PlusCircle, label: 'Nova Solicitação' },
    { to: '/meus-protocolos', icon: FileText, label: 'Meus Protocolos' },
    { to: '/mapa', icon: MapIcon, label: 'Mapa' },
    { to: '/servicos', icon: Briefcase, label: 'Serviços' },
    { to: '/acessibilidade', icon: A11yIcon, label: 'Acessibilidade' },
  ];

  const adminLinks = [
    { to: '/admin', icon: BarChart3, label: 'Dashboard Executivo' },
    { to: '/admin/solicitacoes', icon: List, label: 'Fila de Solicitações' },
    { to: '/admin/mapa', icon: MapIcon, label: 'Mapa Estratégico' },
    { to: '/admin/relatorios', icon: FileText, label: 'Relatórios' },
    { to: '/admin/ai-logs', icon: Database, label: 'Logs IA' },
    { to: '/acessibilidade', icon: A11yIcon, label: 'Acessibilidade' },
  ];

  const links = role === 'citizen' ? citizenLinks : adminLinks;
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-[#D3DDEA] bg-white shadow-[4px_0_18px_rgba(35,65,110,0.03)] transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : isSidebarCollapsed ? '-translate-x-full' : '-translate-x-full md:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-[#D9E1EC] px-6">
          <CidadaoBrand compact />
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-[#EAF2FF] hover:text-[#1351B4] md:flex"
            title="Recolher sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
          <button
            onClick={toggleMobileMenu}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-[#EAF2FF] hover:text-[#1351B4] md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-7 pb-2 pt-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {role === 'citizen' ? 'Portal do Cidadão' : 'Portal do Servidor'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={() => { if (isMobileMenuOpen) toggleMobileMenu(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${isActive
                  ? 'bg-blue-600 text-white shadow-[0_7px_16px_rgba(19,81,180,0.2)]'
                  : 'text-slate-600 hover:bg-[#EAF2FF] hover:text-[#1351B4]'
                }`
              }
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: profile + logout */}
        <div className="border-t border-[#D9E1EC] p-4">
          <NavLink
            to="/perfil"
            onClick={() => { if (isMobileMenuOpen) toggleMobileMenu(); }}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all mb-1 ${isActive
                ? 'bg-blue-600 text-white shadow-[0_7px_16px_rgba(19,81,180,0.2)]'
                : 'text-slate-600 hover:bg-[#EAF2FF] hover:text-[#1351B4]'
              }`
            }
          >
            <User size={18} />
            <span>Perfil</span>
          </NavLink>

          {/* User card */}
          <div className="mt-1 flex items-center gap-3 rounded-lg border border-[#CDD8E7] bg-white px-3 py-3 shadow-sm">
            <div className="size-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg shadow-blue-600/30">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#111827]">{user?.full_name || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || (role === 'citizen' ? 'Cidadão' : 'Servidor')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-[#FDE9E7] hover:text-[#C00F0C]"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
