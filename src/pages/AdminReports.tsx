import { useMemo, useState } from 'react';
import {
  AlertCircle,
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
import { exportToExcel, protocolExportRows, type ExportRow } from '../utils/exportUtils';
import { summarizeSlaCompliance } from '../utils/sla';
import { extractNeighborhood, listNeighborhoods } from '../utils/address';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function protocolDate(protocol: Protocol) {
  const raw = (protocol as Protocol & { created_at?: string }).created_at;
  if (raw) return new Date(raw);
  const parts = protocol.date?.split('/');
  return parts?.length === 3 ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : null;
}

const isResolved = (status: Protocol['status']) => ['Concluído', 'Resolved', 'Closed'].includes(status);

interface ReportCardConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  tone: 'purple' | 'green' | 'yellow' | 'blue';
  /** Linhas ja mapeadas para a planilha, com cabecalhos em portugues. */
  rows: ExportRow[];
  file: string;
  sheet: string;
  highlight?: boolean;
}

export function AdminReports() {
  const { protocols, loading } = useProtocols('admin');
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [location, setLocation] = useState('all');
  const [category, setCategory] = useState('all');
  const [applied, setApplied] = useState({ year: currentYear.toString(), location: 'all', category: 'all' });

  // Bairros extraidos do endereco. Antes era `address.split('-')[0]`, que
  // devolve "Rua X, 881" - a lista rotulada "lotacoes" vinha cheia de ruas.
  const neighborhoods = useMemo(
    () => listNeighborhoods(protocols.map((item) => item.address)),
    [protocols],
  );

  const filteredProtocols = useMemo(() => protocols.filter((protocol) => {
    const date = protocolDate(protocol);
    const matchesYear = !date || date.getFullYear().toString() === applied.year;
    // Comparacao exata pelo bairro extraido, nao substring do endereco inteiro:
    // "Centro" nao deve casar com "Centro Historico" nem com "Rua do Centro".
    const matchesLocation = applied.location === 'all'
      || extractNeighborhood(protocol.address) === applied.location;
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

  // Ocorrencias agrupadas por bairro. O cartao "Ocorrencias por Bairro"
  // exportava `categoryData`, ou seja, dados por categoria - nao batia com o
  // proprio titulo nem com o nome do arquivo gerado.
  const neighborhoodData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredProtocols.forEach((protocol) => {
      const key = extractNeighborhood(protocol.address) ?? 'Sem bairro informado';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filteredProtocols]);

  // Conformidade sobre o prazo real (created_at vs prioridade da triagem).
  // Antes o calculo usava `status === 'Atrasado'`, valor que nenhum fluxo
  // atribui, o que fixava a conformidade em 100% mesmo sem nenhuma resolucao.
  const slaSummary = useMemo(() => summarizeSlaCompliance(filteredProtocols), [filteredProtocols]);
  const slaRate = slaSummary.rate;
  const slaData = slaRate === null
    ? []
    : [
      { name: 'No prazo', value: slaRate, color: '#08A86B' },
      { name: 'Vencido', value: 100 - slaRate, color: '#E52207' },
    ];

  const tooltipStyle = {
    background: '#FFFFFF',
    border: '1px solid #CDD8E7',
    borderRadius: 8,
    color: '#17233A',
    boxShadow: '0 10px 28px rgba(15,45,85,0.12)',
  };

  // Cada cartao passou a exportar o conteudo do relatorio, nao a estrutura do
  // grafico: o de SLA gerava colunas name/value/color - com o hex da cor dentro
  // da planilha - e os outros dois saiam com cabecalhos `name`/`value`.
  const protocolRows = useMemo(() => protocolExportRows(filteredProtocols), [filteredProtocols]);

  const neighborhoodRows: ExportRow[] = neighborhoodData.map((item) => ({
    Bairro: item.name,
    Ocorrências: item.value,
    'Participação (%)': filteredProtocols.length
      ? Math.round((item.value / filteredProtocols.length) * 1000) / 10
      : 0,
  }));

  // Uma linha com os numeros que sustentam o percentual do painel. Vazio quando
  // nao ha base de calculo, o mesmo critério do estado "Sem dados suficientes".
  const slaRows: ExportRow[] = slaSummary.evaluated === 0 ? [] : [{
    'Solicitações em aberto avaliadas': slaSummary.evaluated,
    'No prazo': slaSummary.onTime,
    Vencidas: slaSummary.late,
    'Conformidade (%)': slaSummary.rate ?? 0,
    'Concluídas fora do cálculo (sem data de conclusão)': slaSummary.resolvedWithoutData,
  }];

  const resolutionRows: ExportRow[] = resolutionData.map((item) => ({
    Mês: item.name,
    Ano: applied.year,
    Abertas: item.abertas,
    Resolvidas: item.resolvidas,
    'Taxa de resolução (%)': item.abertas
      ? Math.round((item.resolvidas / item.abertas) * 100)
      : 0,
  }));

  const reportCards: ReportCardConfig[] = [
    { title: 'Ocorrências por Bairro', description: 'Volume absoluto de aberturas por localização.', icon: PieChartIcon, tone: 'purple', rows: neighborhoodRows, file: 'ocorrencias_bairro.xlsx', sheet: 'Ocorrências por bairro' },
    { title: 'SLA de Atendimento', description: 'Tempo médio e conformidade de resposta.', icon: BarChart3, tone: 'green', rows: slaRows, file: 'sla_atendimento.xlsx', sheet: 'SLA de atendimento' },
    { title: 'Taxa de Resolução Mensal', description: 'Evolução de protocolos concluídos no ano.', icon: TrendingUp, tone: 'yellow', rows: resolutionRows, file: 'resolucao_mensal.xlsx', sheet: 'Resolução mensal' },
    { title: 'Extrato Analítico', description: 'Exportação detalhada de toda a base filtrada.', icon: FileText, tone: 'blue', rows: protocolRows, file: 'extrato_analitico.xlsx', sheet: 'Extrato analítico', highlight: true },
  ];

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <Header
        title="Relatórios e Análises"
        subtitle="Estatísticas detalhadas e exportação de dados"
        action={(
          <button
            type="button"
            onClick={() => exportToExcel(protocolRows, 'relatorio_geral.xlsx', 'Relatório geral')}
            disabled={loading || protocolRows.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            {/* "Lotação" é unidade de trabalho do servidor, não local da
                ocorrência. O filtro sempre foi geográfico: rótulo corrigido. */}
            <ReportSelect icon={<MapPin size={17} />} value={location} onChange={setLocation} options={[
              ['all', 'Todos os bairros'],
              ...neighborhoods.map((item): [string, string] => [item, item]),
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
              highlight={card.highlight ?? false}
              // Cartao sem linhas nao gera arquivo: desabilitado em vez de
              // aceitar o clique e nao produzir nada.
              disabled={loading || card.rows.length === 0}
              onClick={() => exportToExcel(card.rows, card.file, card.sheet)}
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
                  <ResponsiveContainer width="100%" height={300}>
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
                <p className="mt-1 text-sm text-slate-600">
                  Solicitações em aberto dentro do prazo previsto para a prioridade
                </p>
                {slaRate === null ? (
                  <div className="mt-4 flex h-[235px] flex-col items-center justify-center gap-2 rounded-lg bg-slate-50 px-6 text-center">
                    <AlertCircle className="text-slate-400" size={28} aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-600">Sem dados suficientes</p>
                    <p className="text-xs leading-5 text-slate-500">
                      Não há solicitações em aberto com data de abertura no período filtrado.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative mt-4 h-[235px]">
                      <ResponsiveContainer width="100%" height={235}>
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
                  </>
                )}
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Base: {slaSummary.evaluated} em aberto ({slaSummary.late} vencida(s)).
                  {slaSummary.resolvedWithoutData > 0 && ` ${slaSummary.resolvedWithoutData} concluída(s) fora do cálculo: não há registro da data de conclusão.`}
                </p>
              </article>
            </section>

            <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
              <h2 className="font-black">Volumetria por Macro Categoria</h2>
              <div className="mt-4 grid grid-cols-1 items-center gap-6 md:grid-cols-[320px_1fr]">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height={220}>
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
                      <strong className="text-sm">{item.value} {item.value === 1 ? 'chamado' : 'chamados'}</strong>
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

function ReportCard({ title, description, icon: Icon, tone, highlight, disabled, onClick }: { title: string; description: string; icon: React.ComponentType<{ size?: number }>; tone: 'purple' | 'green' | 'yellow' | 'blue'; highlight: boolean; disabled: boolean; onClick: () => void }) {
  const tones = {
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-100 text-[#0758BD]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'Sem dados para exportar nos filtros atuais' : undefined}
      className={`flex min-h-[138px] items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:border-[#7EAAE2] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#CDD8E7] ${highlight ? 'border-blue-400 bg-[#F2F7FF]' : 'border-[#CDD8E7] bg-white'}`}
    >
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}><Icon size={27} /></span>
      <span className="min-w-0">
        <span className={`block font-black ${highlight ? 'text-[#0758BD]' : ''}`}>{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0758BD]">
          {disabled ? 'Sem dados' : 'Abrir relatório'} <Download size={15} />
        </span>
      </span>
    </button>
  );
}
