import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, ArrowRight, Box, Calendar, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Copy, ExternalLink,
  FileText, Hash, Info, Link2, Loader2, LockKeyhole, MapPin, MoreHorizontal,
  Paperclip, RefreshCw, Settings, ShieldCheck, Tag, User,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { Header } from '../components/Header';
import { PrioritySection } from '../components/admin/PrioritySection';
import { useApp } from '../context/AppContext';
import type { Protocol } from '../constants';
import { api, type ProtocolAuditTrail } from '../services/api';
import { getMarkerPosition } from '../utils/mapUtils';

type DetailsTab = 'details' | 'blockchain';
type DetailedProtocol = Protocol & { image_urls?: string[] };

const DETAIL_MARKER_ICON = L.divIcon({
  className: '',
  html: '<span style="display:flex;width:42px;height:42px;align-items:center;justify-content:center;border:4px solid white;border-radius:50%;background:#0758BD;color:white;font-size:22px;box-shadow:0 5px 15px rgba(7,88,189,.35)">♿</span>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const STATUS_OPTIONS = ['Aberto', 'Em Análise', 'Concluído', 'Atrasado'];

function normalizeStatus(status: string) {
  if (status === 'Open') return 'Aberto';
  if (status === 'InProgress') return 'Em Análise';
  if (status === 'Resolved' || status === 'Closed') return 'Concluído';
  return status;
}

function MapCenter({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
    window.setTimeout(() => map.invalidateSize(), 100);
  }, [map, position]);
  return null;
}

export function ProtocolDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useApp();
  const [protocol, setProtocol] = useState<DetailedProtocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditTrail, setAuditTrail] = useState<ProtocolAuditTrail | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [activeTab, setActiveTab] = useState<DetailsTab>('details');
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number]>([-15.7939, -47.8828]);

  const loadProtocol = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setProtocol(await api.getProtocolById(id) as DetailedProtocol | null);
    } catch {
      setProtocol(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProtocol();
  }, [loadProtocol]);

  useEffect(() => {
    if (!protocol) return;
    let active = true;
    getMarkerPosition(protocol.id, protocol.address || '')
      .then((position) => {
        if (active) setMapPosition(position);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [protocol]);

  const loadAuditTrail = useCallback(async () => {
    if (!id || role !== 'admin') {
      setAuditTrail(null);
      setAuditError('');
      setAuditLoading(false);
      return;
    }
    setAuditLoading(true);
    setAuditError('');
    try {
      setAuditTrail(await api.getProtocolAuditTrail(id));
    } catch (error) {
      setAuditTrail(null);
      setAuditError(formatAuditError(error));
    } finally {
      setAuditLoading(false);
    }
  }, [id, role]);

  useEffect(() => {
    if (role !== 'admin') {
      setActiveTab('details');
      return;
    }
    if (activeTab === 'blockchain') void loadAuditTrail();
  }, [activeTab, loadAuditTrail, role]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !protocol || newStatus === normalizeStatus(protocol.status)) return;
    setStatusUpdating(true);
    setStatusError('');
    try {
      const updatedProtocol = await api.updateProtocolStatus(
        id,
        newStatus,
        'Atualização de status pelo painel administrativo',
      );
      setProtocol(updatedProtocol as DetailedProtocol);
      await loadAuditTrail();
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Não foi possível alterar o status.');
      throw error;
    } finally {
      setStatusUpdating(false);
    }
  };

  const copyProtocol = async () => {
    if (!protocol) return;
    await navigator.clipboard.writeText(protocol.id).catch(() => undefined);
    setCopiedProtocol(true);
    window.setTimeout(() => setCopiedProtocol(false), 1600);
  };

  if (loading) {
    return <div className="flex h-full flex-1 items-center justify-center bg-[#F4F8FC] text-slate-600"><Loader2 className="mr-3 animate-spin text-[#0758BD]" size={24} />Carregando detalhes do protocolo...</div>;
  }

  if (!protocol) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-[#F4F8FC] p-8 text-center">
        <AlertCircle size={48} className="mb-4 text-red-600" />
        <h1 className="text-2xl font-black text-[#111827]">Protocolo não encontrado</h1>
        <p className="mt-2 text-slate-600">O protocolo solicitado não existe ou você não tem acesso.</p>
        <Link to={role === 'admin' ? '/admin/solicitacoes' : '/meus-protocolos'} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 font-bold text-white"><ArrowLeft size={18} /> Voltar</Link>
      </div>
    );
  }

  const category = protocol.category || protocol.service || 'Outros';
  const categoryLabel = category.toLocaleLowerCase('pt-BR');
  const backPath = role === 'admin' ? '/admin/solicitacoes' : '/meus-protocolos';
  const title = activeTab === 'blockchain' ? 'Auditoria do protocolo' : `Solicitação de acessibilidade ${categoryLabel}`;
  const timeline = buildTimeline(normalizeStatus(protocol.status), protocol.date);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[#F4F8FC] text-[#111827]">
      <Header
        title={title}
        subtitle={role === 'admin' ? 'Fila de Solicitações / Detalhes' : 'Meus Protocolos / Detalhes'}
        action={role === 'admin' ? <HeaderActions protocol={protocol} onCopy={copyProtocol} onRefresh={loadProtocol} onOpenPublic={() => navigate(`/p/${protocol.id}`)} /> : undefined}
      />
      <div className="w-full px-4 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={copyProtocol} className="inline-flex min-h-10 max-w-full items-center gap-3 rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm" title="Copiar número do protocolo">
            <span className="truncate">Protocolo&nbsp; {protocol.id}</span>
            {copiedProtocol ? <Check size={16} className="shrink-0 text-green-600" /> : <Copy size={16} className="shrink-0" />}
          </button>
          <StatusPill status={protocol.status} className="md:hidden" />
        </div>
        <Link to={backPath} className="mt-4 inline-flex items-center gap-2 font-bold text-[#0758BD] hover:text-blue-800"><ArrowLeft size={18} /> Voltar</Link>
        {role === 'admin' && <ProtocolTabs activeTab={activeTab} onChange={setActiveTab} auditCount={auditTrail?.blocks.length ?? 0} />}
        {role === 'admin' && activeTab === 'blockchain' ? (
          <BlockchainAuditPanel auditTrail={auditTrail} loading={auditLoading} error={auditError} onRefresh={loadAuditTrail} />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <ProtocolSummary protocol={protocol} category={category} />
              <LocationCard protocol={protocol} position={mapPosition} onOpenMap={() => navigate(role === 'admin' ? '/admin/mapa' : '/mapa')} />
              <DescriptionCard description={protocol.description || 'Nenhuma descrição informada.'} />
              <AttachmentsCard images={protocol.image_urls || []} />
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <RequesterCard protocol={protocol} />
              {role === 'admin' && <>
                <StatusControlCard status={protocol.status} loading={statusUpdating} error={statusError} onSave={handleStatusChange} />
                <PrioritySection protocolId={protocol.id} initialPriority={protocol.ai_priority} initialStatus={protocol.ai_status} />
              </>}
              <TimelineCard events={timeline} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderActions({
  protocol, onCopy, onRefresh, onOpenPublic,
}: {
  protocol: DetailedProtocol;
  onCopy: () => void;
  onRefresh: () => void;
  onOpenPublic: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <StatusPill status={protocol.status} />
      <details className="relative">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">
          <MoreHorizontal size={18} /> Mais ações <ChevronDown size={15} />
        </summary>
        <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-lg border border-[#CDD8E7] bg-white p-1.5 shadow-2xl">
          <button type="button" onClick={onCopy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"><Copy size={16} /> Copiar protocolo</button>
          <button type="button" onClick={onOpenPublic} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"><ExternalLink size={16} /> Visualização pública</button>
          <button type="button" onClick={onRefresh} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"><RefreshCw size={16} /> Atualizar dados</button>
        </div>
      </details>
    </div>
  );
}

function ProtocolTabs({ activeTab, onChange, auditCount }: { activeTab: DetailsTab; onChange: (tab: DetailsTab) => void; auditCount: number }) {
  const tabs = [
    { id: 'details' as const, label: 'Detalhes', icon: FileText },
    { id: 'blockchain' as const, label: 'Blockchain', icon: ShieldCheck, count: auditCount },
  ];
  return (
    <nav className="mt-4 flex min-h-12 items-end gap-1 rounded-lg border border-[#CDD8E7] bg-white px-2" aria-label="Seções do protocolo">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        return (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`flex min-h-11 items-center gap-2 border-b-[3px] px-4 text-sm font-bold transition-colors ${selected ? 'border-[#0758BD] text-[#0758BD]' : 'border-transparent text-slate-600 hover:text-[#0758BD]'}`} aria-current={selected ? 'page' : undefined}>
            <Icon size={17} /> {tab.label}
            {'count' in tab && <span className="flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{tab.count}</span>}
          </button>
        );
      })}
    </nav>
  );
}

function ProtocolSummary({ protocol, category }: { protocol: DetailedProtocol; category: string }) {
  return (
    <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#E7F0FF] text-3xl text-[#0758BD]" aria-hidden="true">♿</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-black">{category}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <StatusPill status={protocol.status} />
            <span className="flex items-center gap-2"><Calendar size={16} /> Aberto em: {protocol.date}</span>
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 shrink-0 text-[#0758BD]" size={16} /><span>{protocol.address || 'Endereço não informado'}</span></p>
        </div>
      </div>
    </section>
  );
}

function LocationCard({ protocol, position, onOpenMap }: { protocol: DetailedProtocol; position: [number, number]; onOpenMap: () => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-sm">
      <h2 className="flex items-center gap-2 px-5 py-4 font-black"><span className="flex size-7 items-center justify-center rounded-full bg-[#E7F0FF] text-[#0758BD]"><MapPin size={16} /></span>Localização da ocorrência</h2>
      <div className="grid border-t border-[#E2E8F0] md:grid-cols-[1.35fr_0.8fr]">
        <div className="relative h-56 min-w-0 md:h-64">
          <MapContainer center={position} zoom={15} zoomControl={false} style={{ width: '100%', height: '100%' }}>
            <MapCenter position={position} />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap contributors &copy; CARTO' />
            <Marker position={position} icon={DETAIL_MARKER_ICON} />
          </MapContainer>
        </div>
        <div className="flex flex-col justify-center p-5">
          <p className="flex items-start gap-2 text-sm leading-6 text-slate-700"><MapPin className="mt-1 shrink-0 text-[#0758BD]" size={16} />{protocol.address || 'Endereço não informado'}</p>
          <button type="button" onClick={onOpenMap} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#0758BD] bg-white px-4 text-sm font-bold text-[#0758BD] hover:bg-blue-50"><ExternalLink size={16} /> Abrir no mapa estratégico</button>
        </div>
      </div>
    </section>
  );
}

function DescriptionCard({ description }: { description: string }) {
  return (
    <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-black"><span className="flex size-7 items-center justify-center rounded-full bg-[#E7F0FF] text-[#0758BD]"><FileText size={16} /></span>Descrição relatada</h2>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{Array.from(description).length} caracteres</span>
      </div>
      <p className="mt-4 leading-7 text-slate-700">{description}</p>
    </section>
  );
}

function AttachmentsCard({ images }: { images: string[] }) {
  return (
    <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-black"><span className="flex size-7 items-center justify-center rounded-full bg-[#E7F0FF] text-[#0758BD]"><Paperclip size={16} /></span>Anexos</h2>
      {images.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhum anexo enviado</p> : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="block aspect-video overflow-hidden rounded-lg border border-[#CDD8E7]"><img src={url} alt={`Anexo ${index + 1}`} className="size-full object-cover" /></a>)}
        </div>
      )}
    </section>
  );
}

function RequesterCard({ protocol }: { protocol: DetailedProtocol }) {
  const requester = protocol.requester || 'Cidadão';
  const initial = requester.trim().charAt(0).toUpperCase() || 'C';
  return (
    <section className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-black"><span className="flex size-7 items-center justify-center rounded-full bg-[#E7F0FF] text-[#0758BD]"><User size={16} /></span>Solicitante</h2>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 font-black text-slate-700">{initial}</div>
        <div><p className="font-black">{requester}</p><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-green-700">Cidadão verificado <CheckCircle2 size={14} /></p></div>
      </div>
      <p className="mt-3 flex items-center gap-2 rounded-lg border border-[#A9C9F5] bg-[#F1F7FF] px-3 py-2 text-xs text-slate-600"><LockKeyhole className="shrink-0 text-[#0758BD]" size={15} />Contato preservado por regras de privacidade da LGPD.</p>
    </section>
  );
}

function StatusControlCard({ status, loading, error, onSave }: { status: string; loading: boolean; error: string; onSave: (status: string) => Promise<void> | void }) {
  const normalized = normalizeStatus(status);
  const [pendingStatus, setPendingStatus] = useState(normalized);
  useEffect(() => setPendingStatus(normalized), [normalized]);
  return (
    <section className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-black"><span className="flex size-7 items-center justify-center rounded-full bg-[#E7F0FF] text-[#0758BD]"><Settings size={16} /></span>Gestão do protocolo</h2>
      <label className="mt-3 block text-xs font-semibold text-slate-600" htmlFor="protocol-status">Status do protocolo</label>
      <select id="protocol-status" value={pendingStatus} disabled={loading} onChange={(event) => setPendingStatus(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#0758BD]">
        {STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}
      </select>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Cada alteração gera um novo bloco de auditoria.</p>
        <button type="button" disabled={loading || pendingStatus === normalized} onClick={() => void onSave(pendingStatus)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-400">
          {loading && <Loader2 size={15} className="animate-spin" />}{loading ? 'Salvando...' : 'Salvar alteração'}
        </button>
      </div>
      {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
    </section>
  );
}

function TimelineCard({ events }: { events: Array<{ title: string; date: string; complete: boolean }> }) {
  return (
    <section className="rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-black"><span className="flex size-7 items-center justify-center rounded-full bg-[#E7F0FF] text-[#0758BD]"><Calendar size={16} /></span>Andamento</h2>
      <div className="relative mt-4 space-y-5">
        <span className="absolute bottom-4 left-[7px] top-2 w-px bg-[#A9C9F5]" />
        {events.map((event) => (
          <div key={event.title} className={`relative flex gap-3 ${event.complete ? '' : 'text-slate-400'}`}>
            <span className={`mt-1 size-4 shrink-0 rounded-full border-[3px] border-white ring-2 ${event.complete ? 'bg-blue-600 ring-blue-600' : 'bg-white ring-slate-300'}`} />
            <div><p className="text-sm font-black">{event.title}</p><p className="mt-0.5 text-xs text-slate-500">{event.date}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildTimeline(status: string, createdAt: string) {
  const analysis = status !== 'Aberto';
  const completed = status === 'Concluído';
  return [
    { title: 'Criado', date: createdAt, complete: true },
    { title: 'Em análise', date: analysis ? 'Etapa atualizada' : 'Pendente', complete: analysis },
    { title: 'Concluído', date: completed ? 'Solicitação resolvida' : 'Pendente', complete: completed },
  ];
}

function StatusPill({ status, className = '' }: { status: string; className?: string }) {
  const normalized = normalizeStatus(status);
  const config: Record<string, string> = {
    Aberto: 'border-blue-300 bg-blue-50 text-blue-700',
    'Em Análise': 'border-amber-300 bg-amber-50 text-amber-800',
    Concluído: 'border-green-300 bg-green-50 text-green-700',
    Atrasado: 'border-red-300 bg-red-50 text-red-700',
  };
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${config[normalized] || 'border-slate-300 bg-slate-50 text-slate-600'} ${className}`}><span className="size-2 rounded-full bg-current" /> {normalized}</span>;
}

function formatAuditError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Invalid action')) return 'A auditoria blockchain ainda não foi publicada no Supabase.';
  if (message.includes('protocol_audit_chain')) return 'A tabela de auditoria blockchain ainda não existe no Supabase.';
  return message || 'Não foi possível carregar a auditoria.';
}

function auditEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    PROTOCOL_CREATED: 'Protocolo criado',
    STATUS_CHANGED: 'Status alterado',
    PRIORITY_CHANGED: 'Prioridade alterada',
    AI_PRIORITY_CLASSIFIED: 'Prioridade definida por IA',
  };
  return labels[eventType] ?? eventType;
}

function shortHash(hash?: string | null) {
  if (!hash) return 'Genesis';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function AuditCopyButton({ value }: { value?: string | null }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return <button type="button" onClick={copy} disabled={!value} className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#CDD8E7] bg-white text-slate-600 hover:text-[#0758BD]" title="Copiar hash">{copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}</button>;
}

function BlockchainAuditPanel({ auditTrail, loading, error, onRefresh }: { auditTrail: ProtocolAuditTrail | null; loading: boolean; error: string; onRefresh: () => void }) {
  const blocks = auditTrail?.blocks ?? [];
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const orderedBlocks = useMemo(() => [...blocks].sort((left, right) => Number(right.block_index) - Number(left.block_index)), [blocks]);
  const totalPages = Math.max(1, Math.ceil(orderedBlocks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleBlocks = orderedBlocks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const latestBlock = orderedBlocks[0];
  useEffect(() => setPage(1), [blocks.length]);

  return (
    <div className="mt-5">
      <div className="flex items-start justify-between gap-3 rounded-lg border border-[#A9C9F5] bg-[#F1F7FF] px-4 py-3 text-sm text-[#0758BD]">
        <p className="flex items-start gap-2"><Info className="mt-0.5 shrink-0" size={18} />O histórico abaixo registra alterações críticas do protocolo e permite verificar sua integridade.</p>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.75fr)]">
        <section className="overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-black"><ClipboardList size={20} className="text-[#0758BD]" /> Histórico de auditoria</h2>
            <div className="flex items-center gap-3">
              {auditTrail && <span className={`flex items-center gap-2 text-sm font-bold ${auditTrail.valid ? 'text-green-700' : 'text-red-700'}`}><ShieldCheck size={18} /> {auditTrail.valid ? 'Integridade verificada' : 'Falha de integridade'}</span>}
              <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar</button>
            </div>
          </div>
          {loading && <div className="flex min-h-72 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-3 animate-spin text-[#0758BD]" size={22} />Verificando trilha de integridade...</div>}
          {!loading && error && <div className="m-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 shrink-0" size={18} /><span>{error}</span></div>}
          {!loading && !error && auditTrail && <>
            {visibleBlocks.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center text-slate-500"><Box size={44} className="mb-3 text-[#87A9D8]" />Nenhum bloco registrado para este protocolo.</div>
            ) : (
              <div className="p-5">
                <div className="relative space-y-5">
                  <span className="absolute bottom-8 left-[19px] top-8 w-px bg-slate-400" />
                  {visibleBlocks.map((block) => (
                    <div key={block.id} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-4">
                      <span className={`z-10 flex size-10 items-center justify-center rounded-full border-2 bg-white ${block.is_valid ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700'}`}><Box size={18} /></span>
                      <article className="rounded-lg border border-[#CDD8E7] bg-[#FBFCFE] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                          <div className="flex items-center gap-3"><h3 className="text-lg font-black">Bloco #{block.block_index}</h3><span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${block.is_valid ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>{block.is_valid ? 'Válido' : 'Inválido'}</span></div>
                          <span className="flex items-center gap-2 text-sm text-slate-500"><Calendar size={15} /> {new Date(block.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
                          <dt className="flex items-center gap-2 font-semibold text-slate-500"><Tag size={16} /> Evento</dt><dd className="font-semibold text-slate-700">{auditEventLabel(block.event_type)}</dd>
                          <dt className="flex items-center gap-2 font-semibold text-slate-500"><User size={16} /> Ator</dt><dd className="text-slate-700">{block.actor_role || 'Sistema'}</dd>
                          <dt className="flex items-center gap-2 font-semibold text-slate-500"><ArrowRight size={16} /> Mudança</dt><dd className="text-slate-700">{block.previous_status || 'Início'} → {block.new_status || 'Sem alteração de status'}</dd>
                          <dt className="flex items-center gap-2 font-semibold text-slate-500"><Hash size={16} /> Hash</dt><dd className="flex min-w-0 items-center gap-2 font-mono text-xs text-slate-700"><span className="truncate">{shortHash(block.block_hash)}</span><AuditCopyButton value={block.block_hash} /></dd>
                          <dt className="flex items-center gap-2 font-semibold text-slate-500"><Link2 size={16} /> Hash anterior</dt><dd className="font-mono text-xs text-slate-700">{shortHash(block.previous_block_hash)}</dd>
                        </dl>
                      </article>
                    </div>
                  ))}
                  <div className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-4"><span className="z-10 flex size-10 items-center justify-center rounded-full border border-dashed border-slate-500 bg-white" /><p className="self-center text-sm font-semibold text-slate-500">Origem da cadeia</p></div>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-5 py-3">
              <span className="text-xs text-slate-500">Página {currentPage} de {totalPages} — {orderedBlocks.length} registro(s)</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#CDD8E7] px-3 text-sm font-bold text-slate-700 disabled:text-slate-300"><ChevronLeft size={16} /> Anterior</button>
                <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#CDD8E7] px-3 text-sm font-bold text-slate-700 disabled:text-slate-300">Próxima <ChevronRight size={16} /></button>
              </div>
            </div>
          </>}
        </section>
        <aside className="space-y-4">
          <section className={`rounded-lg border p-5 shadow-sm ${auditTrail?.valid === false ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
            <h2 className="flex items-center gap-2 font-black"><ShieldCheck size={19} className={auditTrail?.valid === false ? 'text-red-700' : 'text-green-700'} /> Integridade</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className={`flex size-16 shrink-0 items-center justify-center rounded-full text-white ${auditTrail?.valid === false ? 'bg-red-600' : 'bg-green-600'}`}>{loading ? <Loader2 size={28} className="animate-spin" /> : auditTrail?.valid === false ? <AlertCircle size={31} /> : <Check size={34} strokeWidth={3} />}</span>
              <div><p className={`text-2xl font-black ${auditTrail?.valid === false ? 'text-red-700' : 'text-green-700'}`}>{auditTrail?.valid === false ? 'Inconsistente' : 'Verificada'}</p><p className="mt-1 text-sm text-slate-600">{auditTrail?.valid === false ? 'A cadeia precisa ser revisada.' : 'Nenhuma inconsistência detectada.'}</p></div>
            </div>
          </section>
          <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-black"><Settings size={18} className="text-slate-600" /> Resumo da cadeia</h2>
            <p className="mt-4 text-lg font-black text-[#0758BD]">{blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'}</p>
            <p className="mt-4 text-xs font-semibold text-slate-500">Último hash</p>
            <div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-sm text-slate-700">{shortHash(latestBlock?.block_hash)}</code><AuditCopyButton value={latestBlock?.block_hash} /></div>
            <p className="mt-4 text-xs font-semibold text-slate-500">Bloco inicial</p><p className="mt-1 font-mono text-sm text-slate-700">Genesis</p>
          </section>
          <section className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-black"><Info size={18} className="text-slate-600" /> Como interpretar</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <p className="flex items-start gap-3"><Box className="shrink-0 text-[#0758BD]" size={18} /> Cada alteração gera um bloco.</p>
              <p className="flex items-start gap-3"><Hash className="shrink-0 text-[#0758BD]" size={18} /> O hash identifica o conteúdo registrado.</p>
              <p className="flex items-start gap-3"><ShieldCheck className="shrink-0 text-[#0758BD]" size={18} /> Alterações quebrariam a sequência de verificação.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
