import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  Menu,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { Protocol } from '../constants';
import { useApp } from '../context/AppContext';
import { api, type PlatformEstablishmentDetails, type PlatformPaymentRecord } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { canonicalStatus, type CanonicalStatus } from '../utils/protocolStatus';

type DetailTab = 'protocols' | 'payments';
type ProtocolStatusFilter = 'all' | CanonicalStatus;

const protocolStatusFilters: Array<{ value: ProtocolStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos os status' },
  { value: 'Aberto', label: 'Abertos' },
  { value: 'Em análise', label: 'Em análise' },
  { value: 'Concluído', label: 'Concluídos' },
  { value: 'Atrasado', label: 'Atrasados' },
];

function subscriptionStatusLabel(status: string) {
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
  if (normalized === 'active' || normalized === 'paid') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'trial' || normalized === 'pending') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (normalized === 'overdue') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (normalized === 'blocked' || normalized === 'canceled' || normalized === 'failed') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function paymentStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'paid') return 'Pago';
  if (normalized === 'pending') return 'Pendente';
  if (normalized === 'overdue') return 'Vencido';
  if (normalized === 'failed') return 'Falhou';
  if (normalized === 'canceled') return 'Cancelado';
  return status || 'Indefinido';
}

function protocolStatusClass(status: CanonicalStatus) {
  if (status === 'Aberto') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Em análise') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'Concluído') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function dateLabel(value?: string | null) {
  if (!value) return 'Sem data';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function dateTimeLabel(value?: string | null) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function periodLabel(value: string | null) {
  if (!value) return 'Sem ciclo';
  return dateTimeLabel(value).replace(',', '');
}

export function AdminMasterEstablishmentDetails() {
  const { establishmentId } = useParams();
  const navigate = useNavigate();
  const { toggleMobileMenu } = useApp();
  const [details, setDetails] = useState<PlatformEstablishmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DetailTab>('protocols');

  const loadDetails = useCallback(async () => {
    if (!establishmentId) return;
    setLoading(true);
    setError('');
    try {
      setDetails(await api.getAdminMasterEstablishmentDetails(establishmentId));
    } catch (err) {
      console.error('Erro ao carregar estabelecimento:', err);
      setDetails(null);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o estabelecimento.');
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  if (loading && !details) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-[#F4F8FC] text-sm font-semibold text-slate-600">
        <Loader2 className="mr-3 animate-spin text-[#0758BD]" size={24} />
        Carregando estabelecimento...
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-[#F4F8FC] px-6 text-center">
        <AlertCircle className="mb-4 text-red-600" size={46} />
        <h1 className="text-2xl font-black text-[#0B1B33]">Estabelecimento não encontrado</h1>
        <p className="mt-2 text-sm text-slate-600">{error || 'Não foi possível abrir este registro.'}</p>
        <button
          type="button"
          onClick={() => navigate('/admin-master')}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0758BD] px-5 text-sm font-bold text-white"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
      </div>
    );
  }

  const { establishment, protocols, payments } = details;
  const pendingPayments = payments.filter((payment) => ['pending', 'overdue'].includes(payment.status.toLowerCase()));
  const paidRevenue = payments
    .filter((payment) => payment.status.toLowerCase() === 'paid')
    .reduce((total, payment) => total + payment.amount, 0);

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
            <button
              type="button"
              onClick={() => navigate('/admin-master')}
              className="mt-1 hidden size-11 shrink-0 items-center justify-center rounded-lg border border-[#CDD8E7] bg-white text-[#0758BD] transition-colors hover:bg-blue-50 md:flex"
              title="Voltar"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-600">Admin Master / Estabelecimento</p>
              <h1 className="mt-1 truncate text-2xl font-black leading-tight sm:text-3xl">{establishment.establishmentName}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{establishment.city}/{establishment.state}</span>
                <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-black ${statusClass(establishment.subscriptionStatus)}`}>
                  {subscriptionStatusLabel(establishment.subscriptionStatus)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin-master')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-[#0758BD] shadow-sm transition-colors hover:bg-blue-50 md:hidden"
            >
              <ArrowLeft size={17} />
              Voltar
            </button>
            <button
              type="button"
              onClick={loadDetails}
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
          <Metric icon={<Building2 size={21} />} label="Plano" value={establishment.planName} hint={`Vencimento dia ${establishment.billingDay}`} tone="blue" />
          <Metric icon={<CreditCard size={21} />} label="Mensalidade" value={formatCurrency(establishment.monthlyAmount)} hint={`Ciclo até ${periodLabel(establishment.currentPeriodEnd)}`} tone="emerald" />
          <Metric icon={<ReceiptText size={21} />} label="Pagamentos" value={String(payments.length)} hint={`${pendingPayments.length} pendente(s)`} tone="amber" />
          <Metric icon={<FileText size={21} />} label="Protocolos" value={String(protocols.length)} hint={`${establishment.admins} servidor(es), ${establishment.citizens} cidadão(s)`} tone="slate" />
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoBlock label="Campanha" value={establishment.campaignName || 'Sem campanha'} detail={establishment.campaignScope === 'state' ? `Estado: ${establishment.campaignState || establishment.state}` : `Cidade: ${establishment.campaignCity || establishment.city}/${establishment.campaignState || establishment.state}`} />
            <InfoBlock label="Receita paga" value={formatCurrency(paidRevenue)} detail={`${payments.length} registro(s) de pagamento`} />
            <InfoBlock label="Equipe" value={`${establishment.owners} diretor(es)`} detail={`${establishment.admins} servidor(es) vinculados`} />
          </div>
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="flex flex-col gap-3 border-b border-[#E3EAF3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-black">Registros do estabelecimento</h2>
              <p className="mt-1 text-sm text-slate-600">Protocolos recebidos por região atendida e cobranças da assinatura.</p>
            </div>
            <div className="inline-flex rounded-lg border border-[#CDD8E7] bg-[#F7F9FC] p-1">
              <TabButton active={activeTab === 'protocols'} icon={<FileText size={16} />} label="Protocolos" onClick={() => setActiveTab('protocols')} />
              <TabButton active={activeTab === 'payments'} icon={<ReceiptText size={16} />} label="Pagamentos" onClick={() => setActiveTab('payments')} />
            </div>
          </div>

          {activeTab === 'protocols'
            ? <ProtocolRecords protocols={protocols} />
            : <PaymentRecords payments={payments} />}
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: 'blue' | 'emerald' | 'amber' | 'slate';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <article className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
      <div className="flex items-start gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-1 truncate text-xl font-black">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>
        </div>
      </div>
    </article>
  );
}

function InfoBlock({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-black">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-black transition-colors ${active ? 'bg-white text-[#0758BD] shadow-sm' : 'text-slate-600 hover:text-[#0758BD]'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function ProtocolRecords({ protocols }: { protocols: Protocol[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProtocolStatusFilter>('all');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return protocols.filter((protocol) => {
      const protocolStatus = canonicalStatus(protocol);
      const matchesStatus = status === 'all' || protocolStatus === status;
      const matchesQuery = !normalizedQuery
        || protocol.id.toLowerCase().includes(normalizedQuery)
        || protocol.category.toLowerCase().includes(normalizedQuery)
        || protocol.address.toLowerCase().includes(normalizedQuery)
        || (protocol.requester ?? '').toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [protocols, query, status]);

  return (
    <div>
      <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar protocolo"
            className="h-11 w-full rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProtocolStatusFilter)}
          className="h-11 rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
        >
          {protocolStatusFilters.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={38} />} title="Nenhum protocolo encontrado." />
      ) : (
        <div className="overflow-x-auto border-t border-[#E3EAF3]">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#F7F9FC] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Protocolo</th>
                <th className="px-4 py-3">Ocorrência</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-5 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF4]">
              {filtered.map((protocol) => {
                const currentStatus = canonicalStatus(protocol);
                return (
                  <tr key={protocol.id} className="align-top hover:bg-blue-50/40">
                    <td className="px-5 py-4">
                      <p className="font-mono font-black text-[#0758BD]">#{protocol.id.slice(0, 8).toUpperCase()}</p>
                      <p className="mt-1 text-xs text-slate-500">{dateTimeLabel(protocol.created_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{protocol.category}</p>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">{protocol.address}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded border px-2.5 py-1 text-xs font-black ${protocolStatusClass(currentStatus)}`}>
                        {currentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{protocol.requester || 'Cidadão'}</p>
                      {protocol.phone && <p className="mt-1 text-xs text-slate-500">{protocol.phone}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {protocol.ai_priority || 'Processando'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/protocolo/${protocol.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-3 font-bold text-[#0758BD] transition-colors hover:bg-blue-50">
                        Abrir
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentRecords({ payments }: { payments: PlatformPaymentRecord[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const statusOptions = useMemo(() => Array.from(new Set(payments.map((payment) => payment.status.toLowerCase()))), [payments]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const normalizedStatus = payment.status.toLowerCase();
      const matchesStatus = status === 'all' || normalizedStatus === status;
      const matchesQuery = !normalizedQuery
        || payment.id.toLowerCase().includes(normalizedQuery)
        || payment.subscriptionId.toLowerCase().includes(normalizedQuery)
        || (payment.paymentMethod ?? '').toLowerCase().includes(normalizedQuery)
        || (payment.externalReference ?? '').toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [payments, query, status]);

  return (
    <div>
      <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pagamento"
            className="h-11 w-full rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
        >
          <option value="all">Todos os status</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>{paymentStatusLabel(option)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ReceiptText size={38} />} title="Nenhum pagamento encontrado." />
      ) : (
        <div className="overflow-x-auto border-t border-[#E3EAF3]">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-[#F7F9FC] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Registro</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Pago em</th>
                <th className="px-5 py-3">Método / referência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF4]">
              {filtered.map((payment) => (
                <tr key={payment.id} className="align-top hover:bg-blue-50/40">
                  <td className="px-5 py-4">
                    <p className="font-mono font-black text-[#0758BD]">#{payment.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-slate-500">Criado em {dateTimeLabel(payment.createdAt)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded border px-2.5 py-1 text-xs font-black ${statusClass(payment.status)}`}>
                      {paymentStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-black text-emerald-700">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-4 text-slate-600">{dateLabel(payment.dueDate)}</td>
                  <td className="px-4 py-4 text-slate-600">{payment.paidAt ? dateTimeLabel(payment.paidAt) : 'Em aberto'}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{payment.paymentMethod || 'Não informado'}</p>
                    <p className="mt-1 max-w-sm truncate text-xs text-slate-500">{payment.externalReference || payment.subscriptionId}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border-t border-[#E3EAF3] px-6 text-center text-slate-500">
      <span className="mb-3 text-[#87A9D8]">{icon}</span>
      <p className="font-semibold">{title}</p>
    </div>
  );
}
