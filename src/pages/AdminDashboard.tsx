import { Header } from '../components/Header';
import { useProtocols } from '../hooks/useProtocols';
import { Download, Calendar, Inbox, Timer, AlertCircle, CheckCircle, MoreHorizontal, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';
import { StatusBadge } from './CitizenDashboard';



const TREND_DATA = [
  { name: 'Jan', atual: 400, anterior: 300 },
  { name: 'Fev', atual: 450, anterior: 320 },
  { name: 'Mar', atual: 600, anterior: 400 },
  { name: 'Abr', atual: 550, anterior: 450 },
  { name: 'Mai', atual: 700, anterior: 500 },
  { name: 'Jun', atual: 800, anterior: 550 },
  { name: 'Jul', atual: 750, anterior: 600 },
  { name: 'Ago', atual: 900, anterior: 650 },
  { name: 'Set', atual: 1000, anterior: 700 },
  { name: 'Out', atual: 1100, anterior: 750 },
  { name: 'Nov', atual: 1248, anterior: 800 },
  { name: 'Dez', atual: 1300, anterior: 850 },
];

import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const { protocols, loading } = useProtocols('admin');

  const totalCount = protocols.length;
  const delayedCount = protocols.filter(p => p.status === 'Atrasado').length;
  const resolvedCount = protocols.filter(p => p.status === 'Concluído').length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const categories = ['Física', 'Visual', 'Auditiva', 'Outros'];
  const colors = ['#137fec', '#0bda5b', '#fa6238', '#a855f7'];
  const categoryData = categories.map((cat, i) => {
    return { name: cat, value: protocols.filter(p => p.category === cat).length, color: colors[i] };
  }).filter(c => c.value > 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922] p-6 md:p-8 lg:p-10">
      <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Visão Geral Executiva</h2>
          <p className="text-[#9dabb9] text-base font-normal">Monitoramento em tempo real da acessibilidade pública.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center bg-[#1a242f] border border-[#283039] rounded-lg px-3 py-2 text-sm text-[#9dabb9]">
            <Calendar size={18} className="mr-2" />
            <span>Últimos 30 dias</span>
            <ChevronDown size={18} className="ml-2" />
          </div>
          <Link to="/admin/relatorios" className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-600/20">
            <Download size={18} />
            <span>Exportar Dados</span>
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total de Solicitações" value={totalCount.toString()} trend="Live" trendColor="text-[#0bda5b]" icon={Inbox} iconColor="text-blue-500" />
        <KPICard label="Tempo Médio Resposta" value="N/A" trend="Live" trendColor="text-[#0bda5b]" icon={Timer} iconColor="text-blue-400" />
        <KPICard label="Solicitações em Atraso" value={delayedCount.toString()} trend="Live" trendColor="text-[#fa6238]" icon={AlertCircle} iconColor="text-red-400" />
        <KPICard label="Taxa de Resolução" value={`${resolutionRate}%`} trend="Live" trendColor="text-[#0bda5b]" icon={CheckCircle} iconColor="text-emerald-400" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 rounded-xl bg-[#1a242f] border border-[#283039] flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white text-lg font-bold">Por Categoria</h3>
            <button className="text-[#9dabb9] hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center relative py-4 min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{ name: 'Vazio', value: 1, color: '#3b4754' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(categoryData.length > 0 ? categoryData : [{ name: 'Vazio', value: 1, color: '#3b4754' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111418', border: '1px solid #283039', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="text-[#9dabb9] text-xs font-medium uppercase tracking-wide">Total</span>
              <span className="text-white text-2xl font-bold">{totalCount}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <div className="flex flex-col">
                  <span className="text-white text-sm font-medium">{cat.name}</span>
                  <span className="text-[#9dabb9] text-xs">{totalCount > 0 ? Math.round((cat.value / totalCount) * 100) : 0}% ({cat.value})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl bg-[#1a242f] border border-[#283039] flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white text-lg font-bold">Fluxo de Solicitações</h3>
              <p className="text-[#9dabb9] text-sm">Comparativo mensal 2023 vs 2024</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 text-xs font-medium text-white">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Atual
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-[#9dabb9]">
                <span className="w-2 h-2 rounded-full bg-[#3b4754]"></span> Anterior
              </span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#283039" vertical={false} />
                <XAxis dataKey="name" stroke="#9dabb9" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111418', border: '1px solid #283039', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="atual" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorAtual)" />
                <Area type="monotone" dataKey="anterior" stroke="#3b4754" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[#1a242f] border border-[#283039] overflow-hidden mb-6">
        <div className="p-6 border-b border-[#283039] flex justify-between items-center">
          <h3 className="text-white text-lg font-bold">Solicitações Recentes</h3>
          <Link to="/admin/solicitacoes" className="text-blue-600 text-sm font-semibold hover:text-blue-500 transition-colors">Ver todas</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111418] border-b border-[#283039]">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#9dabb9]">ID</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#9dabb9]">Solicitante</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#9dabb9]">Categoria</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#9dabb9]">Data</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#9dabb9]">Status</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#9dabb9] text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#283039]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#9dabb9]">
                    Carregando banco de dados...
                  </td>
                </tr>
              )}
              {!loading && protocols.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-[#283039]/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-[#9dabb9] font-mono">{p.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3b4754] flex items-center justify-center text-xs font-bold text-white">
                        {p.requester?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-white text-sm font-medium">{p.requester}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border ${p.category === 'Física' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      p.category === 'Auditiva' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-pink-500/10 text-pink-400 border-pink-500/20'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.category === 'Física' ? 'bg-purple-400' :
                        p.category === 'Auditiva' ? 'bg-blue-400' :
                          'bg-pink-400'
                        }`}></span>
                      Acessibilidade {p.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-white">{p.date}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link to={`/protocolo/${p.id}`} className="text-[#9dabb9] hover:text-white p-1 rounded hover:bg-[#3b4754] transition-colors inline-block">
                      <Eye size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, trend, trendColor, icon: Icon, iconColor }: any) {
  return (
    <div className="flex flex-col gap-1 rounded-xl p-5 bg-[#1a242f] border border-[#283039] hover:border-blue-500/30 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 bg-slate-800 rounded-lg ${iconColor}`}>
          <Icon size={24} />
        </div>
        <span className={`${trendColor} text-xs font-bold bg-slate-800 px-2 py-1 rounded-full`}>{trend}</span>
      </div>
      <p className="text-[#9dabb9] text-sm font-medium">{label}</p>
      <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

