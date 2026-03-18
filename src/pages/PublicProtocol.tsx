import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, FileText, CheckCircle, AlertCircle, Shield, Share2, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../services/supabase';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function StatusLabel(status: string) {
    const map: any = { Open: 'Aberto', InProgress: 'Em Análise', Resolved: 'Concluído', Closed: 'Encerrado', Aberto: 'Aberto', 'Em Análise': 'Em Análise', Concluído: 'Concluído', Atrasado: 'Atrasado' };
    return map[status] || status;
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'Open': 'bg-blue-500/15 text-blue-400 border-blue-500/25', 'Aberto': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
        'InProgress': 'bg-amber-500/15 text-amber-400 border-amber-500/25', 'Em Análise': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
        'Resolved': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', 'Concluído': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
        'Closed': 'bg-slate-500/15 text-slate-400 border-slate-500/25', 'Atrasado': 'bg-red-500/15 text-red-400 border-red-500/25',
    };
    const dots: any = {
        'Open': 'bg-blue-400', 'Aberto': 'bg-blue-400', 'InProgress': 'bg-amber-400', 'Em Análise': 'bg-amber-400',
        'Resolved': 'bg-emerald-400', 'Concluído': 'bg-emerald-400', 'Closed': 'bg-slate-400', 'Atrasado': 'bg-red-400',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${styles[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
            <span className={`size-2 rounded-full ${dots[status] || 'bg-slate-400'}`} />
            {StatusLabel(status)}
        </span>
    );
}

export function PublicProtocol() {
    const { id } = useParams();
    const [protocol, setProtocol] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) return;
        supabase
            .from('protocols')
            .select('*')
            .eq('id', id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error || !data) {
                    setNotFound(true);
                } else {
                    // Map DB fields to display fields
                    const p = data as any;
                    setProtocol({
                        ...p,
                        service: p.service || `Acessibilidade ${p.category}`,
                        date: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—',
                        address: p.address || 'Localização não informada',
                        status: p.status || 'Aberto',
                    });
                }
                setLoading(false);
            });
    }, [id]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const events = protocol ? [
        { type: 'Criado', date: protocol.date, desc: 'Protocolo aberto pelo cidadão', done: true },
        { type: 'Em Análise', date: protocol.date, desc: 'Solicitação em análise técnica', done: protocol.status !== 'Aberto' && protocol.status !== 'Open' },
        { type: 'Finalizado', date: '—', desc: 'Conclusão do serviço', done: protocol.status === 'Concluído' || protocol.status === 'Resolved' },
    ] : [];

    return (
        <div className="min-h-screen bg-[#080d12] text-white font-sans">
            {/* Navbar */}
            <nav className="border-b border-white/5 bg-[#080d12]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Shield size={14} className="text-white" />
                        </div>
                        <span className="font-black text-sm text-white group-hover:text-blue-400 transition-colors">Cidadão Informa</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopyLink}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
                            {copied ? <><Check size={14} className="text-emerald-400" /> Copiado!</> : <><Share2 size={14} /> Compartilhar</>}
                        </button>
                        <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">
                            Entrar
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-32 gap-3">
                        <div className="size-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                        <p className="text-slate-500 text-sm">Carregando protocolo...</p>
                    </div>
                )}

                {notFound && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                        <AlertCircle size={48} className="text-red-500 opacity-80" />
                        <h2 className="text-2xl font-black text-white">Protocolo não encontrado</h2>
                        <p className="text-slate-500">Este protocolo não existe ou não está disponível publicamente.</p>
                        <Link to="/" className="mt-2 text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors">
                            Ir para a página inicial →
                        </Link>
                    </div>
                )}

                {!loading && !notFound && protocol && (
                    <>
                        {/* Banner */}
                        <div className="bg-white/5 border border-white/8 rounded-2xl p-6 mb-6 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Protocolo Público</p>
                                <h1 className="text-2xl font-black text-white mb-3">{protocol.service || `Acessibilidade ${protocol.category}`}</h1>
                                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5"><Calendar size={13} />{protocol.date}</span>
                                    <span className="flex items-center gap-1.5"><MapPin size={13} />{protocol.address || 'Localização não informada'}</span>
                                    <span className="flex items-center gap-1.5 font-mono"><FileText size={13} />#{String(protocol.id || '').split('-')[0]}</span>
                                </div>
                            </div>
                            <StatusBadge status={protocol.status} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left column */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                {/* Map */}
                                <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden h-64 relative z-0">
                                    <MapContainer center={[-23.5505, -46.6333]} zoom={15}
                                        style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                            attribution='© OpenStreetMap contributors © CARTO'
                                        />
                                        <Marker position={[-23.5505, -46.6333]}>
                                            <Popup>{protocol.address || 'Local do incidente'}</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>

                                {/* Description */}
                                <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
                                    <h3 className="font-black text-white flex items-center gap-2 mb-3">
                                        <FileText size={16} className="text-blue-400" /> Descrição
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {(protocol as any).description ||
                                            'O cidadão relatou um problema de acessibilidade que afeta a mobilidade urbana local. O problema foi registrado e está em processo de análise e atendimento pela equipe de zeladoria.'}
                                    </p>
                                </div>

                                {/* Photos */}
                                {protocol.image_urls?.length > 0 && (
                                    <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
                                        <h3 className="font-black text-white flex items-center gap-2 mb-3">
                                            <ImageIcon size={16} className="text-blue-400" /> Fotos Anexadas
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {protocol.image_urls.map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                    className="block aspect-video rounded-xl overflow-hidden border border-white/8 hover:border-blue-500/40 transition-colors bg-white/5 group relative">
                                                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right column */}
                            <div className="flex flex-col gap-6">
                                {/* Timeline */}
                                <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
                                    <h3 className="font-black text-white flex items-center gap-2 mb-5">
                                        <Clock size={16} className="text-blue-400" /> Progresso
                                    </h3>
                                    <div className="flex flex-col gap-5 relative">
                                        <div className="absolute left-[11px] top-2 bottom-6 w-0.5 bg-white/5" />
                                        {events.map((evt, i) => (
                                            <div key={i} className={`flex gap-3 relative ${evt.done ? 'opacity-100' : 'opacity-40'}`}>
                                                <div className={`size-6 rounded-full flex items-center justify-center shrink-0 border-2 z-10 mt-0.5 ${evt.done ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10'}`}>
                                                    {evt.done && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${evt.done ? 'text-white' : 'text-slate-500'}`}>{evt.type}</p>
                                                    <p className="text-[11px] text-slate-600 mb-0.5">{evt.date}</p>
                                                    <p className="text-xs text-slate-500">{evt.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Info card */}
                                <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
                                    <h3 className="font-black text-white text-sm mb-4">Informações</h3>
                                    <div className="space-y-3 text-sm">
                                        {[
                                            { label: 'Categoria', value: protocol.category || '—' },
                                            { label: 'Status', value: StatusLabel(protocol.status) },
                                            { label: 'Protocolo', value: `#${String(protocol.id || '').split('-')[0]}` },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                                <span className="text-slate-500 text-xs uppercase tracking-wide font-medium">{label}</span>
                                                <span className="text-white font-semibold text-xs">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Privacy note */}
                                <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4">
                                    <div className="flex gap-2">
                                        <Shield size={14} className="text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Dados pessoais do solicitante são protegidos pela <strong className="text-slate-400">LGPD</strong>. Este link é somente leitura.
                                        </p>
                                    </div>
                                </div>

                                {/* CTA */}
                                <Link to="/login"
                                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5">
                                    Acompanhar no Portal
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 mt-16 py-6">
                <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-600">
                    © {new Date().getFullYear()} Cidadão Informa — Portal de Acessibilidade Urbana
                </div>
            </footer>
        </div>
    );
}
