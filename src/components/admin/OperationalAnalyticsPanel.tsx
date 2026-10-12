import { useEffect, useState } from 'react';
import { getOperationalAnalytics, type OperationalAnalytics } from '../../services/operationalAnalyticsService';
import { formatCurrency } from '../../utils/currency';
import { downloadOperationalAnalyticsCsv } from '../../utils/operationalAnalyticsCsv';

function localToday() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function OperationalAnalyticsPanel() {
  const [today] = useState(localToday);
  const [startDate, setStartDate] = useState(`${today.slice(0, 4)}-01-01`);
  const [endDate, setEndDate] = useState(today);
  const [period, setPeriod] = useState({ startDate, endDate });
  const [data, setData] = useState<OperationalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    getOperationalAnalytics(period.startDate, period.endDate, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch(() => { if (!controller.signal.aborted) setError('Não foi possível carregar os indicadores. Tente novamente.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [period, refreshKey]);

  return (
    <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-sm" aria-labelledby="operational-analytics-title">
      <h2 id="operational-analytics-title" className="font-black">Análise do atendimento por período</h2>
      <p className="mt-1 text-sm text-slate-600">Indicadores do seu escopo de acesso. O período abaixo é independente dos filtros dos demais cartões.</p>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(event) => {
        event.preventDefault();
        if (startDate > endDate) { setValidationError('A data inicial deve ser anterior ou igual à final.'); return; }
        const days = (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000 + 1;
        if (!Number.isFinite(days) || days > 731) { setValidationError('Selecione um período de até 731 dias, incluindo as duas datas.'); return; }
        setValidationError('');
        setPeriod({ startDate, endDate });
      }}>
        <label className="text-sm font-semibold">De<input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block rounded border border-slate-300 p-2" /></label>
        <label className="text-sm font-semibold">Até<input type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block rounded border border-slate-300 p-2" /></label>
        <button type="submit" disabled={loading} className="min-h-10 rounded bg-blue-700 px-4 font-bold text-white disabled:opacity-50">Aplicar período</button>
        <button type="button" disabled={!data || loading || Boolean(error) || Boolean(validationError)} onClick={() => { if (data) downloadOperationalAnalyticsCsv(data); }} className="min-h-10 rounded border border-blue-700 px-4 font-bold text-blue-700 disabled:opacity-50">Exportar indicadores CSV</button>
      </form>
      <p className="mt-2 text-xs text-slate-500">Até 731 dias. A exportação usa o período aplicado e os dados exibidos, com cobertura e regras de cálculo.</p>
      {validationError && <p className="mt-3 text-sm text-red-700" role="alert">{validationError}</p>}
      {loading && <p className="mt-4 text-sm" role="status">Carregando análise...</p>}
      {error && <div className="mt-4 text-sm text-red-700" role="alert">{error} <button type="button" className="underline" onClick={() => setRefreshKey((key) => key + 1)}>Tentar novamente</button></div>}
      {data && !loading && <>
        <p className="mt-4 text-xs text-slate-500">Período: {data.startDate.split('-').reverse().join('/')} a {data.endDate.split('-').reverse().join('/')} · Atualizado em {new Date(data.generatedAt).toLocaleString('pt-BR', { timeZone: data.timezone })}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Solicitações criadas" value={String(data.summary.total)} />
          <Metric label="Taxa de conclusão" value={`${data.summary.completionRate.toLocaleString('pt-BR')}%`} detail={`${data.summary.completed} concluídas entre as criadas no período`} />
          <Metric label="Tempo médio" value={data.summary.averageResolutionDays == null ? 'Sem dados' : `${data.summary.averageResolutionDays.toLocaleString('pt-BR')} dias`} detail={`${data.summary.timedCompletions}/${data.summary.completed} concluídas com datas válidas`} />
          <Metric label="Custo total registrado" value={formatCurrency(data.summary.totalCost, 'Sem dados')} detail={`Média: ${formatCurrency(data.summary.averageCost)} · ${data.summary.costedCompletions}/${data.summary.completed} com custo`} />
        </div>
        {data.summary.total === 0 && <p className="mt-3 text-sm text-slate-600">Nenhuma solicitação criada no período. A série mensal pode incluir conclusões de solicitações anteriores.</p>}
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="overflow-x-auto"><h3 className="mb-2 font-bold">Categoria e status atual</h3><table className="w-full text-left text-sm"><thead><tr><th scope="col">Categoria</th><th scope="col">Status</th><th scope="col">Quantidade</th></tr></thead><tbody>{data.distribution.map((item) => <tr key={`${item.category}:${item.status}`} className="border-t border-slate-100"><td className="py-2">{item.category}</td><td>{item.status}</td><td>{item.total}</td></tr>)}</tbody></table></div>
          <div className="overflow-x-auto"><h3 className="mb-2 font-bold">Entradas e conclusões mensais</h3><table className="w-full text-left text-sm"><thead><tr><th scope="col">Mês</th><th scope="col">Criadas</th><th scope="col">Concluídas</th></tr></thead><tbody>{data.monthly.map((item) => <tr key={item.month} className="border-t border-slate-100"><td className="py-2">{item.month.split('-').reverse().join('/')}</td><td>{item.opened}</td><td>{item.completed}</td></tr>)}</tbody></table></div>
        </div>
        <h3 className="mb-2 mt-5 font-bold">Locais com relatos recorrentes</h3>
        <p className="mb-2 text-xs text-slate-500">Até 10 grupos com pelo menos 2 relatos, agrupados por prefeitura, UF, local e causa; empates compartilham a posição.</p>
        {data.recurrence.length === 0 ? <p className="text-sm text-slate-600">Nenhum grupo recorrente no período.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th scope="col">Posição</th><th scope="col">Local</th><th scope="col">Categoria</th><th scope="col">Relatos</th></tr></thead><tbody>{data.recurrence.map((item, index) => <tr key={index} className="border-t border-slate-100"><td className="py-2">{item.position}º</td><td>{item.address}</td><td>{item.category}</td><td>{item.reports}</td></tr>)}</tbody></table></div>}
      </>}
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-sm text-slate-600">{label}</p><p className="mt-1 text-xl font-black">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>;
}
