import { Header } from '../components/Header';
import { Search, Construction, AlertTriangle, LightbulbIcon, Shield, Navigation, PlusCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SERVICES = [
    {
        id: 1,
        category: 'Infraestrutura',
        title: 'Buraco ou Via Danificada',
        description: 'Relatar buracos, afundamentos ou danos graves na via pública ou calçadas.',
        icon: Construction,
        color: 'amber'
    },
    {
        id: 2,
        category: 'Acessibilidade',
        title: 'Barreira Arquitetônica',
        description: 'Relatar rampas bloqueadas, calçadas intransitáveis ou falta de piso tátil.',
        icon: AlertTriangle,
        color: 'red'
    },
    {
        id: 3,
        category: 'Iluminação',
        title: 'Poste Apagado',
        description: 'Relatar lâmpadas queimadas ou postes sem energia na região.',
        icon: LightbulbIcon,
        color: 'yellow'
    },
    {
        id: 4,
        category: 'Trânsito',
        title: 'Semáforo com Defeito',
        description: 'Relatar semáforos apagados, piscantes ou semáforos sonoros quebrados.',
        icon: Navigation,
        color: 'emerald'
    },
    {
        id: 5,
        category: 'Segurança',
        title: 'Poda de Árvore',
        description: 'Solicitar poda de árvores que estão bloqueando a via, calçada ou fiação.',
        icon: Shield,
        color: 'blue'
    },
];

export function CitizenServices() {
    const navigate = useNavigate();

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922]">
            <Header title="Catálogo de Serviços" subtitle="O que você precisa relatar hoje?" />

            <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
                <div className="relative max-w-xl w-full mx-auto mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por tipo de serviço, exemplo: Iluminação, Buraco..."
                        className="w-full bg-[#1b2631] border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-colors shadow-lg"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SERVICES.map((service) => {
                        const Icon = service.icon;
                        return (
                            <div
                                key={service.id}
                                className="bg-[#1b2631] border border-slate-700 hover:border-blue-500 hover:shadow-lg hover:translate-y-[-2px] transition-all rounded-xl p-6 flex flex-col group cursor-pointer"
                                onClick={() => navigate('/nova-solicitacao')}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg flex items-center justify-center ${service.color === 'amber' ? 'bg-amber-500/20 text-amber-500' :
                                            service.color === 'red' ? 'bg-red-500/20 text-red-500' :
                                                service.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    service.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-500' :
                                                        'bg-blue-500/20 text-blue-500'
                                        }`}>
                                        <Icon size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{service.category}</span>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
                                <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-2">{service.description}</p>

                                <div className="flex items-center text-blue-500 text-sm font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                                    <PlusCircle size={16} className="mr-2" />
                                    Abrir Solicitação
                                    <ArrowRight size={16} className="ml-auto transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
