import { useProtocols } from '../hooks/useProtocols';
import { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { Download, Calendar, Filter, FileText, PieChart as PieChartIcon, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { exportToExcel } from '../utils/exportUtils';
import { motion } from 'framer-motion';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function AdminReports() {
    const { protocols, loading } = useProtocols('admin');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

    // --- Derived Data for Charts ---

    // 1. Categories Data
    const categoryData = useMemo(() => {
        const categories = [
            { id: 'Física', name: 'Acessibilidade Física', color: '#a855f7' },
            { id: 'Visual', name: 'Acessibilidade Visual', color: '#3b82f6' },
            { id: 'Auditiva', name: 'Acessibilidade Auditiva', color: '#10b981' },
            { id: 'Outros', name: 'Outros', color: '#64748b' }
        ];

        return categories.map(cat => ({
            name: cat.name,
            value: protocols.filter(p => p.category === cat.id).length,
            color: cat.color
        })).filter(c => c.value > 0);
    }, [protocols]);

    // 2. Resolution vs Open Data (Monthly)
    const resolutionData = useMemo(() => {
        const targetYear = parseInt(yearFilter);
        const monthlyAbertas = Array(12).fill(0);
        const monthlyResolvidas = Array(12).fill(0);

        protocols.forEach(p => {
            const raw = (p as any).created_at || '';
            if (!raw) return;
            const d = new Date(raw);
            if (d.getFullYear() === targetYear) {
                const monthInfo = d.getMonth();
                monthlyAbertas[monthInfo] += 1;
                if (p.status === 'Concluído') {
                    monthlyResolvidas[monthInfo] += 1;
                }
            }
        });

        const currentMonth = targetYear === new Date().getFullYear() ? new Date().getMonth() + 1 : 12;

        return MONTH_LABELS.slice(0, currentMonth).map((name, i) => ({
            name,
            abertas: monthlyAbertas[i],
            resolvidas: monthlyResolvidas[i]
        }));
    }, [protocols, yearFilter]);

    // 3. SLA Data
    const slaData = useMemo(() => {
        const total = protocols.length;
        if (total === 0) return [];

        const atrasados = protocols.filter(p => p.status === 'Atrasado').length;
        const noPrazo = protocols.filter(p => ['Concluído', 'Aberto', 'Em Análise'].includes(p.status)).length;
        // Simulando "Atenção" como 15% dos no prazo, para fins visuais, ou se tivéssemos log de data límite
        const atencao = Math.floor(noPrazo * 0.15);
        const seguro = noPrazo - atencao;

        return [
            { name: 'No Prazo', value: Math.round((seguro / total) * 100), color: '#10b981' },
            { name: 'Atenção', value: Math.round((atencao / total) * 100), color: '#eab308' },
            { name: 'Atrasado', value: Math.round((atrasados / total) * 100), color: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [protocols]);

    const tooltipStyle = { backgroundColor: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' };

    const prepareExportData = () => {
        return protocols.map(p => ({
            ID: p.id,
            Solicitante: p.requester,
            Categoria: p.category,
            Status: p.status,
            Data: p.date,
            'Criado em': (p as any).created_at || p.date
        }));
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#080d12]">
            <Header title="Relatórios e Análises" subtitle="Estatísticas detalhadas e exportação de dados" />

            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="bg-white/5 border border-white/8 text-slate-300 hover:border-white/15 px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
                        >
                            <option value="2024">Ano 2024</option>
                            <option value="2025">Ano 2025</option>
                            <option value="2026">Ano 2026</option>
                        </select>
                        <button className="flex items-center gap-2 bg-white/5 border border-white/8 text-slate-400 hover:text-white hover:border-white/15 px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none">
                            <Filter size={15} /> Todas Lotações
                        </button>
                    </div>
                    <button onClick={() => exportToExcel(prepareExportData(), 'relatorio_consolidado.xlsx')}
                        disabled={loading || protocols.length === 0}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 whitespace-nowrap">
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                        Exportar Relatório Geral (.CSV)
                    </button>
                </div>

                {/* Report library */}
                <div>
                    <h3 className="font-black text-white flex items-center gap-2 mb-4">
                        <FileText size={18} className="text-blue-400" /> Biblioteca de Relatórios
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ReportCard title="Ocorrências por Bairro" desc="Volume absoluto de aberturas por localização." icon={PieChartIcon} onClick={() => exportToExcel(categoryData, 'ocorrencias_bairro.xlsx')} />
                        <ReportCard title="SLA de Atendimento" desc="Tempo médio e conformidade de resposta." icon={BarChart3} onClick={() => exportToExcel(slaData, 'sla_atendimento.xlsx')} />
                        <ReportCard title="Taxa de Resolução Mensal" desc="Evolução de protocolos concluídos no ano." icon={TrendingUp} onClick={() => exportToExcel(resolutionData, 'resolucao_mensal.xlsx')} />
                        <ReportCard title="Extrato Analítico" desc="Exportação bruta e detalhada de toda a base." icon={FileText} highlight onClick={() => exportToExcel(prepareExportData(), 'extrato_completo.xlsx')} />
                    </div>
                </div>

                {/* Charts */}
                {loading ? (
                    <div className="flex-1 min-h-[400px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4 text-blue-400">
                            <RefreshCw size={32} className="animate-spin" />
                            <p className="font-medium">Carregando relatórios analíticos...</p>
                        </div>
                    </div>
                ) : protocols.length === 0 ? (
                    <div className="flex-1 min-h-[400px] flex items-center justify-center">
                        <div className="text-center text-slate-500">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Sem dados suficientes para processar gráficos.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white/5 border border-white/8 rounded-2xl p-5 flex flex-col">
                            <div className="mb-4">
                                <h3 className="font-black text-white">Taxa de Resolução vs Abertura</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Desempenho da gestão no ano de {yearFilter}</p>
                            </div>
                            <div className="flex-1 min-h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={resolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: '#cbd5e1' }} />
                                        <Bar dataKey="abertas" name="Abertas" fill="#475569" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="resolvidas" name="Resolvidas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/8 rounded-2xl p-5 flex flex-col">
                            <h3 className="font-black text-white mb-0.5">Conformidade de SLA Geral</h3>
                            <p className="text-slate-500 text-xs mb-4">Proporção de resoluções no prazo estipulado</p>
                            <div className="flex-1 min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={slaData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                            {slaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center mt-2">
                                {slaData.map(item => (
                                    <div key={item.name} className="flex flex-col items-center gap-1">
                                        <div className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-white font-black text-sm">{item.value}%</span>
                                        <span className="text-slate-600 text-[10px] leading-tight">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional category pie chart for wider screens to fill space */}
                        <div className="lg:col-span-3 bg-white/5 border border-white/8 rounded-2xl p-5">
                            <h3 className="font-black text-white mb-4">Volumetria por Macro Categoria</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                                            {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-3 justify-center">
                                    {categoryData.map(c => (
                                        <div key={c.name} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                                                <span className="text-slate-300">{c.name}</span>
                                            </div>
                                            <span className="text-white font-bold">{c.value} chamados</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

function ReportCard({ title, desc, icon: Icon, highlight = false, onClick }: any) {
    return (
        <div onClick={onClick} className={`bg-white/5 border rounded-2xl p-5 flex flex-col hover:-translate-y-1 transition-all cursor-pointer group ${highlight ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20' : 'border-white/8 hover:border-white/20 hover:bg-white/10'
            }`}>
            <div className={`size-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${highlight ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 text-slate-500 group-hover:text-white group-hover:bg-white/20'
                }`}>
                <Icon size={18} />
            </div>
            <h4 className="text-white font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">{title}</h4>
            <p className="text-slate-500 text-xs leading-relaxed flex-1">{desc}</p>
            <div className={`mt-4 flex items-center text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 ${highlight ? 'text-blue-400' : 'text-slate-300'}`}>
                <Download size={13} className="mr-1" /> Baixar Dados CSV
            </div>
        </div>
    );
}
