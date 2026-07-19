import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    MapPin, ArrowRight, Shield, Zap, Users, BarChart3,
    CheckCircle, ChevronRight, ChevronLeft, Star, Eye, Clock, UserRound, Camera, Monitor, Accessibility,
    ClipboardList, Smile, Quote, Contrast
} from 'lucide-react';
import { CidadaoBrand } from '../components/CidadaoBrand';
import { useA11y } from '../context/A11yContext';

type ProcessVisualProps = {
    type: 'report' | 'tracking' | 'solution';
};

function ProcessVisual({ type }: ProcessVisualProps) {
    if (type === 'report') {
        return (
            <div className="relative flex h-40 items-end justify-center overflow-hidden" aria-hidden="true">
                <div className="absolute bottom-1 h-7 w-40 skew-x-[-8deg] rounded-lg border border-slate-200 bg-slate-100 shadow-sm" />
                <div className="absolute bottom-6 left-[16%]">
                    <span className="mx-auto block h-11 w-11 rounded-full bg-[#6BAF45]" />
                    <span className="mx-auto -mt-1 block h-8 w-2 bg-[#8A633B]" />
                </div>
                <div className="relative z-10 flex h-36 w-20 rotate-2 flex-col items-center rounded-[20px] border-[5px] border-slate-700 bg-white p-2 shadow-xl">
                    <span className="mb-2 h-1.5 w-8 rounded-full bg-slate-300" />
                    <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-[#EAF2FF]">
                        <span className="absolute inset-x-0 top-1/3 h-px rotate-12 bg-blue-200" />
                        <span className="absolute inset-y-0 left-1/2 w-px -rotate-12 bg-blue-200" />
                        <MapPin size={30} className="relative text-[#E52207]" fill="#E52207" />
                    </div>
                    <span className="mt-2 flex size-8 items-center justify-center rounded-full bg-blue-600">
                        <Camera size={17} className="landing-inverse-icon" />
                    </span>
                </div>
            </div>
        );
    }

    if (type === 'tracking') {
        return (
            <div className="relative flex h-40 items-end justify-center overflow-hidden" aria-hidden="true">
                <div className="absolute bottom-3 h-5 w-44 rounded-lg border border-slate-200 bg-slate-100 shadow-sm" />
                <div className="absolute bottom-11 right-[10%] flex h-24 w-32 flex-col rounded-lg border-4 border-slate-700 bg-[#DDEBFF] p-2 shadow-lg">
                    <div className="grid flex-1 grid-cols-2 gap-1">
                        <span className="rounded bg-blue-600/20" />
                        <span className="rounded bg-green-500/20" />
                        <span className="rounded bg-yellow-500/30" />
                        <span className="rounded bg-blue-600/20" />
                    </div>
                    <span className="mx-auto -mb-4 mt-2 h-4 w-2 bg-slate-600" />
                </div>
                <div className="absolute bottom-8 left-[14%] flex size-20 items-center justify-center rounded-lg border-4 border-slate-700 bg-white shadow-lg">
                    <Monitor size={45} className="text-[#1351B4]" />
                </div>
                <div className="absolute bottom-4 left-[39%] z-10 flex flex-col items-center">
                    <span className="size-8 rounded-full bg-[#E5A06C]" />
                    <span className="flex h-14 w-12 items-center justify-center rounded-t-2xl bg-blue-600">
                        <Users size={24} className="landing-inverse-icon" />
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-40 items-end justify-center overflow-hidden" aria-hidden="true">
            <div className="relative h-28 w-48 -rotate-3 overflow-hidden rounded-lg border-4 border-slate-300 bg-slate-700 shadow-lg">
                <div className="absolute inset-y-0 left-6 flex gap-2">
                    {[0, 1, 2, 3].map((stripe) => (
                        <span key={stripe} className="mt-8 h-14 w-4 skew-x-[-12deg] bg-white" />
                    ))}
                </div>
                <span className="absolute bottom-2 right-5 flex size-14 items-center justify-center rounded-lg bg-blue-600">
                    <Accessibility size={34} className="landing-inverse-icon" />
                </span>
            </div>
            <div className="absolute right-[12%] top-2 flex flex-col items-center">
                <span className="flex size-14 items-center justify-center rounded-lg border-4 border-[#168821] bg-white shadow-md">
                    <CheckCircle size={34} className="text-[#168821]" />
                </span>
                <span className="h-20 w-2 bg-slate-500" />
            </div>
            <div className="absolute left-[17%] top-8">
                <span className="mx-auto block h-12 w-12 rounded-full bg-[#6BAF45]" />
                <span className="mx-auto -mt-1 block h-10 w-2 bg-[#8A633B]" />
            </div>
        </div>
    );
}
export function LandingPage() {
    const navigate = useNavigate();
    const [comparisonPosition, setComparisonPosition] = useState(50);
    const { fontSize, setFontSize, theme, setTheme } = useA11y();

    const features = [
        {
            icon: MapPin,
            title: 'Mapa interativo',
            desc: 'Veja e acompanhe solicitações na sua região.',
            iconClass: 'text-[#1351B4]',
            cardClass: 'border-[#B8D0F7] bg-[#F2F7FF]',
        },
        {
            icon: Zap,
            title: 'Respostas rápidas',
            desc: 'Acompanhe cada etapa e receba atualizações em tempo real.',
            iconClass: 'text-[#E6A900]',
            cardClass: 'border-[#F0D37A] bg-[#FFF9E8]',
        },
        {
            icon: Shield,
            title: 'Seguro e acessível',
            desc: 'Dados protegidos e plataforma inclusiva para todos.',
            iconClass: 'text-[#168821]',
            cardClass: 'border-[#AFD8B5] bg-[#F1FAF2]',
        },
        {
            icon: BarChart3,
            title: 'Transparência total',
            desc: 'Informações claras para fortalecer a confiança.',
            iconClass: 'text-[#1351B4]',
            cardClass: 'border-[#B8D0F7] bg-[#F2F7FF]',
        },
    ];

    const processSteps = [
        {
            number: '1',
            title: 'Informe o problema',
            desc: 'Envie uma foto, descreva a situação e marque o local.',
            visual: 'report' as const,
            badgeClass: 'bg-blue-600',
            cardClass: 'border-[#8DB5F3] bg-[#F3F8FF]',
        },
        {
            number: '2',
            title: 'Acompanhe o andamento',
            desc: 'Veja as atualizações e saiba qual equipe está responsável.',
            visual: 'tracking' as const,
            badgeClass: 'bg-yellow-500',
            cardClass: 'border-[#EFC64B] bg-[#FFFAEB]',
        },
        {
            number: '3',
            title: 'Confira a solução',
            desc: 'Receba a conclusão e avalie o atendimento.',
            visual: 'solution' as const,
            badgeClass: 'bg-green-600',
            cardClass: 'border-[#87C68F] bg-[#F2FAF3]',
        },
    ];
    const stats = [
        { value: '12.4 mil', label: 'atendidas', icon: Users, tone: 'bg-blue-600' },
        { value: '98%', label: 'de satisfação', icon: Star, tone: 'bg-yellow-500' },
        { value: '3,2 mil', label: 'usuários', icon: UserRound, tone: 'bg-green-600' },
        { value: '48h', label: 'de resposta média', icon: Clock, tone: 'bg-blue-600' },
    ];

    const journeySteps = [
        { label: 'Solicitação\nenviada', color: '#E52207', position: 'left-0 top-[10%] sm:left-[2%]' },
        { label: 'Em análise', color: '#FFB600', position: 'left-1/2 top-[10%] -translate-x-1/2 sm:left-[41%] sm:translate-x-0' },
        { label: 'Problema\nresolvido', color: '#168821', position: 'right-0 top-[10%] sm:right-[2%]' },
    ];
    const testimonials = [
        {
            name: 'Ana Lima',
            role: 'Moradora do Plano Piloto',
            text: 'Reportei uma rampa quebrada e em poucos dias ela foi resolvida.',
            avatar: 'AL',
            color: 'bg-blue-600',
        },
        {
            name: 'Carlos Mendes',
            role: 'Cidadão com deficiência visual',
            text: 'Consigo acompanhar cada atualização com clareza e autonomia.',
            avatar: 'CM',
            color: 'bg-[#071A3A]',
        },
        {
            name: 'Fernanda Costa',
            role: 'Moradora de Taguatinga',
            text: 'Agora sei exatamente em qual etapa minha solicitação está.',
            avatar: 'FC',
            color: 'bg-green-600',
        },
    ];

    return (
        <div className="min-h-screen bg-[#F7F9FC] text-slate-900 font-sans overflow-x-hidden">

            {/* ── Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-full max-w-[1540px] items-center justify-between px-5 sm:px-8 lg:px-12">
                    <CidadaoBrand />

                    <div className="hidden items-center gap-8 lg:flex">
                        <a href="#como-funciona" className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#1351B4]">
                            Como funciona
                        </a>
                        <a href="#beneficios" className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#1351B4]">
                            Benefícios
                        </a>
                        <a href="#resultados" className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#1351B4]">
                            Resultados
                        </a>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="h-11 rounded-lg border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition-colors hover:border-[#1351B4] hover:text-[#1351B4]"
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/cadastro')}
                            className="h-11 rounded-lg bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-[#0C326F]"
                        >
                            Criar conta
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white lg:hidden"
                    >
                        Entrar
                    </button>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-[linear-gradient(135deg,#F8FBFF_0%,#EAF2FF_58%,#F7F9FC_100%)] px-5 pb-12 pt-28 sm:px-8 lg:px-12 lg:pb-16 lg:pt-32">
                <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
                    <div className="absolute -left-[16%] top-[34%] h-[58%] w-[72%] rounded-[50%] bg-white/55" />
                    <div className="absolute -right-[24%] top-[4%] h-[82%] w-[84%] rounded-[50%] bg-[#DFEAFF]/45" />
                </div>

                <div className="relative mx-auto max-w-[1540px]">
                    <div className="grid items-center gap-12 lg:grid-cols-[0.83fr_1.35fr] lg:gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                            className="z-10 max-w-2xl lg:pb-8"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#79A7F4] bg-[#EDF4FF] px-4 py-2 text-xs font-bold uppercase text-[#1351B4] sm:text-sm">
                                <span className="size-2 rounded-full bg-[#4E8BEF]" />
                                Portal de acessibilidade urbana
                            </span>

                            <h1 className="mt-8 text-4xl font-black leading-[1.08] text-[#071A3A] sm:text-5xl lg:text-6xl">
                                Sua voz
                                <span className="mt-2 block text-[#1657C8]">transforma a cidade.</span>
                            </h1>

                            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                                Reporte problemas de acessibilidade, acompanhe cada etapa e contribua para uma cidade mais inclusiva.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/cadastro')}
                                    className="flex h-14 items-center justify-center gap-3 rounded-lg bg-blue-600 px-8 text-base font-bold text-white shadow-xl shadow-blue-900/20 transition-colors hover:bg-[#0C326F]"
                                >
                                    Criar conta gratuita
                                    <ArrowRight size={19} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/login')}
                                    className="flex h-14 items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white/90 px-8 text-base font-bold text-slate-800 shadow-sm transition-colors hover:border-[#1351B4] hover:text-[#1351B4]"
                                >
                                    Já tenho conta
                                    <ChevronRight size={19} />
                                </motion.button>
                            </div>

                            <p className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-600">
                                <CheckCircle size={21} className="fill-[#1351B4] landing-inverse-icon" />
                                Gratuito, acessível e transparente
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                            className="relative min-h-[390px] w-[calc(100vw-2.5rem)] min-w-0 max-w-full overflow-hidden scroll-mt-28 sm:min-h-[520px] sm:w-full lg:min-h-[600px]"
                        >
                            <svg
                                viewBox="0 0 1000 300"
                                className="pointer-events-none absolute left-[10%] top-[6%] z-[15] hidden h-[32%] w-[80%] sm:block"
                                aria-hidden="true"
                            >
                                <path
                                    d="M15 190 C 220 20, 390 80, 500 110 S 780 15, 985 160"
                                    fill="none"
                                    stroke="#6D9FEE"
                                    strokeWidth="3"
                                    strokeDasharray="10 10"
                                />
                            </svg>

                            {journeySteps.map((step) => (
                                <div key={step.label} className={`absolute z-20 ${step.position}`}>
                                    <div className="relative flex h-[86px] w-[104px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 pt-3 text-center shadow-[0_10px_28px_rgba(26,71,126,0.16)] sm:h-[88px] sm:w-auto sm:min-w-[132px] sm:px-4">
                                        <MapPin
                                            size={46}
                                            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md"
                                            fill={step.color}
                                            stroke={step.color}
                                        />
                                        <span className="whitespace-pre-line text-xs font-bold leading-5 text-slate-800 sm:text-base">
                                            {step.label}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            <img
                                src="/landing-city-hero.png"
                                alt="Ilustração de um espaço urbano acessível com rampas, piso tátil e faixa de pedestres"
                                className="absolute bottom-0 left-1/2 z-10 w-[112%] max-w-none -translate-x-1/2 object-contain sm:w-[105%] lg:w-[108%]"
                            />

                            <div className="absolute bottom-[7%] right-[1%] z-20 flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(26,71,126,0.18)] sm:right-[2%] sm:px-5">
                                <Eye size={24} className="mt-0.5 text-[#1351B4]" />
                                <div>
                                    <strong className="block text-2xl font-black leading-none text-[#071A3A] sm:text-3xl">5</strong>
                                    <span className="mt-2 block text-xs font-medium leading-5 text-slate-600 sm:text-sm">
                                        solicitações<br />na área
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div

                        className="relative z-20 mt-8 grid scroll-mt-28 grid-cols-2 rounded-lg border border-slate-200 bg-white shadow-[0_12px_34px_rgba(26,71,126,0.14)] sm:mt-2 lg:grid-cols-4"
                    >
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className={`flex min-h-28 items-center gap-4 px-4 py-5 sm:px-7 ${index % 2 === 0 ? 'border-r border-slate-200' : ''} ${index < 2 ? 'border-b border-slate-200 lg:border-b-0' : ''} ${index === 1 ? 'lg:border-r' : ''}`}
                                >
                                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${stat.tone}`}>
                                        <Icon size={25} className="landing-inverse-icon" />
                                    </span>
                                    <div>
                                        <strong className="block text-xl font-black leading-tight text-[#071A3A] sm:text-2xl">{stat.value}</strong>
                                        <span className="mt-1 block text-xs font-medium text-slate-600 sm:text-sm">{stat.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Como funciona e benefícios ── */}
            <section
                id="como-funciona"
                className="relative scroll-mt-20 overflow-hidden border-t border-slate-200 bg-[linear-gradient(180deg,#F8FBFF_0%,#F1F6FD_100%)] px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
            >
                <div className="mx-auto max-w-[1540px]">
                    <div
                        className="text-center"
                    >
                        <span className="inline-flex rounded-full border border-[#B8D0F7] bg-[#EAF2FF] px-5 py-2 text-xs font-extrabold uppercase text-[#1351B4] sm:text-sm">
                            Como funciona
                        </span>
                        <h2 className="mt-5 text-3xl font-black leading-tight text-[#111827] sm:text-4xl">
                            Da solicitação à solução,
                            <span className="text-[#1657C8]"> sem complicação.</span>
                        </h2>
                        <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                            Acompanhe cada etapa com transparência e receba atualizações em tempo real.
                        </p>
                    </div>

                    <div className="relative mt-12">
                        <div className="pointer-events-none absolute left-[18%] right-[18%] top-1/2 hidden -translate-y-1/2 border-t-2 border-dashed border-[#3D76D0] lg:block" aria-hidden="true" />
                        <span className="pointer-events-none absolute left-1/3 top-1/2 z-20 hidden size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#2866C5] bg-white lg:block" aria-hidden="true" />
                        <span className="pointer-events-none absolute left-2/3 top-1/2 z-20 hidden size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#2866C5] bg-white lg:block" aria-hidden="true" />

                        <div className="relative z-10 grid gap-6 lg:grid-cols-3 lg:gap-8">
                            {processSteps.map((step, index) => (
                                <article
                                    key={step.number}
                                    className={`min-h-[290px] rounded-lg border p-6 shadow-[0_10px_28px_rgba(26,71,126,0.07)] sm:p-7 ${step.cardClass}`}
                                >
                                    <div className="grid h-full items-center gap-5 sm:grid-cols-[1fr_180px] lg:grid-cols-1 xl:grid-cols-[1fr_170px]">
                                        <div>
                                            <div className="flex items-start gap-4">
                                                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-base font-black landing-inverse-icon ${step.badgeClass}`}>
                                                    {step.number}
                                                </span>
                                                <h3 className="pt-1 text-lg font-black leading-6 text-[#111827] sm:text-xl">
                                                    {step.number}. {step.title}
                                                </h3>
                                            </div>
                                            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
                                                {step.desc}
                                            </p>
                                        </div>
                                        <ProcessVisual type={step.visual} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div id="beneficios" className="scroll-mt-28 pt-16 lg:pt-20">
                        <h3 className="text-center text-2xl font-black text-[#111827] sm:text-3xl">
                            Uma plataforma feita para todos
                        </h3>
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <article
                                        key={feature.title}
                                        className={`flex min-h-32 items-center gap-5 rounded-lg border p-5 ${feature.cardClass}`}
                                    >
                                        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                                            <Icon size={30} className={feature.iconClass} />
                                        </span>
                                        <div>
                                            <h4 className="text-base font-black text-[#111827]">{feature.title}</h4>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{feature.desc}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Results and testimonials ── */}
            <section
                id="resultados"
                className="scroll-mt-20 border-y border-slate-200 bg-[linear-gradient(135deg,#FFFFFF_0%,#F4F8FF_100%)] px-5 py-16 sm:px-8 lg:py-24"
            >
                <div className="mx-auto max-w-[1540px]">
                    <div className="grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
                        <div>
                            <span className="landing-dark-text inline-flex items-center gap-2 rounded-md bg-[#1351B4] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] shadow-sm sm:text-sm">
                                <Star size={17} fill="currentColor" aria-hidden="true" />
                                Resultados reais
                            </span>
                            <h2 className="mt-5 max-w-2xl text-4xl font-black leading-[1.06] text-[#071A3A] sm:text-5xl">
                                Uma cidade mais acessível <span className="text-[#1F5FC4]">começa com participação.</span>
                            </h2>
                            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                                Cada solicitação ajuda a orientar equipes, priorizar melhorias e transformar espaços urbanos.
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {[
                                    { value: '12.4 mil', label: 'solicitações atendidas', icon: ClipboardList, tone: 'text-[#1351B4]', bg: 'bg-[#EEF5FF]' },
                                    { value: '98%', label: 'de satisfação', icon: Smile, tone: 'text-[#168821]', bg: 'bg-[#EFF9F0]' },
                                    { value: '48h', label: 'de resposta média', icon: Clock, tone: 'text-[#D99B00]', bg: 'bg-[#FFF8E3]' },
                                ].map((metric) => {
                                    const MetricIcon = metric.icon;
                                    return (
                                        <article key={metric.label} className="flex min-h-32 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,42,80,0.08)] sm:flex-col sm:items-start xl:flex-row xl:items-center">
                                            <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${metric.bg}`}>
                                                <MetricIcon size={27} className={metric.tone} aria-hidden="true" />
                                            </span>
                                            <div>
                                                <strong className={`block text-2xl font-black leading-none ${metric.tone}`}>{metric.value}</strong>
                                                <span className="mt-2 block text-sm leading-5 text-slate-600">{metric.label}</span>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-[0_18px_45px_rgba(15,42,80,0.16)] sm:aspect-video">
                            <img
                                src="/results-after.png"
                                alt="Entrada acessível com rampa, corrimãos e piso tátil"
                                className="absolute inset-0 size-full object-cover"
                            />
                            <div
                                className="absolute inset-0"
                                style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                                aria-hidden="true"
                            >
                                <img
                                    src="/results-before.png"
                                    alt=""
                                    className="size-full object-cover"
                                />
                            </div>

                            <span className="landing-dark-text absolute bottom-4 left-4 z-20 rounded-full bg-[#C62828] px-4 py-2 text-xs font-black shadow-xl ring-2 ring-white/90 sm:text-sm">
                                ANTES
                            </span>
                            <span className="landing-dark-text absolute bottom-4 right-4 z-20 rounded-full bg-[#168821] px-4 py-2 text-xs font-black shadow-xl ring-2 ring-white/90 sm:text-sm">
                                DEPOIS
                            </span>

                            <div
                                className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-white shadow-[0_0_0_1px_rgba(7,26,58,0.22)]"
                                style={{ left: `${comparisonPosition}%` }}
                                aria-hidden="true"
                            >
                                <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1351B4] shadow-xl">
                                    <ChevronLeft size={20} />
                                    <ChevronRight size={20} />
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={comparisonPosition}
                                onChange={(event) => setComparisonPosition(Number(event.target.value))}
                                className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
                                aria-label="Mover comparação entre antes e depois"
                            />
                        </div>
                    </div>

                    <div className="mt-16 border-t border-slate-200 pt-14 lg:mt-20 lg:pt-16">
                        <div className="text-center">
                            <h3 className="text-3xl font-black text-[#071A3A] sm:text-4xl">O que dizem os cidadãos</h3>
                            <p className="mt-2 text-sm text-slate-600 sm:text-base">Histórias reais de quem usa o Cidadão Informa</p>
                        </div>

                        <div className="mx-auto mt-9 grid max-w-6xl gap-5 md:grid-cols-3">
                            {testimonials.map((testimonial) => (
                                <article
                                    key={testimonial.name}
                                    className="flex min-h-60 flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,42,80,0.09)]"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <Quote size={32} className="text-[#1351B4]" fill="currentColor" aria-hidden="true" />
                                        <span className="flex gap-1" aria-label="5 de 5 estrelas">
                                            {[0, 1, 2, 3, 4].map((star) => (
                                                <Star key={star} size={18} className="fill-[#F4B400] text-[#F4B400]" aria-hidden="true" />
                                            ))}
                                        </span>
                                    </div>
                                    <p className="mt-5 flex-1 text-base font-medium leading-7 text-slate-800">
                                        “{testimonial.text}”
                                    </p>
                                    <div className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
                                        <span className={`landing-inverse-icon flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-black ${testimonial.color}`}>
                                            {testimonial.avatar}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#071A3A]">{testimonial.name}</p>
                                            <p className="mt-0.5 text-sm leading-5 text-slate-500">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            {/* ── Final call to action ── */}
            <section className="bg-[#F7F9FC] px-5 pb-6 pt-14 sm:px-8 lg:px-12 lg:pt-20">
                <div className="relative mx-auto max-w-[1540px] overflow-hidden rounded-lg bg-[#061B3A] px-6 py-10 shadow-[0_18px_45px_rgba(7,26,58,0.18)] sm:px-10 lg:min-h-[500px] lg:px-20 lg:py-14">
                    <svg
                        viewBox="0 0 1600 520"
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute inset-0 size-full opacity-20"
                        aria-hidden="true"
                    >
                        <g fill="none" stroke="#4D79B6" strokeWidth="2">
                            <path d="M-40 110 C180 70 290 180 455 118 S760 62 925 138 S1280 212 1640 90" />
                            <path d="M40 430 C210 328 358 430 520 340 S820 218 1010 330 S1345 420 1600 305" />
                            <path d="M250 -20 C330 100 258 190 388 258 S530 378 488 550" />
                            <path d="M1040 -15 C970 92 1080 162 1030 252 S900 420 980 540" />
                            <path d="M1260 -10 C1190 110 1335 162 1290 262 S1215 408 1360 535" />
                        </g>
                        <path d="M470 68 C590 95 620 190 770 207 S965 128 1120 186 S1290 315 1450 286" fill="none" stroke="#79A7F4" strokeWidth="3" strokeDasharray="12 12" />
                        <g fill="#79A7F4">
                            <circle cx="470" cy="68" r="7" />
                            <circle cx="770" cy="207" r="7" />
                            <circle cx="1120" cy="186" r="7" />
                            <circle cx="1450" cy="286" r="7" />
                        </g>
                    </svg>

                    <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
                        <div className="max-w-2xl">
                            <h2 className="landing-dark-text text-4xl font-black leading-[1.06] sm:text-5xl lg:text-6xl">
                                Sua cidade pode melhorar.
                                <span className="mt-2 block text-[#FFCD07]">Comece agora.</span>
                            </h2>
                            <p className="landing-dark-muted mt-7 max-w-xl text-base leading-8 sm:text-xl">
                                Junte-se a milhares de cidadãos que já ajudam a construir espaços mais acessíveis.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => navigate('/cadastro')}
                                    className="flex h-14 items-center justify-center gap-3 rounded-lg bg-[#FFCD07] px-8 text-base font-black text-[#071A3A] shadow-lg shadow-black/15 transition-colors hover:bg-[#FFD83D]"
                                >
                                    Criar minha conta
                                    <ArrowRight size={20} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="landing-outline-button flex h-14 items-center justify-center rounded-lg border-2 bg-transparent px-8 text-base font-bold transition-colors"
                                >
                                    Já tenho conta
                                </button>
                            </div>

                            <p className="landing-dark-muted mt-7 flex items-center gap-3 text-sm font-medium sm:text-base">
                                <CheckCircle size={23} className="shrink-0 text-[#6FCF67]" aria-hidden="true" />
                                Cadastro gratuito e acompanhamento em tempo real.
                            </p>
                        </div>

                        <div className="relative flex min-h-[290px] items-center justify-center lg:min-h-[390px]">
                            <img
                                src="/landing-cta-city.png"
                                alt="Espaço urbano acessível com piso tátil, cadeira de rodas e equipe de atendimento"
                                className="w-full max-w-[760px] object-contain mix-blend-lighten drop-shadow-[0_24px_26px_rgba(0,0,0,0.3)]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-[#F7F9FC] px-5 pb-8 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-[1540px] rounded-lg border border-slate-200 bg-white px-6 shadow-sm sm:px-10">
                    <div className="grid gap-9 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.9fr_0.9fr_0.9fr] lg:gap-0">
                        <div className="lg:border-r lg:border-slate-200 lg:pr-12">
                            <CidadaoBrand />
                        </div>

                        <nav aria-label="Links da plataforma" className="lg:px-12">
                            <h3 className="font-black text-[#071A3A]">Plataforma</h3>
                            <div className="mt-5 flex flex-col items-start gap-3">
                                <a href="#como-funciona" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1351B4]">Como funciona</a>
                                <a href="#beneficios" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1351B4]">Benefícios</a>
                                <button type="button" onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1351B4]">Entrar</button>
                            </div>
                        </nav>

                        <nav aria-label="Links de suporte" className="lg:border-l lg:border-slate-200 lg:px-12">
                            <h3 className="font-black text-[#071A3A]">Suporte</h3>
                            <div className="mt-5 flex flex-col items-start gap-3">
                                <button type="button" onClick={() => navigate('/acessibilidade')} className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1351B4]">Acessibilidade</button>
                                <a href="mailto:suporte@cidadaoinforma.com.br" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1351B4]">Central de ajuda</a>
                                <a href="mailto:contato@cidadaoinforma.com.br" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1351B4]">Contato</a>
                            </div>
                        </nav>

                        <nav aria-label="Links legais" className="lg:border-l lg:border-slate-200 lg:pl-12">
                            <h3 className="font-black text-[#071A3A]">Legal</h3>
                            <div className="mt-5 flex flex-col items-start gap-3">
                                <button type="button" onClick={() => navigate('/termos-de-uso')} className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1351B4]">Termos de uso</button>
                                <button type="button" onClick={() => navigate('/privacidade')} className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1351B4]">Privacidade</button>
                            </div>
                        </nav>
                    </div>

                    <div className="flex flex-col gap-5 border-t border-slate-200 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>© 2026 Cidadão Informa</p>
                        <div className="flex items-center gap-2" aria-label="Atalhos de acessibilidade">
                            <button
                                type="button"
                                onClick={() => navigate('/acessibilidade')}
                                className="flex size-10 items-center justify-center rounded-full text-[#1351B4] transition-colors hover:bg-[#EAF2FF]"
                                title="Opções de acessibilidade"
                                aria-label="Abrir opções de acessibilidade"
                            >
                                <Accessibility size={23} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontSize(Math.min(200, fontSize + 5))}
                                className="flex size-10 items-center justify-center rounded-full text-base font-black text-[#1351B4] transition-colors hover:bg-[#EAF2FF] disabled:opacity-40"
                                title="Aumentar texto"
                                aria-label="Aumentar tamanho do texto"
                                disabled={fontSize >= 200}
                            >
                                A+
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontSize(Math.max(100, fontSize - 5))}
                                className="flex size-10 items-center justify-center rounded-full text-base font-black text-[#1351B4] transition-colors hover:bg-[#EAF2FF] disabled:opacity-40"
                                title="Diminuir texto"
                                aria-label="Diminuir tamanho do texto"
                                disabled={fontSize <= 100}
                            >
                                A−
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme(theme === 'high-contrast' ? 'light' : 'high-contrast')}
                                className="flex size-10 items-center justify-center rounded-full text-[#1351B4] transition-colors hover:bg-[#EAF2FF]"
                                title="Alternar alto contraste"
                                aria-label="Alternar alto contraste"
                                aria-pressed={theme === 'high-contrast'}
                            >
                                <Contrast size={22} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
