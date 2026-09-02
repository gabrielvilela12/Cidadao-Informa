import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText, Map as MapIcon, User, LogOut, BarChart3, List, X, Sparkles, ChevronDown, ChevronLeft, Users, ShieldCheck, BellRing, Crown, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CidadaoBrand } from './CidadaoBrand';
import { AccessibilityIcon as A11yIcon } from './AccessibilityIcon';
import type { AdminScreenPermission } from '../services/serverPermissionService';
import { getRoleDisplayName, getRolePortalLabel } from '../types/auth';

export function Sidebar() {
  const { role, logout, user, hasAdminScreen, isMobileMenuOpen, toggleMobileMenu, isSidebarCollapsed, toggleSidebarCollapsed } = useApp();
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
    { to: '/acessibilidade', icon: A11yIcon, label: 'Acessibilidade' },
  ];

  const adminLinks = [
    {
      id: 'atendimento',
      label: 'Atendimento',
      links: [
        { to: '/admin/solicitacoes', icon: List, label: 'Fila de Solicitações', permission: undefined },
        { to: '/admin/alertas', icon: BellRing, label: 'Alertas de recorrência', permission: undefined },
        { to: '/admin/cidadaos', icon: Users, label: 'Cidadãos', permission: 'CITIZENS' as AdminScreenPermission },
      ],
    },
    {
      id: 'gestao',
      label: 'Gestão',
      links: [
        { to: '/admin/usuarios', icon: ShieldCheck, label: 'Usuários e permissões', permission: 'USER_MANAGEMENT' as AdminScreenPermission },
        { to: '/admin/relatorios', icon: FileText, label: 'Relatórios', permission: 'REPORTS' as AdminScreenPermission },
      ],
    },
    {
      id: 'inteligencia',
      label: 'Inteligência',
      links: [
        { to: '/admin/mapa', icon: MapIcon, label: 'Mapa Estratégico', permission: undefined },
        { to: '/admin/ia', icon: Sparkles, label: 'IA', permission: 'AI' as AdminScreenPermission },
      ],
    },
  ];

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    atendimento: true,
    gestao: true,
    inteligencia: true,
  });
  const ownerLinks = role === 'platform_owner'
    ? [{ to: '/backoffice', icon: Crown, label: 'Backoffice' }]
    : role === 'establishment_owner'
      ? [{ to: '/admin-dono', icon: Building2, label: 'Painel do Diretor' }]
      : [];
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const closeMobileMenu = () => {
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  const linkClassName = (isActive: boolean, nested = false) =>
    `flex items-center gap-3 rounded-lg py-3 text-sm font-semibold transition-all ${nested ? 'ml-3 px-4' : 'px-4'} ${isActive
      ? 'bg-blue-600 text-white shadow-[0_7px_16px_rgba(19,81,180,0.2)]'
      : 'text-slate-600 hover:bg-[#EAF2FF] hover:text-[#1351B4]'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/*
        Sidebar.

        O estado oculto precisa de `invisible` junto do `-translate-x-full`: so
        empurrar para fora da tela mantem os 10 controles no fluxo de foco e na
        arvore de acessibilidade. No celular isso fazia o primeiro Tab de toda
        pagina cair no botao "Fechar menu", fora da tela.

        `visibility` entra na transicao para o slide de saida continuar sendo
        visto: a propriedade so vira `hidden` ao fim dos 300ms.
      */}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-[#D3DDEA] bg-white shadow-[4px_0_18px_rgba(35,65,110,0.03)] transform transition-[transform,visibility] duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 visible' : isSidebarCollapsed ? '-translate-x-full invisible' : '-translate-x-full invisible md:translate-x-0 md:visible'}`}>

        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-[#D9E1EC] px-6">
          <CidadaoBrand compact iconClassName="size-11" />
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="group hidden size-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[#0758BD] shadow-sm transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-md md:flex"
            title="Recolher sidebar"
            aria-label="Recolher sidebar"
          >
            <ChevronLeft aria-hidden="true" size={22} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            onClick={toggleMobileMenu}
            className="flex size-10 items-center justify-center rounded-lg border border-[#CDD8E7] bg-white text-[#0758BD] shadow-sm transition-colors hover:bg-[#EAF2FF] hover:text-[#1351B4] md:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-7 pb-2 pt-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {getRolePortalLabel(role)}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4">
          {role === 'citizen' ? citizenLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={closeMobileMenu}
                className={({ isActive }) => linkClassName(isActive)}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            )) : role === 'platform_owner' ? (
              <>
                {ownerLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    onClick={closeMobileMenu}
                    className={({ isActive }) => linkClassName(isActive)}
                  >
                    <link.icon size={18} />
                    <span>{link.label}</span>
                  </NavLink>
                ))}

                <NavLink
                  to="/acessibilidade"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => `${linkClassName(isActive)} mt-auto`}
                >
                  <A11yIcon size={18} />
                  <span>Acessibilidade</span>
                </NavLink>
              </>
            ) : (
              <>
                {ownerLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    onClick={closeMobileMenu}
                    className={({ isActive }) => linkClassName(isActive)}
                  >
                    <link.icon size={18} />
                    <span>{link.label}</span>
                  </NavLink>
                ))}

                <NavLink
                  to="/admin"
                  end
                  onClick={closeMobileMenu}
                  className={({ isActive }) => linkClassName(isActive)}
                >
                  <BarChart3 size={18} />
                  <span>Dashboard Executivo</span>
                </NavLink>

                {adminLinks.map((group) => {
                  const isExpanded = expandedGroups[group.id];
                  const visibleLinks = group.links.filter((link) => !link.permission || hasAdminScreen(link.permission));
                  if (visibleLinks.length === 0) return null;

                  return (
                    <section key={group.id} className="pt-2">
                      <button
                        type="button"
                        onClick={() => setExpandedGroups((current) => ({
                          ...current,
                          [group.id]: !current[group.id],
                        }))}
                        aria-expanded={isExpanded}
                        aria-controls={`sidebar-group-${group.id}`}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1351B4]"
                      >
                        <ChevronDown
                          aria-hidden="true"
                          size={15}
                          className={`shrink-0 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                        />
                        <span>{group.label}</span>
                      </button>

                      <div
                        id={`sidebar-group-${group.id}`}
                        className={`mt-0.5 space-y-1 ${isExpanded ? '' : 'hidden'}`}
                      >
                        {visibleLinks.map((link) => (
                          <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={closeMobileMenu}
                            className={({ isActive }) => linkClassName(isActive, true)}
                          >
                            <link.icon size={17} />
                            <span>{link.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </section>
                  );
                })}

                <NavLink
                  to="/acessibilidade"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => `${linkClassName(isActive)} mt-auto`}
                >
                  <A11yIcon size={18} />
                  <span>Acessibilidade</span>
                </NavLink>
              </>
            )}
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
              <p className="text-xs text-slate-500 truncate">{user?.email || getRoleDisplayName(role)}</p>
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
