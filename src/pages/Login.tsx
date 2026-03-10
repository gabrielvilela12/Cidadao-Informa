import React, { useState } from 'react';
import { MapPin, User, Shield, Key, FileText, Loader2, ArrowRight, CheckCircle, BarChart3, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// ─── InputField — must be at module level to avoid remounting on each render ──
function InputField({ label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Icon size={16} />
                </div>
                <input
                    type={type}
                    required
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 text-sm
                     placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40
                     transition-all hover:border-white/20"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}

// ─── Citizen app preview mockup ───────────────────────────────────────────────
function AppPreviewMockup() {
    return (
        <div className="relative w-full max-w-sm mx-auto select-none">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="bg-[#111820]/90 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Minhas Solicitações</p>
                        <p className="text-white font-bold text-lg">3 Ativas</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">Ao vivo</span>
                    </div>
                </div>

                <div className="space-y-2.5">
                    {[
                        { label: 'Buraco na calçada', status: 'Em Análise', color: 'bg-yellow-500', dot: 'bg-yellow-400', addr: 'Av. Paulista, 1200' },
                        { label: 'Piso tátil danificado', status: 'Aberto', color: 'bg-blue-500', dot: 'bg-blue-400', addr: 'R. Augusta, 500' },
                        { label: 'Rampa bloqueada', status: 'Concluído', color: 'bg-green-500', dot: 'bg-green-400', addr: 'R. da Consolação, 80' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                            <span className={`size-2 rounded-full ${item.dot} shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-semibold truncate">{item.label}</p>
                                <p className="text-slate-500 text-[10px] truncate">{item.addr}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${item.color}`}>
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -top-10 -right-6 bg-blue-600 text-white rounded-2xl px-4 py-3 shadow-xl shadow-blue-600/40"
            >
                <p className="text-[10px] font-medium opacity-80">Tempo de resposta</p>
                <p className="text-xl font-black">48h</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute -bottom-8 -left-6 bg-[#111820] border border-white/10 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
                <div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle size={16} className="text-green-400" />
                </div>
                <div>
                    <p className="text-white text-xs font-bold">Resolvido!</p>
                    <p className="text-slate-500 text-[10px]">Rampa bloqueada</p>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Admin panel mockup ───────────────────────────────────────────────────────
function AdminPreviewMockup() {
    const queue = [
        { id: '#4821', label: 'Calçada danificada', addr: 'Av. Brasil, 340', status: 'Novo', color: 'bg-blue-500', dot: 'bg-blue-400' },
        { id: '#4820', label: 'Piso tátil quebrado', addr: 'R. 7 de Setembro, 12', status: 'Atribuído', color: 'bg-amber-500', dot: 'bg-amber-400' },
        { id: '#4819', label: 'Rampa de acesso', addr: 'Praça da Sé, 1', status: 'Concluído', color: 'bg-emerald-500', dot: 'bg-emerald-400' },
    ];
    return (
        <div className="relative w-full max-w-sm mx-auto select-none">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="bg-[#111820]/90 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Fila de Solicitações</p>
                        <p className="text-white font-bold text-lg">3 Pendentes</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs text-amber-400 font-medium">Ao vivo</span>
                    </div>
                </div>

                <div className="space-y-2.5">
                    {queue.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                            <span className={`size-2 rounded-full ${item.dot} shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-slate-500 text-[10px] font-mono">{item.id}</p>
                                    <p className="text-white text-xs font-semibold truncate">{item.label}</p>
                                </div>
                                <p className="text-slate-500 text-[10px] truncate">{item.addr}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${item.color}`}>
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="flex justify-between mb-1">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Meta SLA</p>
                        <p className="text-[10px] text-amber-400 font-bold">78% atendido</p>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '78%' }} />
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -top-10 -right-6 bg-amber-500 text-white rounded-2xl px-4 py-3 shadow-xl shadow-amber-500/40"
            >
                <p className="text-[10px] font-medium opacity-80">Atribuídas hoje</p>
                <p className="text-xl font-black">14</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute -bottom-8 -left-6 bg-[#111820] border border-white/10 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
                <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle size={16} className="text-emerald-400" />
                </div>
                <div>
                    <p className="text-white text-xs font-bold">Equipe atribuída</p>
                    <p className="text-slate-500 text-[10px]">Protocolo #4820</p>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Login({ initialMode = false }: { initialMode?: boolean }) {
    const { setRole, loginSuccess } = useApp();
    const navigate = useNavigate();

    const [isRegistering, setIsRegistering] = useState(initialMode);
    const [cpf, setCpf] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorDesc, setErrorDesc] = useState('');
    const [authMode, setAuthMode] = useState<'citizen' | 'admin'>('citizen');

    const sanitizeCPF = (raw: string) => raw.replace(/\D/g, '');

    const formatCPF = (val: string) =>
        val.replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14);

    const handleCitizenAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorDesc('');
        setLoading(true);

        const cleanCpf = sanitizeCPF(cpf);
        if (cleanCpf.length !== 11) { setErrorDesc('O CPF deve ter 11 dígitos.'); setLoading(false); return; }
        if (isRegistering && (!email || !email.includes('@'))) { setErrorDesc('Informe um e-mail válido.'); setLoading(false); return; }
        if (password.length < 6) { setErrorDesc('A senha deve ter pelo menos 6 caracteres.'); setLoading(false); return; }

        try {
            if (isRegistering) {
                if (!name.trim()) { setErrorDesc('O Nome Completo é obrigatório.'); setLoading(false); return; }
                const data = await api.register(name, email, cleanCpf, password);
                loginSuccess(data.token, { id: data.userId, cpf: data.cpf, full_name: data.name, email: data.email, created_at: data.createdAt }, data.role as 'citizen');
                navigate('/');
            } else {
                const data = await api.login(cleanCpf, password);
                loginSuccess(data.token, { id: data.userId, cpf: data.cpf, full_name: data.name, email: data.email, created_at: data.createdAt }, data.role as 'citizen' | 'admin');
                navigate(data.role === 'admin' ? '/admin' : '/');
            }
        } catch (err: any) {
            setErrorDesc(err.message || 'Erro na autenticação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminMock = (e: React.FormEvent) => {
        e.preventDefault();
        setRole('admin');
        navigate('/admin');
    };

    const switchMode = (toRegister: boolean) => {
        setIsRegistering(toRegister);
        setErrorDesc('');
        navigate(toRegister ? '/cadastro' : '/login');
    };

    // Panel content config per authMode
    const isAdmin = authMode === 'admin';

    const citizenStats = [
        { icon: <CheckCircle size={16} className="text-green-400" />, value: '12.4k', label: 'Resolvidas' },
        { icon: <Zap size={16} className="text-yellow-400" />, value: '48h', label: 'Resposta média' },
        { icon: <BarChart3 size={16} className="text-blue-400" />, value: '98%', label: 'Satisfação' },
    ];

    const adminStats = [
        { icon: <BarChart3 size={16} className="text-amber-400" />, value: '14', label: 'Atribuídas hoje' },
        { icon: <Zap size={16} className="text-red-400" />, value: '3', label: 'Atrasadas' },
        { icon: <CheckCircle size={16} className="text-emerald-400" />, value: '78%', label: 'SLA cumprido' },
    ];

    const currentStats = isAdmin ? adminStats : citizenStats;

    return (
        <div className="min-h-screen bg-[#080d12] text-white font-sans flex flex-col overflow-hidden">

            {/* ── Navbar ─────────────────────────────────────── */}
            <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/5 shrink-0">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-blue-600 shadow-lg shadow-blue-600/40 group-hover:shadow-blue-600/60 transition-shadow">
                        <MapPin size={16} />
                    </div>
                    <span className="font-bold tracking-tight">Zeladoria <span className="text-blue-400">Pública</span></span>
                </Link>

                <div className="flex items-center gap-2 text-sm">
                    {isRegistering ? (
                        <>
                            <span className="text-slate-500 hidden sm:block">Já tem conta?</span>
                            <button
                                onClick={() => switchMode(false)}
                                className="px-4 py-2 font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Entrar
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="text-slate-500 hidden sm:block">Novo por aqui?</span>
                            <button
                                onClick={() => switchMode(true)}
                                className="px-4 py-2 font-bold bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5"
                            >
                                Cadastrar-se
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* ── Main content ────────────────────────────────── */}
            <div className="flex-1 flex items-stretch overflow-hidden">

                {/* ── Form Panel ── */}
                <motion.div
                    layout
                    transition={{ duration: 0.65, type: 'spring', stiffness: 60, damping: 18 }}
                    style={{ order: isRegistering ? 2 : 1 }}
                    className="flex-1 lg:max-w-xl xl:max-w-2xl flex items-center justify-center px-6 py-12 relative z-10"
                >
                    <motion.div
                        key={isRegistering ? 'register' : 'login'}
                        initial={{ opacity: 0, x: isRegistering ? 40 : -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                        className="w-full max-w-sm flex flex-col gap-7"
                    >
                        {/* Heading */}
                        <div className="flex flex-col gap-2">
                            <span className="text-blue-400 text-sm font-semibold">
                                {isRegistering ? 'Crie sua conta gratuita' : 'Bem-vindo de volta'}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                {isRegistering
                                    ? <><span>Comece a reportar</span><br /><span className="text-blue-400">agora mesmo</span></>
                                    : <><span>Acesse sua</span><br /><span className="text-blue-400">conta</span></>}
                            </h1>
                            <p className="text-slate-500 text-sm">
                                {isRegistering
                                    ? 'Preencha os dados abaixo para criar sua conta.'
                                    : 'Digite seu CPF e senha para continuar.'}
                            </p>
                        </div>

                        {/* Mode toggle */}
                        <div className="flex bg-white/5 border border-white/8 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setAuthMode('citizen')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex justify-center items-center gap-2 ${authMode === 'citizen' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                <User size={15} /> Cidadão
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('admin'); setIsRegistering(false); }}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex justify-center items-center gap-2 ${authMode === 'admin' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Shield size={15} /> Servidor
                            </button>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {errorDesc && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl text-center"
                                >
                                    {errorDesc}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Citizen form */}
                        {authMode === 'citizen' ? (
                            <form onSubmit={handleCitizenAuth} className="flex flex-col gap-4">
                                <AnimatePresence>
                                    {isRegistering && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden flex flex-col gap-4"
                                        >
                                            <InputField label="Nome Completo" icon={FileText} value={name}
                                                onChange={(e: any) => setName(e.target.value)} placeholder="Ex: João da Silva" autoComplete="name" />
                                            <InputField label="E-mail" icon={User} type="email" value={email}
                                                onChange={(e: any) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <InputField label="CPF" icon={User} value={cpf}
                                    onChange={(e: any) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" autoComplete="username" />
                                <InputField label="Senha" icon={Key} type="password" value={password}
                                    onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isRegistering ? 'new-password' : 'current-password'} />

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-1"
                                >
                                    {loading
                                        ? <Loader2 size={18} className="animate-spin" />
                                        : <>{isRegistering ? 'Criar minha conta' : 'Entrar agora'} <ArrowRight size={16} /></>}
                                </button>

                                <p className="text-center text-sm text-slate-500">
                                    {isRegistering ? 'Já tem conta? ' : 'Ainda não tem conta? '}
                                    <button
                                        type="button"
                                        onClick={() => switchMode(!isRegistering)}
                                        className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                                    >
                                        {isRegistering ? 'Fazer login' : 'Cadastre-se grátis'}
                                    </button>
                                </p>
                            </form>
                        ) : (
                            /* Admin form */
                            <form onSubmit={handleAdminMock} className="flex flex-col gap-4">
                                <InputField label="Chave de Servidor" icon={Shield} type="password" value={adminPassword}
                                    onChange={(e: any) => setAdminPassword(e.target.value)} placeholder="Insira a chave de acesso" />
                                <button
                                    type="submit"
                                    className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 border border-amber-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 mt-1 shadow-lg shadow-amber-600/25"
                                >
                                    Acessar Painel <ArrowRight size={16} />
                                </button>
                                <p className="text-center text-xs text-slate-600">Acesso restrito a servidores municipais autorizados.</p>
                            </form>
                        )}
                    </motion.div>
                </motion.div>

                {/* ── Visual Panel ── */}
                <motion.div
                    layout
                    transition={{ duration: 0.65, type: 'spring', stiffness: 60, damping: 18 }}
                    style={{ order: isRegistering ? 1 : 2 }}
                    className={`hidden lg:flex flex-1 relative items-center justify-center px-12 overflow-hidden transition-colors duration-700 ${isAdmin
                            ? 'bg-gradient-to-br from-amber-950/30 via-[#0d1520] to-[#080d12]'
                            : 'bg-gradient-to-br from-blue-950/40 via-[#0d1520] to-[#080d12]'
                        }`}
                >
                    {/* Divider */}
                    <div className={`absolute top-0 bottom-0 w-px bg-white/5 ${isRegistering ? 'right-0' : 'left-0'}`} />

                    {/* Ambient blob — color follows mode */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`blob-${authMode}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none ${isAdmin ? 'bg-amber-600/10' : 'bg-blue-600/10'
                                }`}
                        />
                    </AnimatePresence>

                    <div className="relative z-10 flex flex-col items-center gap-16 w-full">

                        {/* Tagline */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`tagline-${authMode}-${isRegistering}`}
                                initial={{ opacity: 0, y: -16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 16 }}
                                transition={{ duration: 0.35 }}
                                className="text-center"
                            >
                                {isAdmin ? (
                                    <>
                                        <h2 className="text-3xl font-black tracking-tight leading-tight mb-3">
                                            Gerencie com<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">eficiência</span>
                                        </h2>
                                        <p className="text-slate-500 text-sm max-w-xs">
                                            Acompanhe a fila de solicitações, atribua equipes e monitore o SLA em tempo real.
                                        </p>
                                    </>
                                ) : isRegistering ? (
                                    <>
                                        <h2 className="text-3xl font-black tracking-tight leading-tight mb-3">
                                            Faça parte da<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">mudança</span>
                                        </h2>
                                        <p className="text-slate-500 text-sm max-w-xs">
                                            Cadastre-se e comece a relatar problemas urbanos na sua cidade.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-black tracking-tight leading-tight mb-3">
                                            Cidade mais<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">acessível</span>{' '}para todos
                                        </h2>
                                        <p className="text-slate-500 text-sm max-w-xs">
                                            Acompanhe suas solicitações, veja o mapa de demandas e transforme sua cidade.
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Mockup — swaps between citizen and admin */}
                        <AnimatePresence mode="wait">
                            {isAdmin ? (
                                <motion.div
                                    key="admin-mockup"
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full"
                                >
                                    <AdminPreviewMockup />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="citizen-mockup"
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full"
                                >
                                    <AppPreviewMockup />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Stats row */}
                        <motion.div
                            key={`stats-${authMode}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-8 pt-4"
                        >
                            {currentStats.map((s, i) => (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    {s.icon}
                                    <span className="text-lg font-black text-white">{s.value}</span>
                                    <span className="text-[10px] text-slate-600 uppercase tracking-wide">{s.label}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
