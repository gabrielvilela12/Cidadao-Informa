import { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { useProtocols } from '../hooks/useProtocols';
import { Search, Filter, Eye, Download, List as ListIcon, ChevronDown, MessageCircle } from 'lucide-react';
import { StatusBadge } from './CitizenDashboard';
import { Link } from 'react-router-dom';
import { exportToExcel } from '../utils/exportUtils';

export function AdminRequestsQueue() {
    const { protocols, loading } = useProtocols('admin');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const openWhatsApp = (phone?: string) => {
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const filteredProtocols = useMemo(() => {
        return protocols.filter(p => {
            const matchesSearch = searchTerm === '' ||
                p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.address?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter ||
                (statusFilter === 'Closed' && p.status === 'Atrasado');
            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [protocols, searchTerm, statusFilter, categoryFilter]);

    const inputClass = "bg-white/5 border border-white/8 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 placeholder-slate-600 transition-all hover:border-white/15";
    const selectClass = `${inputClass} appearance-none cursor-pointer pr-8`;

    const catColors: any = {
        'Física': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'Visual': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Auditiva': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'Outros': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    const catDots: any = { 'Física': 'bg-orange-400', 'Visual': 'bg-blue-400', 'Auditiva': 'bg-purple-400', 'Outros': 'bg-slate-400' };

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#080d12]">
            <Header title="Fila de Solicitações" subtitle="Gerenciamento de chamados e triagem" />

            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <input type="text" placeholder="Pesquisar protocolo, solicitante ou endereço..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className={`${inputClass} pl-9 w-full`} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <div className="relative">
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className={`${selectClass} pl-4 min-w-[120px]`} style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <option value="all">Status</option>
                                <option value="Open">Aberto</option>
                                <option value="InProgress">Em Análise</option>
                                <option value="Resolved">Concluído</option>
                                <option value="Atrasado">Atrasado</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={13} />
                        </div>
                        <div className="relative">
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                                className={`${selectClass} pl-4 min-w-[130px]`} style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <option value="all">Categoria</option>
                                <option value="Física">Física</option>
                                <option value="Visual">Visual</option>
                                <option value="Auditiva">Auditiva</option>
                                <option value="Outros">Outros</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={13} />
                        </div>
                        <button onClick={() => exportToExcel(filteredProtocols, 'solicitacoes.xlsx')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 whitespace-nowrap">
                            <Download size={15} /> Exportar
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-black text-white flex items-center gap-2">
                            <ListIcon size={18} className="text-blue-400" /> Todas as Solicitações
                        </h3>
                        <span className="text-xs font-bold bg-white/5 border border-white/8 px-2.5 py-1 rounded-full text-slate-400">
                            {filteredProtocols.length} registros
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Solicitante', 'Categoria', 'Data', 'SLA', 'Status', 'Ações'].map(h => (
                                        <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide ${h === 'Ações' ? 'text-right' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Carregando...</td></tr>}
                                {!loading && filteredProtocols.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-xs font-black text-blue-400">
                                                    {p.requester?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{p.requester}</p>
                                                    <p className="text-slate-600 text-xs">Cidadão Verificado</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${catColors[p.category] || catColors['Outros']}`}>
                                                <span className={`size-1.5 rounded-full ${catDots[p.category] || catDots['Outros']}`} />
                                                {p.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500 text-xs">{p.date}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-xs font-medium ${p.status === 'Atrasado' ? 'text-red-400' : p.status === 'Resolved' || p.status === 'Concluído' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {p.status === 'Atrasado' ? 'Vencido' : 'Em dia'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => openWhatsApp(p.phone)}
                                                    disabled={!p.phone}
                                                    title={p.phone ? 'Enviar mensagem via WhatsApp' : 'Cidadão não tem telefone registrado'}
                                                    className={`p-1.5 rounded-lg transition-colors ${p.phone ? 'text-slate-600 hover:text-green-400 hover:bg-white/5' : 'text-slate-700 cursor-not-allowed opacity-50'}`}>
                                                    <MessageCircle size={16} />
                                                </button>
                                                <Link to={`/protocolo/${p.id}`} className="text-slate-600 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 inline-block">
                                                    <Eye size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredProtocols.length === 0 && (
                                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Nenhum protocolo encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs text-slate-600">Mostrando {filteredProtocols.length} de {protocols.length} registros</span>
                        <div className="flex gap-1">
                            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-500 text-xs cursor-not-allowed">Anterior</button>
                            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">1</button>
                            <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs transition-colors">Próxima</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
