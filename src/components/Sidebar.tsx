import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText, Map as MapIcon, Briefcase, User, LogOut, BarChart3, List, Accessibility as A11yIcon, X, MapPin, Shield, UserCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Sidebar() {
  const { role, setRole, logout, user, isMobileMenuOpen, toggleMobileMenu } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSwitchRole = () => {
    if (role === 'citizen') {
      setRole('admin');
      navigate('/admin');
    } else {
      setRole('citizen');
      navigate('/');
    }
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
      <aside className={`w-72 bg-[#080d12] border-r border-white/8 flex flex-col h-screen fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-blue-600 shadow-lg shadow-blue-600/40">
              <MapPin size={16} />
            </div>
            <span className="font-bold tracking-tight text-white">
              Cidadão <span className="text-blue-400">Informa</span>
            </span>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {role === 'citizen' ? 'Portal do Cidadão' : 'Portal do Servidor'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={() => { if (isMobileMenuOpen) toggleMobileMenu(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: profile + logout */}
        <div className="p-4 border-t border-white/5">
          <NavLink
            to="/perfil"
            onClick={() => { if (isMobileMenuOpen) toggleMobileMenu(); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <User size={18} />
            <span>Perfil</span>
          </NavLink>

          {/* Role switch button */}
          <button
            onClick={handleSwitchRole}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-2 ${role === 'citizen'
              ? 'text-slate-400 hover:bg-amber-500/10 hover:text-amber-400 border border-dashed border-white/8 hover:border-amber-500/30'
              : 'text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 border border-dashed border-white/8 hover:border-blue-500/30'
              }`}
            title={role === 'citizen' ? 'Trocar para modo Servidor' : 'Trocar para modo Cidadão'}
          >
            {role === 'citizen' ? <Shield size={18} /> : <UserCircle size={18} />}
            <span>{role === 'citizen' ? 'Entrar como Servidor' : 'Voltar para Cidadão'}</span>
          </button>

          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/8 mt-1">
            <div className="size-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg shadow-blue-600/30">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || (role === 'citizen' ? 'Cidadão' : 'Servidor')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10 shrink-0"
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
