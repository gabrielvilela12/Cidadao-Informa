import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Eye,
  FileText,
  MessageCircle,
  Search,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { api, type AdminCitizenSummary } from '../services/api';

const PAGE_SIZE = 10;

type WhatsAppFilter = 'all' | 'connected' | 'not-connected';

const hasWhatsApp = (phone?: string | null) => Boolean(phone?.replace(/\D/g, ''));

const formatCpf = (cpf: string) => {
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  return digits.length === 11
    ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : cpf || 'Não informado';
};

const formatPhone = (phone?: string | null) => {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return phone || 'Não cadastrado';
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sem protocolos';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
    : 'Data indisponível';
};

export function AdminCitizens() {
  const [citizens, setCitizens] = useState<AdminCitizenSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [whatsAppFilter, setWhatsAppFilter] = useState<WhatsAppFilter>('all');
  const [page, setPage] = useState(1);

  const loadCitizens = async () => {
    setLoading(true);
    setError('');
    try {
      setCitizens(await api.getAdminCitizens());
    } catch (loadError) {
      console.error('Erro ao carregar cidadãos:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os cidadãos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCitizens();
  }, []);

  useEffect(() => setPage(1), [search, whatsAppFilter]);

  const metrics = useMemo(() => ({
    total: citizens.length,
    connected: citizens.filter((citizen) => hasWhatsApp(citizen.phone)).length,
    withoutWhatsApp: citizens.filter((citizen) => !hasWhatsApp(citizen.phone)).length,
    protocols: citizens.reduce((total, citizen) => total + citizen.protocolCount, 0),
  }), [citizens]);

  const filteredCitizens = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return citizens.filter((citizen) => {
      const matchesSearch = !term || [citizen.name, citizen.email, citizen.cpf, citizen.phone]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(term));
      const matchesWhatsApp = whatsAppFilter === 'all'
        || (whatsAppFilter === 'connected' && hasWhatsApp(citizen.phone))
        || (whatsAppFilter === 'not-connected' && !hasWhatsApp(citizen.phone));
      return matchesSearch && matchesWhatsApp;
    });
  }, [citizens, search, whatsAppFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCitizens.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredCitizens.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <Header
        title="Cidadãos"
        subtitle="Cadastros e relacionamento"
        action={(
          <div className="inline-flex h-10 items-center gap-2 rounded-full border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700">
            <Users size={16} className="text-[#0758BD]" />
            {citizens.length} cadastrados
          </div>
        )}
      />

      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 pb-7 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Resumo dos cidadãos">
          <MetricCard icon={Users} value={metrics.total} label="Cidadãos cadastrados" tone="blue" />
          <MetricCard icon={UserRoundCheck} value={metrics.connected} label="Com WhatsApp" tone="green" />
          <MetricCard icon={UserRoundX} value={metrics.withoutWhatsApp} label="Sem WhatsApp" tone="amber" />
          <MetricCard icon={FileText} value={metrics.protocols} label="Protocolos solicitados" tone="sky" />
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar cidadão</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, CPF, e-mail ou telefone..."
                className="h-12 w-full rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-3 text-base outline-none placeholder:text-slate-500 focus:border-[#0758BD] focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="lg:w-64">
              <span className="sr-only">Filtrar por WhatsApp</span>
              <select
                value={whatsAppFilter}
                onChange={(event) => setWhatsAppFilter(event.target.value as WhatsAppFilter)}
                className="h-12 w-full rounded-lg border border-[#CDD8E7] bg-white px-3 text-base font-semibold text-slate-700 outline-none focus:border-[#0758BD] focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Todos os contatos</option>
                <option value="connected">Com WhatsApp</option>
                <option value="not-connected">Sem WhatsApp</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {filteredCitizens.length} cidadão{filteredCitizens.length === 1 ? '' : 's'} encontrado{filteredCitizens.length === 1 ? '' : 's'}
          </p>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="bg-[#F8FAFD]">
                <tr className="border-b border-[#D8E1ED] text-[11px] font-black uppercase tracking-wide text-slate-600">
                  <th className="px-5 py-3">Cidadão</th>
                  <th className="px-4 py-3">CPF</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3 text-center">Protocolos</th>
                  <th className="px-4 py-3">Última solicitação</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && <MessageRow message="Carregando cidadãos..." />}
                {!loading && error && <MessageRow message={error} tone="error" onRetry={loadCitizens} />}
                {!loading && !error && pageItems.map((citizen) => (
                  <CitizenRow key={citizen.id} citizen={citizen} />
                ))}
                {!loading && !error && pageItems.length === 0 && <MessageRow message="Nenhum cidadão encontrado." />}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 lg:hidden">
            {loading && <MobileMessage message="Carregando cidadãos..." />}
            {!loading && error && <MobileMessage message={error} onRetry={loadCitizens} />}
            {!loading && !error && pageItems.map((citizen) => <CitizenCard key={citizen.id} citizen={citizen} />)}
            {!loading && !error && pageItems.length === 0 && <MobileMessage message="Nenhum cidadão encontrado." />}
          </div>

          {!loading && !error && filteredCitizens.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-[#D8E1ED] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-600">
                Exibindo {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCitizens.length)} de {filteredCitizens.length}
              </p>
              <div className="flex items-center gap-2">
                <PageButton label="Página anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17} /></PageButton>
                <span className="min-w-20 text-center text-sm font-bold">{currentPage} de {totalPages}</span>
                <PageButton label="Próxima página" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17} /></PageButton>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function CitizenRow({ citizen }: { citizen: AdminCitizenSummary }) {
  return (
    <tr className="border-b border-[#E2E8F0] transition-colors last:border-0 hover:bg-[#F5F9FF]">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={citizen.name} />
          <div className="min-w-0">
            <p className="max-w-[250px] truncate text-sm font-bold text-[#0B1B33]">{citizen.name}</p>
            <p className="max-w-[250px] truncate text-xs text-slate-600">{citizen.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm font-semibold text-slate-700">{formatCpf(citizen.cpf)}</td>
      <td className="px-4 py-3.5"><WhatsAppBadge phone={citizen.phone} /></td>
      <td className="px-4 py-3.5 text-center">
        <span className="inline-flex min-w-12 justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-[#0758BD]">{citizen.protocolCount}</span>
        {citizen.openProtocolCount > 0 && <p className="mt-1 text-[11px] font-semibold text-amber-700">{citizen.openProtocolCount} em andamento</p>}
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-700">{formatDate(citizen.lastProtocolAt)}</td>
      <td className="px-5 py-3.5">
        <div className="flex justify-end gap-2">
          {hasWhatsApp(citizen.phone) && (
            <a
              href={`https://wa.me/${citizen.phone!.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex size-9 items-center justify-center rounded-lg border border-[#CDD8E7] text-slate-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
              aria-label={`Conversar com ${citizen.name} no WhatsApp`}
              title="Abrir WhatsApp"
            ><MessageCircle size={16} /></a>
          )}
          <Link
            to={`/admin/cidadaos/${citizen.id}`}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
          ><Eye size={16} /> Detalhes</Link>
        </div>
      </td>
    </tr>
  );
}

function CitizenCard({ citizen }: { citizen: AdminCitizenSummary }) {
  return (
    <article className="rounded-lg border border-[#CDD8E7] bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar name={citizen.name} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold">{citizen.name}</h2>
          <p className="truncate text-sm text-slate-600">{citizen.email}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{formatCpf(citizen.cpf)}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[#E2E8F0] py-3 text-sm">
        <div><p className="text-xs text-slate-500">Protocolos</p><p className="font-black">{citizen.protocolCount}</p></div>
        <div><p className="text-xs text-slate-500">WhatsApp</p><p className="font-bold">{formatPhone(citizen.phone)}</p></div>
      </div>
      <Link to={`/admin/cidadaos/${citizen.id}`} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white">
        <Eye size={17} /> Ver detalhes e protocolos
      </Link>
    </article>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-black text-[#0758BD]">{initials || <CircleUserRound size={20} />}</span>;
}

function WhatsAppBadge({ phone }: { phone?: string | null }) {
  return hasWhatsApp(phone) ? (
    <div><span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700"><MessageCircle size={13} /> Cadastrado</span><p className="mt-1 text-xs text-slate-600">{formatPhone(phone)}</p></div>
  ) : <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Não cadastrado</span>;
}

function MetricCard({ icon: Icon, value, label, tone }: { icon: typeof Users; value: number; label: string; tone: 'blue' | 'green' | 'amber' | 'sky' }) {
  const tones = {
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-blue-50 text-[#0758BD]',
  };
  return <article className="flex min-h-[92px] items-center gap-3 rounded-lg border border-[#CDD8E7] bg-white px-3 py-3 shadow-[0_7px_20px_rgba(15,45,85,0.035)] sm:px-4"><span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={21} /></span><div><p className="text-2xl font-black">{value}</p><p className="text-xs text-slate-600 sm:text-sm">{label}</p></div></article>;
}

function MessageRow({ message, tone = 'default', onRetry }: { message: string; tone?: 'default' | 'error'; onRetry?: () => void }) {
  return <tr><td colSpan={6} className={`px-5 py-14 text-center text-sm ${tone === 'error' ? 'text-red-700' : 'text-slate-600'}`}>{message}{onRetry && <button type="button" onClick={onRetry} className="ml-3 rounded-lg border border-[#CDD8E7] px-3 py-2 font-bold text-[#0758BD]">Tentar novamente</button>}</td></tr>;
}

function MobileMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="rounded-lg border border-[#CDD8E7] p-8 text-center text-sm text-slate-600">{message}{onRetry && <button type="button" onClick={onRetry} className="mt-3 block w-full rounded-lg border border-[#CDD8E7] px-3 py-2 font-bold text-[#0758BD]">Tentar novamente</button>}</div>;
}

function PageButton({ children, label, disabled, onClick }: { children: React.ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="flex size-9 items-center justify-center rounded-lg border border-[#CDD8E7] bg-white disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
}
