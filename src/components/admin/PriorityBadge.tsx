import React from 'react';

type Priority = 'baixa' | 'media' | 'alta' | 'critica' | null;

interface PriorityBadgeProps {
  priority: Priority;
  status?: 'success' | 'failed' | 'pending';
  showLabel?: boolean;
}

const priorityConfig = {
  critica: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    emoji: '🔴',
    label: 'CRÍTICA',
  },
  alta: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    emoji: '🟠',
    label: 'ALTA',
  },
  media: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    emoji: '🟡',
    label: 'MÉDIA',
  },
  baixa: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    emoji: '🟢',
    label: 'BAIXA',
  },
};

const failedConfig = {
  bg: 'bg-gray-100',
  text: 'text-gray-800',
  emoji: '⚠️',
  label: 'IA Falhou',
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  status,
  showLabel = true,
}) => {
  if (status === 'failed') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${failedConfig.bg} ${failedConfig.text}`}
      >
        <span>{failedConfig.emoji}</span>
        {showLabel && failedConfig.label}
      </span>
    );
  }

  if (!priority) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        <span>⏳</span>
        {showLabel && 'Processando'}
      </span>
    );
  }

  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <span>{config.emoji}</span>
      {showLabel && config.label}
    </span>
  );
};
