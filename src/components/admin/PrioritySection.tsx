import React, { useState, useEffect } from 'react';
import { PriorityBadge } from './PriorityBadge';
import { ChangePriorityModal } from './ChangePriorityModal';
import { aiPriorityService } from '../../services/aiPriorityService';

type Priority = 'baixa' | 'media' | 'alta' | 'critica';

interface PrioritySectionProps {
  protocolId: string;
  initialPriority?: Priority | null;
  initialStatus?: 'success' | 'failed' | 'pending';
}

export const PrioritySection: React.FC<PrioritySectionProps> = ({
  protocolId,
  initialPriority,
  initialStatus = 'pending',
}) => {
  const [priority, setPriority] = useState<Priority | null | undefined>(initialPriority);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      await aiPriorityService.regeneratePriority(protocolId);
      setStatus('pending');

      setTimeout(async () => {
        const data = await aiPriorityService.getPriority(protocolId);
        setPriority(data.priority);
        setStatus(data.aiStatus as any);
      }, 5000);
    } catch (error) {
      console.error('Failed to regenerate:', error);
      alert('Erro ao regenerar prioridade: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setRegenerating(false);
    }
  };

  const handleChangePriority = async (
    newPriority: Priority,
    reason?: string
  ) => {
    try {
      setLoading(true);
      await aiPriorityService.setManualPriority(
        protocolId,
        newPriority,
        reason
      );
      setPriority(newPriority);
      setStatus('success');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to change priority:', error);
      alert('Erro ao alterar prioridade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Prioridade</h2>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <PriorityBadge priority={priority} status={status} />
          <p className="text-sm text-gray-600">
            {status === 'failed' && 'Falha na classificação pela IA'}
            {status === 'success' && 'Definida pela IA'}
            {status === 'pending' && 'Processando...'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating || loading}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            {regenerating ? 'Regenerando...' : 'Regenerar IA'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Trocar
          </button>
        </div>
      </div>

      {showModal && (
        <ChangePriorityModal
          currentPriority={priority}
          onSave={handleChangePriority}
          onClose={() => setShowModal(false)}
          isLoading={loading}
        />
      )}
    </div>
  );
};
