import { useMemo, useState } from 'react';
import {
    Accessibility,
    ArrowRight,
    CircleHelp,
    Construction,
    Lightbulb,
    Plus,
    Search,
    ShieldCheck,
    TrafficCone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';

type ServiceTone = 'amber' | 'coral' | 'yellow' | 'green' | 'blue';

type Service = {
    id: number;
    category: string;
    title: string;
    description: string;
    icon: LucideIcon;
    tone: ServiceTone;
    requestCategory: 'Física' | 'Outros';
};

const SERVICES: Service[] = [
    {
        id: 1,
        category: 'Infraestrutura',
        title: 'Buraco ou Via Danificada',
        description: 'Relatar buracos, afundamentos ou danos graves na via pública ou calçadas.',
        icon: Construction,
        tone: 'amber',
        requestCategory: 'Física',
    },
    {
        id: 2,
        category: 'Acessibilidade',
        title: 'Barreira Arquitetônica',
        description: 'Relatar rampas bloqueadas, calçadas intransitáveis ou falta de piso tátil.',
        icon: Accessibility,
        tone: 'coral',
        requestCategory: 'Física',
    },
    {
        id: 3,
        category: 'Iluminação',
        title: 'Poste Apagado',
        description: 'Relatar lâmpadas queimadas ou postes sem energia na região.',
        icon: Lightbulb,
        tone: 'yellow',
        requestCategory: 'Outros',
    },
    {
        id: 4,
        category: 'Trânsito',
        title: 'Semáforo com Defeito',
        description: 'Relatar semáforos apagados, piscantes ou semáforos sonoros quebrados.',
        icon: TrafficCone,
        tone: 'green',
        requestCategory: 'Outros',
    },
    {
        id: 5,
        category: 'Segurança',
        title: 'Poda de Árvore',
        description: 'Solicitar poda de árvores que estão bloqueando a via, calçada ou fiação.',
        icon: ShieldCheck,
        tone: 'blue',
        requestCategory: 'Outros',
    },
];

const categories = ['Todos', ...SERVICES.map((service) => service.category)];

const tones: Record<ServiceTone, { card: string; icon: string; illustration: string }> = {
    amber: {
        card: 'border-t-[#E7A900]',
        icon: 'bg-[#FFF1A8] text-[#745600]',
        illustration: 'text-[#C59000]',
    },
    coral: {
        card: 'border-t-[#F06A5F]',
        icon: 'bg-[#FFD4CF] text-[#C52B1E]',
        illustration: 'text-[#E65F54]',
    },
    yellow: {
        card: 'border-t-[#F9B900]',
        icon: 'bg-[#FFE775] text-[#735800]',
        illustration: 'text-[#E7A900]',
    },
    green: {
        card: 'border-t-[#2BA84A]',
        icon: 'bg-[#C8F0D1] text-[#168821]',
        illustration: 'text-[#168821]',
    },
    blue: {
        card: 'border-t-[#377FD0]',
        icon: 'bg-[#CFE4FF] text-[#0758BD]',
        illustration: 'text-[#377FD0]',
    },
};

export function CitizenServices() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todos');

    const filteredServices = useMemo(() => {
        const search = searchTerm.trim().toLocaleLowerCase('pt-BR');
        return SERVICES.filter((service) => {
            const matchesCategory = activeCategory === 'Todos' || service.category === activeCategory;
            const matchesSearch = !search || `${service.title} ${service.description} ${service.category}`
                .toLocaleLowerCase('pt-BR')
                .includes(search);
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchTerm]);

    const openService = (service: Service) => {
        navigate('/nova-solicitacao', {
            state: {
                category: service.requestCategory,
                serviceDesc: service.title,
            },
        });
    };

    return (
        <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[#f4f8fc] text-[#0b1b33]">
            <Header title="Catálogo de Serviços" subtitle="O que você precisa relatar hoje?" />

            <main className="mx-auto w-full max-w-[1480px] px-4 pb-8 sm:px-6 lg:px-8">
                <div className="flex justify-end">
                    <span className="text-sm font-semibold text-[#0758bd]">
                        {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''} disponíve{filteredServices.length !== 1 ? 'is' : 'l'}
                    </span>
                </div>

                <div className="relative mt-1">
                    <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Buscar por tipo de serviço, exemplo: iluminação, buraco..."
                        aria-label="Buscar no catálogo de serviços"
                        className="min-h-14 w-full rounded-lg border border-[#CDD8E7] bg-white py-3 pl-14 pr-4 text-base text-[#0b1b33] shadow-[0_5px_16px_rgba(35,65,110,0.03)] outline-none transition placeholder:text-slate-500 focus:border-[#0758bd] focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div className="mt-5 overflow-x-auto pb-1" role="tablist" aria-label="Categorias de serviço">
                    <div className="flex min-w-max gap-3">
                        {categories.map((category) => {
                            const selected = activeCategory === category;
                            return (
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`min-h-11 rounded-full border px-6 text-sm font-semibold transition ${selected
                                        ? 'dashboard-inverse-text border-[#0758bd] bg-[#0758bd] text-white shadow-[0_5px_12px_rgba(7,88,189,0.18)]'
                                        : 'border-[#CDD8E7] bg-white text-slate-600 hover:border-[#8DB6F4] hover:text-[#0758bd]'
                                    }`}
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {filteredServices.length > 0 ? (
                    <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Serviços disponíveis">
                        {filteredServices.map((service) => (
                            <ServiceCard key={service.id} service={service} onOpen={openService} />
                        ))}
                        <HelpCard onOpen={() => navigate('/nova-solicitacao', { state: { category: 'Outros' } })} />
                    </section>
                ) : (
                    <section className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#CDD8E7] bg-white p-8 text-center">
                        <CircleHelp className="text-[#0758bd]" size={42} />
                        <h2 className="mt-4 text-xl font-bold text-[#0b1b33]">Nenhum serviço encontrado</h2>
                        <p className="mt-2 max-w-md text-slate-600">Tente outro termo ou selecione uma categoria diferente.</p>
                        <button type="button" onClick={() => { setSearchTerm(''); setActiveCategory('Todos'); }} className="mt-5 min-h-11 rounded-md border border-[#0758bd] px-5 text-sm font-semibold text-[#0758bd]">Limpar busca</button>
                    </section>
                )}
            </main>
        </div>
    );
}

function ServiceCard({ service, onOpen }: { service: Service; onOpen: (service: Service) => void }) {
    const Icon = service.icon;
    const tone = tones[service.tone];

    return (
        <article className={`group relative flex min-h-[280px] flex-col overflow-hidden rounded-lg border border-[#CDD8E7] border-t-2 bg-white p-6 shadow-[0_7px_20px_rgba(35,65,110,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(35,65,110,0.09)] ${tone.card}`}>
            <Icon className={`pointer-events-none absolute -bottom-5 -right-4 size-36 opacity-[0.13] ${tone.illustration}`} strokeWidth={1} aria-hidden="true" />
            <div className="relative z-10 flex items-start justify-between gap-4">
                <span className={`flex size-14 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
                    <Icon size={28} />
                </span>
                <span className="pt-2 text-xs font-bold uppercase text-slate-600">{service.category}</span>
            </div>

            <div className="relative z-10 mt-5 flex-1">
                <h2 className="text-xl font-black text-[#0b1b33] sm:text-2xl">{service.title}</h2>
                <p className="mt-3 max-w-[85%] text-base leading-6 text-slate-600">{service.description}</p>
            </div>

            <button
                type="button"
                onClick={() => onOpen(service)}
                className="relative z-10 mt-6 flex min-h-11 w-fit items-center gap-3 text-base font-semibold text-[#0758bd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
                Abrir solicitação
                <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
            </button>
        </article>
    );
}

function HelpCard({ onOpen }: { onOpen: () => void }) {
    return (
        <article className="relative flex min-h-[280px] flex-col overflow-hidden rounded-lg border border-[#B7D2F5] bg-gradient-to-br from-white to-[#EAF2FF] p-6 shadow-[0_7px_20px_rgba(35,65,110,0.05)]">
            <Construction className="pointer-events-none absolute -bottom-7 -right-4 size-40 text-[#0758bd] opacity-[0.1]" strokeWidth={1} aria-hidden="true" />
            <span className="dashboard-inverse-text flex size-14 items-center justify-center rounded-full bg-[#0758bd] text-white">
                <CircleHelp size={30} />
            </span>
            <h2 className="relative z-10 mt-5 text-xl font-black text-[#0b1b33] sm:text-2xl">Não encontrou o serviço?</h2>
            <p className="relative z-10 mt-3 max-w-[82%] flex-1 text-base leading-6 text-slate-600">Use a categoria Outros para relatar uma situação diferente.</p>
            <button type="button" onClick={onOpen} className="dashboard-inverse-text relative z-10 mt-6 flex min-h-12 w-fit items-center gap-3 rounded-md bg-[#0758bd] px-5 text-base font-semibold text-white shadow-[0_7px_16px_rgba(7,88,189,0.18)] transition hover:bg-[#064c9f]">
                <Plus size={20} />
                Criar solicitação
            </button>
        </article>
    );
}