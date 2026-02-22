import { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { useProtocols } from '../hooks/useProtocols';
import { Search, Filter, Eye, Download, Users, List as ListIcon, Calendar, ChevronDown } from 'lucide-react';
import { StatusBadge } from './CitizenDashboard';
import { Link } from 'react-router-dom';
import { exportToCSV } from '../utils/exportUtils';

export function AdminRequestsQueue() {
    const { protocols, loading } = useProtocols('admin');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filteredProtocols = useMemo(() => {
        return protocols.filter(p => {
            const matchesSearch = searchTerm === '' ||
                p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.address?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' ||
                p.status === statusFilter ||
                (statusFilter === 'Closed' && p.status === 'Atrasado');

            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [protocols, searchTerm, statusFilter, categoryFilter]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922]">
            <Header title="Fila de Solicitações" subtitle="Gerenciamento de chamados e triagem" />

            <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a242f] border border-[#283039] p-4 rounded-xl">
                    <div className="relative flex-1 max-w-lg w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar protocolo, solicitante ou endereço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#111418] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className="relative min-w-[130px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none bg-[#111418] border border-slate-700 text-slate-300 hover:text-white pl-4 pr-8 py-2 rounded-lg transition-colors focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
                            >
                                <option value="all">Status</option>
                                <option value="Open">Aberto</option>
                                <option value="InProgress">Em Análise</option>
                                <option value="Resolved">Concluído</option>
                                <option value="Closed">Atrasado</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronDown size={14} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="relative min-w-[140px]">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full appearance-none bg-[#111418] border border-slate-700 text-slate-300 hover:text-white pl-4 pr-8 py-2 rounded-lg transition-colors focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
                            >
                                <option value="all">Categoria</option>
                                <option value="Física">Física</option>
                                <option value="Visual">Visual</option>
                                <option value="Auditiva">Auditiva</option>
                                <option value="Outros">Outros</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronDown size={14} className="text-slate-400" />
                            </div>
                        </div>
                        <button onClick={() => exportToCSV(filteredProtocols, 'solicitacoes.csv')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap text-sm font-medium">
                            <Download size={16} />
                            <span>Exportar</span>
                        </button>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-[#1a242f] border border-[#283039] rounded-xl overflow-hidden flex flex-col flex-1">
                    <div className="p-6 border-b border-[#283039] flex justify-between items-center bg-[#111418]/50">
                        <h3 className="text-white text-lg font-bold flex items-center gap-2">
                            <ListIcon className="text-blue-500" size={20} />
                            Todas as Solicitações
                        </h3>
                        <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                            {filteredProtocols.length} Registros
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#111418] border-b border-[#283039]">
                                <tr>
                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[#9dabb9] text-xs">ID / Protocolo</th>
                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[#9dabb9] text-xs">Solicitante</th>
                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[#9dabb9] text-xs">Categoria</th>
                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[#9dabb9] text-xs">Data de Abertura</th>
                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[#9dabb9] text-xs">Prazo SLA</th>
                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[#9dabb9] text-xs">Status</th>
                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[#9dabb9] text-xs text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#283039]">
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            Buscando banco de dados...
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredProtocols.map((p) => (
                                    <tr key={p.id} className="hover:bg-[#283039]/50 transition-colors">
                                        <td className="py-4 px-6 text-[#9dabb9] font-mono font-medium">{p.id}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#3b4754] flex items-center justify-center text-xs font-bold text-white shadow-inner">
                                                    {p.requester?.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{p.requester}</span>
                                                    <span className="text-xs text-slate-500">Cidadão Verificado</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border ${p.category === 'Física' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                p.category === 'Auditiva' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-pink-500/10 text-pink-400 border-pink-500/20'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${p.category === 'Física' ? 'bg-purple-400' :
                                                    p.category === 'Auditiva' ? 'bg-blue-400' :
                                                        'bg-pink-400'
                                                    }`}></span>
                                                Acessibilidade {p.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-300">{p.date}</td>
                                        <td className="py-4 px-6">
                                            <span className={`text-sm font-medium ${p.status === 'Closed' ? 'text-red-400' :
                                                p.status === 'Resolved' ? 'text-emerald-400' :
                                                    'text-slate-300'
                                                }`}>
                                                {p.status === 'Closed' ? 'Vencido' : 'Em dia'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Link to={`/protocolo/${p.id}`} className="text-[#9dabb9] hover:text-white p-2 rounded-lg hover:bg-[#3b4754] transition-colors inline-block" title="Ver Detalhes">
                                                <Eye size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredProtocols.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            Nenhum protocolo encontrado com os filtros atuais.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Mock */}
                    <div className="p-4 border-t border-[#283039] bg-[#111418]/50 flex justify-between items-center text-sm text-[#9dabb9]">
                        <span>Mostrando 1 a {filteredProtocols.length} de {filteredProtocols.length} registros</span>
                        <div className="flex gap-1">
                            <button className="px-3 py-1 rounded bg-[#283039] text-slate-400 cursor-not-allowed">Anterior</button>
                            <button className="px-3 py-1 rounded bg-blue-600 text-white font-medium">1</button>
                            <button className="px-3 py-1 rounded bg-[#283039] hover:bg-[#3b4754] text-white transition-colors">2</button>
                            <button className="px-3 py-1 rounded bg-[#283039] hover:bg-[#3b4754] text-white transition-colors">3</button>
                            <button className="px-3 py-1 rounded bg-[#283039] hover:bg-[#3b4754] text-white transition-colors">Próxima</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
