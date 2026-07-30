/**
 * Calculo de SLA de atendimento.
 *
 * Antes desta implementacao o SLA era decorativo: tudo derivava de
 * `status === 'Atrasado'`, um valor que nenhum fluxo do sistema atribui. O
 * efeito era um painel que só sabia dizer que estava tudo bem - protocolos
 * abertos havia dois meses apareciam como "Em dia", o contador "Em atraso"
 * ficava eternamente em 0 e Relatorios anunciava "100% de conformidade" tendo
 * zero resolucoes na base.
 *
 * Agora o prazo e calculado a partir de created_at contra a prioridade da
 * triagem.
 *
 * Limitacao conhecida e deliberada: a tabela protocols nao tem timestamp de
 * resolucao, entao NAO ha como saber se um protocolo concluido foi entregue
 * dentro do prazo. Protocolos concluidos ficam com estado 'resolved' e sao
 * excluidos do calculo de conformidade, em vez de contarem como sucesso. Para
 * medir conformidade historica de verdade e preciso persistir resolved_at.
 */

import type { Protocol } from '../constants';

export type SlaPriority = 'baixa' | 'media' | 'alta' | 'critica';

/** Prazo de atendimento em horas, por prioridade atribuida na triagem. */
export const SLA_DEADLINE_HOURS: Record<SlaPriority, number> = {
    critica: 48,   // 2 dias
    alta: 120,     // 5 dias
    media: 360,    // 15 dias
    baixa: 720,    // 30 dias
};

/** Prazo aplicado enquanto a triagem nao definiu prioridade. */
export const SLA_UNTRIAGED_DEADLINE_HOURS = 360; // 15 dias

/** Fracao final do prazo em que o protocolo passa a ser "a vencer". */
const DUE_SOON_THRESHOLD = 0.2;

const MS_PER_HOUR = 3_600_000;

const RESOLVED_STATUSES = ['Concluído', 'Concluido', 'Resolved', 'Closed'];

export type SlaState =
    | 'on-time'   // dentro do prazo
    | 'due-soon'  // dentro do prazo, mas nos ultimos 20% dele
    | 'late'      // prazo vencido
    | 'resolved'  // concluido; sem resolved_at nao da para julgar o prazo
    | 'unknown';  // sem data de abertura utilizavel

export interface SlaInfo {
    state: SlaState;
    deadlineHours: number;
    elapsedHours: number | null;
    /** Negativo quando vencido. */
    remainingHours: number | null;
}

export function isResolvedStatus(status: string | undefined): boolean {
    return RESOLVED_STATUSES.includes(status ?? '');
}

export function getDeadlineHours(priority: Protocol['ai_priority']): number {
    if (priority && priority in SLA_DEADLINE_HOURS) {
        return SLA_DEADLINE_HOURS[priority as SlaPriority];
    }
    return SLA_UNTRIAGED_DEADLINE_HOURS;
}

export function getSlaInfo(protocol: Protocol, now: number = Date.now()): SlaInfo {
    const deadlineHours = getDeadlineHours(protocol.ai_priority);

    if (isResolvedStatus(protocol.status)) {
        return { state: 'resolved', deadlineHours, elapsedHours: null, remainingHours: null };
    }

    const createdAt = protocol.created_at ? Date.parse(protocol.created_at) : NaN;
    if (!Number.isFinite(createdAt)) {
        return { state: 'unknown', deadlineHours, elapsedHours: null, remainingHours: null };
    }

    const elapsedHours = (now - createdAt) / MS_PER_HOUR;
    const remainingHours = deadlineHours - elapsedHours;

    let state: SlaState;
    if (remainingHours < 0) {
        state = 'late';
    } else if (remainingHours <= deadlineHours * DUE_SOON_THRESHOLD) {
        state = 'due-soon';
    } else {
        state = 'on-time';
    }

    return { state, deadlineHours, elapsedHours, remainingHours };
}

export function isSlaLate(protocol: Protocol, now?: number): boolean {
    return getSlaInfo(protocol, now).state === 'late';
}

/** Rotulo curto para a coluna de SLA. */
export function getSlaLabel(info: SlaInfo): string {
    switch (info.state) {
        case 'late': {
            const days = Math.floor(Math.abs(info.remainingHours ?? 0) / 24);
            if (days >= 1) return `Vencido há ${days}d`;
            return 'Vencido';
        }
        case 'due-soon': {
            const hours = Math.max(0, Math.floor(info.remainingHours ?? 0));
            if (hours >= 24) return `Vence em ${Math.floor(hours / 24)}d`;
            return `Vence em ${hours}h`;
        }
        case 'on-time': {
            const days = Math.floor((info.remainingHours ?? 0) / 24);
            if (days >= 1) return `${days}d restantes`;
            return 'Em dia';
        }
        case 'resolved':
            return 'Concluído';
        default:
            return 'Sem data';
    }
}

export interface SlaComplianceSummary {
    /** Protocolos abertos com prazo avaliavel. */
    evaluated: number;
    onTime: number;
    late: number;
    /** Percentual no prazo, ou null quando nao ha base para calcular. */
    rate: number | null;
    /** Concluidos, fora do calculo por falta de resolved_at. */
    resolvedWithoutData: number;
}

export function summarizeSlaCompliance(
    protocols: Protocol[],
    now: number = Date.now(),
): SlaComplianceSummary {
    let onTime = 0;
    let late = 0;
    let resolvedWithoutData = 0;

    for (const protocol of protocols) {
        const { state } = getSlaInfo(protocol, now);
        if (state === 'late') late++;
        else if (state === 'on-time' || state === 'due-soon') onTime++;
        else if (state === 'resolved') resolvedWithoutData++;
    }

    const evaluated = onTime + late;

    return {
        evaluated,
        onTime,
        late,
        rate: evaluated > 0 ? Math.round((onTime / evaluated) * 100) : null,
        resolvedWithoutData,
    };
}

export function countSlaLate(protocols: Protocol[], now?: number): number {
    return protocols.reduce((total, protocol) => total + (isSlaLate(protocol, now) ? 1 : 0), 0);
}
