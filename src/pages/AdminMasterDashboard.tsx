import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertTriangle,
  Building2,
  CalendarClock,
  Crown,
  CreditCard,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  X,
  Users,
} from 'lucide-react';
import { api, type CreatePlatformSubscriptionInput, type PlatformOverview } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';

type SubscriptionRow = PlatformOverview['establishmentSubscriptions'][number];

type CreateSubscriptionForm = {
  establishmentName: string;
  document: string;
  city: string;
  state: string;
  primaryColor: string;
  logoUrl: string;
  campaignName: string;
  campaignScope: string;
  planName: string;
  subscriptionStatus: string;
  monthlyAmount: string;
  billingDay: string;
  ownerName: string;
  ownerEmail: string;
  ownerCpf: string;
  ownerPhone: string;
  ownerPassword: string;
};

const initialCreateSubscriptionForm: CreateSubscriptionForm = {
  establishmentName: '',
  document: '',
  city: '',
  state: '',
  primaryColor: '#0758BD',
  logoUrl: '',
  campaignName: '',
  campaignScope: 'city',
  planName: 'Essencial Prefeitura',
  subscriptionStatus: 'active',
  monthlyAmount: '1490',
  billingDay: '10',
  ownerName: '',
  ownerEmail: '',
  ownerCpf: '',
  ownerPhone: '',
  ownerPassword: '',
};

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState<CreateSubscriptionForm>(initialCreateSubscriptionForm);

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

  const openCreateForm = () => {
    setCreateError('');
    setShowCreateForm(true);
  };

  const closeCreateForm = () => {
    if (createSaving) return;
    setShowCreateForm(false);
    setCreateError('');
  };

  const updateCreateForm = (field: keyof CreateSubscriptionForm, value: string) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateSubscription = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateSaving(true);
    setCreateError('');

    try {
      const monthlyAmount = Number(createForm.monthlyAmount.replace(',', '.'));
      const billingDay = Number.parseInt(createForm.billingDay, 10);

      if (!Number.isFinite(monthlyAmount)) {
        throw new Error('Informe uma mensalidade válida.');
      }
      if (!Number.isInteger(billingDay)) {
        throw new Error('Informe um dia de vencimento válido.');
      }

      const ownerCpf = createForm.ownerCpf.replace(/\D/g, '');
      const ownerPhone = createForm.ownerPhone.replace(/\D/g, '');
      const hasOwnerData = Boolean(
        createForm.ownerName.trim()
        || createForm.ownerEmail.trim()
        || ownerCpf
        || ownerPhone
        || createForm.ownerPassword.trim(),
      );

      const payload: CreatePlatformSubscriptionInput = {
        establishmentName: createForm.establishmentName.trim(),
        document: createForm.document.trim() || undefined,
        city: createForm.city.trim(),
        state: createForm.state.trim().toUpperCase(),
        primaryColor: createForm.primaryColor,
        logoUrl: createForm.logoUrl.trim() || undefined,
        campaignName: createForm.campaignName.trim() || undefined,
        campaignScope: createForm.campaignScope,
        planName: createForm.planName.trim(),
        subscriptionStatus: createForm.subscriptionStatus,
        monthlyAmount,
        billingDay,
        ...(hasOwnerData ? {
          ownerName: createForm.ownerName.trim(),
          ownerEmail: createForm.ownerEmail.trim(),
          ownerCpf,
          ownerPhone: ownerPhone || undefined,
          ownerPassword: createForm.ownerPassword,
        } : {}),
      };

      const updatedOverview = await api.createPlatformSubscription(payload);
      setOverview(updatedOverview);
      setCreateForm({ ...initialCreateSubscriptionForm });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Erro ao cadastrar assinatura:', err);
      setCreateError(err instanceof Error ? err.message : 'Não foi possível cadastrar a assinatura.');
    } finally {
      setCreateSaving(false);
    }
  };

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

          <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-[#0758BD] shadow-sm transition-colors hover:bg-blue-50"
            >
              <Plus size={17} />
              Nova assinatura
            </button>
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
              <h2 className="font-black">Estabelecimentos e Assinaturas</h2>
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
                <option value="overdue">Inadimplentes</option>
                <option value="blocked">Bloqueadas</option>
                <option value="canceled">Canceladas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1140px] text-left text-sm">
              <thead className="bg-[#F7F9FC] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Estabelecimento</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Assinatura</th>
                  <th className="px-4 py-3">Campanha</th>
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
                    <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
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

      {showCreateForm && (
        <CreateSubscriptionModal
          error={createError}
          form={createForm}
          saving={createSaving}
          onChange={updateCreateForm}
          onClose={closeCreateForm}
          onSubmit={handleCreateSubscription}
        />
      )}
    </div>
  );
}

