import { useProtocols } from '../hooks/useProtocols';
import { useMemo } from 'react';
import { Download, Calendar, Inbox, Timer, AlertCircle, CheckCircle, Eye, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, CartesianGrid } from 'recharts';
import { StatusBadge } from './CitizenDashboard';
import { exportToExcel } from '../utils/exportUtils';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function AdminDashboard() {
  const { protocols, loading } = useProtocols('admin');

  const totalCount = protocols.length;
  const delayedCount = protocols.filter(p => p.status === 'Atrasado').length;
  const resolvedCount = protocols.filter(p => p.status === 'Concluído').length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const inProgressCount = protocols.filter(p => p.status === 'Em Análise').length;
  const openCount = protocols.filter(p => p.status === 'Aberto').length;

  // Category breakdown for PieChart
  const categories = ['Física', 'Visual', 'Auditiva', 'Outros'];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7'];
  const categoryData = categories.map((cat, i) => ({
    name: cat, value: protocols.filter(p => p.category === cat).length, color: colors[i]
  })).filter(c => c.value > 0);

  // Monthly trend derived from real protocol created_at dates
  const trendData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Count protocols per month for current year
    const monthlyCounts = Array(12).fill(0);
    protocols.forEach(p => {
      // p.date is formatted 'DD/MM/YYYY' by api.ts
      const raw = (p as any).created_at || '';
      if (raw) {
        const d = new Date(raw);
        if (d.getFullYear() === currentYear) {
          monthlyCounts[d.getMonth()] += 1;
        }
      }
    });

    // Only show months up to current month
    return MONTH_LABELS.slice(0, now.getMonth() + 1).map((name, i) => ({
      name,
      abertas: monthlyCounts[i],
      resolvidas: Math.round(monthlyCounts[i] * (resolutionRate / 100 || 0)),
    }));
  }, [protocols, resolutionRate]);

  const kpis = [
    { label: 'Total', value: totalCount.toString(), icon: Inbox, color: 'text-blue-400', bg: 'bg-blue-500/10', trend: '● Ao vivo', trendColor: 'text-green-400' },
    { label: 'Em Análise', value: inProgressCount.toString(), icon: Timer, color: 'text-sky-400', bg: 'bg-sky-500/10', trend: '● Ao vivo', trendColor: 'text-green-400' },
    { label: 'Em Atraso', value: delayedCount.toString(), icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', trend: '● Ao vivo', trendColor: 'text-red-400' },
    { label: 'Resolução', value: `${resolutionRate}%`, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: '● Ao vivo', trendColor: 'text-green-400' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#080d12] p-4 sm:p-6 md:p-8">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <p className="text-slate-500 text-sm mb-1">Portal do Servidor</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Visão Geral Executiva</h2>
          <p className="text-slate-500 text-sm mt-1">Monitoramento em tempo real da acessibilidade pública</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 h-10 text-sm text-slate-400">
            <Calendar size={16} />
            <span>{new Date().getFullYear()}</span>
          </div>
          <button onClick={() => exportToExcel(protocols, 'dashboard_data.xlsx')}
            className="flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5">
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <motion.div key={k.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white/5 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`size-10 rounded-xl flex items-center justify-center ${k.bg} ${k.color}`}>
                <k.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold ${k.trendColor}`}>{k.trend}</span>
            </div>
            <p className="text-slate-500 text-xs mb-1">{k.label}</p>
            <p className="text-2xl font-black text-white tracking-tight">{k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Status breakdown mini-bar */}
      {totalCount > 0 && (
        <div className="mb-6 bg-white/5 border border-white/8 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-black text-white text-sm">Distribuição por Status</h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">{totalCount} total</span>
          </div>
          <div className="flex rounded-xl overflow-hidden h-3 gap-0.5">
            {openCount > 0 && (
              <div className="bg-blue-500" style={{ width: `${(openCount / totalCount) * 100}%` }} title={`Aberto: ${openCount}`} />
            )}
            {inProgressCount > 0 && (
              <div className="bg-yellow-500" style={{ width: `${(inProgressCount / totalCount) * 100}%` }} title={`Em Análise: ${inProgressCount}`} />
            )}
            {resolvedCount > 0 && (
              <div className="bg-emerald-500" style={{ width: `${(resolvedCount / totalCount) * 100}%` }} title={`Concluído: ${resolvedCount}`} />
            )}
            {delayedCount > 0 && (
              <div className="bg-red-500" style={{ width: `${(delayedCount / totalCount) * 100}%` }} title={`Atrasado: ${delayedCount}`} />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {[
              { label: 'Aberto', count: openCount, color: 'bg-blue-500' },
              { label: 'Em Análise', count: inProgressCount, color: 'bg-yellow-500' },
              { label: 'Concluído', count: resolvedCount, color: 'bg-emerald-500' },
              { label: 'Atrasado', count: delayedCount, color: 'bg-red-500' },
            ].filter(s => s.count > 0).map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${s.color}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className="text-xs font-bold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Pie — by category (real data) */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5 flex flex-col">
          <h3 className="font-black text-white mb-4">Por Categoria</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[180px]">
              <p className="text-slate-500 text-sm">Carregando...</p>
            </div>
          ) : categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[180px]">
              <p className="text-slate-500 text-sm">Nenhum dado ainda</p>
            </div>
          ) : (
            <>
              <div className="relative flex-1 flex items-center justify-center min-h-[180px]">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-xl font-black text-white">{totalCount}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <p className="text-white text-xs font-medium">{cat.name}</p>
                      <p className="text-slate-500 text-[10px]">{totalCount > 0 ? Math.round((cat.value / totalCount) * 100) : 0}% · {cat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Area chart — monthly from real data */}
        <div className="lg:col-span-2 bg-white/5 border border-white/8 rounded-2xl p-5 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-black text-white">Fluxo de Solicitações</h3>
              <p className="text-slate-500 text-xs mt-0.5">Abertas por mês em {new Date().getFullYear()}</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-300"><span className="size-2 rounded-full bg-blue-500" /> Abertas</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-600"><span className="size-2 rounded-full bg-emerald-500" /> Resolvidas</span>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500 text-sm">Carregando...</p>
              </div>
            ) : trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500 text-sm">Nenhum protocolo registrado ainda</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAbertas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolvidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="abertas" name="Abertas" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAbertas)" />
                  <Area type="monotone" dataKey="resolvidas" name="Resolvidas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolvidas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
