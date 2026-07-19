import React, { useState } from 'react';
import { User, Shield, Key, FileText, Loader2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CidadaoBrand } from '../components/CidadaoBrand';

// ─── InputField — must be at module level to avoid remounting on each render ──
function InputField({ label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete }: any) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-500">
                    <Icon size={16} />
                </div>
                <input
                    type={type}
                    required
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    className="auth-input w-full py-2.5 pl-7 pr-2 text-base sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Login({ initialMode = false }: { initialMode?: boolean }) {
    const { loginSuccess } = useApp();
    const navigate = useNavigate();

    const [isRegistering, setIsRegistering] = useState(initialMode);
    const [cpf, setCpf] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorDesc, setErrorDesc] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
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
        if (isRegistering && !acceptedTerms) { setErrorDesc('Para criar sua conta, confirme que leu e aceita os Termos de Uso.'); setLoading(false); return; }

        try {
            if (isRegistering) {
                if (!name.trim()) { setErrorDesc('O Nome Completo é obrigatório.'); setLoading(false); return; }
                const data = await api.register(name, email, cleanCpf, password);
                loginSuccess(data.token, { id: data.userId, cpf: data.cpf, full_name: data.name, email: data.email, phone: data.phone, created_at: data.createdAt }, data.role as 'citizen');
                navigate('/');
            } else {
                const data = await api.login(cleanCpf, password);
                loginSuccess(data.token, { id: data.userId, cpf: data.cpf, full_name: data.name, email: data.email, phone: data.phone, created_at: data.createdAt }, data.role as 'citizen' | 'admin');
                navigate(data.role === 'admin' ? '/admin' : '/');
            }
        } catch (err: any) {
            setErrorDesc(err.message || 'Erro na autenticação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorDesc('');
        setLoading(true);

        const cleanCpf = sanitizeCPF(cpf);
        if (cleanCpf.length !== 11) { setErrorDesc('O CPF deve ter 11 dígitos.'); setLoading(false); return; }
        if (password.length < 6) { setErrorDesc('A senha deve ter pelo menos 6 caracteres.'); setLoading(false); return; }

        try {
            const data = await api.login(cleanCpf, password);
            if (data.role !== 'admin') {
                throw new Error('Acesso restrito a servidores autorizados.');
            }

            loginSuccess(
                data.token,
                {
                    id: data.userId,
                    cpf: data.cpf,
                    full_name: data.name,
                    email: data.email,
                    phone: data.phone,
                    created_at: data.createdAt
                },
                'admin'
            );
            navigate('/admin');
        } catch (err: any) {
            setErrorDesc(err.message || 'Erro na autenticação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (toRegister: boolean) => {
        setIsRegistering(toRegister);
        setErrorDesc('');
        setAcceptedTerms(false);
        navigate(toRegister ? '/cadastro' : '/login');
    };

    // Panel content config per authMode
    const isAdmin = authMode === 'admin';

    return (
        <div className={`min-h-dvh text-slate-900 font-sans flex flex-col overflow-x-hidden ${isAdmin ? 'bg-[#f7faff]' : 'auth-citizen-gradient'}`}>

            {/* ── Navbar ─────────────────────────────────────── */}
            <nav className="hidden">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <CidadaoBrand />
                </Link>

                {isRegistering && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 hidden sm:block">Já tem conta?</span>
                        <button
                            onClick={() => switchMode(false)}
                            className="px-4 py-2 font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Entrar
                        </button>
                    </div>
                )}
            </nav>

            {/* ── Main content ────────────────────────────────── */}
            <div className="flex-1 flex items-stretch overflow-y-auto overflow-x-hidden">

                {/* ── Form Panel ── */}
                <motion.div
                    layout
                    transition={{ duration: 0.65, type: 'spring', stiffness: 60, damping: 18 }}
                    style={{ order: isAdmin ? 1 : 2 }}
                    className={`w-full lg:w-[42vw] lg:min-w-[460px] flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12 relative z-10 ${isAdmin ? 'bg-[#f7faff]' : 'auth-citizen-gradient'}`}
                >
                    <motion.div
                        key={isRegistering ? 'register' : 'login'}
                        initial={{ opacity: 0, x: isRegistering ? 40 : -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                        className="auth-login-card w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
                    >
                        <div className="border-b border-slate-100 bg-slate-50 px-6 py-6">
                            <Link to="/" className="flex justify-center">
                                <CidadaoBrand compact />
                            </Link>
                        </div>

                        <div className="flex flex-col gap-6 px-6 py-7 sm:px-8">
                            {/* Heading */}
                        <div className="flex flex-col items-center gap-2 text-center">
                                <span className="text-blue-600 text-lg font-medium leading-snug">
                                    {isAdmin ? 'Bem-vindo de volta' : isRegistering ? 'Preencha seus dados para' : 'Por favor, insira seu'}
                                </span>
                                <h1 className="text-xl font-black leading-snug text-slate-900">
                                    {isAdmin ? 'Acesse sua conta' : isRegistering ? 'criar sua conta' : 'CPF e senha'}
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {isAdmin
                                        ? 'Digite seu CPF e senha para continuar.'
                                        : isRegistering
                                            ? 'Informe seus dados para acompanhar solicitações de acessibilidade.'
                                            : 'Acesse para reportar e acompanhar suas solicitações.'}
                                </p>
                            </div>

                            {/* Mode toggle */}
                        <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => setAuthMode('citizen')}
                                className={`rounded-full py-2 text-sm font-bold transition-all flex justify-center items-center gap-2 ${authMode === 'citizen' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                <User size={15} /> Cidadão
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('admin'); setIsRegistering(false); setAcceptedTerms(false); }}
                                className={`rounded-full py-2 text-sm font-bold transition-all flex justify-center items-center gap-2 ${authMode === 'admin' ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20' : 'text-slate-500 hover:text-slate-900'}`}
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
                                    className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700"
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

                                {isRegistering && (
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                        <input
                                            id="accepted-terms"
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-blue-600"
                                        />
                                        <label htmlFor="accepted-terms" className="text-sm text-slate-600 leading-relaxed">
                                            Li e aceito os{' '}
                                            <Link to="/termos-de-uso" className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-4 hover:underline">
                                                Termos de Uso
                                            </Link>
                                            .
                                        </label>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                                >
                                    {loading
                                        ? <Loader2 size={18} className="animate-spin" />
                                        : <>{isRegistering ? 'Criar minha conta' : 'Entrar agora'} <ArrowRight size={16} /></>}
                                </button>

                                <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
                                    <button
                                        type="button"
                                        aria-pressed={!isRegistering}
                                        onClick={() => switchMode(false)}
                                        className={`auth-mode-choice rounded-full px-4 py-2.5 text-sm font-bold transition-all ${!isRegistering
                                            ? 'is-active bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-white text-slate-600 shadow-sm hover:text-slate-900'
                                            }`}
                                    >
                                        <span>Entrar</span>
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={isRegistering}
                                        onClick={() => switchMode(true)}
                                        className={`auth-mode-choice rounded-full px-4 py-2.5 text-sm font-bold transition-all ${isRegistering
                                            ? 'is-active bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-white text-slate-600 shadow-sm hover:text-slate-900'
                                            }`}
                                    >
                                        <span>Cadastrar</span>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* Admin form */
                            <form onSubmit={handleAdminAuth} className="flex flex-col gap-4">
                                <InputField label="CPF do Servidor" icon={Shield} value={cpf}
                                    onChange={(e: any) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" autoComplete="username" />
                                <InputField label="Senha" icon={Key} type="password" value={password}
                                    onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full border border-amber-500 bg-amber-500 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Acessar Painel <ArrowRight size={16} /></>}
                                </button>
                                <p className="text-center text-xs text-slate-600">Acesso restrito a servidores municipais autorizados.</p>
                            </form>
                        )}
                        </div>
                        <div className="auth-accessibility-strip px-6 py-5 text-center">
                            <p className="text-sm font-semibold">Você possui alguma necessidade especial?</p>
                            <Link to="/acessibilidade" className="auth-accessibility-link text-xs font-bold underline underline-offset-4">
                                Ativar opções de acessibilidade
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>

                <div className={`hidden lg:flex flex-1 items-center justify-center overflow-hidden ${isAdmin ? 'order-2 bg-[#fff8dd]' : 'order-1 auth-citizen-gradient'}`}>
                    <img
                        src={isAdmin ? '/login-servidor-hero.jpg' : '/login-participacao-hero.jpg'}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-contain"
                    />
                </div>
            </div>
        </div>
    );
}
