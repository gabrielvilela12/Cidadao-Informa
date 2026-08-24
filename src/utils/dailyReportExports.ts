import type { DailyReportDetail, DailyReportSummary } from '../services/api';
import type { Cell } from 'write-excel-file/browser';

const BLUE = '#0758BD';
const NAVY = '#0A1F44';
const LIGHT_BLUE = '#EAF2FF';
const BORDER = '#CBD8E9';
const DATE_TIME_FORMAT = 'dd/mm/yyyy hh:mm';
const CURRENCY_FORMAT = '"R$" #,##0.00';

const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
const dateTimeLabel = (value: string) => new Date(value).toLocaleString('pt-BR');
const currencyLabel = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const headerCell = (value: string): Cell => ({
  value,
  fontWeight: 'bold',
  textColor: '#FFFFFF',
  backgroundColor: BLUE,
  borderColor: BLUE,
  borderStyle: 'thin',
  alignVertical: 'center',
  wrap: true,
});

const titleRow = (title: string, columns: number): Cell[] => [
  { value: title, fontWeight: 'bold', fontSize: 18, textColor: NAVY, columnSpan: columns },
  ...Array<Cell>(columns - 1).fill(null),
];

const subtitleRow = (subtitle: string, columns: number): Cell[] => [
  { value: subtitle, textColor: '#52627A', columnSpan: columns },
  ...Array<Cell>(columns - 1).fill(null),
];

const summaryRows = (report: DailyReportDetail): Cell[][] => [
  titleRow(`Fechamento operacional - ${dateLabel(report.reportDate)}`, 2),
  subtitleRow(`Gerado em ${dateTimeLabel(report.generatedAt)}`, 2),
  [headerCell('Indicador'), headerCell('Valor')],
  ['Novas solicitações', report.newProtocolsCount],
  ['Mudanças de status', report.statusChangesCount],
  ['Protocolos envolvidos', report.protocolsInvolvedCount],
  ['Regiões', report.regionsCount],
  ['Valor gasto no dia', { value: report.totalSpent, type: Number, format: CURRENCY_FORMAT }],
  ['Início do período', { value: new Date(report.periodStart), type: Date, format: DATE_TIME_FORMAT }],
  ['Fim do período', { value: new Date(report.periodEnd), type: Date, format: DATE_TIME_FORMAT }],
];

export async function exportDailyReportsExcel(reports: DailyReportSummary[]): Promise<void> {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const data: Cell[][] = [
    titleRow('Histórico de fechamentos operacionais', 7),
    subtitleRow(`Exportado em ${new Date().toLocaleString('pt-BR')}`, 7),
    ['Dia', 'Novas solicitações', 'Mudanças de status', 'Valor gasto', 'Regiões', 'Protocolos envolvidos', 'Gerado em'].map((value) => headerCell(value)),
    ...reports.map((report): Cell[] => [
      { value: new Date(`${report.reportDate}T12:00:00`), type: Date, format: 'dd/mm/yyyy' },
      report.newProtocolsCount,
      report.statusChangesCount,
      { value: report.totalSpent, type: Number, format: CURRENCY_FORMAT },
      report.regionsCount,
      report.protocolsInvolvedCount,
      { value: new Date(report.generatedAt), type: Date, format: DATE_TIME_FORMAT },
    ]),
  ];

  await writeExcelFile(data, {
    sheet: 'Fechamentos diários',
    columns: [{ width: 14 }, { width: 18 }, { width: 18 }, { width: 16 }, { width: 12 }, { width: 20 }, { width: 20 }],
    stickyRowsCount: 3,
    showGridLines: false,
    orientation: 'landscape',
  }, { fontFamily: 'Arial', fontSize: 10 }).toFile('relatorios-diarios.xlsx');
}

