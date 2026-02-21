import { Header } from '../components/Header';
import { useProtocols } from '../hooks/useProtocols';
import { Search, Filter, Eye, List as ListIcon } from 'lucide-react';
import { StatusBadge } from './CitizenDashboard';
import { Link } from 'react-router-dom';

export function CitizenProtocols() {
    const { protocols, loading } = useProtocols('citizen');
    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922]">
            <Header title="Meus Protocolos" subtitle="Acompanhe suas solicitações" />

            <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por protocolo ou serviço..."
                            className="w-full bg-[#1b2631] border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-[#1b2631] border border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
                        <Filter size={18} />
                        <span>Filtrar</span>
                    </button>
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
                                {!loading && protocols.map((p) => (
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
                                {!loading && protocols.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            Nenhum protocolo encontrado.
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
