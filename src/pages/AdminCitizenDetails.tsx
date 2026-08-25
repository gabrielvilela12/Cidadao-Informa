import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  IdCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import type { Protocol } from '../constants';
import { api, type AdminCitizenDetail } from '../services/api';
import { canonicalStatus } from '../utils/protocolStatus';

const formatCpf = (cpf: string) => {
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  return digits.length === 11 ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
};

const formatPhone = (phone?: string | null) => {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return phone || 'Não cadastrado';
};

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', withTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'long' }).format(date);
};

const isResolved = (protocol: Protocol) => canonicalStatus(protocol) === 'Concluído';

export function AdminCitizenDetails() {
  const { id = '' } = useParams<{ id: string }>();
  const [citizen, setCitizen] = useState<AdminCitizenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadCitizen = async () => {
    setLoading(true);
    setError('');
    try {
      setCitizen(await api.getAdminCitizen(id));
    } catch (loadError) {
      console.error('Erro ao carregar detalhes do cidadão:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o cidadão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCitizen();
  }, [id]);

  const filteredProtocols = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (citizen?.protocols ?? []).filter((protocol) => {
      const state = canonicalStatus(protocol);
      const matchesSearch = !term || [protocol.id, protocol.category, protocol.description, protocol.address]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(term));
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'resolved' && state === 'Concluído')
        || (statusFilter === 'open' && state !== 'Concluído');
      return matchesSearch && matchesStatus;
    });
  }, [citizen, search, statusFilter]);

  const resolvedCount = citizen?.protocols.filter(isResolved).length ?? 0;
  const initials = citizen?.name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CI';

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <Header title="Detalhes do cidadão" subtitle="Cadastro e histórico de solicitações" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-8 sm:px-6 lg:px-8">
        <Link to="/admin/cidadaos" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[#0758BD] hover:underline">
          <ArrowLeft size={17} /> Voltar para cidadãos
        </Link>

        {loading && <StateCard message="Carregando informações do cidadão..." />}
        {!loading && error && <StateCard message={error} error onRetry={loadCitizen} />}

        {!loading && !error && citizen && (
          <>
            <section className="overflow-hidden rounded-xl border border-[#CDD8E7] bg-white shadow-[0_10px_28px_rgba(15,45,85,0.06)]">
              <div className="h-2 bg-gradient-to-r from-blue-700 via-blue-500 to-emerald-500" />
              <div className="flex flex-col gap-6 p-5 md:flex-row md:items-center md:p-6">
                <span className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-blue-100 bg-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-200">{initials}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-2xl font-black text-[#0B1B33]">{citizen.name}</h2>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0758BD]">Cidadão verificado</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Cadastro realizado em {formatDate(citizen.createdAt)}</p>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
                    <ContactItem icon={IdCard} label={formatCpf(citizen.cpf)} />
                    <ContactItem icon={Mail} label={citizen.email} />
                    <ContactItem icon={Phone} label={formatPhone(citizen.phone)} />
                  </div>
                </div>
                {citizen.phone && (
                  <a
                    href={`https://wa.me/${citizen.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-700"
                  ><MessageCircle size={18} /> Conversar no WhatsApp</a>
                )}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumo dos protocolos do cidadão">
              <DetailMetric icon={FileText} value={citizen.protocolCount} label="Protocolos" tone="blue" />
              <DetailMetric icon={Clock3} value={citizen.openProtocolCount} label="Em andamento" tone="amber" />
              <DetailMetric icon={CheckCircle2} value={resolvedCount} label="Concluídos" tone="green" />
              <DetailMetric icon={CalendarDays} value={citizen.lastProtocolAt ? formatDate(citizen.lastProtocolAt, true) : '—'} label="Última solicitação" tone="sky" compact />
            </section>

            <section className="rounded-xl border border-[#CDD8E7] bg-white shadow-[0_8px_24px_rgba(35,65,110,0.05)]">
              <div className="border-b border-[#D8E1ED] p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-xl font-black">Protocolos solicitados</h2>
                    <p className="mt-1 text-sm text-slate-600">Histórico completo das solicitações deste cidadão.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative sm:w-80">
                      <span className="sr-only">Buscar protocolo</span>
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Protocolo, categoria ou endereço..."
                        className="h-11 w-full rounded-lg border border-[#CDD8E7] pl-10 pr-3 text-sm outline-none focus:border-[#0758BD] focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      aria-label="Filtrar protocolos por status"
                      className="h-11 rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700"
                    >
                      <option value="all">Todos os status</option>
                      <option value="open">Em andamento</option>
                      <option value="resolved">Concluídos</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-[#F8FAFD] text-[11px] font-black uppercase tracking-wide text-slate-600">
                    <tr><th className="px-5 py-3">Protocolo / categoria</th><th className="px-4 py-3">Local</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Ação</th></tr>
                  </thead>
                  <tbody>
                    {filteredProtocols.map((protocol) => <ProtocolRow key={protocol.id} protocol={protocol} />)}
                    {filteredProtocols.length === 0 && <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-600">Nenhum protocolo encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 md:hidden">
                {filteredProtocols.map((protocol) => <ProtocolCard key={protocol.id} protocol={protocol} />)}
                {filteredProtocols.length === 0 && <div className="p-8 text-center text-sm text-slate-600">Nenhum protocolo encontrado.</div>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ContactItem({ icon: Icon, label }: { icon: typeof Mail; label: string }) {
  return <span className="inline-flex min-w-0 items-center gap-2"><Icon size={16} className="shrink-0 text-[#0758BD]" /><span className="truncate">{label}</span></span>;
}

function DetailMetric({ icon: Icon, value, label, tone, compact = false }: { icon: typeof FileText; value: number | string; label: string; tone: 'blue' | 'green' | 'amber' | 'sky'; compact?: boolean }) {
  const tones = { blue: 'bg-blue-600 text-white', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', sky: 'bg-blue-50 text-[#0758BD]' };
  return <article className="flex min-h-24 items-center gap-3 rounded-lg border border-[#CDD8E7] bg-white p-3 shadow-[0_7px_20px_rgba(15,45,85,0.035)] sm:p-4"><span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={21} /></span><div className="min-w-0"><p className={`${compact ? 'break-words text-[11px] leading-tight sm:text-sm' : 'truncate text-2xl'} font-black`}>{value}</p><p className="text-xs text-slate-600 sm:text-sm">{label}</p></div></article>;
}

function StatusBadge({ protocol }: { protocol: Protocol }) {
  const status = canonicalStatus(protocol);
  const styles = {
    'Concluído': 'bg-green-50 text-green-700',
    'Em análise': 'bg-amber-50 text-amber-700',
    'Atrasado': 'bg-red-50 text-red-700',
    'Aberto': 'bg-blue-50 text-[#0758BD]',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>;
}

function ProtocolRow({ protocol }: { protocol: Protocol }) {
  return (
    <tr className="border-t border-[#E2E8F0] hover:bg-[#F5F9FF]">
      <td className="px-5 py-3.5"><p className="text-sm font-black text-[#0758BD]">#{protocol.id.slice(0, 8).toUpperCase()}</p><p className="mt-0.5 text-sm font-semibold">{protocol.category}</p></td>
      <td className="max-w-[330px] px-4 py-3.5"><p className="truncate text-sm text-slate-700" title={protocol.address}>{protocol.address}</p></td>
      <td className="px-4 py-3.5 text-sm text-slate-700">{protocol.date}</td>
      <td className="px-4 py-3.5"><StatusBadge protocol={protocol} /></td>
      <td className="px-5 py-3.5 text-right"><Link to={`/protocolo/${protocol.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#CDD8E7] px-3 text-xs font-bold text-[#0758BD] hover:bg-blue-50"><Eye size={15} /> Ver protocolo</Link></td>
    </tr>
  );
}

function ProtocolCard({ protocol }: { protocol: Protocol }) {
  return (
    <article className="rounded-lg border border-[#CDD8E7] p-4">
      <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-black text-[#0758BD]">#{protocol.id.slice(0, 8).toUpperCase()}</p><h3 className="mt-1 font-bold">{protocol.category}</h3></div><StatusBadge protocol={protocol} /></div>
      <p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0" />{protocol.address}</p>
      <p className="mt-2 text-xs text-slate-500">Solicitado em {protocol.date}</p>
      <Link to={`/protocolo/${protocol.id}`} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#CDD8E7] text-sm font-bold text-[#0758BD]"><Eye size={16} /> Ver protocolo completo</Link>
    </article>
  );
}

function StateCard({ message, error = false, onRetry }: { message: string; error?: boolean; onRetry?: () => void }) {
  return <section className={`rounded-xl border p-12 text-center ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-[#CDD8E7] bg-white text-slate-600'}`}><UserRound className="mx-auto mb-3" size={32} /><p className="font-semibold">{message}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Tentar novamente</button>}</section>;
}