function CreateSubscriptionModal({
  error,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  error: string;
  form: CreateSubscriptionForm;
  saving: boolean;
  onChange: (field: keyof CreateSubscriptionForm, value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const inputClassName = 'h-11 w-full rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400';
  const labelClassName = 'text-xs font-black uppercase tracking-[0.08em] text-slate-500';
  const colorPickerValue = /^#[0-9A-Fa-f]{6}$/.test(form.primaryColor) ? form.primaryColor : '#0758BD';

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-subscription-title"
        className="flex max-h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white text-[#0B1B33] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E3EAF3] px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-600">Admin Master</p>
            <h2 id="create-subscription-title" className="mt-1 text-xl font-black">Nova assinatura</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#CDD8E7] text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            title="Fechar cadastro"
            aria-label="Fechar cadastro"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <section>
            <h3 className="text-sm font-black">White-label</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className={labelClassName}>Prefeitura</span>
                <input
                  required
                  value={form.establishmentName}
                  onChange={(event) => onChange('establishmentName', event.target.value)}
                  className={inputClassName}
                  placeholder="Prefeitura de Ribeirão Preto"
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>CNPJ ou documento</span>
                <input
                  value={form.document}
                  onChange={(event) => onChange('document', event.target.value)}
                  className={inputClassName}
                  placeholder="Somente se já tiver"
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Cidade</span>
                <input
                  required
                  value={form.city}
                  onChange={(event) => onChange('city', event.target.value)}
                  className={inputClassName}
                  placeholder="Ribeirão Preto"
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>UF</span>
                <input
                  required
                  maxLength={2}
                  value={form.state}
                  onChange={(event) => onChange('state', event.target.value.toUpperCase())}
                  className={inputClassName}
                  placeholder="SP"
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Cor principal</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={colorPickerValue}
                    onChange={(event) => onChange('primaryColor', event.target.value)}
                    className="h-11 w-14 shrink-0 rounded-lg border border-[#CDD8E7] bg-white p-1"
                    title="Selecionar cor principal"
                    aria-label="Selecionar cor principal"
                  />
                  <input
                    required
                    value={form.primaryColor}
                    onChange={(event) => onChange('primaryColor', event.target.value)}
                    className={inputClassName}
                    placeholder="#0758BD"
                  />
                </div>
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Logo URL</span>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(event) => onChange('logoUrl', event.target.value)}
                  className={inputClassName}
                  placeholder="https://..."
                />
              </label>
            </div>
          </section>

          <section className="mt-6 border-t border-[#E3EAF3] pt-4">
            <h3 className="text-sm font-black">Campanha regional</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="space-y-1.5 md:col-span-2">
                <span className={labelClassName}>Nome da campanha</span>
                <input
                  value={form.campaignName}
                  onChange={(event) => onChange('campaignName', event.target.value)}
                  className={inputClassName}
                  placeholder="Campanha Ribeirão Acessível"
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className={labelClassName}>Cobertura</span>
                <select
                  value={form.campaignScope}
                  onChange={(event) => onChange('campaignScope', event.target.value)}
                  className={inputClassName}
                >
                  <option value="city">Cidade da prefeitura</option>
                  <option value="state">Estado inteiro</option>
                </select>
              </label>
            </div>
          </section>

          <section className="mt-6 border-t border-[#E3EAF3] pt-4">
            <h3 className="text-sm font-black">Assinatura</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="space-y-1.5 md:col-span-2">
                <span className={labelClassName}>Plano</span>
                <input
                  required
                  value={form.planName}
                  onChange={(event) => onChange('planName', event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Mensalidade</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthlyAmount}
                  onChange={(event) => onChange('monthlyAmount', event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Vencimento</span>
                <input
                  required
                  type="number"
                  min="1"
                  max="28"
                  value={form.billingDay}
                  onChange={(event) => onChange('billingDay', event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className={labelClassName}>Status</span>
                <select
                  value={form.subscriptionStatus}
                  onChange={(event) => onChange('subscriptionStatus', event.target.value)}
                  className={inputClassName}
                >
                  <option value="active">Ativa</option>
                  <option value="trial">Teste</option>
                  <option value="overdue">Inadimplente</option>
                  <option value="blocked">Bloqueada</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </label>
            </div>
          </section>

          <section className="mt-6 border-t border-[#E3EAF3] pt-4">
            <h3 className="text-sm font-black">Diretor responsável opcional</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className={labelClassName}>Nome</span>
                <input
                  value={form.ownerName}
                  onChange={(event) => onChange('ownerName', event.target.value)}
                  className={inputClassName}
                  placeholder="Nome do admin-dono"
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>E-mail</span>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(event) => onChange('ownerEmail', event.target.value)}
                  className={inputClassName}
                  placeholder="diretor@prefeitura.gov.br"
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>CPF</span>
                <input
                  inputMode="numeric"
                  value={form.ownerCpf}
                  onChange={(event) => onChange('ownerCpf', event.target.value)}
                  className={inputClassName}
                  placeholder="Somente números"
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Telefone</span>
                <input
                  inputMode="tel"
                  value={form.ownerPhone}
                  onChange={(event) => onChange('ownerPhone', event.target.value)}
                  className={inputClassName}
                  placeholder="DDD + número"
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className={labelClassName}>Senha inicial</span>
                <input
                  type="password"
                  value={form.ownerPassword}
                  onChange={(event) => onChange('ownerPassword', event.target.value)}
                  className={inputClassName}
                  placeholder="Mínimo de 6 caracteres"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E3EAF3] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0758BD] px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            Salvar assinatura
          </button>
        </div>
      </form>
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
      <td className="px-4 py-4">
        <p className="font-bold">{row.campaignName || 'Sem campanha'}</p>
        <p className="text-xs text-slate-500">
          {row.campaignScope === 'state'
            ? `Estado: ${row.campaignState || row.state}`
            : `Cidade: ${row.campaignCity || row.city}/${row.campaignState || row.state}`}
        </p>
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
        <Link
          to={`/admin-master/estabelecimentos/${encodeURIComponent(row.establishmentId)}`}
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
