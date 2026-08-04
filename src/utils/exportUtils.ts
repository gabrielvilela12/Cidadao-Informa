/**
 * Exportacao de planilhas.
 *
 * Toda exportacao passa por mapeadores estaveis antes de baixar o arquivo:
 * protocolExportRows para a base de protocolos, e os mapeadores por relatorio
 * em AdminReports. Nenhuma tela entrega objeto de dominio direto para download.
 *
 * O arquivo e CSV com BOM UTF-8 e separador `;`, formato que o Excel abre bem
 * em pt-BR. Mantemos o nome exportToExcel porque e a acao de produto, mas sem a
 * dependencia xlsx: ela nao tem fix publicado para vulnerabilidades conhecidas.
 */

import type { Protocol } from '../constants';
import { extractNeighborhood } from './address';
import { getSlaInfo, getSlaLabel } from './sla';

export type ExportValue = string | number | Date;
export type ExportRow = Record<string, ExportValue>;

const PRIORITY_LABELS: Record<NonNullable<Protocol['ai_priority']>, string> = {
    critica: 'Crítica',
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
};

/** Mesmos rotulos do PriorityBadge, para a planilha bater com a tela. */
function priorityLabel(protocol: Protocol): string {
    if (protocol.ai_status === 'failed') return 'Triagem falhou';
    if (!protocol.ai_priority) return 'Processando';
    return PRIORITY_LABELS[protocol.ai_priority] ?? 'Processando';
}

/** Consolida os status legados em ingles no rotulo exibido na interface. */
function statusLabel(status: Protocol['status']): string {
    if (['Concluido', 'ConcluÃ­do', 'Resolved', 'Closed'].includes(status)) return 'Concluído';
    if (['Em Analise', 'Em AnÃ¡lise', 'InProgress'].includes(status)) return 'Em análise';
    if (status === 'Atrasado') return 'Atrasado';
    return 'Aberto';
}

/**
 * Data de abertura como Date, para a exportacao preservar dia e hora quando
 * possivel. `protocol.date` e fallback: ja vem formatado em pt-BR.
 */
function openedAt(protocol: Protocol): Date | string {
    if (protocol.created_at) {
        const parsed = new Date(protocol.created_at);
        if (Number.isFinite(parsed.getTime())) return parsed;
    }
    return protocol.date || 'Data não informada';
}

/**
 * Linhas da base de protocolos, com cabecalhos em portugues e ordem estavel.
 * Usada por todas as telas que exportam protocolos, para os botoes gerarem
 * arquivos com o mesmo formato.
 */
export function protocolExportRows(protocols: Protocol[]): ExportRow[] {
    return protocols.map((protocol) => {
        const sla = getSlaInfo(protocol);
        return {
            Protocolo: protocol.id,
            Abertura: openedAt(protocol),
            Solicitante: protocol.requester || 'Não informado',
            Categoria: protocol.category || 'Outros',
            Descrição: protocol.description || '',
            Endereço: protocol.address || 'Não informado',
            Bairro: extractNeighborhood(protocol.address) ?? 'Não informado',
            Status: statusLabel(protocol.status),
            Prioridade: priorityLabel(protocol),
            'Prazo (dias)': Math.round(sla.deadlineHours / 24),
            'Situação do prazo': getSlaLabel(sla),
            // Localizacao da ocorrencia, nao do cidadao. Vazio quando o
            // solicitante nao confirmou a posicao - o mapa depende desse null.
            Latitude: typeof protocol.latitude === 'number' ? protocol.latitude : '',
            Longitude: typeof protocol.longitude === 'number' ? protocol.longitude : '',
        };
    });
}

function normalizeCell(value: ExportValue): string {
    if (value instanceof Date) {
        return value.toLocaleString('pt-BR');
    }

    return String(value);
}

function preventFormulaInjection(value: string): string {
    const normalized = value.replace(/\r?\n/g, ' ');
    return /^[=+\-@]/.test(normalized.trimStart()) ? `'${normalized}` : normalized;
}

function csvCell(value: ExportValue): string {
    const safe = preventFormulaInjection(normalizeCell(value));
    return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(contents: string, filename: string): void {
    const blob = new Blob(['\ufeff', contents], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/**
 * Gera um CSV pronto para abrir no Excel a partir de linhas ja mapeadas.
 *
 * Retorna false quando nao havia nada para exportar - antes o clique num
 * conjunto vazio nao gerava arquivo nem aviso, e parecia bug.
 */
export function exportToExcel(rows: ExportRow[], filename: string, _sheetName = 'Relatório'): boolean {
    if (!rows?.length) return false;

    // Uniformiza as colunas: se a primeira linha nao tem uma chave presente nas
    // seguintes, a exportacao ainda preserva a coluna.
    const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const normalizedRows = rows.map((row) => {
        const normalized: ExportRow = {};
        keys.forEach((key) => {
            const value = row[key];
            normalized[key] = value === undefined || value === null ? '' : value;
        });
        return normalized;
    });

    const csv = [
        keys.map(csvCell).join(';'),
        ...normalizedRows.map((row) => keys.map((key) => csvCell(row[key])).join(';')),
    ].join('\r\n');

    let finalFilename = filename.replace(/\.(xlsx|xls|csv)$/i, '.csv');
    if (!finalFilename.toLowerCase().endsWith('.csv')) finalFilename += '.csv';

    downloadCsv(csv, finalFilename);
    return true;
}

/** Atalho para as telas que exportam a base de protocolos. */
export function exportProtocolsToExcel(
    protocols: Protocol[],
    filename: string,
    sheetName?: string,
): boolean {
    return exportToExcel(protocolExportRows(protocols), filename, sheetName);
}
