import { Header } from '../components/Header';
import { useProtocols } from '../hooks/useProtocols';
import { useApp } from '../context/AppContext';
import { Clock, Search, CheckCircle, Plus, HelpCircle, Gavel, Eye, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';

export function CitizenDashboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { protocols, loading } = useProtocols('citizen');

  const openCount = protocols.filter(p => p.status === 'Aberto').length;
  const analysisCount = protocols.filter(p => p.status === 'Em Análise').length;
  const completedCount = protocols.filter(p => p.status === 'Concluído').length;

  const todayStr = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
  const formattedDate = todayStr.split(' ').map(word =>
    word === 'de' ? word : word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Cidadão';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922]">
      <Header title={`Olá, ${firstName}`} subtitle={formattedDate} />

      <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Quick Stats */}
        <section aria-label="Resumo de Solicitações">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={20} />
              Resumo de Solicitações
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Em Aberto" value={openCount.toString()} subtext="Aguardando triagem" color="blue" icon={Clock} />
            <StatCard label="Em Análise" value={analysisCount.toString()} subtext="Em processamento técnico" color="amber" icon={Search} />
            <StatCard label="Concluídos" value={completedCount.toString()} subtext="Resolvidos com sucesso" color="emerald" icon={CheckCircle} />
          </div>
        </section>

        {/* Actions & Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden"
            >
              <div className="absolute -right-10 -bottom-10 opacity-20">
                <Plus size={180} />
              </div>
              <h3 className="text-xl font-bold mb-2 relative z-10">Precisa de acessibilidade?</h3>
              <p className="text-blue-100 mb-6 relative z-10 text-sm leading-relaxed">
                Relate problemas em calçadas, falta de sinalização sonora ou barreiras arquitetônicas na sua região.
              </p>
              <button
                onClick={() => navigate('/nova-solicitacao')}
                className="w-full bg-white text-blue-600 hover:bg-slate-50 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 relative z-10 shadow-md"
              >
                <Plus size={20} />
                Nova Solicitação
              </button>
            </motion.div>

            <div className="bg-[#1b2631] border border-slate-700 rounded-xl p-6">
              <h4 className="font-bold text-lg mb-4 text-white">Links Rápidos</h4>
              <div className="grid grid-cols-2 gap-3">
                <QuickLink icon={HelpCircle} label="Serviços" to="/servicos" />
                <QuickLink icon={Gavel} label="Legislação" to="#" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#1b2631] border border-slate-700 rounded-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Últimos Protocolos</h3>
              <Link to="/meus-protocolos" className="text-blue-500 text-sm font-medium hover:underline">Ver todos</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-4">Protocolo</th>
                    <th className="px-6 py-4">Serviço</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Carregando solicitações recentes...
                      </td>
                    </tr>
                  )}
                  {!loading && protocols.slice(0, 4).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-300">{p.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">{p.service}</span>
                          <span className="text-xs text-slate-500">{p.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{p.date}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/protocolo/${p.id}`} className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-slate-700 inline-block">
                          <Eye size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="mt-8 border-t border-slate-800 pt-6 pb-2 text-center text-xs text-slate-500">
          <p>© 2023 HackGov PCD. Todos os direitos reservados. Portal de Acessibilidade Governamental.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a className="hover:text-blue-500 transition-colors" href="#">Termos de Uso</a>
            <a className="hover:text-blue-500 transition-colors" href="#">Política de Privacidade</a>
            <a className="hover:text-blue-500 transition-colors" href="#">Acessibilidade</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, color, icon: Icon }: any) {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
  };

  return (
    <div className="bg-[#1b2631] p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon size={64} className={color === 'blue' ? 'text-blue-500' : color === 'amber' ? 'text-amber-500' : 'text-emerald-500'} />
      </div>
      <p className="text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-4xl font-black text-white">{value}</p>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <span className={`block size-2 rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
        <span>{subtext}</span>
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, to = "#" }: any) {
  return (
    <Link to={to} className="p-4 bg-[#101922] rounded-lg hover:border-blue-600 border border-transparent transition-colors flex flex-col items-center justify-center gap-2 text-center group">
      <Icon size={24} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
      <span className="text-sm font-medium text-slate-300 group-hover:text-blue-600">{label}</span>
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'Aberto': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Em Análise': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Concluído': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Atrasado': 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  const dotColors: any = {
    'Aberto': 'bg-blue-500',
    'Em Análise': 'bg-amber-500',
    'Concluído': 'bg-emerald-500',
    'Atrasado': 'bg-red-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      <span className={`size-1.5 rounded-full ${dotColors[status]}`}></span>
      {status}
    </span>
  );
}
