/**
 * Status canonico de um protocolo, para filtro e contagem nas telas.
 *
 * O banco guarda o status em texto livre e a base tem valores de duas gerações
 * ('Em Análise' e 'InProgress', 'Concluído' e 'Resolved'). Aqui eles colapsam
 * nos quatro estados que a interface mostra.
 *
 * Extraido de AdminMap para poder ser testado: era uma funcao privada da pagina,
 * e o filtro de status - o que o servidor usa para achar o que esta atrasado -
 * nao tinha como ser verificado sem montar a tela inteira.
 */

import type { Protocol } from '../constants';
import { isResolvedStatus, isSlaLate } from './sla';

export type CanonicalStatus = 'Aberto' | 'Em análise' | 'Concluído' | 'Atrasado';

export const CANONICAL_STATUSES: CanonicalStatus[] = ['Aberto', 'Em análise', 'Concluído', 'Atrasado'];

const IN_ANALYSIS_STATUSES = ['Em Análise', 'InProgress'];

/**
 * Em que estado a interface coloca o protocolo.
 *
 * Recebe o protocolo inteiro, e nao so o texto do status, porque 'Atrasado' nao
 * e um valor que o banco guarde: nenhum fluxo do sistema o grava. O atraso sai
 * de created_at contra o prazo da prioridade, a mesma conta que o painel e os
 * relatorios usam (utils/sla.ts).
 *
 * Antes esta funcao comparava so a string, e o efeito era um filtro morto: clicar
 * em "Atrasado" no Mapa Estrategico esvaziava o mapa, e o contador de atraso da
 * visao operacional vivia em zero, sobre uma base cheia de chamado vencido.
 *
 * A ordem das verificacoes e a regra:
 *  - concluido nunca e atraso. Sem resolved_at no banco nao ha como saber se a
 *    entrega foi no prazo, entao a conclusao encerra o assunto;
 *  - atraso vem antes de aberto e de em analise, porque os quatro estados sao
 *    exclusivos no filtro e o atraso e a informacao que decide despacho.
 */
export function canonicalStatus(protocol: Protocol): CanonicalStatus {
    const stored = protocol.status;

    if (isResolvedStatus(stored)) return 'Concluído';
    if (stored === 'Atrasado' || isSlaLate(protocol)) return 'Atrasado';
    if (IN_ANALYSIS_STATUSES.includes(stored)) return 'Em análise';
    return 'Aberto';
}
