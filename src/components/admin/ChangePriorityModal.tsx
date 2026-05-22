import React, { useState } from 'react';

type Priority = 'baixa' | 'media' | 'alta' | 'critica';

interface ChangePriorityModalProps {
  currentPriority?: string | null;
  onSave: (priority: string, reason?: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'critica', label: '🔴 CRÍTICA' },
  { value: 'alta', label: '🟠 ALTA' },
  { value: 'media', label: '🟡 MÉDIA' },
  { value: 'baixa', label: '🟢 BAIXA' },
];

export const ChangePriorityModal: React.FC<ChangePriorityModalProps> = ({
  currentPriority,
  onSave,
  onClose,
  isLoading,
}) => {
  const [selected, setSelected] = useState(currentPriority || 'media');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(selected, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Alterar Prioridade</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {PRIORITIES.map((p) => (
              <label key={p.value} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={selected === p.value}
                  onChange={(e) => setSelected(e.target.value as Priority)}
                  className="w-4 h-4"
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Por que está alterando?"
              className="w-full px-3 py-2 border rounded text-sm"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
