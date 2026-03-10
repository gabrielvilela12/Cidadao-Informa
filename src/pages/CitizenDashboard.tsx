import { useProtocols } from '../hooks/useProtocols';
import { useApp } from '../context/AppContext';
import { Clock, CheckCircle, Plus, HelpCircle, Eye, BarChart3, ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';

export function CitizenDashboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { protocols, loading } = useProtocols('citizen');

  const openCount = protocols.filter(p => ['Open', 'Aberto'].includes(p.status)).length;
  const analysisCount = protocols.filter(p => ['InProgress', 'Em Análise'].includes(p.status)).length;
  const completedCount = protocols.filter(p => ['Resolved', 'Closed', 'Concluído'].includes(p.status)).length;
  const total = protocols.length;

  const todayStr = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const formattedDate = todayStr.split(' ').map(w => w === 'de' ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Cidadão';

  const stats = [
    { label: 'Em Aberto', value: openCount, sub: 'Aguardando triagem', icon: Clock, accent: 'blue', glow: 'shadow-blue-600/20', ring: 'ring-blue-500/20', iconBg: 'bg-blue-500/10 text-blue-400', bar: 'bg-blue-500' },
    { label: 'Em Análise', value: analysisCount, sub: 'Em processamento', icon: TrendingUp, accent: 'amber', glow: 'shadow-amber-600/20', ring: 'ring-amber-500/20', iconBg: 'bg-amber-500/10 text-amber-400', bar: 'bg-amber-500' },
    { label: 'Concluídos', value: completedCount, sub: 'Resolvidos', icon: CheckCircle, accent: 'emerald', glow: 'shadow-emerald-600/20', ring: 'ring-emerald-500/20', iconBg: 'bg-emerald-500/10 text-emerald-400', bar: 'bg-emerald-500' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#080d12]">
      <Header title={`Olá, ${firstName} 👋`} subtitle={formattedDate} />

      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`relative bg-white/5 border border-white/8 rounded-2xl p-5 overflow-hidden hover:border-white/15 transition-colors group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`size-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.icon size={20} />
                </div>
                <span className="text-slate-600 text-xs font-medium">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
              </div>
              <p className="text-slate-400 text-sm mb-1">{s.label}</p>
              <p className="text-4xl font-black text-white tracking-tight">{s.value}</p>
              <p className="text-xs text-slate-600 mt-1">{s.sub}</p>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                <div className={`h-full ${s.bar} transition-all duration-700`} style={{ width: `${total > 0 ? (s.value / total) * 100 : 0}%` }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* CTA card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 overflow-hidden cursor-pointer shadow-xl shadow-blue-600/20"
              onClick={() => navigate('/nova-solicitacao')}
            >
              <div className="absolute -right-6 -bottom-6 size-32 bg-white/5 rounded-full" />
              <div className="absolute -right-2 -bottom-2 size-20 bg-white/5 rounded-full" />
              <h3 className="text-lg font-black text-white mb-1 relative z-10">Nova Solicitação</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-5 relative z-10">
                Relate problemas de acessibilidade na sua cidade.
              </p>
              <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all relative z-10">
                <Plus size={16} /> Criar solicitação
              </button>
            </motion.div>

            {/* Quick links */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <h4 className="font-bold text-white text-sm mb-3">Acesso Rápido</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: HelpCircle, label: 'Serviços', to: '/servicos' },
                  { icon: BarChart3, label: 'Protocolos', to: '/meus-protocolos' },
                ].map(({ icon: Icon, label, to }) => (
                  <Link key={to} to={to}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group">
                    <Icon size={20} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent requests table */}
          <div className="lg:col-span-2 bg-white/5 border border-white/8 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-black text-white">Últimos Protocolos</h3>
              <Link to="/meus-protocolos" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Carregando...</div>
              ) : protocols.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <BarChart3 size={32} className="text-slate-700" />
                  <p className="text-slate-500 text-sm">Nenhuma solicitação ainda</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Serviço</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Data</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {protocols.slice(0, 5).map((p, i) => (
                      <tr key={`${p.id}-${i}`} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-slate-200 font-medium text-sm truncate max-w-[200px]">{p.service || p.description}</p>
                          <p className="text-slate-600 text-xs truncate">{p.address}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{p.date}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to={`/protocolo/${p.id}`} className="text-slate-600 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 inline-block">
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusLabel(status: string): string {
  const map: any = { Open: 'Aberto', InProgress: 'Em Análise', Resolved: 'Concluído', Closed: 'Encerrado', Atrasado: 'Atrasado', Aberto: 'Aberto', 'Em Análise': 'Em Análise', Concluído: 'Concluído' };
  return map[status] || status;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'Open': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    'Aberto': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    'InProgress': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    'Em Análise': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    'Resolved': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'Concluído': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'Closed': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    'Atrasado': 'bg-red-500/15 text-red-400 border-red-500/25',
  };
  const dots: any = {
    'Open': 'bg-blue-400', 'Aberto': 'bg-blue-400',
    'InProgress': 'bg-amber-400', 'Em Análise': 'bg-amber-400',
    'Resolved': 'bg-emerald-400', 'Concluído': 'bg-emerald-400',
    'Closed': 'bg-slate-400', 'Atrasado': 'bg-red-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
      <span className={`size-1.5 rounded-full ${dots[status] || 'bg-slate-400'}`} />
      {StatusLabel(status)}
    </span>
  );
}
