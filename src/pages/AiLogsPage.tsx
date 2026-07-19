import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  FileSearch,
  FileText,
  FilterX,
  Flag,
  Info,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Header } from '../components/Header';
import { aiPriorityService } from '../services/aiPriorityService';

interface AiLog {
  id: string;
  protocol_id: string;
  priority: string;
  source: string;
  admin_id?: string;
  created_at: string;
  reason?: string;
}

export const AiLogsPage = () => {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState(7);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [origin, setOrigin] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const auditPanelRef = useRef<HTMLElement>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiPriorityService.getAuditLogs(filterDays);
      setLogs(data);
    } catch (loadError) {
      console.error('Falha ao carregar logs de IA:', loadError);
      setError('Não foi possível carregar os registros de auditoria.');
    } finally {
      setLoading(false);
    }
  }, [filterDays]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const normalized = search.trim().toLowerCase();
    const matchesSearch = !normalized
      || log.protocol_id.toLowerCase().includes(normalized)
      || log.reason?.toLowerCase().includes(normalized);
    const matchesPriority = priority === 'all' || log.priority === priority;
    const matchesOrigin = origin === 'all' || log.source === origin;
    return matchesSearch && matchesPriority && matchesOrigin;
  }), [logs, origin, priority, search]);

  const clearFilters = () => {
    setSearch('');
    setPriority('all');
    setOrigin('all');
  };

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <Header
        title="Logs de Classificação IA"
        subtitle="Auditoria de prioridades classificadas por inteligência artificial"
        action={(
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => auditPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ShieldCheck size={17} /> Auditoria
            </button>
            <button
              type="button"
              onClick={loadLogs}
              disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-55"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
          </div>
        )}
      />

      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 pb-8 sm:px-6 lg:px-8">
        <section className="flex items-start gap-4 rounded-lg border border-[#A9C9F5] bg-[#F1F7FF] p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white"><Sparkles size={23} /></span>
          <div>
            <h2 className="font-black text-[#0758BD]">Como funciona</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              As classificações automáticas de prioridade podem ser revisadas pelos servidores. Todas as alterações ficam registradas para auditoria.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-[0_7px_20px_rgba(15,45,85,0.035)] xl:flex-row xl:items-center">
          <div className="grid grid-cols-3 gap-2">
            {[
              [1, 'Últimas 24h'],
              [7, 'Últimos 7 dias'],
              [30, 'Últimos 30 dias'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterDays(Number(value))}
                className={`min-h-11 rounded-lg border px-3 text-sm font-bold transition-colors ${filterDays === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-[#CDD8E7] bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="relative min-w-0 flex-1 xl:max-w-[350px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar protocolo"
              className="h-11 w-full rounded-lg border border-[#CDD8E7] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#0758BD] focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-11 rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700 xl:min-w-[145px]">
            <option value="all">Prioridade</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
          <select value={origin} onChange={(event) => setOrigin(event.target.value)} className="h-11 rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700 xl:min-w-[140px]">
            <option value="all">Origem</option>
            <option value="ia">IA</option>
            <option value="admin_manual">Servidor</option>
            <option value="admin_regenerated">Reprocessado</option>
          </select>
          <button type="button" onClick={clearFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <FilterX size={17} /> Limpar filtros
          </button>
        </section>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <Info size={19} /> {error}
          </div>
        )}

        <section className="grid min-h-[440px] grid-cols-1 overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-[0_7px_20px_rgba(15,45,85,0.035)] xl:grid-cols-[1fr_390px]">
          <div className="min-w-0 border-b border-[#D8E1ED] xl:border-b-0 xl:border-r">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[#D8E1ED] text-xs font-black text-slate-700">
                    <th className="px-5 py-4">Protocolo</th>
                    <th className="px-5 py-4">Prioridade</th>
                    <th className="px-5 py-4">Origem</th>
                    <th className="px-5 py-4">Data/Hora</th>
                    <th className="px-5 py-4">Motivo</th>
                  </tr>
                </thead>
                {filteredLogs.length > 0 && (
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-[#E2E8F0] hover:bg-[#F6F9FD]">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-[#0758BD]">#{log.protocol_id.slice(0, 8)}</td>
                        <td className="px-5 py-4"><PriorityBadge priority={log.priority} /></td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">{sourceLabel(log.source)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                        <td className="max-w-[260px] truncate px-5 py-4 text-sm text-slate-600" title={log.reason || 'Sem justificativa'}>{log.reason || 'Sem justificativa'}</td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {loading ? (
              <div className="flex min-h-[330px] items-center justify-center gap-3 text-sm text-slate-600"><RefreshCw size={20} className="animate-spin text-[#0758BD]" />Carregando registros...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex min-h-[330px] flex-col items-center justify-center px-5 text-center">
                <FileSearch size={88} strokeWidth={1.2} className="text-[#86A8D9]" />
                <h2 className="mt-3 text-xl font-black">Nenhum registro encontrado</h2>
                <p className="mt-2 text-sm text-slate-600">Não houve classificações no período selecionado.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={() => setFilterDays(30)} className="min-h-11 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">Ver últimos 30 dias</button>
                  <button type="button" onClick={clearFilters} className="min-h-11 rounded-lg border border-[#CDD8E7] bg-white px-5 text-sm font-bold text-slate-700">Limpar filtros</button>
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs text-slate-600"><Info size={16} />Novos registros aparecerão aqui automaticamente após a classificação.</p>
              </div>
            ) : null}
          </div>

          <aside ref={auditPanelRef} className="m-5 self-start rounded-lg border border-[#CDD8E7] bg-[#FBFCFE] p-5">
            <h2 className="text-lg font-black">O que será registrado?</h2>
            <div className="mt-5 space-y-5">
              <AuditItem icon={<Flag size={23} />} title="Prioridade atribuída" description="A prioridade definida automaticamente para a solicitação." />
              <AuditItem icon={<Building2 size={23} />} title="Origem da classificação" description="O sistema ou modelo de IA que realizou a classificação." />
              <AuditItem icon={<FileText size={23} />} title="Justificativa da decisão" description="O motivo que fundamentou a classificação atribuída." />
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    baixa: 'bg-green-100 text-green-800',
    media: 'bg-amber-100 text-amber-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${styles[priority] || 'bg-slate-100 text-slate-700'}`}>{priority}</span>;
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    ia: 'Inteligência artificial',
    admin_manual: 'Servidor',
    admin_regenerated: 'Reprocessado',
  };
  return labels[source] || source;
}

function AuditItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">{icon}</span>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
