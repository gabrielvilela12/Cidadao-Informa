import React, { useState, useEffect } from 'react';
import { aiPriorityService } from '../services/aiPriorityService';
import { AlertCircle, LogOut, RefreshCw, Clock } from 'lucide-react';

interface AiLog {
  id: string;
  protocol_id: string;
  priority: string;
  source: string;
  admin_id?: string;
  created_at: string;
  reason?: string;
}

export const AiLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filterDays]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiPriorityService.getAuditLogs(filterDays);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
      setError('Erro ao carregar logs. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critica: 'bg-red-500/15 text-red-300 border border-red-500/30',
      alta: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
      media: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
      baixa: 'bg-green-500/15 text-green-300 border border-green-500/30',
    };
    return colors[priority] || 'bg-gray-500/15 text-gray-300 border border-gray-500/30';
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      ia: '🤖 IA',
      admin_manual: '👤 Admin Manual',
      admin_regenerated: '🔄 Admin Regenerado',
    };
    return labels[source] || source;
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      ia: 'text-blue-300',
      admin_manual: 'text-purple-300',
      admin_regenerated: 'text-cyan-300',
    };
    return colors[source] || 'text-slate-300';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#080d12] p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <p className="text-slate-500 text-sm mb-1">Portal do Servidor</p>
            <h2 className="text-3xl font-black text-white tracking-tight">Logs de Classificação IA</h2>
            <p className="text-slate-500 text-sm mt-1">Auditoria de prioridades classificadas por inteligência artificial</p>
          </div>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5 mb-6">
          <label className="block text-sm font-semibold text-white mb-3">Período de Análise</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 1, label: 'Últimas 24h' },
              { value: 7, label: 'Últimos 7 dias' },
              { value: 30, label: 'Últimos 30 dias' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterDays(option.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterDays === option.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/8'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <p className="text-slate-400">Carregando logs...</p>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/8">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Protocolo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Prioridade
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Origem
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <LogOut size={32} className="text-slate-600" />
                          <p className="text-slate-400">Nenhum registro encontrado</p>
                          <p className="text-slate-600 text-xs">Ajuste o período e tente novamente</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm">
                          <code className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/30 group-hover:border-blue-500/50 transition-colors">
                            #{log.protocol_id.slice(0, 8)}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs uppercase tracking-wide ${getPriorityColor(log.priority)}`}
                          >
                            {log.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`${getSourceColor(log.source)}`}>
                            {getSourceLabel(log.source)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-600" />
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 italic max-w-xs truncate" title={log.reason || 'Sem motivo registrado'}>
                          {log.reason || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Stats */}
            {logs.length > 0 && (
              <div className="bg-white/5 border-t border-white/8 px-6 py-4 flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Total de Logs</p>
                  <p className="text-lg font-black text-white">{logs.length}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Críticas</p>
                  <p className="text-lg font-black text-red-400">
                    {logs.filter(l => l.priority === 'critica').length}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Altas</p>
                  <p className="text-lg font-black text-orange-400">
                    {logs.filter(l => l.priority === 'alta').length}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Origem: IA</p>
                  <p className="text-lg font-black text-blue-400">
                    {logs.filter(l => l.source === 'ia').length}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
