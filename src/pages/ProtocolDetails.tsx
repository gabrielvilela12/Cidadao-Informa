import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { ArrowLeft, Clock, MapPin, User, FileText, CheckCircle, AlertCircle, Calendar, Image as ImageIcon, ShieldCheck, Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBadge } from './CitizenDashboard';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { PrioritySection } from '../components/admin/PrioritySection';
import { api, ProtocolAuditTrail } from '../services/api';
import { useApp } from '../context/AppContext';

export function ProtocolDetails() {
    const { id } = useParams();
    const { role } = useApp();
    const [protocol, setProtocol] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [auditTrail, setAuditTrail] = useState<ProtocolAuditTrail | null>(null);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditError, setAuditError] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusError, setStatusError] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'blockchain'>('details');

    useEffect(() => {
        if (id) {
            setLoading(true);
            api.getProtocolById(id)
                .then(data => setProtocol(data))
                .catch(() => setProtocol(null))
                .finally(() => setLoading(false));
        }
    }, [id]);

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

        if (activeTab === 'blockchain') {
            loadAuditTrail();
        }
    }, [activeTab, loadAuditTrail, role]);

    const handleStatusChange = async (newStatus: string) => {
        if (!id || !protocol || newStatus === protocol.status) return;

        setStatusUpdating(true);
        setStatusError('');

        try {
            const updatedProtocol = await api.updateProtocolStatus(
                id,
                newStatus,
                'Atualizacao de status pelo painel administrativo'
            );
            setProtocol(updatedProtocol);
            await loadAuditTrail();
        } catch (error) {
            setStatusError(error instanceof Error ? error.message : 'Nao foi possivel alterar o status.');
        } finally {
            setStatusUpdating(false);
        }
    };

    if (loading) {
        return <div className="flex-1 flex flex-col h-full bg-[#101922] text-white p-8 items-center justify-center">Carregando detalhes do protocolo...</div>;
    }

    if (!protocol) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#101922] text-white p-8 items-center justify-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Protocolo não encontrado</h2>
                <p className="text-slate-400 mb-6">O protocolo solicitado não existe ou você não tem acesso.</p>
                <Link to="/" className="text-blue-500 hover:text-blue-400 font-bold flex items-center gap-2">
                    <ArrowLeft size={20} />
                    Voltar para o Dashboard
                </Link>
            </div>
        );
    }

    // Mock timeline based on status
    const events = [
        { type: 'Criado', date: protocol.date, desc: 'Protocolo aberto pelo cidadão', completed: true },
        { type: 'Em Análise', date: protocol.date, desc: 'Solicitação em análise técnica', completed: protocol.status !== 'Aberto' },
        { type: 'Finalizado', date: '---', desc: 'Conclusão do serviço', completed: protocol.status === 'Concluído' }
    ];

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922]">
            <Header title={`Protocolo ${protocol.id}`} subtitle="Detalhes da Solicitação" />

            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                <Link to={-1 as any} className="text-slate-400 hover:text-white flex items-center gap-2 w-fit mb-2 transition-colors">
                    <ArrowLeft size={18} />
                    Voltar
                </Link>

                {role === 'admin' && (
                    <ProtocolTabs
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        auditCount={auditTrail?.blocks.length ?? 0}
                    />
                )}

                {role === 'admin' && activeTab === 'blockchain' ? (
                    <BlockchainAuditPanel
                        auditTrail={auditTrail}
                        loading={auditLoading}
                        error={auditError}
                        onRefresh={loadAuditTrail}
                    />
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Header Info Banner */}
                        <div className="bg-[#1a242f] border border-[#283039] rounded-xl p-6 flex flex-wrap justify-between items-start gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{protocol.service || `Acessibilidade ${protocol.category}`}</h2>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#9dabb9]">
                                    <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar size={16} /> Aberto em: {protocol.date}</span>
                                    <span className="flex items-center gap-1.5 min-w-0"><MapPin size={16} className="shrink-0" /> <span className="truncate">{protocol.address || 'Av. Central, São Paulo'}</span></span>
                                </div>
                            </div>
                            <StatusBadge status={protocol.status} />
                        </div>

                        {/* Map Area */}
                        <div className="bg-[#1a242f] border border-[#283039] rounded-xl overflow-hidden h-[300px] relative z-0">
                            <MapContainer
                                center={[-23.5505, -46.6333]}
                                zoom={15}
                                style={{ height: '100%', width: '100%', zIndex: 0 }}
                                zoomControl={false}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />
                                <Marker position={[-23.5505, -46.6333]}>
                                    <Popup>Local do Incidente apontado pelo Cidadão</Popup>
                                </Marker>
                            </MapContainer>
                        </div>

                        {/* Description */}
                        <div className="bg-[#1a242f] border border-[#283039] rounded-xl p-6">
                            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-blue-500" />
                                Descrição Relatada
                            </h3>
                            <p className="text-slate-300 leading-relaxed">
                                {(protocol as any).description || 'O cidadão relatou um problema de sinalização e danos na via que afeta a mobilidade e o tráfego local. O problema foi identificado em vistoria prévia e requer atenção imediata para restauração da rota acessível.'}
                            </p>
                        </div>

                        {/* Photos */}
                        {protocol.image_urls && protocol.image_urls.length > 0 && (
                            <div className="bg-[#1a242f] border border-[#283039] rounded-xl p-6">
                                <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                    <ImageIcon size={20} className="text-blue-500" />
                                    Fotos Anexadas
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {protocol.image_urls.map((url: string, index: number) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-video rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors bg-[#111418]">
                                            <img src={url} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-1 flex flex-col gap-6">

                        {/* Requester Info */}
                        <div className="bg-[#1a242f] border border-[#283039] rounded-xl p-6">
                            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                <User size={20} className="text-blue-500" />
                                Solicitante
                            </h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#3b4754] flex items-center justify-center text-lg font-bold text-white shadow-inner">
                                    {('requester' in protocol ? protocol.requester : 'Carlos').split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold">{('requester' in protocol ? protocol.requester : 'Carlos')}</span>
                                    <span className="text-sm text-slate-400">Cidadão Verificado</span>
                                </div>
                            </div>
                            <div className="text-sm text-slate-400 italic">
                                Contato preservado por regras de privacidade da LGPD.
                            </div>
                        </div>

                        {role === 'admin' && (
                            <>
                                <StatusControlCard
                                    status={protocol.status}
                                    loading={statusUpdating}
                                    error={statusError}
                                    onChange={handleStatusChange}
                                />

                                <PrioritySection
                                    protocolId={protocol.id}
                                    initialPriority={protocol.ai_priority}
                                    initialStatus={protocol.ai_status}
                                />

                            </>
                        )}

                        {/* Timeline */}
                        <div className="bg-[#1a242f] border border-[#283039] rounded-xl p-6">
                            <h3 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
                                <Clock size={20} className="text-blue-500" />
                                Andamento
                            </h3>
                            <div className="flex flex-col gap-6 relative">
                                {/* Connecting Line */}
                                <div className="absolute left-3 top-2 bottom-6 w-0.5 bg-[#283039] z-0"></div>

                                {events.map((evt, idx) => (
                                    <div key={idx} className={`flex gap-4 relative z-10 ${evt.completed ? 'opacity-100' : 'opacity-50'}`}>
                                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-4 border-[#1a242f] ${evt.completed ? 'bg-blue-500 text-white' : 'bg-[#283039] text-transparent'}`}>
                                            {evt.completed && <CheckCircle size={10} strokeWidth={4} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${evt.completed ? 'text-white' : 'text-slate-500'}`}>{evt.type}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{evt.date}</p>
                                            <p className="text-sm text-slate-400 mt-1">{evt.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
                )}

            </div>
        </div>
    );
}

function shortHash(hash?: string | null) {
    if (!hash) return 'Genesis';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatAuditError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Invalid action')) {
        return 'Auditoria blockchain ainda nao publicada no Supabase. Aplique a migration e redeploy da Edge Function app-protocols.';
    }

    if (message.includes('protocol_audit_chain')) {
        return 'Tabela de auditoria blockchain ainda nao existe no Supabase. Aplique a migration protocol_audit_chain.';
    }

    return message || 'Nao foi possivel carregar a auditoria.';
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

function StatusControlCard({
    status,
    loading,
    error,
    onChange,
}: {
    status: string;
    loading: boolean;
    error: string;
    onChange: (status: string) => void;
}) {
    const statuses = ['Aberto', 'Em Análise', 'Concluído', 'Atrasado'];

    return (
        <div className="bg-[#1a242f] border border-[#283039] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-blue-500" />
                Status do Protocolo
            </h3>
            <select
                value={status}
                disabled={loading}
                onChange={(event) => onChange(event.target.value)}
                className="w-full bg-[#111820] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60"
            >
                {statuses.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
            <p className="text-xs text-slate-500 mt-3">
                Cada alteracao gera um novo bloco de auditoria.
            </p>
            {loading && (
                <p className="text-xs text-blue-300 mt-3">Registrando bloco de integridade...</p>
            )}
            {error && (
                <p className="text-xs text-red-300 mt-3">{error}</p>
            )}
        </div>
    );
}

function ProtocolTabs({
    activeTab,
    onChange,
    auditCount,
}: {
    activeTab: 'details' | 'blockchain';
    onChange: (tab: 'details' | 'blockchain') => void;
    auditCount: number;
}) {
    const tabs = [
        { id: 'details' as const, label: 'Detalhes', icon: FileText },
        { id: 'blockchain' as const, label: 'Blockchain', icon: ShieldCheck, count: auditCount },
    ];

    return (
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={`h-10 px-4 rounded-lg text-sm font-bold border transition-colors flex items-center gap-2 ${selected
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-[#1a242f] text-slate-400 border-[#283039] hover:text-white hover:border-slate-600'
                            }`}
                    >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                        {typeof tab.count === 'number' && (
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${selected ? 'bg-white/15 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

function BlockchainAuditPanel({
    auditTrail,
    loading,
    error,
    onRefresh,
}: {
    auditTrail: ProtocolAuditTrail | null;
    loading: boolean;
    error: string;
    onRefresh: () => void;
}) {
    const blocks = auditTrail?.blocks ?? [];
    const pageSize = 5;
    const [page, setPage] = useState(1);
    const orderedBlocks = useMemo(
        () => [...blocks].sort((left, right) => Number(right.block_index) - Number(left.block_index)),
        [blocks]
    );
    const totalPages = Math.max(1, Math.ceil(orderedBlocks.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const visibleBlocks = orderedBlocks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        setPage(1);
    }, [blocks.length]);

    return (
        <div className="bg-[#1a242f] border border-[#283039] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#283039] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-white text-lg font-bold flex items-center gap-2">
                        <ShieldCheck size={20} className="text-emerald-400" />
                        Auditoria Blockchain
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Historico imutavel dos eventos criticos deste protocolo.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-60"
                >
                    Atualizar
                </button>
            </div>

            {loading && (
                <div className="px-5 py-12 text-center text-sm text-slate-400">
                    Verificando trilha de integridade...
                </div>
            )}

            {!loading && error && (
                <div className="m-5 flex gap-3 text-sm text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {!loading && !error && auditTrail && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5 border-b border-[#283039]">
                        <div className={`rounded-lg border p-4 ${auditTrail.valid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <p className={`text-xs font-bold uppercase ${auditTrail.valid ? 'text-emerald-300' : 'text-red-300'}`}>
                                Integridade
                            </p>
                            <p className="text-white font-bold mt-1">
                                {auditTrail.valid ? 'Verificada' : 'Falha'}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-[#111820] p-4">
                            <p className="text-xs font-bold uppercase text-slate-500">Blocos</p>
                            <p className="text-white font-bold mt-1">{blocks.length}</p>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-[#111820] p-4 min-w-0">
                            <p className="text-xs font-bold uppercase text-slate-500">Ultimo hash</p>
                            <p className="text-white font-mono text-sm mt-1 truncate">
                                {shortHash(orderedBlocks[0]?.block_hash)}
                            </p>
                        </div>
                    </div>

                    {orderedBlocks.length === 0 ? (
                        <div className="px-5 py-12 text-center text-slate-400">
                            Nenhum bloco registrado para este protocolo.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#283039]">
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bloco</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Evento</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ator</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hash</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Anterior</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#283039]">
                                    {visibleBlocks.map((block) => (
                                        <tr key={block.id} className="hover:bg-white/5">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash size={14} className="text-blue-400" />
                                                    <span className="font-bold text-white">#{block.block_index}</span>
                                                </div>
                                                <span className={`text-[11px] font-bold ${block.is_valid ? 'text-emerald-300' : 'text-red-300'}`}>
                                                    {block.is_valid ? 'Valido' : 'Invalido'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-white font-semibold">
                                                {auditEventLabel(block.event_type)}
                                            </td>
                                            <td className="px-5 py-4 text-slate-400">
                                                {block.actor_role}
                                            </td>
                                            <td className="px-5 py-4 text-slate-400">
                                                {block.previous_status || '-'} {'->'} {block.new_status || '-'}
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                                                {shortHash(block.block_hash)}
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                {shortHash(block.previous_block_hash)}
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                                                {new Date(block.created_at).toLocaleString('pt-BR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-5 py-4 border-t border-[#283039] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                            Pagina {currentPage} de {totalPages} - {orderedBlocks.length} registro(s)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((value) => Math.max(1, value - 1))}
                                disabled={currentPage === 1}
                                className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <ChevronLeft size={15} />
                                Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                                disabled={currentPage === totalPages}
                                className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                Proxima
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
