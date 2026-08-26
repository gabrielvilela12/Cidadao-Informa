import { useMemo } from 'react';
import type React from 'react';
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Menu,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useProtocols } from '../hooks/useProtocols';
import { type Protocol } from '../constants';
import { countSlaLate } from '../utils/sla';

function statusMatches(status: Protocol['status'], expected: 'open' | 'analysis' | 'resolved') {
  const groups = {
    open: ['Aberto', 'Open'],
    analysis: ['Em Análise', 'InProgress'],
    resolved: ['Concluído', 'Resolved', 'Closed'],
  };
  return groups[expected].includes(status);
}

export function AdminOwnerDashboard() {
  const { user, toggleMobileMenu } = useApp();
  const { protocols, loading } = useProtocols('establishment_owner');

  const counts = useMemo(() => ({
    total: protocols.length,
    open: protocols.filter((item) => statusMatches(item.status, 'open')).length,
    analysis: protocols.filter((item) => statusMatches(item.status, 'analysis')).length,
    resolved: protocols.filter((item) => statusMatches(item.status, 'resolved')).length,
    late: countSlaLate(protocols),
  }), [protocols]);

  const resolutionRate = counts.total ? Math.round((counts.resolved / counts.total) * 100) : 0;

  const kpis = [
    { label: 'Solicitações locais', value: counts.total, icon: FileText, color: 'bg-blue-50 text-blue-700' },
    { label: 'Em análise', value: counts.analysis, icon: Timer, color: 'bg-amber-50 text-amber-700' },
    { label: 'Em atraso', value: counts.late, icon: AlertCircle, color: 'bg-red-50 text-red-700' },
    { label: 'Resolvidas', value: `${resolutionRate}%`, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#CDD8E7] bg-white text-[#1351B4] md:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-600">Admin-dono</p>
              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">Painel do Diretor</h1>
              <p className="mt-1 text-sm text-slate-600">
                {user?.establishment_name || 'Estabelecimento vinculado'} sob gestão de {user?.full_name || 'diretor'}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(19,81,180,0.18)] hover:bg-blue-700"
            >
              <BarChart3 size={17} />
              Operação
            </Link>
            <Link
              to="/admin/solicitacoes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-[#0758BD] hover:bg-blue-50"
            >
              <FileText size={17} />
              Fila
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <article key={kpi.label} className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
                <div className="flex items-start gap-3">
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${kpi.color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-black">{loading ? '...' : kpi.value}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)] xl:col-span-2">
            <div className="flex items-center gap-3">
              <Building2 className="text-blue-700" size={24} />
              <div>
                <h2 className="font-black">Estabelecimento</h2>
                <p className="mt-1 text-sm text-slate-600">{user?.establishment_name || 'Sem estabelecimento vinculado'}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <OwnerMetric label="Chamados abertos" value={counts.open} />
              <OwnerMetric label="Em andamento" value={counts.analysis} />
              <OwnerMetric label="Concluídos" value={counts.resolved} />
            </div>
          </article>

          <article className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-700" size={24} />
              <div>
                <h2 className="font-black">Gestão local</h2>
                <p className="mt-1 text-sm text-slate-600">Diretor, servidores e cidadãos do mesmo white-label.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Link to="/admin/relatorios" className="flex min-h-11 items-center justify-between rounded-lg border border-[#CDD8E7] px-3 text-sm font-bold text-slate-700 hover:bg-blue-50">
                Relatórios locais
                <FileText size={16} />
              </Link>
              <Link to="/admin/mapa" className="flex min-h-11 items-center justify-between rounded-lg border border-[#CDD8E7] px-3 text-sm font-bold text-slate-700 hover:bg-blue-50">
                Mapa estratégico
                <Building2 size={16} />
              </Link>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 divide-y divide-[#D8E1ED] rounded-lg border border-[#CDD8E7] bg-white px-5 py-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <OwnerIndicator icon={<Users size={23} />} value="Admin-dono" label="perfil do diretor" />
          <OwnerIndicator icon={<ShieldCheck size={23} />} value="Admin" label="servidores operacionais" />
          <OwnerIndicator icon={<FileText size={23} />} value="Cidadão" label="usuários do portal" />
        </section>
      </div>
    </div>
  );
}

function OwnerMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#E3EAF3] bg-[#F7F9FC] p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function OwnerIndicator({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-4 px-4 py-3">
      <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{icon}</span>
      <div>
        <p className="text-lg font-black">{value}</p>
        <p className="text-xs text-slate-600">{label}</p>
      </div>
    </div>
  );
}
