import React, { useEffect, useState } from 'react';
import { Loader2, Pencil, RefreshCw, Star } from 'lucide-react';
import { ChangePriorityModal } from './ChangePriorityModal';
import { aiPriorityService } from '../../services/aiPriorityService';

type Priority = 'baixa' | 'media' | 'alta' | 'critica';

interface PrioritySectionProps {
  protocolId: string;
  initialPriority?: Priority | null;
  initialStatus?: 'success' | 'failed' | 'pending';
}

const PRIORITY_STYLE: Record<Priority, { label: string; classes: string; dot: string }> = {
  baixa: { label: 'Baixa', classes: 'border-green-300 bg-green-50 text-green-800', dot: 'bg-green-600' },
  media: { label: 'Média', classes: 'border-amber-300 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  alta: { label: 'Alta', classes: 'border-orange-300 bg-orange-50 text-orange-800', dot: 'bg-orange-600' },
  critica: { label: 'Crítica', classes: 'border-red-300 bg-red-50 text-red-800', dot: 'bg-red-600' },
};

export const PrioritySection: React.FC<PrioritySectionProps> = ({ protocolId, initialPriority, initialStatus = 'pending' }) => {
  const [priority, setPriority] = useState<Priority | null | undefined>(initialPriority);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [explanation, setExplanation] = useState<{ reason: string | null; source: string | null }>({ reason: null, source: null });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => setPriority(initialPriority), [initialPriority]);
  useEffect(() => setStatus(initialStatus), [initialStatus]);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setExplanation({ reason: null, source: null });
    const refresh = async () => {
      try {
        const result = await aiPriorityService.getPriority(protocolId);
        if (disposed) return;
        setPriority(result.priority);
        setStatus(result.aiStatus);
        setExplanation({ reason: result.reason, source: result.source });
        setError('');
        if (result.aiStatus === 'pending') timer = setTimeout(refresh, 5000);
      } catch {
        if (!disposed) setError('Não foi possível consultar a justificativa.');
      }
    };
    void refresh();
    return () => { disposed = true; if (timer) clearTimeout(timer); };
  }, [protocolId, initialPriority, initialStatus, refreshKey]);

  const handleChangePriority = async (newPriority: Priority, reason?: string) => {
    setLoading(true);
    setError('');
    try {
      await aiPriorityService.setManualPriority(protocolId, newPriority, reason);
      setPriority(newPriority);
      setStatus('success');
      setShowModal(false);
      setRefreshKey((key) => key + 1);
    } catch {
      setError('Não foi possível alterar a prioridade.');
    } finally {
      setLoading(false);
    }
  };

  const config = priority ? PRIORITY_STYLE[priority] : null;

  const handleRegenerate = async () => {
    setLoading(true);
    setError('');
    try {
      await aiPriorityService.regeneratePriority(protocolId);
      setStatus('pending');
      setRefreshKey((key) => key + 1);
    } catch {
      setError('Não foi possível reprocessar a prioridade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-black">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#E7F0FF] text-[#0758BD]"><Star size={16} /></span>
        Prioridade
      </h2>

      <div className="mt-3 rounded-lg border border-[#A9C9F5] bg-[#F1F7FF] p-3">
        {status === 'pending' && (
          <>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Loader2 size={16} className="animate-spin text-[#0758BD]" /> Processando pela IA</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#C9D8EC]"><span className="block h-full w-1/3 animate-pulse rounded-full bg-blue-600" /></div>
          </>
        )}
        {status === 'failed' && <p className="text-sm font-bold text-red-700">Falha na classificação pela IA</p>}
        {status === 'success' && config && (
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-black ${config.classes}`}><span className={`size-2.5 rounded-full ${config.dot}`} /> {config.label}</span>
        )}
      </div>

      {status === 'success' && (
        <div className="mt-3 text-sm leading-6 text-slate-700">
          <p className="font-bold">{explanation.source === 'admin_manual' ? 'Justificativa do servidor' : explanation.source === 'ia' ? 'Justificativa da IA' : 'Justificativa da prioridade'}</p>
          <p>{explanation.reason || 'Este registro ainda não possui justificativa disponível.'}</p>
          {explanation.source === 'ia' && <p className="mt-1 text-xs text-slate-500">Sugestão sujeita à revisão do servidor.</p>}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        {status === 'pending' ? 'A classificação está sendo analisada.' : status === 'failed' ? 'Defina a prioridade manualmente.' : 'Prioridade registrada para a triagem.'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowModal(true)} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#0758BD] bg-white px-4 whitespace-nowrap text-xs font-bold text-[#0758BD] disabled:opacity-50">
          <Pencil size={16} /> Definir manualmente
        </button>
        {(status === 'failed' || error) && <button type="button" onClick={() => void handleRegenerate()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold disabled:opacity-50"><RefreshCw size={16} /> Reprocessar IA</button>}
      </div>
      {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

      {showModal && <ChangePriorityModal currentPriority={priority} onSave={(value, reason) => handleChangePriority(value as Priority, reason)} onClose={() => setShowModal(false)} isLoading={loading} />}
    </section>
  );
};
