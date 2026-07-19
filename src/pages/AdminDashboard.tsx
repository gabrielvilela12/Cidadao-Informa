import { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Inbox,
  MapPin,
  Menu,
  Search,
  Timer,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { useProtocols } from '../hooks/useProtocols';
import { type Protocol } from '../constants';
import { exportToExcel } from '../utils/exportUtils';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const statusMatches = (status: Protocol['status'], expected: 'open' | 'analysis' | 'resolved' | 'late') => {
  const groups = {
    open: ['Aberto', 'Open'],
    analysis: ['Em Análise', 'InProgress'],
    resolved: ['Concluído', 'Resolved', 'Closed'],
    late: ['Atrasado'],
  };
  return groups[expected].includes(status);
};

function protocolDate(protocol: Protocol) {
  const raw = (protocol as Protocol & { created_at?: string }).created_at;
  if (raw) return new Date(raw);

  const parts = protocol.date?.split('/');
  if (parts?.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  return null;
}

export function AdminDashboard() {
  const { protocols, loading } = useProtocols('admin');
  const { toggleMobileMenu } = useApp();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [neighborhood, setNeighborhood] = useState('all');

  const counts = useMemo(() => ({
    open: protocols.filter((item) => statusMatches(item.status, 'open')).length,
    analysis: protocols.filter((item) => statusMatches(item.status, 'analysis')).length,
    resolved: protocols.filter((item) => statusMatches(item.status, 'resolved')).length,
    late: protocols.filter((item) => statusMatches(item.status, 'late')).length,
  }), [protocols]);

  const total = protocols.length;
  const resolutionRate = total ? Math.round((counts.resolved / total) * 100) : 0;

  const categoryData = useMemo(() => {
    const definitions = [
      { name: 'Física', color: '#0758BD' },
      { name: 'Visual', color: '#168821' },
      { name: 'Auditiva', color: '#F5B700' },
      { name: 'Outros', color: '#8B3DFF' },
    ];

    return definitions.map((definition) => ({
      ...definition,
      value: protocols.filter((item) => item.category === definition.name).length,
    }));
  }, [protocols]);

  const trendData = useMemo(() => {
    const selectedYear = Number(year);
    const opened = Array(12).fill(0);
    const resolved = Array(12).fill(0);

    protocols.forEach((protocol) => {
      const date = protocolDate(protocol);
      if (!date || date.getFullYear() !== selectedYear) return;
      opened[date.getMonth()] += 1;
      if (statusMatches(protocol.status, 'resolved')) resolved[date.getMonth()] += 1;
    });

    const lastMonth = selectedYear === currentYear ? new Date().getMonth() : 11;
    return MONTH_LABELS.slice(0, lastMonth + 1).map((name, index) => ({
      name,
      abertas: opened[index],
      resolvidas: resolved[index],
    }));
  }, [currentYear, protocols, year]);

  const miniSeries = (value: number) => [
    { value: Math.max(0, value - 3) },
    { value: Math.max(0, value - 1) },
    { value: Math.max(0, value - 2) },
    { value },
    { value: Math.max(0, value - 1) },
    { value },
  ];

  const kpis = [
    { label: 'Total', value: total, icon: Inbox, tone: 'blue', series: miniSeries(total) },
    { label: 'Em análise', value: counts.analysis, icon: Timer, tone: 'blue', series: miniSeries(counts.analysis) },
    { label: 'Em atraso', value: counts.late, icon: AlertCircle, tone: 'red', series: miniSeries(counts.late) },
    { label: 'Resolução', value: `${resolutionRate}%`, icon: CheckCircle2, tone: 'green', series: miniSeries(resolutionRate) },
  ] as const;

  const neighborhoods = useMemo(() => {
    const values = protocols
      .map((item) => item.address?.split('-')[0]?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).slice(0, 8);
  }, [protocols]);

  const statusSegments = [
    { label: 'Abertos', value: counts.open, color: '#0758BD' },
    { label: 'Em análise', value: counts.analysis, color: '#FFB800' },
    { label: 'Concluídos', value: counts.resolved, color: '#168821' },
    { label: 'Atrasados', value: counts.late, color: '#E52207' },
  ];

  const tooltipStyle = {
    background: '#FFFFFF',
    border: '1px solid #CDD8E7',
    borderRadius: 8,
    color: '#17233A',
    boxShadow: '0 10px 28px rgba(15,45,85,0.12)',
  };

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
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
              <p className="text-sm font-medium text-slate-600">Portal do Servidor</p>
              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">Visão Geral Executiva</h1>
              <p className="mt-1 text-sm text-slate-600">Monitoramento em tempo real da acessibilidade pública</p>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <label className="relative min-w-[145px] flex-1 sm:flex-none">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
                <select value={year} onChange={(event) => setYear(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-9 text-sm font-semibold text-slate-700">
                  {[currentYear - 2, currentYear - 1, currentYear].map((item) => <option key={item} value={item}>Ano {item}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              </label>
              <label className="relative min-w-[180px] flex-1 sm:flex-none">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
                <select value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-9 text-sm font-semibold text-slate-700">
                  <option value="all">Todos os bairros</option>
                  {neighborhoods.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              </label>
              <button
                type="button"
                onClick={() => exportToExcel(protocols, 'dashboard_executivo.xlsx')}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(19,81,180,0.18)] hover:bg-blue-700 sm:flex-none"
              >
                <Download size={17} />
                Exportar dados
              </button>
            </div>
            <p className="flex items-center justify-end gap-2 text-xs font-bold text-[#168821]">
              <span className="size-2 rounded-full bg-green-600" />
              Dados atualizados agora
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const color = kpi.tone === 'red' ? '#E52207' : kpi.tone === 'green' ? '#168821' : '#0758BD';
            const iconBg = kpi.tone === 'red' ? 'bg-red-50 text-red-600' : kpi.tone === 'green' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700';
            return (
              <article key={kpi.label} className="min-h-[132px] rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
                <div className="flex items-start gap-3">
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${iconBg}`}><Icon size={22} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-600">{kpi.label}</p>
                      <span className="hidden items-center gap-1 text-[10px] font-bold text-[#168821] sm:flex"><span className="size-1.5 rounded-full bg-green-600" />Ao vivo</span>
                    </div>
                    <p className="mt-1 text-2xl font-black">{loading ? '—' : kpi.value}</p>
                  </div>
                </div>
                <div className="mt-3 h-7">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.series}>
                      <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.08} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white px-5 py-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-black">Distribuição por status</h2>
            <span className="text-sm text-slate-600">{total} total</span>
          </div>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
            {statusSegments.filter((item) => item.value > 0).map((item) => (
              <span key={item.label} style={{ width: `${total ? (item.value / total) * 100 : 0}%`, backgroundColor: item.color }} title={`${item.label}: ${item.value}`} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {statusSegments.filter((item) => item.value > 0).map((item) => (
              <span key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <strong className="text-[#17233A]">{item.value}</strong> {item.label}
              </span>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <article className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)] xl:col-span-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-black">Fluxo de solicitações</h2>
                <p className="mt-1 text-sm text-slate-600">Abertas por mês em {year}</p>
              </div>
              <div className="flex gap-4 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-blue-600" />Abertas</span>
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-green-600" />Resolvidas</span>
              </div>
            </div>
            <div className="mt-4 h-[245px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -22, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="adminFlowBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0758BD" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#0758BD" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#D8E1ED" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#64748B" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#64748B" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="abertas" name="Abertas" stroke="#0758BD" strokeWidth={2.5} fill="url(#adminFlowBlue)" />
                  <Area type="monotone" dataKey="resolvidas" name="Resolvidas" stroke="#168821" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)] xl:col-span-2">
            <h2 className="font-black">Por categoria</h2>
            <div className="mt-3 grid min-h-[255px] grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_150px]">
              <div className="relative h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} innerRadius={62} outerRadius={88} paddingAngle={2} dataKey="value">
                      {categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <strong className="text-3xl font-black">{total}</strong>
                  <span className="text-xs text-slate-600">total</span>
                </div>
              </div>
              <div className="space-y-3">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-start gap-2">
                    <span className="mt-1 size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-xs text-slate-600">{total ? Math.round((item.value / total) * 100) : 0}% · {item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 divide-y divide-[#D8E1ED] rounded-lg border border-[#CDD8E7] bg-white px-5 py-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <OperationalIndicator icon={<Users size={23} />} value={counts.open} label="aguardando triagem" />
          <OperationalIndicator icon={<Search size={23} />} value={counts.analysis} label="em análise" />
          <OperationalIndicator icon={<AlertCircle size={23} />} value={counts.late} label="em atraso" danger />
        </section>
      </div>
    </div>
  );
}

function OperationalIndicator({ icon, value, label, danger = false }: { icon: React.ReactNode; value: number; label: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4 px-4 py-3">
      <span className={`flex size-11 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>{icon}</span>
      <div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs text-slate-600">{label}</p>
      </div>
    </div>
  );
}
