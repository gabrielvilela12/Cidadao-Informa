import { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { useProtocols } from '../hooks/useProtocols';
import { Search, Filter, Eye, FileText, ChevronDown } from 'lucide-react';
import { StatusBadge } from './CitizenDashboard';
import { Link } from 'react-router-dom';

export function CitizenProtocols() {
    const { protocols, loading } = useProtocols('citizen');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredProtocols = useMemo(() => {
        return protocols.filter(p => {
            const matchesSearch = searchTerm === '' ||
                p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.address?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter ||
                (statusFilter === 'Closed' && p.status === 'Atrasado');
            return matchesSearch && matchesStatus;
        });
    }, [protocols, searchTerm, statusFilter]);

    const inputClass = "bg-white/5 border border-white/8 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 placeholder-slate-600 transition-all hover:border-white/15";
    const selectClass = `${inputClass} appearance-none cursor-pointer pr-8`;

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#080d12]">
            <Header title="Meus Protocolos" subtitle="Acompanhe suas solicitações" />

            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                {/* Search & filter bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por protocolo, serviço ou endereço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`${inputClass} pl-9 w-full`}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className={`${selectClass} pl-9`}
                            style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <option value="all">Todos os Status</option>
                            <option value="Open">Aberto</option>
                            <option value="InProgress">Em Análise</option>
                            <option value="Resolved">Concluído</option>
                            <option value="Closed">Encerrado</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
                    </div>
                </div>

                {/* Table card */}
                <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-black text-white flex items-center gap-2">
                            <FileText size={18} className="text-blue-400" />
                            Histórico de Solicitações
                        </h3>
                        <span className="text-xs font-bold bg-white/5 border border-white/8 px-2.5 py-1 rounded-full text-slate-400">
                            {filteredProtocols.length} registro{filteredProtocols.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Serviço / Endereço', 'Protocolo', 'Data', 'Status', ''].map(h => (
                                        <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide ${h === '' ? 'text-right' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Carregando...</td></tr>}
                                {!loading && filteredProtocols.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="text-slate-200 font-medium truncate max-w-[240px]">{p.service}</p>
                                            <p className="text-slate-600 text-xs truncate">{p.address}</p>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{p.id}</td>
                                        <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{p.date}</td>
                                        <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Link to={`/protocolo/${p.id}`} className="text-slate-600 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 inline-block">
                                                <Eye size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredProtocols.length === 0 && (
                                    <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Nenhum protocolo encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
