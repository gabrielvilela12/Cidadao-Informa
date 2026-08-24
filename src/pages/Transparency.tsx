import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    ArrowLeft,
    Bot,
    CheckCircle2,
    Clock3,
    Database,
    Download,
    LogIn,
    MapPinned,
    RefreshCw,
    ShieldCheck,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { CidadaoBrand } from '../components/CidadaoBrand';
import { api, type TransparencyData, type TransparencyMetric } from '../services/api';

const TransparencyMap = lazy(() =>
    import('../components/TransparencyMap').then((module) => ({ default: module.TransparencyMap })),
);

const numberFormatter = new Intl.NumberFormat('pt-BR');
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
});

function formatNumber(value: number) {
    return numberFormatter.format(value);
}

function formatPercent(value: number | null) {
    return value == null ? '—' : `${value}%`;
}

function downloadFile(filename: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number) {
    return `"${String(value).replaceAll('"', '""')}"`;
}

const distributionItemStyles: Record<string, { bar: string; dot: string; badge: string }> = {
    Aberto: { bar: 'bg-blue-600', dot: 'bg-blue-600', badge: 'bg-blue-50 text-blue-700' },
    'Em análise': { bar: 'bg-amber-500', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
    Concluído: { bar: 'bg-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    Atrasado: { bar: 'bg-red-500', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' },
    Física: { bar: 'bg-sky-500', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700' },
    Visual: { bar: 'bg-violet-500', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700' },
    Auditiva: { bar: 'bg-orange-500', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700' },
    Outros: { bar: 'bg-indigo-500', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700' },
    Crítica: { bar: 'bg-red-600', dot: 'bg-red-600', badge: 'bg-red-50 text-red-700' },
    Alta: { bar: 'bg-orange-500', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700' },
    Média: { bar: 'bg-amber-400', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' },
    Baixa: { bar: 'bg-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    'Não classificada': { bar: 'bg-slate-400', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
};

const defaultDistributionItemStyle = {
    bar: 'bg-blue-600',
    dot: 'bg-blue-600',
    badge: 'bg-blue-50 text-blue-700',
};

const distributionCardStyles: Record<string, { border: string; dot: string }> = {
    'Por status': { border: 'border-t-blue-500', dot: 'bg-blue-500' },
    'Por categoria': { border: 'border-t-violet-500', dot: 'bg-violet-500' },
    'Por prioridade': { border: 'border-t-orange-500', dot: 'bg-orange-500' },
};

function DistributionCard({ title, items }: { title: string; items: TransparencyMetric[] }) {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const max = Math.max(...items.map((item) => item.value), 1);
    const cardStyle = distributionCardStyles[title] ?? distributionCardStyles['Por status'];

    return (
        <section className={`rounded-2xl border border-t-4 border-slate-200 bg-white p-6 shadow-sm ${cardStyle.border}`}>
            <h2 className="flex items-center gap-2.5 text-lg font-black text-[#071A3A]">
                <span className={`size-2.5 rounded-full ${cardStyle.dot}`} aria-hidden="true" />
                {title}
            </h2>
            <div className="mt-5 space-y-4">
                {items.map((item) => {
                    const itemStyle = distributionItemStyles[item.label] ?? defaultDistributionItemStyle;
                    const percentage = total ? Math.round((item.value / total) * 100) : 0;

                    return (
                        <div key={item.label}>
                            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                                <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                                    <span className={`size-2 rounded-full ${itemStyle.dot}`} aria-hidden="true" />
                                    {item.label}
                                </span>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${itemStyle.badge}`}>
                                    {formatNumber(item.value)} · {percentage}%
                                </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${itemStyle.bar}`}
                                    style={{ width: `${Math.max(item.value ? 3 : 0, (item.value / max) * 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function LoadingState() {
    return (
        <div className="mx-auto max-w-[1440px] px-5 py-20 text-center sm:px-8">
            <RefreshCw className="mx-auto size-9 animate-spin text-[#0B63CE] motion-reduce:animate-none" aria-hidden="true" />
            <p className="mt-4 font-semibold text-slate-600">Preparando os dados públicos…</p>
        </div>
    );
}

export function Transparency() {
    const [data, setData] = useState<TransparencyData | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await api.getTransparency());
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os dados.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const exportCsv = () => {
        if (!data) return;
        const header = ['protocolo_anonimizado', 'categoria', 'localidade', 'data', 'status', 'prioridade'];
        const rows = data.recentProtocols.map((item) => [
            item.publicId,
            item.category,
            item.location,
            item.createdAt,
            item.status,
            item.priority,
        ]);
        const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');
        downloadFile(
            `protocolos-publicos-${data.generatedAt.slice(0, 10)}.csv`,
            `\uFEFF${csv}`,
            'text/csv;charset=utf-8',
        );
    };

    const monthlyData = data?.monthlyEvolution.map((item) => ({
        ...item,
        label: monthFormatter.format(new Date(`${item.month}-01T00:00:00Z`)).replace('.', ''),
    })) ?? [];

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#F5F8FC] text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
                    <Link to="/" aria-label="Voltar para a página inicial">
                        <CidadaoBrand iconClassName="size-11" />
                    </Link>
                    <nav className="flex items-center gap-2" aria-label="Navegação da transparência">
                        <Link to="/" className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                            <ArrowLeft size={18} aria-hidden="true" />
                            <span className="hidden sm:inline">Página inicial</span>
                        </Link>
                        <Link to="/login" className="inline-flex h-10 items-center rounded-lg bg-[#0B63CE] px-4 text-sm font-bold text-white hover:bg-[#084C9F]">
                            Entrar
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#EAF3FF_0%,#F8FBFF_55%,#ECFDF3_100%)]">
                    <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:gap-14 lg:py-14">
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#0758BD]">
                                <ShieldCheck size={16} aria-hidden="true" /> Dados públicos e protegidos
                            </span>
                            <h1 className="mt-5 text-4xl font-black tracking-tight text-[#071A3A] sm:text-5xl">
                                Transparência Cidadão Informa
                            </h1>
                            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                                Acompanhe os resultados da plataforma, os prazos, a cobertura dos dados e o uso de inteligência artificial — sem expor nenhum cidadão.
                            </p>

                            {data && (
                                <div className="mt-8">
                                    <p className="text-sm text-slate-600" aria-live="polite">
                                        Atualizado em <strong>{dateFormatter.format(new Date(data.generatedAt))}</strong>
                                    </p>
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#0B63CE] hover:text-[#0758BD] disabled:opacity-60">
                                            <RefreshCw size={17} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> Atualizar
                                        </button>
                                        <button type="button" onClick={exportCsv} className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#0B63CE] hover:text-[#0758BD]">
                                            <Download size={17} aria-hidden="true" /> CSV
                                        </button>
                                        <Link to="/login" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B63CE] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#084C9F]">
                                            <LogIn size={17} aria-hidden="true" /> Entrar
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 p-2 shadow-[0_24px_70px_-35px_rgba(11,99,206,0.55)]">
                            <img
                                src="/transparency-banner.jpg"
                                alt="Cidadãos acompanhando dados públicos acessíveis em um mapa da cidade"
                                width="1536"
                                height="1024"
                                className="aspect-[3/2] w-full rounded-[1.55rem] object-cover"
                                fetchPriority="high"
                            />
                        </div>
                    </div>
                </section>

                {loading && !data ? <LoadingState /> : error && !data ? (
                    <div className="mx-auto max-w-2xl px-5 py-20 text-center" role="alert">
                        <h2 className="text-2xl font-black text-[#071A3A]">Os dados não carregaram</h2>
                        <p className="mt-3 text-slate-600">{error}</p>
                        <button type="button" onClick={() => void loadData()} className="mt-6 rounded-lg bg-[#0B63CE] px-5 py-3 font-bold text-white">Tentar novamente</button>
                    </div>
                ) : data && (
                    <div className="mx-auto max-w-[1440px] space-y-8 px-5 py-10 sm:px-8 lg:py-14">
                        {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">Não foi possível atualizar agora. Os últimos dados carregados continuam visíveis.</p>}

                        <section aria-labelledby="overview-title">
                            <div className="mb-5 flex items-end justify-between gap-4">
                                <div>
                                    <h2 id="overview-title" className="text-2xl font-black text-[#071A3A]">Visão geral</h2>
                                    <p className="mt-1 text-sm text-slate-500">Indicadores acumulados desde o início da plataforma.</p>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                {[
                                    { label: 'Solicitações', value: formatNumber(data.overview.total), icon: Database, color: 'text-blue-700 bg-blue-50' },
                                    { label: 'Abertas', value: formatNumber(data.overview.open), icon: Activity, color: 'text-sky-700 bg-sky-50' },
                                    { label: 'Em análise', value: formatNumber(data.overview.inAnalysis), icon: Clock3, color: 'text-amber-700 bg-amber-50' },
                                    { label: 'Concluídas', value: formatNumber(data.overview.completed), icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
                                    { label: 'Taxa de resolução', value: formatPercent(data.overview.resolutionRate), icon: ShieldCheck, color: 'text-violet-700 bg-violet-50' },
                                    { label: 'Cidadãos', value: formatNumber(data.overview.citizens), icon: Users, color: 'text-indigo-700 bg-indigo-50' },
                                ].map((card) => (
                                    <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <span className={`flex size-10 items-center justify-center rounded-xl ${card.color}`}><card.icon size={21} aria-hidden="true" /></span>
                                        <strong className="mt-5 block text-3xl font-black text-[#071A3A]">{card.value}</strong>
                                        <span className="mt-1 block text-sm font-semibold text-slate-500">{card.label}</span>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8" aria-labelledby="evolution-title">
                            <h2 id="evolution-title" className="text-xl font-black text-[#071A3A]">Evolução nos últimos 12 meses</h2>
                            <p className="mt-1 text-sm text-slate-500">Concluídas considera a situação atual das solicitações abertas em cada mês.</p>
                            <div className="mt-7 h-80 min-w-0" aria-label="Gráfico mensal de solicitações registradas e atualmente concluídas">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                    minWidth={0}
                                    initialDimension={{ width: 800, height: 320 }}
                                >
                                    <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#D9E2EF" />
                                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#F1F5F9' }} />
                                        <Legend />
                                        <Bar name="Registradas" dataKey="registered" fill="#0B63CE" radius={[5, 5, 0, 0]} />
                                        <Bar name="Atualmente concluídas" dataKey="currentlyCompleted" fill="#159447" radius={[5, 5, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <DistributionCard title="Por status" items={data.statusDistribution} />
                            <DistributionCard title="Por categoria" items={data.categoryDistribution} />
                            <DistributionCard title="Por prioridade" items={data.priorityDistribution} />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Clock3 aria-hidden="true" /></span>
                                    <div><h2 className="text-xl font-black text-[#071A3A]">Prazos das demandas ativas</h2><p className="text-sm text-slate-500">SLA calculado pela prioridade atual.</p></div>
                                </div>
                                <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {[
                                        ['Dentro do prazo', data.sla.onTime],
                                        ['Próximas do prazo', data.sla.dueSoon],
                                        ['Em atraso', data.sla.late],
                                        ['No prazo', formatPercent(data.sla.onTimeRate)],
                                    ].map(([label, value]) => (
                                        <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><strong className="block text-2xl font-black text-[#071A3A]">{typeof value === 'number' ? formatNumber(value) : value}</strong><span className="mt-1 block text-xs font-semibold text-slate-500">{label}</span></div>
                                    ))}
                                </div>
                                <p className="mt-5 text-xs leading-5 text-slate-500">Prazos adotados: crítica 48h, alta 5 dias, média 15 dias e baixa 30 dias. O sistema ainda não possui a data histórica de conclusão; por isso esta seção mede somente demandas ativas.</p>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Bot aria-hidden="true" /></span>
                                    <div><h2 className="text-xl font-black text-[#071A3A]">Transparência da inteligência artificial</h2><p className="text-sm text-slate-500">A IA sugere prioridade; a decisão pode ser revista.</p></div>
                                </div>
                                <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                    <div><dt className="text-slate-500">Cobertura</dt><dd className="mt-1 text-2xl font-black text-[#071A3A]">{formatPercent(data.ai.coverageRate)}</dd></div>
                                    <div><dt className="text-slate-500">Classificadas</dt><dd className="mt-1 text-2xl font-black text-[#071A3A]">{formatNumber(data.ai.classified)}</dd></div>
                                    <div><dt className="text-slate-500">Pendentes</dt><dd className="mt-1 font-bold text-slate-800">{formatNumber(data.ai.pending)}</dd></div>
                                    <div><dt className="text-slate-500">Falhas</dt><dd className="mt-1 font-bold text-slate-800">{formatNumber(data.ai.failed)}</dd></div>
                                </dl>
                                <p className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4 text-xs leading-5 text-violet-950">Modelo em uso: <strong>{data.ai.model}</strong>. A classificação considera descrição e categoria da solicitação. Ela não aprova, rejeita ou conclui protocolos automaticamente.</p>
                            </section>
                        </div>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="map-title">
                            <div className="grid lg:grid-cols-[360px_1fr]">
                                <div className="p-6 lg:p-8">
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><MapPinned aria-hidden="true" /></span>
                                    <h2 id="map-title" className="mt-5 text-xl font-black text-[#071A3A]">Distribuição geográfica agregada</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">Os círculos mostram volume aproximado por área. As coordenadas são arredondadas para uma grade de cerca de 25 km para não revelar o local exato de nenhuma solicitação.</p>
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-slate-50 p-4"><strong className="block text-2xl font-black text-[#071A3A]">{formatNumber(data.dataQuality.withCoordinates)}</strong><span className="text-xs font-semibold text-slate-500">com localização</span></div>
                                        <div className="rounded-xl bg-slate-50 p-4"><strong className="block text-2xl font-black text-[#071A3A]">{formatNumber(data.dataQuality.withoutCoordinates)}</strong><span className="text-xs font-semibold text-slate-500">sem localização</span></div>
                                    </div>
                                </div>
                                <div className="h-[420px] border-t border-slate-200 bg-slate-100 lg:border-l lg:border-t-0">
                                    {data.geography.length ? (
                                        <Suspense fallback={<div className="flex h-full items-center justify-center font-semibold text-slate-500">Carregando mapa agregado…</div>}>
                                            <TransparencyMap clusters={data.geography} />
                                        </Suspense>
                                    ) : <div className="flex h-full items-center justify-center px-8 text-center font-semibold text-slate-500">Ainda não há coordenadas suficientes para o mapa público.</div>}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="recent-title">
                            <div className="flex flex-col gap-2 border-b border-slate-200 p-6 sm:flex-row sm:items-end sm:justify-between lg:px-8">
                                <div><h2 id="recent-title" className="text-xl font-black text-[#071A3A]">Solicitações recentes anonimizadas</h2><p className="mt-1 text-sm text-slate-500">Somente protocolo abreviado, categoria, cidade/UF, data, status e prioridade.</p></div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Últimas {data.recentProtocols.length}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <caption className="sr-only">Lista de solicitações recentes com dados pessoais removidos</caption>
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4 lg:pl-8">Protocolo</th><th className="px-6 py-4">Categoria</th><th className="px-6 py-4">Localidade</th><th className="px-6 py-4">Data</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 lg:pr-8">Prioridade</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.recentProtocols.map((item) => (
                                            <tr key={`${item.publicId}-${item.createdAt}`} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono font-bold text-[#0758BD] lg:pl-8">#{item.publicId}</td><td className="px-6 py-4 font-semibold text-slate-700">{item.category}</td><td className="px-6 py-4 text-slate-600">{item.location}</td><td className="px-6 py-4 text-slate-600">{dateFormatter.format(new Date(item.createdAt))}</td><td className="px-6 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">{item.status}</span></td><td className="px-6 py-4 text-slate-600 lg:pr-8">{item.priority}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                                <div className="flex items-center gap-3"><ShieldCheck className={data.audit.valid ? 'text-emerald-600' : 'text-red-600'} aria-hidden="true" /><h2 className="text-xl font-black text-[#071A3A]">Integridade e qualidade</h2></div>
                                <p className="mt-4 text-sm leading-6 text-slate-600">A cadeia de auditoria está <strong>{data.audit.valid ? 'íntegra' : 'com divergência detectada'}</strong>, com {formatNumber(data.audit.totalBlocks)} eventos verificados. {formatNumber(data.dataQuality.withAiClassification)} solicitações possuem classificação de prioridade e {formatNumber(data.dataQuality.withoutAiClassification)} ainda não.</p>
                            </section>
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                                <h2 className="text-xl font-black text-[#071A3A]">Metodologia e privacidade</h2>
                                <p className="mt-4 text-sm leading-6 text-slate-600">Os indicadores são calculados diretamente sobre os protocolos existentes no momento indicado. Não publicamos nome, CPF, telefone, e-mail, descrição, fotos, endereço completo nem coordenadas exatas. Taxas sem base de cálculo aparecem como “—”.</p>
                                <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold"><Link to="/privacidade" className="text-[#0758BD] hover:underline">Política de privacidade</Link><Link to="/termos-de-uso" className="text-[#0758BD] hover:underline">Termos de uso</Link><Link to="/acessibilidade" className="text-[#0758BD] hover:underline">Acessibilidade</Link></div>
                            </section>
                        </div>
                    </div>
                )}
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p>© 2026 Cidadão Informa · Dados públicos com privacidade</p>
                    <Link to="/" className="font-bold text-[#0758BD] hover:underline">Voltar à página inicial</Link>
                </div>
            </footer>
        </div>
    );
}
