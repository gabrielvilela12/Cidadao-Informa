import { describe, expect, it } from 'vitest';
import { buildOperationalAnalyticsCsv } from '../utils/operationalAnalyticsCsv';
import type { OperationalAnalytics } from '../services/operationalAnalyticsService';

const fixture: OperationalAnalytics = {
  startDate: '2026-08-01', endDate: '2026-10-10', timezone: 'America/Sao_Paulo', generatedAt: '2026-10-11T02:49:04Z',
  summary: { total: 2, completed: 1, completionRate: 50, averageResolutionDays: null, timedCompletions: 0, totalCost: 0, averageCost: 0, costedCompletions: 1 },
  distribution: [{ category: 'Física', status: 'Concluído', total: 1 }],
  monthly: [{ month: '2026-09', opened: 2, completed: 0 }],
  recurrence: [{ position: 1, address: 'Rua "A"; esquina\nCentro', category: 'Física', reports: 2 }],
};

describe('CSV dos indicadores operacionais', () => {
  it('preserva metadados, todas as seções, cobertura, ausência e custo zero', () => {
    const csv = buildOperationalAnalyticsCsv(fixture);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Data inicial";"2026-08-01"');
    expect(csv).toContain('"Gerado em";"2026-10-11T02:49:04Z"');
    expect(csv).toContain('"Tempo médio de resolução";"Sem dados";"dias"');
    expect(csv).toContain('"Custo total registrado";"0";"BRL"');
    expect(csv).toContain('"Concluídas com custo informado";"1"');
    expect(csv).toContain('"Distribuição";"Solicitações";"1";"protocolos";"Física"');
    expect(csv).toContain('"Mensal";"Concluídas com data válida";"0"');
    expect(csv).toContain('"Rua ""A""; esquina\nCentro"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('neutraliza fórmulas textuais, inclusive após espaços ou controles', () => {
    for (const text of ['=HYPERLINK("https://example.invalid")', '+SUM(1)', '-1+2', '@SUM(1)', ' \t=SUM(1)']) {
      const csv = buildOperationalAnalyticsCsv({ ...fixture, recurrence: [{ ...fixture.recurrence[0], address: text }] });
      expect(csv).toContain(`"'${text.replaceAll('"', '""')}"`);
    }
  });

  it('exporta meses vazios e custos ausentes sem converter ausência em zero', () => {
    const csv = buildOperationalAnalyticsCsv({ ...fixture, summary: { ...fixture.summary, total: 0, completed: 0, totalCost: null, averageCost: null }, distribution: [], recurrence: [] });
    expect(csv).toContain('"Custo total registrado";"Sem dados";"BRL"');
    expect(csv).toContain('"2026-09"');
    expect(csv).not.toContain('"Recorrência";"Relatos"');
  });
});
