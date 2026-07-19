import { useEffect, useMemo, useState } from 'react';
import {
    Accessibility,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Copy,
    Ear,
    Eye,
    FileText,
    FilterX,
    FolderOpen,
    MoreHorizontal,
    Plus,
    Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useProtocols } from '../hooks/useProtocols';
import { Protocol } from '../constants';
import { StatusBadge } from './CitizenDashboard';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'open' | 'analysis' | 'resolved' | 'closed' | 'late';

function statusGroup(status: string): Exclude<StatusFilter, 'all'> {
    if (status === 'Open' || status === 'Aberto') return 'open';
    if (status === 'InProgress' || status === 'Em Análise') return 'analysis';
    if (status === 'Resolved' || status === 'Concluído') return 'resolved';
    if (status === 'Atrasado') return 'late';
    return 'closed';
}

export function CitizenProtocols() {
    const { protocols, loading, error } = useProtocols('citizen');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [copiedId, setCopiedId] = useState('');

    const categories = useMemo(() => {
        return Array.from(new Set(protocols.map((protocol) => protocol.category || protocol.service).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [protocols]);

    const filteredProtocols = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');

        return protocols.filter((protocol) => {
            const matchesSearch = !normalizedSearch ||
                protocol.id.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
                protocol.service?.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
                protocol.address?.toLocaleLowerCase('pt-BR').includes(normalizedSearch);
            const matchesStatus = statusFilter === 'all' || statusGroup(protocol.status) === statusFilter;
            const protocolCategory = protocol.category || protocol.service;
            const matchesCategory = categoryFilter === 'all' || protocolCategory === categoryFilter;
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [protocols, searchTerm, statusFilter, categoryFilter]);

    const metrics = useMemo(() => ({
        total: protocols.length,
        open: protocols.filter((protocol) => statusGroup(protocol.status) === 'open').length,
        analysis: protocols.filter((protocol) => statusGroup(protocol.status) === 'analysis').length,
    }), [protocols]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, categoryFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredProtocols.length / PAGE_SIZE));
    const page = Math.min(currentPage, totalPages);
    const paginatedProtocols = filteredProtocols.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const hasFilters = Boolean(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all');

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCategoryFilter('all');
    };

    const copyProtocol = async (id: string) => {
        try {
            await navigator.clipboard.writeText(id);
            setCopiedId(id);
            window.setTimeout(() => setCopiedId(''), 1500);
        } catch (copyError) {
            console.error('Não foi possível copiar o protocolo.', copyError);
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[#f4f8fc] text-[#0b1b33]">
            <Header
                title="Meus Protocolos"
                description="Acompanhe suas solicitações"
                action={(
                    <Link
                        to="/nova-solicitacao"
                        className="dashboard-inverse-text inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0758bd] px-3 text-sm font-semibold text-white shadow-[0_7px_16px_rgba(7,88,189,0.18)] transition hover:bg-[#064c9f] sm:px-5"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Nova solicitação</span>
                    </Link>
                )}
            />

            <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 pb-7 sm:px-6 lg:px-8">
                <section className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Resumo dos protocolos">
                    <MetricCard icon={FileText} value={metrics.total} label="Total" tone="blue" />
                    <MetricCard icon={FolderOpen} value={metrics.open} label="Abertos" tone="blue" />
                    <MetricCard icon={Clock3} value={metrics.analysis} label="Em análise" tone="amber" />
                </section>

                <section className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_8px_24px_rgba(35,65,110,0.05)] sm:p-5">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative min-w-0 flex-1 xl:max-w-[420px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="search"
                                aria-label="Buscar protocolos"
                                placeholder="Buscar por protocolo, serviço ou endereço..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="min-h-12 w-full rounded-md border border-[#CDD8E7] bg-white py-2.5 pl-10 pr-3 text-base text-[#0b1b33] outline-none transition placeholder:text-slate-500 focus:border-[#0758bd] focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <FilterSelect
                            label="Filtrar por status"
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value as StatusFilter)}
                            options={[
                                { value: 'all', label: 'Todos os status' },
                                { value: 'open', label: 'Abertos' },
                                { value: 'analysis', label: 'Em análise' },
                                { value: 'resolved', label: 'Concluídos' },
                                { value: 'closed', label: 'Encerrados' },
                                { value: 'late', label: 'Atrasados' },
                            ]}
                        />

                        <FilterSelect
                            label="Filtrar por categoria"
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            options={[
                                { value: 'all', label: 'Todas as categorias' },
                                ...categories.map((category) => ({ value: category, label: category })),
                            ]}
                        />

                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={!hasFilters}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#CDD8E7] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 xl:ml-auto"
                        >
                            <FilterX size={17} />
                            Limpar filtros
                        </button>
                    </div>

                    <p className="mt-5 text-sm text-slate-600">
                        {filteredProtocols.length} resultado{filteredProtocols.length !== 1 ? 's' : ''} encontrado{filteredProtocols.length !== 1 ? 's' : ''}
                    </p>

                    <div className="mt-4 hidden overflow-hidden rounded-md border border-[#CDD8E7] lg:block">
                        <table className="w-full table-fixed text-left text-sm">
                            <thead className="bg-[#F8FAFD]">
                                <tr className="border-b border-[#CDD8E7]">
                                    <th className="w-[36%] px-5 py-3 text-xs font-bold uppercase text-slate-700">Serviço / Endereço</th>
                                    <th className="w-[20%] px-5 py-3 text-xs font-bold uppercase text-slate-700">Protocolo</th>
                                    <th className="w-[13%] px-5 py-3 text-xs font-bold uppercase text-slate-700">Data</th>
                                    <th className="w-[15%] px-5 py-3 text-xs font-bold uppercase text-slate-700">Status</th>
                                    <th className="w-[16%] px-5 py-3 text-right text-xs font-bold uppercase text-slate-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <LoadingRow />}
                                {!loading && error && <MessageRow message={error} tone="error" />}
                                {!loading && !error && paginatedProtocols.map((protocol, index) => (
                                    <ProtocolRow
                                        key={protocol.id}
                                        protocol={protocol}
                                        copied={copiedId === protocol.id}
                                        onCopy={copyProtocol}
                                        alternate={index % 2 === 1}
                                    />
                                ))}
                                {!loading && !error && filteredProtocols.length === 0 && (
                                    <MessageRow message="Nenhum protocolo encontrado." />
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-3 lg:hidden">
                        {loading && <div className="rounded-md border border-[#CDD8E7] bg-white p-8 text-center text-slate-500">Carregando...</div>}
                        {!loading && error && <div className="rounded-md border border-red-200 bg-red-50 p-5 text-center text-red-700">{error}</div>}
                        {!loading && !error && paginatedProtocols.map((protocol) => (
                            <MobileProtocolCard
                                key={protocol.id}
                                protocol={protocol}
                                copied={copiedId === protocol.id}
                                onCopy={copyProtocol}
                            />
                        ))}
                        {!loading && !error && filteredProtocols.length === 0 && (
                            <div className="rounded-md border border-[#CDD8E7] bg-white p-8 text-center text-slate-500">Nenhum protocolo encontrado.</div>
                        )}
                    </div>

                    {!loading && !error && filteredProtocols.length > 0 && (
                        <Pagination page={page} totalPages={totalPages} onChange={setCurrentPage} />
                    )}
                </section>
            </main>
        </div>
    );
}

function MetricCard({ icon: Icon, value, label, tone }: { icon: typeof FileText; value: number; label: string; tone: 'blue' | 'amber' }) {
    const colors = tone === 'amber'
        ? 'bg-[#FFF4CF] text-[#B07B00]'
        : 'bg-[#EAF2FF] text-[#0758bd]';

    return (
        <article className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-2 py-3 text-center shadow-[0_6px_18px_rgba(35,65,110,0.05)] sm:min-h-24 sm:flex-row sm:justify-start sm:gap-4 sm:px-5 sm:py-4 sm:text-left">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-full sm:size-14 ${colors}`}>
                <Icon className="size-5 sm:size-6" />
            </span>
            <div>
                <strong className="block text-xl font-black leading-none text-[#0b1b33] sm:text-2xl">{value}</strong>
                <span className="mt-1 block text-xs text-slate-600 sm:text-sm">{label}</span>
            </div>
        </article>
    );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
    return (
        <div className="relative min-w-0 xl:w-[245px]">
            <select
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-md border border-[#CDD8E7] bg-white px-4 pr-10 text-base text-[#0b1b33] outline-none transition focus:border-[#0758bd] focus:ring-2 focus:ring-blue-100"
            >
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
        </div>
    );
}

function ProtocolRow({ protocol, copied, onCopy, alternate }: { protocol: Protocol; copied: boolean; onCopy: (id: string) => void; alternate: boolean }) {
    return (
        <tr className={`border-b border-[#E3E9F1] last:border-b-0 transition hover:bg-blue-50/50 ${alternate ? 'bg-[#FAFCFE]' : 'bg-white'}`}>
            <td className="px-5 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                    <CategoryIcon category={protocol.category || protocol.service} />
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-[#0b1b33]">{protocol.service}</p>
                        <p className="truncate text-xs text-slate-600">{protocol.address}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-2.5">
                <div className="flex items-center gap-2">
                    <code className="text-sm text-slate-600">{protocol.id.slice(0, 8)}</code>
                    <CopyButton id={protocol.id} copied={copied} onCopy={onCopy} />
                </div>
            </td>
            <td className="whitespace-nowrap px-5 py-2.5 text-sm text-slate-600">{protocol.date}</td>
            <td className="px-5 py-2.5"><StatusBadge status={protocol.status} /></td>
            <td className="px-5 py-2.5 text-right">
                <Link to={`/protocolo/${protocol.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#CDD8E7] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-[#0758bd] hover:text-[#0758bd]">
                    <Eye size={16} />
                    Ver detalhes
                </Link>
            </td>
        </tr>
    );
}

function MobileProtocolCard({ protocol, copied, onCopy }: { protocol: Protocol; copied: boolean; onCopy: (id: string) => void }) {
    return (
        <article className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_4px_14px_rgba(35,65,110,0.04)]">
            <div className="flex items-start gap-3">
                <CategoryIcon category={protocol.category || protocol.service} />
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#0b1b33]">{protocol.service}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{protocol.address}</p>
                </div>
                <StatusBadge status={protocol.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E3E9F1] pt-4">
                <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Protocolo</p>
                    <div className="mt-1 flex items-center gap-2">
                        <code className="text-sm text-slate-700">{protocol.id.slice(0, 8)}</code>
                        <CopyButton id={protocol.id} copied={copied} onCopy={onCopy} />
                    </div>
                </div>
                <p className="text-sm text-slate-600">{protocol.date}</p>
                <Link to={`/protocolo/${protocol.id}`} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#0758bd] bg-white px-4 text-sm font-semibold text-[#0758bd] sm:w-auto">
                    <Eye size={16} />
                    Ver detalhes
                </Link>
            </div>
        </article>
    );
}

function CategoryIcon({ category }: { category: string }) {
    const normalized = category.toLocaleLowerCase('pt-BR');
    const config = normalized.includes('visual')
        ? { Icon: Eye, colors: 'bg-violet-100 text-violet-700' }
        : normalized.includes('audit')
            ? { Icon: Ear, colors: 'bg-violet-100 text-violet-700' }
            : normalized.includes('fís') || normalized.includes('fis') || normalized.includes('mobil')
                ? { Icon: Accessibility, colors: 'bg-blue-100 text-[#0758bd]' }
                : { Icon: MoreHorizontal, colors: 'bg-emerald-100 text-emerald-700' };
    const Icon = config.Icon;

    return <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${config.colors}`}><Icon size={21} /></span>;
}

function CopyButton({ id, copied, onCopy }: { id: string; copied: boolean; onCopy: (id: string) => void }) {
    return (
        <button
            type="button"
            onClick={() => onCopy(id)}
            title={copied ? 'Protocolo copiado' : 'Copiar protocolo'}
            aria-label={copied ? 'Protocolo copiado' : 'Copiar protocolo'}
            className={`flex size-8 items-center justify-center rounded-md transition ${copied ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-blue-50 hover:text-[#0758bd]'}`}
        >
            {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
    );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
    return (
        <nav className="mt-5 flex items-center justify-center gap-3 border-t border-[#E3E9F1] pt-4" aria-label="Paginação dos protocolos">
            <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} className="flex size-10 items-center justify-center rounded-md border border-[#CDD8E7] text-slate-600 transition hover:bg-slate-50 disabled:opacity-35" aria-label="Página anterior"><ChevronLeft size={18} /></button>
            <span className="flex size-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-sm font-bold text-[#0758bd]">{page}</span>
            <span className="text-sm text-slate-600">de {totalPages}</span>
            <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} className="flex size-10 items-center justify-center rounded-md border border-[#CDD8E7] text-slate-600 transition hover:bg-slate-50 disabled:opacity-35" aria-label="Próxima página"><ChevronRight size={18} /></button>
        </nav>
    );
}

function LoadingRow() {
    return <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Carregando...</td></tr>;
}

function MessageRow({ message, tone = 'default' }: { message: string; tone?: 'default' | 'error' }) {
    return <tr><td colSpan={5} className={`px-5 py-12 text-center ${tone === 'error' ? 'text-red-700' : 'text-slate-500'}`}>{message}</td></tr>;
}