export async function exportDailyReportDetailExcel(report: DailyReportDetail): Promise<void> {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const transitions: Cell[][] = [
    titleRow('Movimentação de status', 3),
    ['Status anterior', 'Novo status', 'Quantidade'].map((value) => headerCell(value)),
    ...report.statusTransitions.map((item): Cell[] => [item.fromStatus, item.toStatus, item.count]),
  ];
  const regions: Cell[][] = [
    titleRow('Novas solicitações por região', 2),
    ['Região', 'Quantidade'].map((value) => headerCell(value)),
    ...report.regionDistribution.map((item): Cell[] => [item.region, item.count]),
  ];
  const protocols: Cell[][] = [
    titleRow('Protocolos do fechamento', 9),
    ['Protocolo', 'Abertura', 'Novo no dia', 'Categoria', 'Região', 'Endereço', 'Status atual', 'Movimentações', 'Gasto no dia'].map((value) => headerCell(value)),
    ...report.protocols.map((protocol): Cell[] => [
      { value: protocol.protocolId, type: String, format: '@' },
      { value: new Date(protocol.protocolCreatedAt), type: Date, format: DATE_TIME_FORMAT },
      protocol.createdDuringPeriod ? 'Sim' : 'Não',
      protocol.category,
      protocol.region,
      { value: protocol.address, wrap: true },
      protocol.currentStatus,
      { value: protocol.statusChanges.map((change) => `${change.fromStatus} > ${change.toStatus} (${new Date(change.occurredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`).join('\n') || 'Sem mudança', wrap: true },
      { value: protocol.spentDuringPeriod, type: Number, format: CURRENCY_FORMAT },
    ]),
  ];

  await writeExcelFile([
    { data: summaryRows(report), sheet: 'Resumo', columns: [{ width: 36 }, { width: 28 }], stickyRowsCount: 3, showGridLines: false },
    { data: transitions, sheet: 'Status', columns: [{ width: 24 }, { width: 24 }, { width: 14 }], stickyRowsCount: 2, showGridLines: false },
    { data: regions, sheet: 'Regiões', columns: [{ width: 34 }, { width: 14 }], stickyRowsCount: 2, showGridLines: false },
    { data: protocols, sheet: 'Protocolos', columns: [{ width: 38 }, { width: 20 }, { width: 13 }, { width: 16 }, { width: 22 }, { width: 45 }, { width: 18 }, { width: 42 }, { width: 16 }], stickyRowsCount: 2, showGridLines: false, orientation: 'landscape' as const },
  ], { fontFamily: 'Arial', fontSize: 10 }).toFile(`fechamento-${report.reportDate}.xlsx`);
}

