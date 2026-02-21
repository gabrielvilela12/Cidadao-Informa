import { Header } from '../components/Header';
import { Download, Calendar, Filter, FileText, PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const CATEGORY_DATA = [
    { name: 'Infraestrutura', value: 850, color: '#137fec' },
    { name: 'Acessibilidade Física', value: 436, color: '#a855f7' },
    { name: 'Segurança', value: 380, color: '#fa6238' },
    { name: 'Trânsito', value: 312, color: '#0bda5b' },
    { name: 'Outros', value: 154, color: '#64748b' },
];

const RESOLUTION_DATA = [
    { name: 'Jan', resolvidas: 300, abertas: 400 },
    { name: 'Fev', resolvidas: 420, abertas: 450 },
    { name: 'Mar', resolvidas: 500, abertas: 600 },
    { name: 'Abr', resolvidas: 530, abertas: 550 },
    { name: 'Mai', resolvidas: 680, abertas: 700 },
    { name: 'Jun', resolvidas: 750, abertas: 800 },
];

const SLA_DATA = [
    { name: 'No Prazo', value: 85, color: '#0bda5b' },
    { name: 'Atenção', value: 10, color: '#eab308' },
    { name: 'Atrasado', value: 5, color: '#ef4444' },
];

export function AdminReports() {
    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922]">
            <Header title="Relatórios e Análises" subtitle="Estatísticas detalhadas e exportação de dados" />

            <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a242f] border border-[#283039] p-4 rounded-xl">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button className="flex items-center gap-2 bg-[#111418] border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                            <Calendar size={18} />
                            <span>Este Ano (2024)</span>
                        </button>
                        <button className="flex items-center gap-2 bg-[#111418] border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                            <Filter size={18} />
                            <span>Todas Lotações</span>
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap font-bold">
                        <Download size={18} />
                        <span>Exportar Relatório Consolidado (PDF)</span>
                    </button>
                </div>

                {/* Available Reports Library */}
                <h3 className="text-white text-lg font-bold mt-2 flex items-center gap-2">
                    <FileText className="text-blue-500" size={20} />
                    Biblioteca de Relatórios
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <ReportCard title="Ocorrências por Bairro" desc="Volume absoluto de aberturas categorizados por geolocalização." icon={PieChartIcon} />
                    <ReportCard title="SLA de Atendimento" desc="Tempo médio de resposta e resolução segmentado por serviço." icon={TimerMockIcon} />
                    <ReportCard title="Satisfação do Cidadão" desc="Média das notas de avaliação pós-resolução do protocolo." icon={TrendingUp} />
                    <ReportCard title="Mapa de Calor (PDF)" desc="Exportação cartográfica de alta densidade de incidentes." icon={MapMockIcon} color="blue" />
                </div>

                {/* Expanded Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-xl bg-[#1a242f] border border-[#283039] flex flex-col p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-white text-lg font-bold">Taxa de Resolução vs Abertura</h3>
                                <p className="text-[#9dabb9] text-sm">Desempenho da gestão no ano corrente</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={RESOLUTION_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#283039" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9dabb9" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9dabb9" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111418', border: '1px solid #283039', borderRadius: '8px', color: '#fff' }}
                                        cursor={{ fill: '#283039', opacity: 0.4 }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="abertas" name="Abertas" fill="#3b4754" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="resolvidas" name="Resolvidas" fill="#137fec" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl bg-[#1a242f] border border-[#283039] flex flex-col p-6 h-full">
                        <h3 className="text-white text-lg font-bold mb-2">Conformidade de SLA</h3>
                        <p className="text-[#9dabb9] text-sm mb-6">Proporção de chamados dentro do prazo</p>
                        <div className="flex-1 min-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={SLA_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {SLA_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111418', border: '1px solid #283039', borderRadius: '8px', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            {SLA_DATA.map(item => (
                                <div key={item.name} className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-white font-bold">{item.value}%</span>
                                    <span className="text-[#9dabb9] text-xs leading-tight">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function ReportCard({ title, desc, icon: Icon, color = 'slate' }: any) {
    return (
        <div className={`bg-[#1a242f] border p-5 rounded-xl flex flex-col hover:shadow-lg transition-all cursor-pointer group ${color === 'blue' ? 'border-blue-500/50 hover:border-blue-400 bg-blue-900/10' : 'border-[#283039] hover:border-slate-500'
            }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color === 'blue' ? 'bg-blue-600 text-white' : 'bg-[#111418] text-[#9dabb9] group-hover:text-white group-hover:bg-[#283039]'
                } transition-colors`}>
                <Icon size={20} />
            </div>
            <h4 className="text-white font-bold mb-1 group-hover:text-blue-400 transition-colors">{title}</h4>
            <p className="text-slate-400 text-xs leading-relaxed flex-1">{desc}</p>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <Download size={14} className="mr-1" />
                Baixar Relatório
            </div>
        </div>
    );
}

// Temporary mocks for icons missing from normal import due to variable count restrictions on previous line
function TimerMockIcon({ size, className }: any) { return <BarChart3 size={size} className={className} />; }
function MapMockIcon({ size, className }: any) { return <FileText size={size} className={className} />; }
