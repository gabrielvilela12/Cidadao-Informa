import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText, Map as MapIcon, Briefcase, User, LogOut, Settings, BarChart3, List, AlertTriangle, Accessibility as A11yIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Sidebar() {
  const { role, setRole, logout, user } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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

  return (
    <aside className="w-72 bg-[#111418] border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
            <MapIcon size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">HackGov PCD</h1>
            <p className="text-[#9dabb9] text-sm">{role === 'citizen' ? 'Portal do Cidadão' : 'Portal do Servidor'}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-[#283039] hover:text-white'
                }`
              }
            >
              <link.icon size={20} />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <button
          onClick={() => setRole(role === 'citizen' ? 'admin' : 'citizen')}
          className="w-full mb-4 flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Trocar para {role === 'citizen' ? 'Servidor' : 'Cidadão'}
        </button>

        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#283039] hover:text-white transition-all mb-2" href="#">
          <User size={20} />
          <span className="font-medium">Perfil</span>
        </a>

        <div className="flex items-center gap-3 px-4 pt-4">
          <div
            className="aspect-square bg-cover rounded-full size-10 border-2 border-blue-600"
            style={{ backgroundImage: `url(${role === 'citizen' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsRG8TpK0sJgZKQoOrjWThkXl7_7XgGCi9kQijq2eba-7TxB8H-UeR3Z-Jt64iTiHkxc8qh2k5_9pGW56GrUsiRU-C8JMI-vlhq3g8IcdvHlY_aUq7FJjDmbhnH7M5fffR_e4pRZHEl9FqRR2LUFBcR9UlpQjO8fpP003R9WTkDfYhh5S_0zR3E4i4AUEktjtrisgjdBaRr6cnAgzrSnTNQW90hO8XMbITrk4oNH8L3ZmqsuMdIBxX0pJU9A9GC573qUoc4-0hJXQ' : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3kervDGjs-N_PW2749Jo1ar89mbYawBP5fKzA590bLoOzrmDFK5ZxRvvLvqaqBn1dWv3MKOfcdpIj4N97velGs7_aCSuhVeadHijr2aJT7rzpS_zLi1Chxw-5COcQBeTf-0YOewG4-SunIRbA5VBX8-g7-6kI1S4lHiBKs6JQlfwnxChXvjAjw_YxyBP55McPLMVGjrLnLSz3HYqDBPnQAyX0Oe6w7GCbXxZT9SYQuMwOH3G-YQTCQweY4jZbvR0h9a2mBLnClI'})` }}
          />
          <div className="flex flex-col">
            <p className="text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis w-40">{user?.full_name || 'Usuário'}</p>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-blue-600 text-left"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
