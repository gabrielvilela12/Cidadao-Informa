import React, { useId, useState } from 'react';
import { User, Shield, Key, FileText, Loader2, ArrowRight, Eye, EyeOff, Home, Crown, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ApiError } from '../services/http';
import { motion, AnimatePresence } from 'framer-motion';
import { CidadaoBrand } from '../components/CidadaoBrand';
import { CitizenLoginHero } from '../components/CitizenLoginHero';
import { ServerLoginHero } from '../components/ServerLoginHero';
import { canAccessOperationalAdmin, getDefaultRouteForRole, isPlatformOwner, normalizeRole } from '../types/auth';

// ─── InputField — must be at module level to avoid remounting on each render ──
function InputField({ label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete }: any) {
    // Campo de senha ganha o botao de exibir/ocultar. O estado vive aqui para
    // atender os dois formularios (cidadao e servidor) sem duplicacao, e comeca
    // sempre oculto: o card remonta ao alternar entrar/cadastrar, então a senha
    // nunca fica exposta de um preenchimento anterior.
    const isPassword = type === 'password';
    const [revealed, setRevealed] = useState(false);
    // O <label> e irmao do <input>, nao pai, entao sem htmlFor/id o campo fica
    // sem nome acessivel e o leitor de tela cai no placeholder ("000.000.000-00"
    // em vez de "CPF"). useId da um id estavel por instancia, incluindo os dois
    // formularios de acesso na mesma pagina.
    const fieldId = useId();

    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={fieldId} className="text-xs font-bold text-slate-700">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-500">
                    <Icon size={16} />
                </div>
                <input
                    id={fieldId}
                    type={isPassword && revealed ? 'text' : type}
                    required
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    className={`auth-input w-full py-2.5 pl-7 text-base sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 ${isPassword ? 'pr-10' : 'pr-2'}`}
                    placeholder={placeholder}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed((current) => !current)}
                        // Rotulo descreve a acao e muda com o estado; sem
                        // aria-pressed junto, para o leitor de tela nao anunciar
                        // a mesma informacao duas vezes.
                        aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
                        title={revealed ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded text-slate-500 transition-colors hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        {revealed ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Texto de erro que o cidadao pode ler.
 *
 * So repassa a mensagem quando ela foi escrita para o usuario (erro do backend,
 * ou regra desta tela). Falha de configuracao, status HTTP cru e queda de rede
 * viram um aviso generico e o detalhe fica no console, para quem depura.
 */
function authErrorMessage(error: unknown): string {
    if (error instanceof ApiError && error.userFacing) return error.message;

    console.error('Falha na autenticação:', error);
    return 'Não foi possível concluir o acesso agora. Tente novamente em instantes.';
}

type LoginPortal = 'citizen' | 'server' | 'owner';

// ─── Main component ───────────────────────────────────────────────────────────
export function Login({ initialMode = false, portal = 'citizen' }: { initialMode?: boolean; portal?: LoginPortal }) {
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
    const authMode: 'citizen' | 'admin' = portal === 'citizen' ? 'citizen' : 'admin';

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
                const role = normalizeRole(data.role);
                loginSuccess(data.token, { id: data.userId, cpf: data.cpf, full_name: data.name, email: data.email, phone: data.phone, establishment_id: data.establishmentId, establishment_name: data.establishmentName, created_at: data.createdAt }, role);
                navigate('/');
            } else {
                const data = await api.login(cleanCpf, password);
                const role = normalizeRole(data.role);
                if (role !== 'citizen') {
                    throw new ApiError('Use o portal correto para acessar sua conta.', true);
                }
                loginSuccess(data.token, { id: data.userId, cpf: data.cpf, full_name: data.name, email: data.email, phone: data.phone, establishment_id: data.establishmentId, establishment_name: data.establishmentName, created_at: data.createdAt }, role);
                navigate(getDefaultRouteForRole(role));
            }
        } catch (err) {
            setErrorDesc(authErrorMessage(err));
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
            const role = normalizeRole(data.role);
            if (portal === 'owner' && !isPlatformOwner(role)) {
                throw new ApiError('Acesso restrito aos donos da plataforma.', true);
            }
            if (portal === 'server' && !canAccessOperationalAdmin(role)) {
                throw new ApiError('Acesso restrito a diretores e servidores autorizados.', true);
            }
            if (portal === 'citizen' && !canAccessOperationalAdmin(role) && !isPlatformOwner(role)) {
                throw new ApiError('Acesso restrito à equipe autorizada.', true);
            }

            loginSuccess(
                data.token,
                {
                    id: data.userId,
                    cpf: data.cpf,
                    full_name: data.name,
                    email: data.email,
                    phone: data.phone,
                    establishment_id: data.establishmentId,
                    establishment_name: data.establishmentName,
                    created_at: data.createdAt
                },
                role
            );
            navigate(getDefaultRouteForRole(role));
        } catch (err) {
            setErrorDesc(authErrorMessage(err));
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
    const isOwnerPortal = portal === 'owner';
    const isServerPortal = portal === 'server';
    const portalLabel = isOwnerPortal ? 'Acesso dos donos' : isServerPortal ? 'Central do servidor' : 'Portal do cidadão';
    const citizenAccessPath = isRegistering ? '/cadastro' : '/login';
    const platformAccessPath = isOwnerPortal ? '/login-dono' : '/login-servidor';
    const accessChoiceBase = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition-all';
    const accessChoiceActive = 'bg-white text-slate-950 shadow-sm';
    const accessChoiceInactive = 'text-slate-500 hover:bg-white/70 hover:text-slate-900';
    const platformProfileBase = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors';

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
                                <CidadaoBrand compact iconClassName="size-12" />
                            </Link>
                        </div>

                        <div className="flex flex-col gap-6 px-6 py-7 sm:px-8">
                            {/* Heading */}
                        <div className="flex flex-col items-center gap-2 text-center">
                                <span className="text-blue-600 text-lg font-medium leading-snug">
                                    {isAdmin ? portalLabel : isRegistering ? 'Preencha seus dados para' : 'Por favor, insira seu'}
                                </span>
                                <h1 className="text-xl font-black leading-snug text-slate-900">
                                    {isAdmin ? 'Acesse sua conta' : isRegistering ? 'criar sua conta' : 'CPF e Senha'}
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {isOwnerPortal
                                    ? 'Entrada exclusiva para Gabriel e Luis.'
                                    : isServerPortal
                                      ? 'Entrada para diretores e servidores das prefeituras.'
                                        : isRegistering
                                            ? 'Informe seus dados para acompanhar solicitações de acessibilidade.'
                                            : 'Acesse para reportar e acompanhar suas solicitações.'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div
                                    role="group"
                                    aria-label="Escolha entre cidadão e plataforma"
                                    className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1"
                                >
                                    <Link
                                        to={citizenAccessPath}
                                        aria-current={!isAdmin ? 'page' : undefined}
                                        className={`${accessChoiceBase} ${!isAdmin ? accessChoiceActive : accessChoiceInactive}`}
                                    >
                                        <User size={15} /> Cidadão
                                    </Link>
                                    <Link
                                        to={platformAccessPath}
                                        aria-current={isAdmin ? 'page' : undefined}
                                        className={`${accessChoiceBase} ${isAdmin ? accessChoiceActive : accessChoiceInactive}`}
                                    >
                                        <Building2 size={15} /> Plataforma
                                    </Link>
                                </div>

                                {isAdmin && (
                                    <div
                                        role="group"
                                        aria-label="Escolha o perfil da plataforma"
                                        className="grid grid-cols-2 gap-2"
                                    >
                                        <Link
                                            to="/login-servidor"
                                            aria-current={isServerPortal ? 'page' : undefined}
                                            className={`${platformProfileBase} ${isServerPortal
                                                ? 'border-amber-300 bg-amber-50 text-slate-950'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-slate-900'
                                                }`}
                                        >
                                            <Shield size={14} /> Servidor
                                        </Link>
                                        <Link
                                            to="/login-dono"
                                            aria-current={isOwnerPortal ? 'page' : undefined}
                                            className={`${platformProfileBase} ${isOwnerPortal
                                                ? 'border-blue-300 bg-blue-50 text-slate-950'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-slate-900'
                                                }`}
                                        >
                                            <Crown size={14} /> Dono
                                        </Link>
                                    </div>
                                )}
                            </div>

                        {/*
                          Error.

                          O contêiner com role="alert" fica sempre montado, mesmo
                          vazio: região viva que nasce junto com o texto costuma
                          não ser anunciada. Sem isso, quem usa leitor de tela
                          tentava entrar e não recebia nenhum retorno da falha.
                        */}
                        <div role="alert" aria-live="assertive">
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
                        </div>

                        {/* Citizen form */}
                        {authMode === 'citizen' ? (
                          <>
                            {/* Seletor de entrar/cadastrar ANTES do formulário: antes ele
                                ficava abaixo do submit, competindo com o botão principal
                                e sugerindo que era a ação final. */}
                            <div
                                role="group"
                                aria-label="Entrar ou criar conta"
                                className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1"
                            >
                                <button
                                    type="button"
                                    aria-pressed={!isRegistering}
                                    onClick={() => switchMode(false)}
                                    className={`auth-mode-choice rounded-full px-4 py-2 text-sm font-bold transition-all ${!isRegistering
                                        ? 'is-active bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    <span>Entrar</span>
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={isRegistering}
                                    onClick={() => switchMode(true)}
                                    className={`auth-mode-choice rounded-full px-4 py-2 text-sm font-bold transition-all ${isRegistering
                                        ? 'is-active bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    <span>Cadastrar</span>
                                </button>
                            </div>
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
                                <Link
                                    to="/"
                                    className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
                                >
                                    <Home size={15} /> Voltar para página inicial
                                </Link>
                            </form>
                          </>
                        ) : (
                            /* Admin form */
                            <form onSubmit={handleAdminAuth} className="flex flex-col gap-4">
                                <InputField label={isOwnerPortal ? 'CPF do dono' : 'Código do Servidor'} icon={isOwnerPortal ? Crown : Shield} value={cpf}
                                    onChange={(e: any) => setCpf(sanitizeCPF(e.target.value).slice(0, 11))} placeholder="00000000000" autoComplete="username" />
                                <InputField label="Senha" icon={Key} type="password" value={password}
                                    onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                            <p className="text-center text-xs text-slate-600">
                                {isOwnerPortal ? 'Apenas donos da plataforma autorizados.' : 'Acesso restrito a diretores e servidores autorizados.'}
                            </p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full border border-amber-500 bg-amber-500 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>{isOwnerPortal ? 'Acessar Admin Master' : 'Acessar Central'} <ArrowRight size={16} /></>}
                                </button>
                                {isServerPortal && (
                                    <Link
                                        to="/cadastro-prefeitura"
                                        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
                                    >
                                        <Building2 size={15} /> Cadastrar prefeitura
                                    </Link>
                                )}
                                <Link
                                    to="/"
                                    className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
                                >
                                    <Home size={15} /> Voltar para página inicial
                                </Link>
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

                <motion.div
                    layout
                    transition={{ duration: 0.65, type: 'spring', stiffness: 60, damping: 18 }}
                    style={{ order: isAdmin ? 2 : 1 }}
                    className={`hidden lg:flex flex-1 items-center justify-center overflow-hidden ${isAdmin ? isOwnerPortal ? 'bg-[#eaf2ff]' : 'bg-[#fff8dd]' : 'auth-citizen-gradient'}`}
                >
                    {isAdmin ? (
                        <ServerLoginHero />
                    ) : (
                        <CitizenLoginHero />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
