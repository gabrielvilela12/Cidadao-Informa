import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Download,
  FileText,
  Filter,
  MapPin,
  PieChart as PieChartIcon,
  Tag,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Header } from '../components/Header';
import { type Protocol } from '../constants';
import { useProtocols } from '../hooks/useProtocols';
import { exportToExcel } from '../utils/exportUtils';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function protocolDate(protocol: Protocol) {
  const raw = (protocol as Protocol & { created_at?: string }).created_at;
  if (raw) return new Date(raw);
  const parts = protocol.date?.split('/');
  return parts?.length === 3 ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : null;
}

const isResolved = (status: Protocol['status']) => ['Concluído', 'Resolved', 'Closed'].includes(status);

export function AdminReports() {
  const { protocols, loading } = useProtocols('admin');
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [location, setLocation] = useState('all');
  const [category, setCategory] = useState('all');
  const [applied, setApplied] = useState({ year: currentYear.toString(), location: 'all', category: 'all' });

  const locations = useMemo(() => Array.from(new Set(protocols
    .map((item) => item.address?.split('-')[0]?.trim())
    .filter((value): value is string => Boolean(value)))).slice(0, 10), [protocols]);

  const filteredProtocols = useMemo(() => protocols.filter((protocol) => {
    const date = protocolDate(protocol);
    const matchesYear = !date || date.getFullYear().toString() === applied.year;
    const matchesLocation = applied.location === 'all' || protocol.address?.includes(applied.location);
    const matchesCategory = applied.category === 'all' || protocol.category === applied.category;
    return matchesYear && matchesLocation && matchesCategory;
  }), [applied, protocols]);

  const resolutionData = useMemo(() => {
    const opened = Array(12).fill(0);
    const resolved = Array(12).fill(0);
    filteredProtocols.forEach((protocol) => {
      const date = protocolDate(protocol);
      if (!date) return;
      opened[date.getMonth()] += 1;
      if (isResolved(protocol.status)) resolved[date.getMonth()] += 1;
    });

    const selectedYear = Number(applied.year);
    const monthCount = selectedYear === currentYear ? new Date().getMonth() + 1 : 12;
    return MONTH_LABELS.slice(0, monthCount).map((name, index) => ({
      name,
      abertas: opened[index],
      resolvidas: resolved[index],
    }));
  }, [applied.year, currentYear, filteredProtocols]);

  const categoryData = useMemo(() => [
    { id: 'Física', name: 'Acessibilidade Física', color: '#8B3DFF' },
    { id: 'Visual', name: 'Acessibilidade Visual', color: '#0758BD' },
    { id: 'Auditiva', name: 'Acessibilidade Auditiva', color: '#168821' },
    { id: 'Outros', name: 'Outros', color: '#64748B' },
  ].map((item) => ({
    ...item,
    value: filteredProtocols.filter((protocol) => protocol.category === item.id).length,
  })), [filteredProtocols]);

  const lateCount = filteredProtocols.filter((item) => item.status === 'Atrasado').length;
  const slaRate = filteredProtocols.length ? Math.max(0, Math.round(((filteredProtocols.length - lateCount) / filteredProtocols.length) * 100)) : 0;
  const slaData = [
    { name: 'No prazo', value: slaRate, color: '#08A86B' },
    { name: 'Atenção', value: 100 - slaRate, color: '#FFB800' },
  ];

  const exportRows = () => filteredProtocols.map((protocol) => ({
    Protocolo: protocol.id,
    Solicitante: protocol.requester,
    Categoria: protocol.category,
    Endereço: protocol.address,
    Status: protocol.status,
    Data: protocol.date,
    Prioridade: protocol.ai_priority || 'Processando',
  }));

  const tooltipStyle = {
    background: '#FFFFFF',
    border: '1px solid #CDD8E7',
    borderRadius: 8,
    color: '#17233A',
    boxShadow: '0 10px 28px rgba(15,45,85,0.12)',
  };

  const reportCards = [
    { title: 'Ocorrências por Bairro', description: 'Volume absoluto de aberturas por localização.', icon: PieChartIcon, tone: 'purple', data: categoryData, file: 'ocorrencias_bairro.xlsx' },
    { title: 'SLA de Atendimento', description: 'Tempo médio e conformidade de resposta.', icon: BarChart3, tone: 'green', data: slaData, file: 'sla_atendimento.xlsx' },
    { title: 'Taxa de Resolução Mensal', description: 'Evolução de protocolos concluídos no ano.', icon: TrendingUp, tone: 'yellow', data: resolutionData, file: 'resolucao_mensal.xlsx' },
    { title: 'Extrato Analítico', description: 'Exportação bruta e detalhada de toda a base.', icon: FileText, tone: 'blue', data: exportRows(), file: 'extrato_analitico.xlsx', highlight: true },
  ] as const;

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <Header
        title="Relatórios e Análises"
        subtitle="Estatísticas detalhadas e exportação de dados"
        action={(
          <button
            type="button"
            onClick={() => exportToExcel(exportRows(), 'relatorio_geral.xlsx')}
            disabled={loading || filteredProtocols.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CalendarDays size={17} />
            Exportar relatório geral
            <ChevronDown size={16} />
          </button>
        )}
      />

      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 pb-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-3 rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)] xl:flex-row xl:items-center">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ReportSelect icon={<CalendarDays size={17} />} value={year} onChange={setYear} options={[
              [(currentYear - 2).toString(), `Ano ${currentYear - 2}`],
              [(currentYear - 1).toString(), `Ano ${currentYear - 1}`],
              [currentYear.toString(), `Ano ${currentYear}`],
            ]} />
            <ReportSelect icon={<MapPin size={17} />} value={location} onChange={setLocation} options={[
              ['all', 'Todas as lotações'],
              ...locations.map((item): [string, string] => [item, item]),
            ]} />
            <ReportSelect icon={<Tag size={17} />} value={category} onChange={setCategory} options={[
              ['all', 'Todas as categorias'], ['Física', 'Física'], ['Visual', 'Visual'], ['Auditiva', 'Auditiva'], ['Outros', 'Outros'],
            ]} />
            <ReportSelect icon={<CalendarDays size={17} />} value="period" onChange={() => undefined} options={[
              ['period', `Jan–${MONTH_LABELS[new Date().getMonth()]}`],
            ]} />
          </div>
          <button
            type="button"
            onClick={() => setApplied({ year, location, category })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Filter size={17} /> Aplicar filtros
          </button>
          <p className="whitespace-nowrap text-sm text-slate-600 xl:ml-auto">Última atualização: agora</p>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {reportCards.map((card) => (
            <ReportCard
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
              tone={card.tone}
              highlight={'highlight' in card && card.highlight}
              onClick={() => exportToExcel(card.data, card.file)}
            />
          ))}
        </section>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-[#CDD8E7] bg-white text-sm text-slate-600">Carregando análises...</div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <article className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)] xl:col-span-3">
                <h2 className="font-black">Taxa de Resolução vs Abertura</h2>
                <p className="mt-1 text-sm text-slate-600">Desempenho da gestão no ano de {applied.year}</p>
                <div className="mt-4 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resolutionData} margin={{ left: -18, right: 8, top: 8 }}>
                      <CartesianGrid stroke="#D8E1ED" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#64748B" />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#64748B" allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
                      <Bar dataKey="abertas" name="Abertas" fill="#3D4B60" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolvidas" name="Resolvidas" fill="#0758BD" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)] xl:col-span-2">
                <h2 className="font-black">Conformidade de SLA Geral</h2>
                <p className="mt-1 text-sm text-slate-600">Proporção de resoluções no prazo estipulado</p>
                <div className="relative mt-4 h-[235px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={slaData} innerRadius={76} outerRadius={102} paddingAngle={2} dataKey="value">
                        {slaData.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <strong className="text-4xl font-black">{slaRate}%</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {slaData.map((item) => (
                    <div key={item.name} className="text-center">
                      <p className="flex items-center justify-center gap-2 text-xl font-black"><span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />{item.value}%</p>
                      <p className="mt-1 text-sm text-slate-600">{item.name}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
              <h2 className="font-black">Volumetria por Macro Categoria</h2>
              <div className="mt-4 grid grid-cols-1 items-center gap-6 md:grid-cols-[320px_1fr]">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} innerRadius={55} outerRadius={92} paddingAngle={2} dataKey="value">
                        {categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3 last:border-0">
                      <span className="flex items-center gap-3 text-sm font-semibold"><span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                      <strong className="text-sm">{item.value} chamados</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ReportSelect({ icon, value, onChange, options }: { icon: React.ReactNode; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <label className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">{icon}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-3 text-sm font-semibold text-slate-700">
        {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
      </select>
    </label>
  );
}

function ReportCard({ title, description, icon: Icon, tone, highlight, onClick }: { title: string; description: string; icon: React.ComponentType<{ size?: number }>; tone: 'purple' | 'green' | 'yellow' | 'blue'; highlight: boolean; onClick: () => void }) {
  const tones = {
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-100 text-[#0758BD]',
  };
  return (
    <button type="button" onClick={onClick} className={`flex min-h-[138px] items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:border-[#7EAAE2] ${highlight ? 'border-blue-400 bg-[#F2F7FF]' : 'border-[#CDD8E7] bg-white'}`}>
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}><Icon size={27} /></span>
      <span className="min-w-0">
        <span className={`block font-black ${highlight ? 'text-[#0758BD]' : ''}`}>{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0758BD]">Abrir relatório <Download size={15} /></span>
      </span>
    </button>
  );
}
