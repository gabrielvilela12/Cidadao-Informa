import { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { useProtocols } from '../hooks/useProtocols';
import { Search, Filter, Eye, List as ListIcon, ChevronDown } from 'lucide-react';
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

            const matchesStatus = statusFilter === 'all' ||
                p.status === statusFilter ||
                (statusFilter === 'Closed' && p.status === 'Atrasado');

            return matchesSearch && matchesStatus;
        });
    }, [protocols, searchTerm, statusFilter]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922]">
            <Header title="Meus Protocolos" subtitle="Acompanhe suas solicitações" />

            <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por protocolo, serviço ou endereço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1b2631] border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="relative w-full md:w-auto">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Filter size={18} className="text-slate-400" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full md:w-auto appearance-none bg-[#1b2631] border border-slate-700 text-slate-300 hover:text-white pl-10 pr-10 py-2.5 rounded-lg transition-colors focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="Open">Aberto</option>
                            <option value="InProgress">Em Análise</option>
                            <option value="Resolved">Concluído</option>
                            <option value="Closed">Fechado/Atraso</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown size={18} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-[#1b2631] border border-slate-700 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <ListIcon size={20} className="text-blue-500" />
                            Histórico de Solicitações
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-800/50 text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Protocolo</th>
                                    <th className="px-6 py-4">Serviço/Categoria</th>
                                    <th className="px-6 py-4">Endereço</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            Buscando protocolos na nuvem...
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredProtocols.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-300">{p.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-200">{p.service}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{p.address}</td>
                                        <td className="px-6 py-4 text-slate-400">{p.date}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/protocolo/${p.id}`} className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-slate-700 inline-block">
                                                <Eye size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredProtocols.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            Nenhum protocolo encontrado com os filtros atuais.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
