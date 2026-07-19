import {
  Accessibility,
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle,
  Clock,
  Ear,
  Eye,
  FileText,
  HelpCircle,
  Map as MapIcon,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { useProtocols } from '../hooks/useProtocols';

const OPEN_STATUSES = ['Open', 'Aberto'];
const ANALYSIS_STATUSES = ['InProgress', 'Em Análise'];
const COMPLETED_STATUSES = ['Resolved', 'Closed', 'Concluído'];

export function CitizenDashboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { protocols, loading } = useProtocols('citizen');

  const openCount = protocols.filter((protocol) => OPEN_STATUSES.includes(protocol.status)).length;
  const analysisCount = protocols.filter((protocol) => ANALYSIS_STATUSES.includes(protocol.status)).length;
  const completedCount = protocols.filter((protocol) => COMPLETED_STATUSES.includes(protocol.status)).length;
  const total = protocols.length;

  const percentage = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
  const openPercentage = percentage(openCount);
  const analysisPercentage = percentage(analysisCount);
  const completedPercentage = percentage(completedCount);
  const openSlice = total > 0 ? (openCount / total) * 100 : 0;
  const analysisSliceEnd = total > 0 ? openSlice + (analysisCount / total) * 100 : 0;
  const completedSliceEnd = total > 0 ? analysisSliceEnd + (completedCount / total) * 100 : 0;

  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const formattedDate = today
    .split(' ')
    .map((word) => (word === 'de' ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
  const firstName = user?.full_name?.split(' ')[0] || 'Cidadão';

  const stats = [
    {
      label: 'Em aberto',
      value: openCount,
      percentage: openPercentage,
      description: 'Aguardando triagem',
      icon: Clock,
      iconClass: 'bg-[#EAF2FF] text-[#1351B4]',
      percentageClass: 'text-[#1351B4]',
      barClass: 'bg-[#1351B4]',
    },
    {
      label: 'Em análise',
      value: analysisCount,
      percentage: analysisPercentage,
      description: 'Em processamento',
      icon: TrendingUp,
      iconClass: 'bg-[#FFF4C7] text-[#8A6100]',
      percentageClass: 'text-[#B07B00]',
      barClass: 'bg-[#FFCD07]',
    },
    {
      label: 'Concluídos',
      value: completedCount,
      percentage: completedPercentage,
      description: 'Resolvidos',
      icon: CheckCircle,
      iconClass: 'bg-[#E7F4E4] text-[#168821]',
      percentageClass: 'text-[#168821]',
      barClass: 'bg-[#168821]',
    },
  ];

  const quickLinks = [
    { label: 'Serviços', icon: Briefcase, to: '/servicos' },
    { label: 'Protocolos', icon: FileText, to: '/meus-protocolos' },
    { label: 'Mapa', icon: MapIcon, to: '/mapa' },
  ];

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[#F4F8FC]">
      <Header
        title={`Olá, ${firstName}`}
        subtitle={formattedDate}
        description="Acompanhe suas solicitações e ajude a melhorar sua cidade."
      />

      <main className="mx-auto flex w-full max-w-[1620px] flex-col gap-5 px-4 pb-8 sm:px-6 lg:px-8">
        <section aria-label="Resumo das solicitações" className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="relative min-h-40 overflow-hidden rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_6px_18px_rgba(35,65,110,0.05)]"
              >
                <div className="flex items-start gap-5 pr-10">
                  <span className={`flex size-20 shrink-0 items-center justify-center rounded-full ${stat.iconClass}`}>
                    <Icon size={38} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
                    <strong className="mt-1 block text-4xl font-black leading-none text-[#111827]">{stat.value}</strong>
                    <p className="mt-2 text-xs text-slate-500">{stat.description}</p>
                  </div>
                </div>

                <span className={`absolute right-5 top-5 text-sm font-black ${stat.percentageClass}`}>
                  {stat.percentage}%
                </span>

                <div className="absolute inset-x-5 bottom-5 flex items-center gap-5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EDF4]">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ${stat.barClass}`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/meus-protocolos')}
                    className="flex size-8 shrink-0 items-center justify-center text-slate-600 transition-colors hover:text-[#1351B4]"
                    title={`Ver solicitações ${stat.label.toLowerCase()}`}
                    aria-label={`Ver solicitações ${stat.label.toLowerCase()}`}
                  >
                    <ArrowRight size={22} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[1.36fr_1fr]">
          <article className="overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-[0_6px_18px_rgba(35,65,110,0.05)]">
            <div className="flex items-center justify-between border-b border-[#D9E1EC] px-5 py-4 sm:px-6">
              <h2 className="text-xl font-black text-[#111827]">Últimos protocolos</h2>
              <Link
                to="/meus-protocolos"
                className="flex items-center gap-2 text-sm font-bold text-[#1351B4] transition-colors hover:text-[#0C326F]"
              >
                Ver todos <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            <div className="overflow-hidden">
              {loading ? (
                <div className="flex min-h-96 items-center justify-center text-sm text-slate-500">Carregando protocolos...</div>
              ) : protocols.length === 0 ? (
                <div className="flex min-h-96 flex-col items-center justify-center gap-3 px-6 text-center">
                  <BarChart3 size={36} className="text-slate-300" aria-hidden="true" />
                  <p className="font-semibold text-slate-600">Nenhuma solicitação encontrada</p>
                  <button
                    type="button"
                    onClick={() => navigate('/nova-solicitacao')}
                    className="text-sm font-bold text-[#1351B4] hover:text-[#0C326F]"
                  >
                    Criar a primeira solicitação
                  </button>
                </div>
              ) : (
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="border-b border-[#D9E1EC] bg-[#FBFCFE]">
                      <th className="w-[84%] px-6 py-3 text-xs font-bold uppercase text-slate-500 sm:w-[64%]">Serviço</th>
                      <th className="hidden w-[16%] px-4 py-3 text-xs font-bold uppercase text-slate-500 sm:table-cell">Data</th>
                      <th className="hidden w-[16%] px-4 py-3 text-xs font-bold uppercase text-slate-500 sm:table-cell">Status</th>
                      <th className="w-16 px-4 py-3"><span className="sr-only">Abrir</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocols.slice(0, 5).map((protocol) => (
                      <tr
                        key={protocol.id}
                        className="border-b border-[#E1E7F0] transition-colors last:border-b-0 hover:bg-[#F2F7FF]"
                      >
                        <td className="px-6 py-4">
                          <Link to={`/protocolo/${protocol.id}`} className="flex items-center gap-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4]">
                            <ProtocolIcon category={protocol.category} service={protocol.service} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#111827]">{protocol.service || protocol.description || 'Solicitação'}</p>
                              <p className="mt-1 max-w-[420px] truncate text-xs text-slate-500">{protocol.address}</p>
                              <div className="mt-2 sm:hidden"><StatusBadge status={protocol.status} /></div>
                            </div>
                          </Link>
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-600 sm:table-cell">{protocol.date}</td>
                        <td className="hidden px-4 py-4 sm:table-cell"><StatusBadge status={protocol.status} /></td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            to={`/protocolo/${protocol.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#EAF2FF] hover:text-[#1351B4]"
                            title="Ver protocolo"
                            aria-label={`Ver protocolo ${protocol.service || protocol.id}`}
                          >
                            <Eye size={19} aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <section className="relative min-h-48 overflow-hidden rounded-lg bg-[#0B5BD3] p-6 text-white shadow-[0_10px_24px_rgba(19,81,180,0.18)] sm:p-7">
              <img
                src="/dashboard-request-visual.png"
                alt="Piso acessível com rampa, faixa tátil e marcador de localização"
                className="absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover object-right opacity-95 [mask-image:linear-gradient(to_left,black_78%,transparent_100%)] sm:block"
              />
              <div className="relative z-10 max-w-full sm:max-w-[58%]">
                <h2 className="dashboard-inverse-text text-2xl font-black">Nova solicitação</h2>
                <p className="dashboard-inverse-muted mt-2 text-base leading-6">Encontrou um problema de acessibilidade?</p>
                <button
                  type="button"
                  onClick={() => navigate('/nova-solicitacao')}
                  className="mt-5 flex h-12 items-center gap-3 rounded-lg bg-white px-5 text-sm font-black text-[#1351B4] shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <Plus size={20} aria-hidden="true" />
                  Criar solicitação
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_6px_18px_rgba(35,65,110,0.05)] sm:p-6">
              <h2 className="text-xl font-black text-[#111827]">Visão rápida</h2>
              <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
                <div
                  className="relative size-36 shrink-0 rounded-full"
                  style={{
                    background: total > 0
                      ? `conic-gradient(#1351B4 0 ${openSlice}%, #FFCD07 ${openSlice}% ${analysisSliceEnd}%, #168821 ${analysisSliceEnd}% ${completedSliceEnd}%, #E8EDF4 ${completedSliceEnd}% 100%)`
                      : '#E8EDF4',
                  }}
                  role="img"
                  aria-label={`${openPercentage}% em aberto, ${analysisPercentage}% em análise e ${completedPercentage}% concluído`}
                >
                  <span className="absolute inset-[24px] rounded-full bg-white" />
                </div>

                <dl className="w-full max-w-xs space-y-4">
                  {[
                    { label: 'Em aberto', value: openPercentage, color: 'bg-[#1351B4]' },
                    { label: 'Em análise', value: analysisPercentage, color: 'bg-[#FFCD07]' },
                    { label: 'Concluído', value: completedPercentage, color: 'bg-[#168821]' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-sm">
                      <span className={`size-3 rounded-full ${item.color}`} aria-hidden="true" />
                      <dt className="flex-1 text-slate-600">{item.label}</dt>
                      <dd className="font-bold text-slate-700">{item.value}%</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_6px_18px_rgba(35,65,110,0.05)] sm:p-6">
              <h2 className="text-xl font-black text-[#111827]">Acesso rápido</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="quick-tile flex min-h-20 items-center justify-center gap-3 rounded-lg border border-[#1351B4] bg-white px-3 text-sm font-bold text-[#1351B4]"
                    >
                      <Icon size={23} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

function ProtocolIcon({ category, service }: { category?: string; service?: string }) {
  const value = `${category || ''} ${service || ''}`.toLocaleLowerCase('pt-BR');
  const Icon = value.includes('audit')
    ? Ear
    : value.includes('fís') || value.includes('fis') || value.includes('mobil')
      ? Accessibility
      : HelpCircle;

  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1351B4]">
      <Icon size={25} aria-hidden="true" />
    </span>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    Open: 'Aberto',
    InProgress: 'Em Análise',
    Resolved: 'Concluído',
    Closed: 'Encerrado',
  };
  return labels[status] || status;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: 'border-[#8DB6F4] bg-[#EAF2FF] text-[#1351B4]',
    Aberto: 'border-[#8DB6F4] bg-[#EAF2FF] text-[#1351B4]',
    InProgress: 'border-[#E9C64A] bg-[#FFF5C7] text-[#7A5700]',
    'Em Análise': 'border-[#E9C64A] bg-[#FFF5C7] text-[#7A5700]',
    Resolved: 'border-[#8BC896] bg-[#E7F4E4] text-[#126C1B]',
    Concluído: 'border-[#8BC896] bg-[#E7F4E4] text-[#126C1B]',
    Closed: 'border-slate-300 bg-slate-100 text-slate-600',
    Atrasado: 'border-[#F0A29A] bg-[#FDE9E7] text-[#A30D0A]',
  };
  const dots: Record<string, string> = {
    Open: 'bg-[#1351B4]',
    Aberto: 'bg-[#1351B4]',
    InProgress: 'bg-[#B07B00]',
    'Em Análise': 'bg-[#B07B00]',
    Resolved: 'bg-[#168821]',
    Concluído: 'bg-[#168821]',
    Closed: 'bg-slate-500',
    Atrasado: 'bg-[#C00F0C]',
  };

  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${styles[status] || 'border-slate-300 bg-slate-100 text-slate-600'}`}>
      <span className={`size-2 rounded-full ${dots[status] || 'bg-slate-500'}`} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}