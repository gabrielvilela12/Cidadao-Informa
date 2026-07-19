import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';

type Priority = 'baixa' | 'media' | 'alta' | 'critica';

interface ChangePriorityModalProps {
  currentPriority?: string | null;
  onSave: (priority: string, reason?: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

const PRIORITIES: { value: Priority; label: string; description: string; color: string }[] = [
  { value: 'critica', label: 'Crítica', description: 'Risco imediato ou bloqueio total', color: 'bg-red-600' },
  { value: 'alta', label: 'Alta', description: 'Impacto relevante e atendimento prioritário', color: 'bg-orange-600' },
  { value: 'media', label: 'Média', description: 'Impacto moderado', color: 'bg-amber-500' },
  { value: 'baixa', label: 'Baixa', description: 'Baixo impacto ou sem urgência', color: 'bg-green-600' },
];

export const ChangePriorityModal: React.FC<ChangePriorityModalProps> = ({ currentPriority, onSave, onClose, isLoading }) => {
  const [selected, setSelected] = useState<Priority>((currentPriority as Priority) || 'media');
  const [reason, setReason] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave(selected, reason);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="priority-modal-title">
      <div className="w-full max-w-md rounded-lg bg-white p-5 text-[#111827] shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div><h2 id="priority-modal-title" className="text-xl font-black">Definir prioridade</h2><p className="mt-1 text-sm text-slate-500">Selecione a urgência adequada para a solicitação.</p></div>
          <button type="button" onClick={onClose} disabled={isLoading} className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#CDD8E7] text-slate-600" aria-label="Fechar"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5">
          <fieldset className="space-y-2">
            <legend className="sr-only">Prioridade</legend>
            {PRIORITIES.map((priority) => (
              <label key={priority.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${selected === priority.value ? 'border-[#0758BD] bg-blue-50' : 'border-[#CDD8E7]'}`}>
                <input type="radio" name="priority" value={priority.value} checked={selected === priority.value} onChange={() => setSelected(priority.value)} className="size-4 accent-blue-600" />
                <span className={`size-3 shrink-0 rounded-full ${priority.color}`} />
                <span><strong className="block text-sm">{priority.label}</strong><span className="text-xs text-slate-500">{priority.description}</span></span>
              </label>
            ))}
          </fieldset>
          <label className="mt-4 block text-sm font-bold" htmlFor="priority-reason">Motivo <span className="font-normal text-slate-500">(opcional)</span></label>
          <textarea id="priority-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Descreva o motivo da alteração" className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#CDD8E7] p-3 text-sm outline-none focus:border-[#0758BD]" />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="min-h-11 rounded-lg border border-[#CDD8E7] px-4 text-sm font-bold text-slate-700">Cancelar</button>
            <button type="submit" disabled={isLoading} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-60">{isLoading && <Loader2 size={16} className="animate-spin" />}{isLoading ? 'Salvando...' : 'Salvar prioridade'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
