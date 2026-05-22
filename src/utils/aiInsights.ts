import type { Protocol, Status } from '../constants';

export interface PriorityProtocol {
  id: string;
  category: string;
  address: string;
  status: Status;
  score: number;
  reasons: string[];
}

export interface SmartInsightCard {
  label: string;
  value: string;
  detail: string;
  tone: 'green' | 'yellow' | 'red' | 'blue';
}

const URGENCY_KEYWORDS = [
  'cadeirante',
  'idoso',
  'idosa',
  'criança',
  'crianca',
  'escola',
  'hospital',
  'risco',
  'acidente',
  'queda',
  'emergência',
  'emergencia',
  'bloqueado',
  'bloqueada',
  'calçada',
  'calcada',
  'rampa',
];

function parseDate(protocol: Protocol) {
  const rawCreatedAt = (protocol as any).created_at;
  if (rawCreatedAt) {
    const parsed = new Date(rawCreatedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const parts = protocol.date?.split('/');
  if (parts?.length === 3) {
    const [day, month, year] = parts.map(Number);
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function daysSince(protocol: Protocol) {
  const parsed = parseDate(protocol);
  if (!parsed) return 0;

  const diff = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function isResolved(status: Status) {
  return status === 'Concluído' || status === 'Resolved' || status === 'Closed';
}

function categoryWeight(category: string) {
  if (category === 'Física') return 14;
  if (category === 'Visual') return 10;
  if (category === 'Auditiva') return 8;
  return 4;
}

export function calculateProtocolPriority(protocol: Protocol): PriorityProtocol {
  const reasons: string[] = [];
  const text = `${protocol.service} ${protocol.category} ${(protocol as any).description || ''} ${protocol.address || ''}`.toLowerCase();
  const age = daysSince(protocol);
  let score = 20;

  if (protocol.status === 'Atrasado') {
    score += 38;
    reasons.push('fora do SLA');
  } else if (protocol.status === 'Em Análise' || protocol.status === 'InProgress') {
    score += 16;
    reasons.push('em análise');
  } else if (protocol.status === 'Aberto' || protocol.status === 'Open') {
    score += 10;
    reasons.push('novo chamado');
  }

  if (age >= 14) {
    score += 24;
    reasons.push(`${age} dias aberto`);
  } else if (age >= 7) {
    score += 16;
    reasons.push(`${age} dias aberto`);
  } else if (age >= 3) {
    score += 8;
    reasons.push(`${age} dias aberto`);
  }

  const categoryScore = categoryWeight(protocol.category);
  score += categoryScore;
  if (categoryScore >= 10) reasons.push(`acessibilidade ${protocol.category.toLowerCase()}`);

  const matchedKeywords = URGENCY_KEYWORDS.filter(keyword => text.includes(keyword)).slice(0, 3);
  if (matchedKeywords.length > 0) {
    score += matchedKeywords.length * 7;
    reasons.push(`termos críticos: ${matchedKeywords.join(', ')}`);
  }

  return {
    id: protocol.id,
    category: protocol.category,
    address: protocol.address,
    status: protocol.status,
    score: Math.min(100, score),
    reasons: reasons.length > 0 ? reasons : ['prioridade padrão'],
  };
}

export function buildSmartInsights(protocols: Protocol[]) {
  const total = protocols.length;
  const delayed = protocols.filter(p => p.status === 'Atrasado').length;
  const resolved = protocols.filter(p => isResolved(p.status)).length;
  const active = protocols.filter(p => !isResolved(p.status));
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
  const delayedRate = total ? Math.round((delayed / total) * 100) : 0;

  const priorityQueue = active
    .map(calculateProtocolPriority)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const categoryCounts = protocols.reduce<Record<string, number>>((acc, protocol) => {
    acc[protocol.category] = (acc[protocol.category] || 0) + 1;
    return acc;
  }, {});

  const criticalCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0];

  const riskTone = delayedRate >= 25 ? 'red' : delayedRate >= 10 ? 'yellow' : 'green';
  const riskLabel = delayedRate >= 25 ? 'Alto' : delayedRate >= 10 ? 'Moderado' : 'Baixo';

  const cards: SmartInsightCard[] = [
    {
      label: 'Risco de SLA',
      value: total ? riskLabel : 'Sem dados',
      detail: total ? `${delayedRate}% da base marcada como atrasada` : 'Aguardando protocolos reais',
      tone: riskTone,
    },
    {
      label: 'Eficiência',
      value: total ? `${resolutionRate}%` : '0%',
      detail: 'taxa de protocolos concluídos',
      tone: resolutionRate >= 70 ? 'green' : resolutionRate >= 40 ? 'yellow' : 'blue',
    },
    {
      label: 'Categoria crítica',
      value: criticalCategory ? criticalCategory[0] : 'Sem dados',
      detail: criticalCategory ? `${criticalCategory[1]} ocorrência(s) registradas` : 'Sem concentração identificada',
      tone: 'blue',
    },
  ];

  const recommendations = [
    delayedRate >= 25
      ? 'Reforçar a fila de atendimento e revisar os protocolos atrasados antes de novas aberturas.'
      : 'Manter acompanhamento diário da fila para evitar crescimento silencioso do atraso.',
    criticalCategory
      ? `Direcionar a próxima ação operacional para acessibilidade ${criticalCategory[0].toLowerCase()}, onde há maior volume de demanda.`
      : 'Coletar mais dados para identificar padrões por categoria, bairro e período.',
    priorityQueue.length > 0
      ? 'Usar a fila priorizada como apoio à triagem do servidor, preservando revisão humana antes da decisão final.'
      : 'Com a base vazia, iniciar testes controlados com registros fictícios e depois migrar para dados reais.',
  ];

  return {
    cards,
    priorityQueue,
    recommendations,
  };
}
