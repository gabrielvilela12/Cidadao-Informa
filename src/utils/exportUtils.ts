/**
 * Exportacao de planilhas.
 *
 * Tres das quatro telas administrativas exportavam o objeto de protocolo cru.
 * Como o xlsx usa as chaves do objeto como cabecalho, os arquivos saiam com
 * colunas em ingles (`address`, `status`, `createdAt`) e duplicadas, porque
 * mapProtocol mantem tanto o camelCase da API quanto os aliases snake_case:
 * `createdAt` e `created_at`, `aiPriority` e `ai_priority`, `aiStatus` e
 * `ai_status`, `userId` e `user_id`, `category` e `service` com o mesmo valor.
 *
 * Junto iam `phone` e `user_id` do solicitante - dado pessoal que nao deve sair
 * em arquivo baixado, e por isso nao ha coluna para eles aqui.
 *
 * Agora toda exportacao passa por um mapeador: protocolExportRows para a base
 * de protocolos, e os mapeadores por relatorio em AdminReports. Nenhuma tela
 * entrega objeto de dominio direto para exportToExcel.
 */

import * as XLSX from 'xlsx';
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
    if (['Concluído', 'Resolved', 'Closed'].includes(status)) return 'Concluído';
    if (['Em Análise', 'InProgress'].includes(status)) return 'Em análise';
    if (status === 'Atrasado') return 'Atrasado';
    return 'Aberto';
}

/**
 * Data de abertura como Date, para o Excel ordenar e filtrar por periodo em vez
 * de comparar texto. `protocol.date` e fallback: ja vem formatado em pt-BR.
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
 * Usada por todas as telas que exportam protocolos, para os quatro botoes
 * gerarem arquivos com o mesmo formato.
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

/** Largura estimada da coluna. Datas ocupam o formato dd/mm/aaaa hh:mm. */
function cellWidth(value: ExportValue | undefined): number {
    if (value instanceof Date) return 16;
    return value === undefined || value === null ? 0 : String(value).length;
}

/**
 * Gera o arquivo .xlsx a partir de linhas ja mapeadas.
 *
 * Retorna false quando nao havia nada para exportar - antes o clique num
 * conjunto vazio nao gerava arquivo nem aviso, e parecia bug.
 */
export function exportToExcel(rows: ExportRow[], filename: string, sheetName = 'Relatório'): boolean {
    if (!rows?.length) return false;

    // Uniformiza as colunas: se a primeira linha nao tem uma chave presente nas
    // seguintes, o xlsx ignora a coluna inteira.
    const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const normalizedRows = rows.map((row) => {
        const normalized: ExportRow = {};
        keys.forEach((key) => {
            const value = row[key];
            normalized[key] = value === undefined || value === null ? '' : value;
        });
        return normalized;
    });

    const worksheet = XLSX.utils.json_to_sheet(normalizedRows, {
        header: keys,
        cellDates: true,
        dateNF: 'dd/mm/yyyy hh:mm',
    });

    worksheet['!cols'] = keys.map((key) => {
        const widest = normalizedRows.reduce(
            (max, row) => Math.max(max, cellWidth(row[key])),
            key.length,
        );
        return { wch: Math.min(widest + 2, 60) };
    });

    // Filtro por coluna no cabecalho, para o servidor recortar a base no Excel.
    worksheet['!autofilter'] = {
        ref: XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: normalizedRows.length, c: keys.length - 1 },
        }),
    };

    const workbook = XLSX.utils.book_new();
    // O nome da aba tem limite de 31 caracteres no Excel.
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

    let finalFilename = filename.replace(/\.csv$/i, '.xlsx');
    if (!finalFilename.toLowerCase().endsWith('.xlsx')) finalFilename += '.xlsx';

    XLSX.writeFile(workbook, finalFilename, { cellDates: true });
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
