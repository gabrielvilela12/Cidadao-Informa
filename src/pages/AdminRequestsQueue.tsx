import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FilterX,
  FolderOpen,
  Hourglass,
  List,
  MessageCircle,
  Search,
  Timer,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { type Protocol } from '../constants';
import { useProtocols } from '../hooks/useProtocols';
import { exportToExcel } from '../utils/exportUtils';

const statusMatches = (status: Protocol['status'], value: string) => {
  if (value === 'all') return true;
  const groups: Record<string, Protocol['status'][]> = {
    open: ['Aberto', 'Open'],
    analysis: ['Em Análise', 'InProgress'],
    resolved: ['Concluído', 'Resolved', 'Closed'],
    late: ['Atrasado'],
  };
  return groups[value]?.includes(status) ?? false;
};

const statusLabel = (status: Protocol['status']) => {
  if (['Concluído', 'Resolved', 'Closed'].includes(status)) return 'Concluído';
  if (['Em Análise', 'InProgress'].includes(status)) return 'Em análise';
  if (status === 'Atrasado') return 'Atrasado';
  return 'Aberto';
};

export function AdminRequestsQueue() {
  const { protocols, loading } = useProtocols('admin');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const counts = useMemo(() => ({
    open: protocols.filter((item) => statusMatches(item.status, 'open')).length,
    analysis: protocols.filter((item) => statusMatches(item.status, 'analysis')).length,
    late: protocols.filter((item) => statusMatches(item.status, 'late')).length,
  }), [protocols]);

  const filteredProtocols = useMemo(() => protocols.filter((protocol) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch
      || protocol.id.toLowerCase().includes(normalizedSearch)
      || protocol.requester?.toLowerCase().includes(normalizedSearch)
      || protocol.address?.toLowerCase().includes(normalizedSearch);
    const matchesCategory = categoryFilter === 'all' || protocol.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all'
      || (priorityFilter === 'processing' ? !protocol.ai_priority : protocol.ai_priority === priorityFilter);
    const matchesSla = slaFilter === 'all'
      || (slaFilter === 'late' ? statusMatches(protocol.status, 'late') : !statusMatches(protocol.status, 'late'));

    return matchesSearch
      && statusMatches(protocol.status, statusFilter)
      && matchesCategory
      && matchesPriority
      && matchesSla;
  }), [categoryFilter, priorityFilter, protocols, searchTerm, slaFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProtocols.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredProtocols.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSlaFilter('all');
    setPage(1);
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
  };

  const toggleSelection = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPageSelected = pageItems.length > 0 && pageItems.every((item) => selected.has(item.id));
  const togglePageSelection = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allPageSelected) pageItems.forEach((item) => next.delete(item.id));
      else pageItems.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const startIndex = filteredProtocols.length ? (safePage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(safePage * pageSize, filteredProtocols.length);

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <Header
        title="Fila de Solicitações"
        subtitle="Gerenciamento de chamados e triagem"
        action={(
          <div className="inline-flex h-10 items-center gap-2 rounded-full border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700">
            <List size={16} className="text-[#0758BD]" />
            {protocols.length} solicitações
          </div>
        )}
      />

      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 pb-6 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard icon={<ClipboardList size={22} />} value={protocols.length} label="Total" tone="blue" />
          <SummaryCard icon={<FolderOpen size={22} />} value={counts.open} label="Abertas" tone="sky" />
          <SummaryCard icon={<Timer size={22} />} value={counts.analysis} label="Em análise" tone="yellow" />
          <SummaryCard icon={<AlertCircle size={22} />} value={counts.late} label="Em atraso" tone="red" />
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white p-3 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="flex flex-col gap-2 xl:flex-row">
            <label className="relative min-w-0 flex-1 xl:max-w-[390px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
                placeholder="Pesquisar protocolo, solicitante ou endereço..."
                className="h-11 w-full rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#0758BD] focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <FilterSelect label="Status" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={[
                ['all', 'Status'], ['open', 'Aberto'], ['analysis', 'Em análise'], ['resolved', 'Concluído'], ['late', 'Atrasado'],
              ]} />
              <FilterSelect label="Categoria" value={categoryFilter} onChange={(value) => { setCategoryFilter(value); setPage(1); }} options={[
                ['all', 'Categoria'], ['Física', 'Física'], ['Visual', 'Visual'], ['Auditiva', 'Auditiva'], ['Outros', 'Outros'],
              ]} />
              <FilterSelect label="Prioridade" value={priorityFilter} onChange={(value) => { setPriorityFilter(value); setPage(1); }} options={[
                ['all', 'Prioridade'], ['baixa', 'Baixa'], ['media', 'Média'], ['alta', 'Alta'], ['critica', 'Crítica'], ['processing', 'Processando'],
              ]} />
              <FilterSelect label="SLA" value={slaFilter} onChange={(value) => { setSlaFilter(value); setPage(1); }} options={[
                ['all', 'SLA'], ['on-time', 'Em dia'], ['late', 'Vencido'],
              ]} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportToExcel(filteredProtocols, 'fila_solicitacoes.xlsx')}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 xl:flex-none"
              >
                <Download size={17} /> Exportar
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 xl:flex-none"
              >
                <FilterX size={17} /> Limpar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#D8E1ED] text-[11px] font-black uppercase text-slate-600">
                  <th className="w-12 px-4 py-3">
                    <input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} aria-label="Selecionar página" className="size-4 rounded" />
                  </th>
                  <th className="px-3 py-3">Solicitante</th>
                  <th className="px-3 py-3">Categoria</th>
                  <th className="px-3 py-3">Data</th>
                  <th className="px-3 py-3">SLA</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Prioridade</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="px-5 py-14 text-center text-sm text-slate-600">Carregando solicitações...</td></tr>
                )}
                {!loading && pageItems.map((protocol) => (
                  <tr
                    key={protocol.id}
                    onClick={() => navigate(`/protocolo/${protocol.id}`)}
                    className={`cursor-pointer border-b border-[#E2E8F0] transition-colors hover:bg-[#F5F9FF] ${selected.has(protocol.id) ? 'bg-[#F0F6FF]' : ''}`}
                  >
                    <td className="px-4 py-2.5" onClick={(event) => event.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(protocol.id)} onChange={() => toggleSelection(protocol.id)} aria-label={`Selecionar protocolo ${protocol.id}`} className="size-4 rounded" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-black text-[#0758BD]">
                          {(protocol.requester || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate text-sm font-bold">{protocol.requester || 'Cidadão'}</p>
                          <p className="text-xs text-slate-600">Cidadão verificado</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><CategoryBadge category={protocol.category} /></td>
                    <td className="px-3 py-2.5 text-xs font-medium text-slate-700">{protocol.date}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${statusMatches(protocol.status, 'late') ? 'text-red-600' : 'text-[#168821]'}`}>
                        {statusMatches(protocol.status, 'late') ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                        {statusMatches(protocol.status, 'late') ? 'Vencido' : 'Em dia'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><StatusPill status={protocol.status} /></td>
                    <td className="px-3 py-2.5"><PriorityPill protocol={protocol} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={!protocol.phone}
                          onClick={(event) => { event.stopPropagation(); openWhatsApp(protocol.phone); }}
                          className="flex size-9 items-center justify-center rounded-lg border border-[#CDD8E7] text-slate-600 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Conversar com o cidadão"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <Link
                          to={`/protocolo/${protocol.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="flex size-9 items-center justify-center rounded-lg border border-[#CDD8E7] text-slate-600 hover:bg-blue-50 hover:text-[#0758BD]"
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && pageItems.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-slate-600">Nenhuma solicitação encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#D8E1ED] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={selected.size === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#CDD8E7] px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ClipboardList size={17} />
              {selected.size ? `${selected.size} selecionada(s)` : 'Selecione solicitações para ações em lote'}
            </button>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs font-semibold text-slate-600">Exibindo {startIndex}–{endIndex} de {filteredProtocols.length}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} className="flex size-9 items-center justify-center rounded-lg border border-[#CDD8E7] disabled:opacity-40"><ChevronLeft size={17} /></button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map((number) => (
                  <button key={number} type="button" onClick={() => setPage(number)} className={`size-9 rounded-lg border text-sm font-bold ${safePage === number ? 'border-blue-600 bg-blue-600 text-white' : 'border-[#CDD8E7] bg-white text-slate-700'}`}>{number}</button>
                ))}
                <button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} className="flex size-9 items-center justify-center rounded-lg border border-[#CDD8E7] disabled:opacity-40"><ChevronRight size={17} /></button>
                <span className="ml-1 rounded-lg border border-[#CDD8E7] px-3 py-2 text-xs font-bold">{pageSize}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: 'blue' | 'sky' | 'yellow' | 'red' }) {
  const tones = {
    blue: 'bg-blue-600 text-white',
    sky: 'bg-blue-50 text-[#0758BD]',
    yellow: 'bg-amber-50 text-[#A66B00]',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <article className="flex min-h-[86px] items-center gap-4 rounded-lg border border-[#CDD8E7] bg-white px-4 py-3 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
      <div><p className="text-2xl font-black">{value}</p><p className="text-sm text-slate-600">{label}</p></div>
    </article>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <label className="min-w-0">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    'Física': 'border-amber-200 bg-amber-50 text-[#8A6100]',
    Visual: 'border-blue-200 bg-blue-50 text-[#0758BD]',
    Auditiva: 'border-purple-200 bg-purple-50 text-purple-700',
    Outros: 'border-slate-200 bg-slate-50 text-slate-700',
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${styles[category] || styles.Outros}`}>{category || 'Outros'}</span>;
}

function StatusPill({ status }: { status: Protocol['status'] }) {
  const label = statusLabel(status);
  const styles: Record<string, string> = {
    Aberto: 'border-blue-200 bg-blue-50 text-[#0758BD]',
    'Em análise': 'border-amber-200 bg-amber-50 text-[#8A6100]',
    Concluído: 'border-green-200 bg-green-50 text-[#168821]',
    Atrasado: 'border-red-200 bg-red-50 text-red-700',
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${styles[label]}`}>{label}</span>;
}

function PriorityPill({ protocol }: { protocol: Protocol }) {
  if (!protocol.ai_priority || protocol.ai_status === 'pending') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"><Hourglass size={13} />Processando</span>;
  }

  const config = {
    baixa: ['BAIXA', 'bg-green-100 text-green-800', 'bg-green-600'],
    media: ['MÉDIA', 'bg-amber-100 text-amber-800', 'bg-amber-500'],
    alta: ['ALTA', 'bg-orange-100 text-orange-800', 'bg-orange-600'],
    critica: ['CRÍTICA', 'bg-red-100 text-red-800', 'bg-red-600'],
  } as const;
  const [label, classes, dot] = config[protocol.ai_priority];
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${classes}`}><span className={`size-2.5 rounded-full ${dot}`} />{label}</span>;
}
