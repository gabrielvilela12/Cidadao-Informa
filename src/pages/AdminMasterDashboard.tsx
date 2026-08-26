import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Crown,
  CreditCard,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { api, type PlatformOverview } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';

type SubscriptionRow = PlatformOverview['establishmentSubscriptions'][number];

const roleModel = [
  {
    label: 'Donos',
    route: '/admin-master',
    description: 'Dono da plataforma, controla assinaturas, pagamentos e usuários globais.',
    icon: Crown,
    color: 'bg-amber-50 text-amber-700',
  },
  {
    label: 'Admin-dono',
    route: '/admin-dono',
    description: 'Diretor ou dono do estabelecimento, gerencia equipe e operação local.',
    icon: UserCog,
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    label: 'Admin',
    route: '/admin',
    description: 'Servidor autorizado, cuida da fila, mapa, relatórios e atendimentos.',
    icon: ShieldCheck,
    color: 'bg-blue-50 text-blue-700',
  },
  {
    label: 'Cidadão',
    route: '/',
    description: 'Solicita serviços, acompanha protocolos e acessa o portal público.',
    icon: Users,
    color: 'bg-slate-100 text-slate-700',
  },
];

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'Ativa';
  if (normalized === 'trial') return 'Teste';
  if (normalized === 'overdue') return 'Inadimplente';
  if (normalized === 'blocked') return 'Bloqueada';
  if (normalized === 'canceled') return 'Cancelada';
  return status || 'Indefinida';
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'trial') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (normalized === 'overdue') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (normalized === 'blocked' || normalized === 'canceled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function periodLabel(value: string | null) {
  if (!value) return 'Sem ciclo';
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

  const kpis = [
    {
      label: 'Usuários totais',
      value: overview?.totalUsers ?? 0,
      hint: `${overview?.citizens ?? 0} cidadãos cadastrados`,
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'White-labels',
      value: overview?.establishments ?? 0,
      hint: `${overview?.activeEstablishments ?? 0} ativos`,
      icon: Building2,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Assinaturas ativas',
      value: overview?.activeSubscriptions ?? 0,
      hint: `${overview?.overdueSubscriptions ?? 0} inadimplentes`,
      icon: ShieldCheck,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Receita mensal',
      value: formatCurrency(overview?.monthlyRecurringRevenue ?? 0),
      hint: `${formatCurrency(overview?.pendingRevenue ?? 0)} pendente`,
      icon: CreditCard,
      color: 'bg-violet-50 text-violet-700',
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
              <p className="text-sm font-medium text-slate-600">Admin Master</p>
              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">Controle da Plataforma</h1>
              <p className="mt-1 text-sm text-slate-600">Gabriel Vilela gerencia white-labels, assinaturas, pagamentos e usuários.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadOverview}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-[#0758BD] shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : undefined} />
            Atualizar
          </button>
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

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          {roleModel.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
                <div className="flex items-start gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{item.label}</h2>
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600">{item.route}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="flex flex-col gap-3 border-b border-[#E3EAF3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-black">White-labels e Assinaturas</h2>
              <p className="mt-1 text-sm text-slate-600">{rows.length} registro(s) no filtro atual</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-[230px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar prefeitura"
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
                <option value="overdue">Inadimplentes</option>
                <option value="blocked">Bloqueadas</option>
                <option value="canceled">Canceladas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#F7F9FC] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Estabelecimento</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Assinatura</th>
                  <th className="px-4 py-3">Mensalidade</th>
                  <th className="px-4 py-3">Ciclo</th>
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
                    <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      Nenhum white-label encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <AdminMasterSignal
            icon={<AlertTriangle size={22} />}
            label="Pagamentos em aberto"
            value={overview?.pendingPayments ?? 0}
            tone="amber"
          />
          <AdminMasterSignal
            icon={<CalendarClock size={22} />}
            label="Assinaturas inadimplentes"
            value={overview?.overdueSubscriptions ?? 0}
            tone="red"
          />
          <AdminMasterSignal
            icon={<Crown size={22} />}
            label="Donos da plataforma"
            value={overview?.platformOwners ?? 0}
            tone="blue"
          />
        </section>
      </div>
    </div>
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
        <p className="text-xs text-slate-500">Vencimento dia {row.billingDay}</p>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex rounded border px-2.5 py-1 text-xs font-black ${statusClass(row.subscriptionStatus)}`}>
          {statusLabel(row.subscriptionStatus)}
        </span>
      </td>
      <td className="px-4 py-4 font-black text-emerald-700">{formatCurrency(row.monthlyAmount)}</td>
      <td className="px-4 py-4 text-slate-600">{periodLabel(row.currentPeriodEnd)}</td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{row.owners} diretor</span>
          <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{row.admins} servidor</span>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">{row.citizens} cidadão</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-3 font-bold text-[#0758BD] transition-colors hover:bg-blue-50"
        >
          <CreditCard size={16} />
          Assinatura
        </button>
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
  tone: 'amber' | 'red' | 'blue';
}) {
  const colors = {
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
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
