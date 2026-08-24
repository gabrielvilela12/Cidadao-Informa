import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, CircleDollarSign, FileClock, FileSpreadsheet, FileText, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { Header } from '../components/Header';
import { api, type DailyReportDetail } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { exportDailyReportDetailExcel, exportDailyReportDetailPdf } from '../utils/dailyReportExports';

const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
const dateTimeLabel = (value: string) => new Date(value).toLocaleString('pt-BR');

export function AdminReportDetails() {
  const { id } = useParams();
  const [report, setReport] = useState<DailyReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getDailyReport(id).then(setReport).catch((reason) => setError(reason instanceof Error ? reason.message : 'Relatório não encontrado.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-full items-center justify-center gap-3 bg-[#F4F8FC] text-slate-600"><Loader2 className="animate-spin text-[#0758BD]" /> Carregando fechamento...</div>;
  if (!report || error) return <div className="flex h-full flex-col items-center justify-center bg-[#F4F8FC] p-8 text-center"><FileClock size={44} className="text-slate-300" /><h1 className="mt-3 text-2xl font-black text-[#0A1F44]">Relatório não encontrado</h1><p className="mt-2 text-slate-500">{error}</p><Link to="/admin/relatorios" className="mt-5 font-bold text-[#0758BD]">Voltar aos relatórios</Link></div>;

  const maxRegion = Math.max(1, ...report.regionDistribution.map((item) => item.count));
  const exportReport = async (format: 'pdf' | 'excel') => {
    setExporting(format);
    setExportError('');
    try {
      if (format === 'pdf') await exportDailyReportDetailPdf(report);
      else await exportDailyReportDetailExcel(report);
    } catch (reason) {
      setExportError(reason instanceof Error ? reason.message : 'Não foi possível exportar o relatório.');
    } finally {
      setExporting(null);
    }
  };
  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[#F4F8FC] text-[#0A1F44]">
      <Header title={`Fechamento de ${dateLabel(report.reportDate)}`} subtitle={`Período encerrado • gerado em ${dateTimeLabel(report.generatedAt)}`} action={(
        <div className="flex gap-2">
          <button type="button" onClick={() => void exportReport('pdf')} disabled={exporting !== null} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#CBD8E9] bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{exporting === 'pdf' ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />} PDF</button>
          <button type="button" onClick={() => void exportReport('excel')} disabled={exporting !== null} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0758BD] px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{exporting === 'excel' ? <Loader2 size={17} className="animate-spin" /> : <FileSpreadsheet size={17} />} Excel</button>
        </div>
      )} />
      <div className="space-y-5 px-4 pb-8 sm:px-6 lg:px-8">
        <Link to="/admin/relatorios" className="inline-flex items-center gap-2 font-bold text-[#0758BD] hover:text-blue-800"><ArrowLeft size={18} /> Voltar aos relatórios</Link>
        {exportError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">{exportError}</div>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={CalendarDays} label="Novas solicitações" value={String(report.newProtocolsCount)} tone="blue" />
          <Metric icon={RefreshCw} label="Mudanças de status" value={String(report.statusChangesCount)} tone="amber" />
          <Metric icon={CircleDollarSign} label="Valor gasto no dia" value={formatCurrency(report.totalSpent)} tone="green" />
          <Metric icon={MapPin} label="Regiões com novas solicitações" value={String(report.regionsCount)} tone="purple" />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-xl border border-[#D7E0EC] bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Movimentação de status</h2><p className="mt-1 text-sm text-slate-500">Quantidade que passou de um status para outro.</p><div className="mt-4 space-y-2">{report.statusTransitions.length === 0 ? <Empty text="Nenhuma mudança de status no dia." /> : report.statusTransitions.map((item) => <div key={`${item.fromStatus}-${item.toStatus}`} className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3"><span className="font-semibold text-slate-700">{item.fromStatus} <ArrowRight size={15} className="mx-2 inline" /> {item.toStatus}</span><strong className="rounded-full bg-amber-600 px-2.5 py-1 text-xs text-white">{item.count}</strong></div>)}</div></section>
          <section className="rounded-xl border border-[#D7E0EC] bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Novas solicitações por região</h2><p className="mt-1 text-sm text-slate-500">Distribuição territorial das entradas do dia.</p><div className="mt-4 space-y-3">{report.regionDistribution.length === 0 ? <Empty text="Nenhuma nova região registrada no dia." /> : report.regionDistribution.map((item) => <div key={item.region}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{item.region}</span><strong>{item.count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.max(5, (item.count / maxRegion) * 100)}%` }} /></div></div>)}</div></section>
        </div>

        <section className="overflow-hidden rounded-xl border border-[#D7E0EC] bg-white shadow-sm">
          <div className="border-b border-[#E2E8F0] px-5 py-4"><h2 className="text-lg font-black">Protocolos do fechamento</h2><p className="mt-1 text-sm text-slate-500">{report.protocolsInvolvedCount} protocolos criados ou movimentados neste dia.</p></div>
          {report.protocols.length === 0 ? <Empty text="Nenhum protocolo teve movimentação operacional no dia." /> : <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-[#F7F9FC] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Protocolo</th><th className="px-4 py-3">Categoria / região</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3">Movimentações</th><th className="px-4 py-3">Gasto no dia</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-[#E8EDF4]">{report.protocols.map((protocol) => <tr key={protocol.protocolId} className="align-top hover:bg-blue-50/40"><td className="px-5 py-4"><p className="font-mono font-bold">#{protocol.protocolId.slice(0, 8)}</p><p className="mt-1 text-xs text-slate-500">Aberto em {dateTimeLabel(protocol.protocolCreatedAt)}</p>{protocol.createdDuringPeriod && <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700">Novo no dia</span>}</td><td className="px-4 py-4"><p className="font-bold">{protocol.category}</p><p className="mt-1 text-xs text-slate-500">{protocol.region}</p><p className="mt-1 max-w-xs truncate text-xs text-slate-400" title={protocol.address}>{protocol.address}</p></td><td className="px-4 py-4 font-semibold">{protocol.currentStatus}</td><td className="px-4 py-4">{protocol.statusChanges.length === 0 ? <span className="text-slate-400">Sem mudança</span> : <div className="space-y-1">{protocol.statusChanges.map((change, index) => <p key={`${change.occurredAt}-${index}`} className="text-xs"><strong>{change.fromStatus}</strong> → <strong>{change.toStatus}</strong><span className="ml-2 text-slate-400">{new Date(change.occurredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></p>)}</div>}</td><td className="px-4 py-4 font-bold text-emerald-700">{formatCurrency(protocol.spentDuringPeriod)}</td><td className="px-5 py-4 text-right"><Link to={`/protocolo/${protocol.protocolId}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-3 font-bold text-[#0758BD] hover:bg-blue-50">Abrir protocolo <ArrowRight size={15} /></Link></td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) { return <p className="p-5 text-center text-sm text-slate-400">{text}</p>; }

function Metric({ icon: Icon, label, value, tone }: { icon: typeof CalendarDays; label: string; value: string; tone: 'blue' | 'amber' | 'green' | 'purple' }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700', purple: 'bg-violet-50 text-violet-700' };
  return <div className="rounded-xl border border-[#D7E0EC] bg-white p-5 shadow-sm"><span className={`flex size-10 items-center justify-center rounded-lg ${colors[tone]}`}><Icon size={21} /></span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}
