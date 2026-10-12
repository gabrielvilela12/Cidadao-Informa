import type { OperationalAnalytics } from '../services/operationalAnalyticsService';

/** Escape de CSV e neutralização de fórmulas em campos textuais de origem externa. */
function csvCell(value: string | number | null): string {
  let text = value === null ? 'Sem dados' : typeof value === 'number' ? String(value).replace('.', ',') : value;
  if (typeof value === 'string' && /^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildOperationalAnalyticsCsv(data: OperationalAnalytics): string {
  const rows: (string | number | null)[][] = [
    ['Seção', 'Indicador', 'Valor', 'Unidade', 'Categoria', 'Status', 'Mês', 'Local', 'Posição'],
  ];
  const metric = (section: string, label: string, value: string | number | null, unit = '') => {
    rows.push([section, label, value, unit, '', '', '', '', '']);
  };
  metric('Metadados', 'Data inicial', data.startDate);
  metric('Metadados', 'Data final', data.endDate);
  metric('Metadados', 'Fuso horário', data.timezone);
  metric('Metadados', 'Gerado em', data.generatedAt);
  metric('Metadados', 'Escopo', 'Escopo autorizado do usuário autenticado');
  metric('Resumo', 'Solicitações criadas no período', data.summary.total, 'protocolos');
  metric('Resumo', 'Atualmente concluídas entre as criadas no período', data.summary.completed, 'protocolos');
  metric('Resumo', 'Taxa de conclusão', data.summary.completionRate, '%');
  metric('Resumo', 'Tempo médio de resolução', data.summary.averageResolutionDays, 'dias');
  metric('Cobertura', 'Concluídas com datas válidas', data.summary.timedCompletions, 'protocolos');
  metric('Resumo', 'Custo total registrado', data.summary.totalCost, 'BRL');
  metric('Resumo', 'Custo médio dos valores informados', data.summary.averageCost, 'BRL');
  metric('Cobertura', 'Concluídas com custo informado', data.summary.costedCompletions, 'protocolos');
  metric('Regras', 'Conclusões mensais', 'Data de resolução válida, incluindo chamados criados antes do período');
  metric('Regras', 'Recorrência', 'Até 10 grupos com pelo menos 2 relatos, por prefeitura, UF, local e causa');
  for (const item of data.distribution) rows.push(['Distribuição', 'Solicitações', item.total, 'protocolos', item.category, item.status, '', '', '']);
  for (const item of data.monthly) {
    rows.push(['Mensal', 'Criadas', item.opened, 'protocolos', '', '', item.month, '', '']);
    rows.push(['Mensal', 'Concluídas com data válida', item.completed, 'protocolos', '', '', item.month, '', '']);
  }
  for (const item of data.recurrence) rows.push(['Recorrência', 'Relatos', item.reports, 'protocolos', item.category, '', '', item.address, item.position]);
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}\r\n`;
}

export function downloadOperationalAnalyticsCsv(data: OperationalAnalytics): void {
  const url = URL.createObjectURL(new Blob([buildOperationalAnalyticsCsv(data)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `indicadores-${data.startDate}-a-${data.endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Aguarda o navegador iniciar o download antes de liberar a URL temporária.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
