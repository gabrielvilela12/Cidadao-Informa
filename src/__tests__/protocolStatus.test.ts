import { describe, expect, it } from 'vitest';
import { canonicalStatus } from '../utils/protocolStatus';
import { SLA_DEADLINE_HOURS } from '../utils/sla';
import type { Protocol } from '../constants';

/**
 * O filtro de status do Mapa Estrategico e a contagem do painel operacional
 * passam por aqui.
 *
 * O caso que motivou estes testes: a opcao "Atrasado" do filtro nunca casava
 * nada. Ela comparava o texto gravado em protocols.status, e nenhum fluxo do
 * sistema grava 'Atrasado' - o atraso e derivado de created_at contra o prazo da
 * prioridade, em utils/sla.ts. O servidor clicava no filtro e o mapa esvaziava.
 */

const HOUR = 3_600_000;

function build(overrides: Partial<Protocol> = {}): Protocol {
    return {
        id: 'p1',
        service: 'Física',
        address: 'Av. Paulista, 100 - São Paulo/SP',
        date: '',
        status: 'Aberto',
        category: 'Física',
        description: 'Calçada sem rebaixamento',
        created_at: new Date(Date.now() - HOUR).toISOString(),
        ai_priority: 'media',
        ai_status: 'success',
        latitude: -23.55,
        longitude: -46.63,
        ...overrides,
    };
}

/** Protocolo aberto com idade em horas. */
function aged(hours: number, overrides: Partial<Protocol> = {}): Protocol {
    return build({ created_at: new Date(Date.now() - hours * HOUR).toISOString(), ...overrides });
}

describe('colapso dos valores de status do banco', () => {
    it('trata as duas gerações de "em análise" como o mesmo estado', () => {
        expect(canonicalStatus(build({ status: 'Em Análise' }))).toBe('Em análise');
        expect(canonicalStatus(build({ status: 'InProgress' }))).toBe('Em análise');
    });

    it('trata as três formas de conclusão como o mesmo estado', () => {
        expect(canonicalStatus(build({ status: 'Concluído' }))).toBe('Concluído');
        expect(canonicalStatus(build({ status: 'Resolved' }))).toBe('Concluído');
        expect(canonicalStatus(build({ status: 'Closed' }))).toBe('Concluído');
    });

    it('cai em Aberto quando o valor gravado é desconhecido', () => {
        expect(canonicalStatus(build({ status: 'Open' }))).toBe('Aberto');
        expect(canonicalStatus(build({ status: '' as Protocol['status'] }))).toBe('Aberto');
    });
});

describe('atraso derivado do prazo, não do texto gravado', () => {
    it('marca como Atrasado o chamado aberto que passou do prazo da prioridade', () => {
        const protocol = aged(SLA_DEADLINE_HOURS.media + 24, { status: 'Aberto', ai_priority: 'media' });
        expect(canonicalStatus(protocol)).toBe('Atrasado');
    });

    it('marca como Atrasado o chamado em análise que passou do prazo', () => {
        const protocol = aged(SLA_DEADLINE_HOURS.critica + 5, { status: 'Em Análise', ai_priority: 'critica' });
        expect(canonicalStatus(protocol)).toBe('Atrasado');
    });

    it('respeita o prazo de cada prioridade', () => {
        // 60 h passa do prazo de crítica (48 h) mas não do de alta (120 h).
        expect(canonicalStatus(aged(60, { ai_priority: 'critica' }))).toBe('Atrasado');
        expect(canonicalStatus(aged(60, { ai_priority: 'alta' }))).toBe('Aberto');
    });

    it('mantém Aberto o chamado dentro do prazo', () => {
        expect(canonicalStatus(aged(SLA_DEADLINE_HOURS.media - 24, { ai_priority: 'media' }))).toBe('Aberto');
    });

    it('não marca como atrasado o que já foi concluído', () => {
        // Sem resolved_at no banco não há como saber se a entrega foi no prazo,
        // então concluído nunca vira atraso - a regra é a mesma de sla.ts.
        const protocol = aged(SLA_DEADLINE_HOURS.baixa + 500, { status: 'Concluído', ai_priority: 'baixa' });
        expect(canonicalStatus(protocol)).toBe('Concluído');
    });

    it('usa o prazo padrão quando a triagem não definiu prioridade', () => {
        expect(canonicalStatus(aged(400, { ai_priority: null, ai_status: 'pending' }))).toBe('Atrasado');
        expect(canonicalStatus(aged(100, { ai_priority: null, ai_status: 'pending' }))).toBe('Aberto');
    });

    it('não quebra com data de abertura ausente ou inválida', () => {
        expect(canonicalStatus(build({ created_at: undefined }))).toBe('Aberto');
        expect(canonicalStatus(build({ created_at: 'não é data' }))).toBe('Aberto');
    });

    it('continua respeitando o valor Atrasado gravado, se algum dia for gravado', () => {
        expect(canonicalStatus(build({ status: 'Atrasado' }))).toBe('Atrasado');
    });
});