function addPdfHeader(doc: import('jspdf').jsPDF, title: string, subtitle: string) {
  doc.setFillColor(7, 88, 189);
  doc.rect(0, 0.1, doc.internal.pageSize.getWidth(), 17.9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Cidadão Informa', 12, 11.5);
  doc.setTextColor(10, 31, 68);
  doc.setFontSize(16);
  doc.text(title, 12, 29);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(82, 98, 122);
  doc.setFontSize(9);
  doc.text(subtitle, 12, 35);
}

function addPdfFooters(doc: import('jspdf').jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    doc.setDrawColor(210, 220, 233);
    doc.line(12, height - 10, width - 12, height - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Relatório administrativo - Cidadão Informa', 12, height - 5);
    doc.text(`Página ${page} de ${pages}`, width - 12, height - 5, { align: 'right' });
  }
}

export async function exportDailyReportsPdf(reports: DailyReportSummary[]): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addPdfHeader(doc, 'Histórico de fechamentos operacionais', `Exportado em ${new Date().toLocaleString('pt-BR')}`);
  autoTable(doc, {
    startY: 42,
    head: [['Dia', 'Novas', 'Mudanças', 'Valor gasto', 'Regiões', 'Protocolos', 'Gerado em']],
    body: reports.map((report) => [dateLabel(report.reportDate), report.newProtocolsCount, report.statusChangesCount, currencyLabel(report.totalSpent), report.regionsCount, report.protocolsInvolvedCount, dateTimeLabel(report.generatedAt)]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.4, lineColor: [203, 216, 233], lineWidth: 0.15 },
    headStyles: { fillColor: [7, 88, 189], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    margin: { left: 12, right: 12, bottom: 16 },
  });
  addPdfFooters(doc);
  doc.save('relatorios-diarios.pdf');
}

export async function exportDailyReportDetailPdf(report: DailyReportDetail): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addPdfHeader(doc, `Fechamento de ${dateLabel(report.reportDate)}`, `Período encerrado - gerado em ${dateTimeLabel(report.generatedAt)}`);

  const metrics = [
    ['Novas solicitações', String(report.newProtocolsCount)],
    ['Mudanças de status', String(report.statusChangesCount)],
    ['Valor gasto', currencyLabel(report.totalSpent)],
    ['Regiões', String(report.regionsCount)],
  ];
  metrics.forEach(([label, value], index) => {
    const x = 12 + index * 68;
    doc.setFillColor(index === 2 ? 236 : 234, index === 2 ? 253 : 242, index === 2 ? 245 : 255);
    doc.roundedRect(x, 42, 62, 18, 2, 2, 'F');
    doc.setTextColor(82, 98, 122);
    doc.setFontSize(7.5);
    doc.text(label, x + 4, 48);
    doc.setTextColor(10, 31, 68);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(value, x + 4, 56);
    doc.setFont('helvetica', 'normal');
  });

  autoTable(doc, {
    startY: 68,
    head: [['Status anterior', 'Novo status', 'Quantidade']],
    body: report.statusTransitions.length ? report.statusTransitions.map((item) => [item.fromStatus, item.toStatus, item.count]) : [['Sem mudanças', '-', 0]],
    theme: 'grid',
    tableWidth: 126,
    margin: { left: 12, right: 159, bottom: 16 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [203, 216, 233], lineWidth: 0.15 },
    headStyles: { fillColor: [217, 119, 6], textColor: 255 },
  });
  autoTable(doc, {
    startY: 68,
    head: [['Região', 'Novas solicitações']],
    body: report.regionDistribution.length ? report.regionDistribution.map((item) => [item.region, item.count]) : [['Sem novas regiões', 0]],
    theme: 'grid',
    tableWidth: 126,
    margin: { left: 159, right: 12, bottom: 16 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [203, 216, 233], lineWidth: 0.15 },
    headStyles: { fillColor: [124, 58, 237], textColor: 255 },
  });

  // The second side-by-side table may repaint the page background in some
  // jsPDF renderers, so keep the report identity on top of the finished page.
  addPdfHeader(doc, `Fechamento de ${dateLabel(report.reportDate)}`, `Período encerrado - gerado em ${dateTimeLabel(report.generatedAt)}`);

  doc.addPage('a4', 'landscape');
  addPdfHeader(doc, 'Protocolos do fechamento', `${report.protocolsInvolvedCount} protocolos criados ou movimentados no dia`);
  autoTable(doc, {
    startY: 42,
    head: [['Protocolo', 'Abertura', 'Novo', 'Categoria', 'Região / endereço', 'Status', 'Movimentações', 'Gasto']],
    body: report.protocols.map((protocol) => [
      protocol.protocolId.slice(0, 8),
      dateTimeLabel(protocol.protocolCreatedAt),
      protocol.createdDuringPeriod ? 'Sim' : 'Não',
      protocol.category,
      `${protocol.region}\n${protocol.address}`,
      protocol.currentStatus,
      protocol.statusChanges.map((change) => `${change.fromStatus} > ${change.toStatus} (${new Date(change.occurredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`).join('\n') || 'Sem mudança',
      currencyLabel(protocol.spentDuringPeriod),
    ]),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.8, valign: 'top', lineColor: [203, 216, 233], lineWidth: 0.12, overflow: 'linebreak' },
    headStyles: { fillColor: [7, 88, 189], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 28 }, 2: { cellWidth: 12 }, 3: { cellWidth: 20 }, 4: { cellWidth: 65 }, 5: { cellWidth: 22 }, 6: { cellWidth: 80 }, 7: { cellWidth: 26, halign: 'right' } },
    margin: { top: 42, left: 12, right: 12, bottom: 16 },
    rowPageBreak: 'avoid',
  });

  for (let page = 2; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    addPdfHeader(doc, 'Protocolos do fechamento', `${report.protocolsInvolvedCount} protocolos criados ou movimentados no dia`);
  }
  addPdfFooters(doc);
  doc.save(`fechamento-${report.reportDate}.pdf`);
}
