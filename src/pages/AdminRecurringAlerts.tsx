import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, BellRing, CheckCircle2, MapPin, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import type { Protocol } from '../constants';
import { useProtocols } from '../hooks/useProtocols';

function reportedCause(protocol: Protocol) {
  return protocol.description?.split(/\s+-\s+/, 1)[0]?.trim() || protocol.category || 'Causa não informada';
}

function isCompleted(protocol: Protocol) {
  return ['Concluído', 'Resolved', 'Closed'].includes(protocol.status);
}

function statusLabel(protocol: Protocol) {
  if (isCompleted(protocol)) return 'Concluído';
  if (['Em Análise', 'InProgress'].includes(protocol.status)) return 'Em análise';
  if (protocol.status === 'Atrasado') return 'Atrasado';
  return 'Aberto';
}

export function AdminRecurringAlerts() {
  const { protocols, loading } = useProtocols('admin');
  const [search, setSearch] = useState('');

  const alerts = useMemo(() => protocols
    .filter((protocol) => protocol.location_alert && protocol.id === protocol.primary_protocol_id)
    .sort((a, b) => (b.location_group_count ?? 0) - (a.location_group_count ?? 0)), [protocols]);

  const filteredAlerts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return alerts;
    return alerts.filter((protocol) => [
      protocol.id,
      protocol.address,
      protocol.category,
      reportedCause(protocol),
    ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(term)));
  }, [alerts, search]);

  const affectedReports = alerts.reduce((sum, protocol) => sum + (protocol.location_group_count ?? 0), 0);
  const activeAlerts = alerts.filter((protocol) => !isCompleted(protocol)).length;

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <Header
        title="Alertas de recorrência"
        subtitle="Locais com mais de 10 relatos da mesma causa"
        action={(
          <div className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700">
            <BellRing size={16} /> {activeAlerts} alerta(s) ativo(s)
          </div>
        )}
      />

      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 pb-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-xl border border-red-200 bg-gradient-to-r from-red-700 to-red-600 shadow-md shadow-red-900/10">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:px-5 md:py-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white"><AlertTriangle size={22} /></span>
              <div>
                <h1 className="text-lg font-black leading-6 text-white">Pontos que merecem atenção prioritária</h1>
                <p className="mt-1 max-w-3xl text-sm leading-5 text-red-50">Cada alerta representa mais de 10 cidadãos relatando a mesma causa no mesmo endereço. Os protocolos permanecem unidos e caminham com o status sincronizado.</p>
              </div>
            </div>
            <div className="flex min-w-[168px] shrink-0 items-center justify-center gap-3 self-start rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-white md:self-center">
              <p className="text-2xl font-black leading-none text-white">{affectedReports}</p>
              <p className="text-[11px] font-bold uppercase leading-4 tracking-wide text-red-50">relatos<br />envolvidos</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric value={alerts.length} label="Locais em alerta" icon={<BellRing size={21} />} tone="red" />
          <Metric value={activeAlerts} label="Alertas ainda ativos" icon={<AlertTriangle size={21} />} tone="amber" />
          <Metric value={affectedReports} label="Protocolos agrupados" icon={<Users size={21} />} tone="blue" />
        </section>

        <section className="rounded-xl border border-[#CDD8E7] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black">Ocorrências recorrentes</h2>
              <p className="mt-1 text-sm text-slate-500">Ordenadas pela quantidade de relatos recebidos.</p>
            </div>
            <label className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar causa, endereço ou protocolo" className="h-11 w-full rounded-lg border border-[#CDD8E7] pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>

          {loading ? (
            <p className="p-12 text-center text-sm font-semibold text-slate-500">Carregando alertas...</p>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-green-100 text-green-700"><CheckCircle2 size={28} /></span>
              <h3 className="mt-4 text-lg font-black">Nenhum alerta encontrado</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">Não há causas com mais de 10 relatos para os filtros atuais.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {filteredAlerts.map((protocol) => (
                <article key={protocol.id} className="grid gap-4 p-5 transition hover:bg-red-50/30 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)_auto] lg:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 font-black text-red-700">{protocol.location_group_count}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-700">ATENÇÃO PRIORITÁRIA</span>
                        <span className="text-xs font-bold text-slate-500">#{protocol.id.slice(0, 8)}</span>
                      </div>
                      <h3 className="mt-2 text-base font-black text-slate-900">{reportedCause(protocol)}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">Categoria: {protocol.category}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-start gap-2 text-sm leading-6 text-slate-600"><MapPin className="mt-1 shrink-0 text-red-600" size={16} /><span>{protocol.address}</span></p>
                    <p className="mt-2 text-xs font-bold text-slate-500">Status conjunto: <span className="text-slate-800">{statusLabel(protocol)}</span></p>
                  </div>
                  <Link to={`/protocolo/${protocol.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700">Ver protocolos <ArrowRight size={16} /></Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ value, label, icon, tone }: { value: number; label: string; icon: React.ReactNode; tone: 'red' | 'amber' | 'blue' }) {
  const tones = {
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <article className="flex items-center gap-4 rounded-xl border border-[#CDD8E7] bg-white p-4 shadow-sm">
      <span className={`flex size-11 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div><p className="text-2xl font-black">{value}</p><p className="text-sm text-slate-500">{label}</p></div>
    </article>
  );
}
