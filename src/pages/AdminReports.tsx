import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CircleDollarSign, FileClock, FileSpreadsheet, FileText, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { Header } from '../components/Header';
import { api, type DailyReportSummary } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { exportDailyReportsExcel, exportDailyReportsPdf } from '../utils/dailyReportExports';

const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
const dateTimeLabel = (value: string) => new Date(value).toLocaleString('pt-BR');

export function AdminReports() {
  const [reports, setReports] = useState<DailyReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setReports(await api.getDailyReports()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os fechamentos.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const exportReports = async (format: 'pdf' | 'excel') => {
    if (!reports.length) return;
    setExporting(format);
    setError('');
    try {
      if (format === 'pdf') await exportDailyReportsPdf(reports);
      else await exportDailyReportsExcel(reports);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível exportar os relatórios.');
    } finally {
      setExporting(null);
    }
  };

  const totals = useMemo(() => reports.reduce((result, item) => ({
    protocols: result.protocols + item.newProtocolsCount,
    changes: result.changes + item.statusChangesCount,
    spent: result.spent + item.totalSpent,
  }), { protocols: 0, changes: 0, spent: 0 }), [reports]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[#F4F8FC] text-[#0A1F44]">
      <Header title="Relatórios diários" subtitle="Fechamentos operacionais gerados todos os dias às 00h10" action={(
        <div className="flex gap-2">
          <button type="button" onClick={() => void exportReports('pdf')} disabled={!reports.length || exporting !== null} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{exporting === 'pdf' ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />} PDF</button>
          <button type="button" onClick={() => void exportReports('excel')} disabled={!reports.length || exporting !== null} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{exporting === 'excel' ? <Loader2 size={17} className="animate-spin" /> : <FileSpreadsheet size={17} />} Excel</button>
        </div>
      )} />
      <div className="space-y-5 px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Metric icon={CalendarDays} label="Novas solicitações" value={totals.protocols.toLocaleString('pt-BR')} tone="blue" />
          <Metric icon={RefreshCw} label="Mudanças de status" value={totals.changes.toLocaleString('pt-BR')} tone="amber" />
          <Metric icon={CircleDollarSign} label="Valor registrado" value={formatCurrency(totals.spent)} tone="green" />
        </div>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">{error}</div>}
        <section className="overflow-hidden rounded-xl border border-[#D7E0EC] bg-white shadow-sm">
          <div className="border-b border-[#E2E8F0] px-5 py-4"><h2 className="text-lg font-black">Histórico de fechamentos</h2><p className="mt-1 text-sm text-slate-500">Cada linha é uma fotografia imutável do dia encerrado.</p></div>
          {loading ? <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500"><Loader2 className="animate-spin text-[#0758BD]" /> Carregando relatórios...</div>
            : reports.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center"><FileClock size={38} className="mb-3 text-slate-300" /><p className="font-bold text-slate-700">Nenhum fechamento diário gerado</p><p className="mt-1 text-sm text-slate-500">O primeiro será criado automaticamente às 00h10.</p></div>
              : <div className="overflow-x-auto"><table className="w-full min-w-[930px] text-left text-sm"><thead className="bg-[#F7F9FC] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Dia</th><th className="px-4 py-3">Novas</th><th className="px-4 py-3">Mudanças</th><th className="px-4 py-3">Valor gasto</th><th className="px-4 py-3">Regiões</th><th className="px-4 py-3">Protocolos envolvidos</th><th className="px-4 py-3">Gerado em</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-[#E8EDF4]">{reports.map((report) => <tr key={report.id} className="hover:bg-blue-50/40"><td className="px-5 py-4 font-black">{dateLabel(report.reportDate)}</td><td className="px-4 py-4 font-bold text-blue-700">{report.newProtocolsCount}</td><td className="px-4 py-4 font-bold text-amber-700">{report.statusChangesCount}</td><td className="px-4 py-4 font-bold text-emerald-700">{formatCurrency(report.totalSpent)}</td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{report.regionsCount}</span></td><td className="px-4 py-4">{report.protocolsInvolvedCount}</td><td className="px-4 py-4 text-slate-500">{dateTimeLabel(report.generatedAt)}</td><td className="px-5 py-4 text-right"><Link to={`/admin/relatorios/${report.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-3 font-bold text-[#0758BD] hover:bg-blue-50">Ver detalhes <ArrowRight size={16} /></Link></td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof CalendarDays; label: string; value: string; tone: 'blue' | 'amber' | 'green' }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700' };
  return <div className="rounded-xl border border-[#D7E0EC] bg-white p-5 shadow-sm"><span className={`flex size-10 items-center justify-center rounded-lg ${colors[tone]}`}><Icon size={21} /></span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}
