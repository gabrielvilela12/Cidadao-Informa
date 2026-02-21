import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { ArrowLeft, Clock, MapPin, User, FileText, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusBadge } from './CitizenDashboard';
import { useProtocols } from '../hooks/useProtocols';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export function ProtocolDetails() {
    const { id } = useParams();
    const { fetchProtocolById } = useProtocols();
    const [protocol, setProtocol] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchProtocolById(id).then(data => {
                setProtocol(data);
                setLoading(false);
            });
        }
    }, [id, fetchProtocolById]);

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

            <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                <Link to={-1 as any} className="text-slate-400 hover:text-white flex items-center gap-2 w-fit mb-2 transition-colors">
                    <ArrowLeft size={18} />
                    Voltar
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Header Info Banner */}
                        <div className="bg-[#1a242f] border border-[#283039] rounded-xl p-6 flex flex-wrap justify-between items-start gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{protocol.service || `Acessibilidade ${protocol.category}`}</h2>
                                <div className="flex items-center gap-4 text-sm text-[#9dabb9]">
                                    <span className="flex items-center gap-1.5"><Calendar size={16} /> Aberto em: {protocol.date}</span>
                                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {protocol.address || 'Av. Central, São Paulo'}</span>
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
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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

            </div>
        </div>
    );
}
