import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  Loader2,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { api, type EstablishmentApplication, type PlatformOverview } from '../services/api';
import { useApp } from '../context/AppContext';

type SubscriptionRow = PlatformOverview['establishmentSubscriptions'][number];

function subscriptionStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'Ativa';
  if (normalized === 'trial') return 'Teste';
  if (normalized === 'overdue') return 'Pendente';
  if (normalized === 'blocked') return 'Bloqueada';
  if (normalized === 'canceled') return 'Cancelada';
  return status || 'Indefinida';
}

function subscriptionStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'trial') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (normalized === 'overdue') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (normalized === 'blocked' || normalized === 'canceled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function applicationStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'pending') return 'Pendente';
  if (normalized === 'approved') return 'Aprovada';
  if (normalized === 'rejected') return 'Recusada';
  return status || 'Indefinida';
}

function applicationStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'pending') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (normalized === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'rejected') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function dateLabel(value: string | null | undefined) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminMasterDashboard() {
  const { toggleMobileMenu } = useApp();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [reviewingId, setReviewingId] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOverview(await api.getPlatformOverview());
    } catch (err) {
      console.error('Erro ao carregar admin master:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o painel master.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const rows = useMemo(() => {
    const items = overview?.establishmentSubscriptions ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus = status === 'all' || item.subscriptionStatus.toLowerCase() === status;
      const matchesQuery = !normalizedQuery
        || item.establishmentName.toLowerCase().includes(normalizedQuery)
        || item.city.toLowerCase().includes(normalizedQuery)
        || item.state.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [overview, query, status]);

  const applications = overview?.establishmentApplications ?? [];
  const pendingApplications = applications.filter((item) => item.status.toLowerCase() === 'pending');

  const approveApplication = async (application: EstablishmentApplication) => {
    setReviewingId(application.id);
    setError('');
    try {
      setOverview(await api.approveEstablishmentApplication(application.id));
    } catch (err) {
      console.error('Erro ao aprovar prefeitura:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível aprovar a prefeitura.');
    } finally {
      setReviewingId('');
    }
  };

  const rejectApplication = async (application: EstablishmentApplication) => {
    if (!window.confirm(`Recusar o cadastro de ${application.establishmentName}?`)) return;
    setReviewingId(application.id);
    setError('');
    try {
      setOverview(await api.rejectEstablishmentApplication(application.id));
    } catch (err) {
      console.error('Erro ao recusar prefeitura:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível recusar a prefeitura.');
    } finally {
      setReviewingId('');
    }
  };

  const kpis = [
    {
      label: 'Usuários totais',
      value: overview?.totalUsers ?? 0,
      hint: `${overview?.citizens ?? 0} cidadãos cadastrados`,
      icon: UserRound,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Prefeituras ativas',
      value: overview?.activeEstablishments ?? 0,
      hint: `${overview?.establishments ?? 0} white-label(s) no total`,
      icon: Building2,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Solicitações pendentes',
      value: overview?.pendingApplications ?? pendingApplications.length,
      hint: `${applications.length} registro(s) de prefeitura`,
      icon: ClipboardCheck,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Donos da plataforma',
      value: overview?.platformOwners ?? 0,
      hint: 'Gabriel e Luis controlam a base',
      icon: Crown,
      color: 'bg-sky-50 text-sky-700',
    },
  ];

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
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
              <p className="text-sm font-medium text-slate-600">Backoffice</p>
              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">Controle da Plataforma</h1>
              <p className="mt-1 text-sm text-slate-600">Gabriel e Luis acompanham cadastros, white-labels e usuários globais.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
            <Link
              to="/cadastro-prefeitura"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-[#0758BD] shadow-sm transition-colors hover:bg-blue-50"
            >
              <Building2 size={17} />
              Cadastro prefeitura
            </Link>
            <button
              type="button"
              onClick={loadOverview}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-[#0758BD] shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : undefined} />
              Atualizar
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <article key={kpi.label} className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
                <div className="flex items-start gap-3">
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${kpi.color}`}>
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-600">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-black">{loading && !overview ? '...' : kpi.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{kpi.hint}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="flex flex-col gap-3 border-b border-[#E3EAF3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-black">Solicitações de prefeituras</h2>
              <p className="mt-1 text-sm text-slate-600">{pendingApplications.length} pendente(s) para análise</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-[#F7F9FC] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Prefeitura</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Campanha</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-5 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF4]">
                {applications.map((application) => (
                  <ApplicationTableRow
                    key={application.id}
                    application={application}
                    reviewing={reviewingId === application.id}
                    onApprove={approveApplication}
                    onReject={rejectApplication}
                  />
                ))}
                {!loading && applications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      Nenhuma prefeitura cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="flex flex-col gap-3 border-b border-[#E3EAF3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-black">Estabelecimentos aprovados</h2>
              <p className="mt-1 text-sm text-slate-600">{rows.length} registro(s) no filtro atual</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-[230px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar estabelecimento"
                  className="h-11 w-full rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                />
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativas</option>
                <option value="trial">Teste</option>
                <option value="overdue">Pendentes</option>
                <option value="blocked">Bloqueadas</option>
                <option value="canceled">Canceladas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-[#F7F9FC] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Estabelecimento</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Assinatura</th>
                  <th className="px-4 py-3">Campanha</th>
                  <th className="px-4 py-3">Usuários</th>
                  <th className="px-5 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF4]">
                {rows.map((row) => (
                  <SubscriptionTableRow key={row.subscriptionId} row={row} />
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      Nenhum estabelecimento aprovado encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <AdminMasterSignal
            icon={<ShieldCheck size={22} />}
            label="Assinaturas operacionais"
            value={overview?.activeSubscriptions ?? 0}
            tone="green"
          />
          <AdminMasterSignal
            icon={<Building2 size={22} />}
            label="Diretores cadastrados"
            value={overview?.establishmentOwners ?? 0}
            tone="blue"
          />
          <AdminMasterSignal
            icon={<ClipboardCheck size={22} />}
            label="Planos base disponíveis"
            value={overview?.plans.length ?? 0}
            tone="amber"
          />
        </section>
      </div>
    </div>
  );
}

function ApplicationTableRow({
  application,
  reviewing,
  onApprove,
  onReject,
}: {
  application: EstablishmentApplication;
  reviewing: boolean;
  onApprove: (application: EstablishmentApplication) => void;
  onReject: (application: EstablishmentApplication) => void;
}) {
  const isPending = application.status.toLowerCase() === 'pending';

  return (
    <tr className="hover:bg-blue-50/40">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="size-3 rounded-full" style={{ backgroundColor: application.primaryColor || '#0758BD' }} />
          <div>
            <p className="font-black text-[#0B1B33]">{application.establishmentName}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{application.city}/{application.state}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="font-bold">{application.planName}</p>
        <p className="text-xs text-slate-500">Plano escolhido no cadastro</p>
      </td>
      <td className="px-4 py-4">
        <p className="font-bold">{application.requesterName || 'Responsável não informado'}</p>
        <p className="text-xs text-slate-500">{application.requesterEmail || 'Sem e-mail'}</p>
      </td>
      <td className="px-4 py-4">
        <p className="font-bold">{application.campaignName || 'Campanha padrão'}</p>
        <p className="text-xs text-slate-500">
          {application.campaignScope === 'state'
            ? `Estado: ${application.state}`
            : `Cidade: ${application.city}/${application.state}`}
        </p>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex rounded border px-2.5 py-1 text-xs font-black ${applicationStatusClass(application.status)}`}>
          {applicationStatusLabel(application.status)}
        </span>
      </td>
      <td className="px-4 py-4 text-slate-600">{dateLabel(application.createdAt)}</td>
      <td className="px-5 py-4">
        {isPending ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApprove(application)}
              disabled={reviewing}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reviewing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Aprovar
            </button>
            <button
              type="button"
              onClick={() => onReject(application)}
              disabled={reviewing}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle size={16} />
              Recusar
            </button>
          </div>
        ) : application.createdEstablishmentId ? (
          <Link
            to={`/backoffice/estabelecimentos/${encodeURIComponent(application.createdEstablishmentId)}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-3 font-bold text-[#0758BD] transition-colors hover:bg-blue-50"
          >
            Abrir
            <ArrowRight size={16} />
          </Link>
        ) : (
          <span className="text-sm font-semibold text-slate-500">Sem ação</span>
        )}
      </td>
    </tr>
  );
}

function SubscriptionTableRow({ row }: { row: SubscriptionRow }) {
  return (
    <tr className="hover:bg-blue-50/40">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="size-3 rounded-full" style={{ backgroundColor: row.primaryColor || '#0758BD' }} />
          <div>
            <p className="font-black text-[#0B1B33]">{row.establishmentName}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{row.city}/{row.state}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="font-bold">{row.planName}</p>
        <p className="text-xs text-slate-500">Base sem valor definido</p>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex rounded border px-2.5 py-1 text-xs font-black ${subscriptionStatusClass(row.subscriptionStatus)}`}>
          {subscriptionStatusLabel(row.subscriptionStatus)}
        </span>
      </td>
      <td className="px-4 py-4">
        <p className="font-bold">{row.campaignName || 'Sem campanha'}</p>
        <p className="text-xs text-slate-500">
          {row.campaignScope === 'state'
            ? `Estado: ${row.campaignState || row.state}`
            : `Cidade: ${row.campaignCity || row.city}/${row.campaignState || row.state}`}
        </p>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{row.owners} diretor</span>
          <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{row.admins} servidor</span>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">{row.citizens} cidadão</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <Link
          to={`/backoffice/estabelecimentos/${encodeURIComponent(row.establishmentId)}`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-3 font-bold text-[#0758BD] transition-colors hover:bg-blue-50"
        >
          Abrir
          <ArrowRight size={16} />
        </Link>
      </td>
    </tr>
  );
}

function AdminMasterSignal({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'amber' | 'blue' | 'green';
}) {
  const colors = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <article className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
      <div className="flex items-center gap-4">
        <span className={`flex size-11 items-center justify-center rounded-lg ${colors[tone]}`}>{icon}</span>
        <div>
          <p className="text-2xl font-black">{value}</p>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
        </div>
      </div>
    </article>
  );
}
