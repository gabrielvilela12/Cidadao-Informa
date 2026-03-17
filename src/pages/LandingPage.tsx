import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    MapPin, ArrowRight, Shield, Zap, Users, BarChart3,
    CheckCircle, ChevronRight, Star, MessageSquare, Eye
} from 'lucide-react';

export function LandingPage() {
    const navigate = useNavigate();

    const features = [
        {
            icon: <MapPin className="text-blue-400" size={28} />,
            title: 'Mapa Interativo',
            desc: 'Visualize e acompanhe todas as solicitações na cidade em tempo real com geolocalização precisa.',
            color: 'from-blue-500/10 to-blue-500/5',
            border: 'border-blue-500/20',
        },
        {
            icon: <Zap className="text-orange-400" size={28} />,
            title: 'Respostas Rápidas',
            desc: 'Protocolo gerado instantaneamente. Acompanhe cada etapa da sua solicitação em tempo real.',
            color: 'from-orange-500/10 to-orange-500/5',
            border: 'border-orange-500/20',
        },
        {
            icon: <Shield className="text-green-400" size={28} />,
            title: 'Seguro e Acessível',
            desc: 'Plataforma 100% acessível para pessoas com deficiência física, visual e auditiva.',
            color: 'from-green-500/10 to-green-500/5',
            border: 'border-green-500/20',
        },
        {
            icon: <BarChart3 className="text-purple-400" size={28} />,
            title: 'Transparência Total',
            desc: 'Dados abertos e relatórios públicos sobre todas as demandas e resoluções da prefeitura.',
            color: 'from-purple-500/10 to-purple-500/5',
            border: 'border-purple-500/20',
        },
    ];

    const stats = [
        { value: '12.4k', label: 'Solicitações atendidas', icon: <CheckCircle size={20} className="text-green-400" /> },
        { value: '98%', label: 'Satisfação dos cidadãos', icon: <Star size={20} className="text-yellow-400" /> },
        { value: '3.2k', label: 'Usuários ativos', icon: <Users size={20} className="text-blue-400" /> },
        { value: '48h', label: 'Tempo médio de resposta', icon: <Zap size={20} className="text-orange-400" /> },
    ];

    const testimonials = [
        {
            name: 'Ana Lima',
            role: 'Moradora do Plano Piloto',
            text: 'Reportei uma rampa quebrada e em menos de 3 dias já estava resolvida. Sistema incrível!',
            avatar: 'AL',
            color: 'bg-blue-600',
        },
        {
            name: 'Carlos Mendes',
            role: 'Deficiente visual',
            text: 'Finalmente um portal que pensa em mim. A acessibilidade auditiva e o contraste são perfeitos.',
            avatar: 'CM',
            color: 'bg-purple-600',
        },
        {
            name: 'Fernanda Costa',
            role: 'Moradora de Taguatinga',
            text: 'Consigo acompanhar cada etapa da minha solicitação pelo app. Transparência total.',
            avatar: 'FC',
            color: 'bg-green-600',
        },
    ];

    return (
        <div className="min-h-screen bg-[#080d12] text-white font-sans overflow-x-hidden">

            {/* ── Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#080d12]/80 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-9 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/40">
                        <MapPin size={18} />
                    </div>
                    <span className="text-lg font-bold tracking-tight">Cidadão <span className="text-blue-400">Informa</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => navigate('/cadastro')}
                        className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5"
                    >
                        Cadastrar-se
                    </button>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-24 pb-16">
                {/* Background glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="relative z-10 flex flex-col items-center gap-6 max-w-3xl"
                >
                    {/* Badge */}
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-xs font-semibold tracking-wide uppercase">
                        <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Portal de Acessibilidade Urbana
                    </span>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
                        Cidadão
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400">
                            Informa
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
                        Reporte problemas de acessibilidade na sua cidade, acompanhe o andamento
                        em tempo real e contribua para uma cidade mais inclusiva.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/cadastro')}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-2xl shadow-xl shadow-blue-600/35 transition-colors"
                        >
                            Criar conta gratuita
                            <ArrowRight size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-center gap-2 px-8 py-4 border border-slate-700 hover:border-slate-500 bg-white/5 hover:bg-white/8 text-white text-base font-semibold rounded-2xl transition-all"
                        >
                            Já tenho conta
                            <ChevronRight size={18} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Map preview card */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="relative z-10 mt-16 w-full max-w-4xl rounded-2xl border border-white/10 bg-[#111820] overflow-hidden shadow-2xl shadow-black/60"
                >
                    {/* Fake map UI */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0d151e]">
                        <div className="size-3 rounded-full bg-red-500/70" />
                        <div className="size-3 rounded-full bg-yellow-500/70" />
                        <div className="size-3 rounded-full bg-green-500/70" />
                        <div className="ml-3 flex-1 h-5 rounded bg-white/5 text-[10px] text-slate-500 flex items-center px-3">
                            cidadaoinforma.gov.br/mapa
                        </div>
                    </div>
                    <div className="relative h-64 bg-[#141e28] flex items-center justify-center overflow-hidden">
                        {/* Fake dark map grid */}
                        <div className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: 'linear-gradient(#1e3a4a 1px, transparent 1px), linear-gradient(90deg, #1e3a4a 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }}
                        />
                        {/* Fake pins */}
                        {[
                            { top: '30%', left: '25%', color: 'bg-red-500', pulse: true },
                            { top: '55%', left: '50%', color: 'bg-yellow-500', pulse: false },
                            { top: '40%', left: '70%', color: 'bg-green-500', pulse: false },
                            { top: '65%', left: '35%', color: 'bg-blue-500', pulse: true },
                            { top: '25%', left: '58%', color: 'bg-red-500', pulse: false },
                        ].map((pin, i) => (
                            <span key={i} className="absolute flex items-center justify-center" style={{ top: pin.top, left: pin.left }}>
                                {pin.pulse && <span className={`absolute size-6 rounded-full ${pin.color} opacity-30 animate-ping`} />}
                                <span className={`size-3.5 rounded-full ${pin.color} shadow-lg border-2 border-white/30`} />
                            </span>
                        ))}
                        <div className="relative z-10 bg-[#111820]/90 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3 shadow-xl">
                            <Eye size={18} className="text-blue-400" />
                            <span className="text-sm text-slate-300 font-medium">5 solicitações na área</span>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Stats ── */}
            <section className="py-16 px-6 border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex flex-col items-center text-center gap-2 p-6 rounded-2xl border border-white/5 bg-white/[0.03]"
                        >
                            {s.icon}
                            <span className="text-3xl font-black text-white">{s.value}</span>
                            <span className="text-xs text-slate-500 font-medium">{s.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                            Tudo que sua cidade precisa,<br />
                            <span className="text-blue-400">na palma da sua mão</span>
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto">
                            Uma plataforma pensada para cidadãos e gestores públicos trabalharem juntos.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-6 rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} flex flex-col gap-4 hover:scale-[1.02] transition-transform`}
                            >
                                <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    {f.icon}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">{f.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-2">O que dizem os cidadãos</h2>
                        <p className="text-slate-400 text-sm">Histórias reais de quem usa Cidadão Informa</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-[#111820] border border-white/8 rounded-2xl p-6 flex flex-col gap-4"
                            >
                                <MessageSquare size={20} className="text-blue-400/60" />
                                <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.text}"</p>
                                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                                    <div className={`size-9 rounded-full ${t.color} flex items-center justify-center text-xs font-bold shrink-0`}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold">{t.name}</p>
                                        <p className="text-slate-500 text-xs">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA final ── */}
            <section className="py-28 px-6 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/12 rounded-full blur-[100px] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto"
                >
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                        Comece agora.<br />
                        <span className="text-blue-400">É gratuito.</span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Junte-se a milhares de cidadãos que já estão transformando suas cidades.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate('/cadastro')}
                            className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-0.5 text-base"
                        >
                            Criar minha conta <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold rounded-2xl transition-all text-base"
                        >
                            Já tenho conta
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer className="py-8 px-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-6 rounded bg-blue-600">
                        <MapPin size={12} />
                    </div>
                    <span>Cidadão Informa © 2026</span>
                </div>
                <div className="flex gap-5">
                    <a href="#" className="hover:text-slate-400 transition-colors">Termos de Uso</a>
                    <a href="#" className="hover:text-slate-400 transition-colors">Privacidade</a>
                    <a href="#" className="hover:text-slate-400 transition-colors">Acessibilidade</a>
                </div>
            </footer>
        </div>
    );
}
