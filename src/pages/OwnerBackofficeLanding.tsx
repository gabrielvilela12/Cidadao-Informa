import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Crown,
  CreditCard,
  FileClock,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { CidadaoBrand } from '../components/CidadaoBrand';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ApiError } from '../services/http';
import { getDefaultRouteForRole, isPlatformOwner, normalizeRole } from '../types/auth';

const MotionLink = motion(Link);

const DEMO_OWNER_CPF = '33344455566';
const DEMO_OWNER_PASSWORD = 'Demo@123';

const backofficeHighlights = [
  { icon: Building2, label: 'White-labels', value: 'Prefeituras' },
  { icon: FileClock, label: 'Cadastros', value: 'Pendentes' },
  { icon: CreditCard, label: 'Assinaturas', value: 'Controle' },
  { icon: BarChart3, label: 'Operação', value: 'Global' },
];

const controlAreas = [
  {
    icon: Building2,
    title: 'Prefeituras e assinaturas',
    text: 'Acompanhe quais cidades entraram, qual plano escolheram e o estágio de liberação.',
  },
  {
    icon: UserCog,
    title: 'Gestão dos acessos',
    text: 'Veja donos, diretores e servidores vinculados a cada operação regional.',
  },
  {
    icon: ClipboardList,
    title: 'Protocolos por estabelecimento',
    text: 'Entre no detalhe de uma prefeitura para enxergar os registros recebidos naquela base.',
  },
  {
    icon: ShieldCheck,
    title: 'Visão executiva',
    text: 'Separe o painel dos donos da operação diária de servidores e cidadãos.',
  },
];

function ownerLandingError(error: unknown) {
  if (error instanceof ApiError && error.userFacing) return error.message;
  console.error('Falha ao acessar demonstração do dono:', error);
  return 'Não foi possível entrar na demonstração agora.';
}

export function OwnerBackofficeLanding() {
  const { isAuthenticated, loginSuccess, role } = useApp();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState('');
  const ownerAccessPath = isAuthenticated && isPlatformOwner(role)
    ? '/backoffice'
    : '/login-dono';
  const ownerAccessLabel = isAuthenticated && isPlatformOwner(role)
    ? 'Abrir backoffice'
    : 'Acessar backoffice';

  const enterDemo = async () => {
    setError('');
    setLoadingDemo(true);

    try {
      const data = await api.login(DEMO_OWNER_CPF, DEMO_OWNER_PASSWORD);
      const demoRole = normalizeRole(data.role);
      if (!isPlatformOwner(demoRole)) {
        throw new ApiError('A conta demo de dono não está configurada para o backoffice.', true);
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
          created_at: data.createdAt,
        },
        demoRole,
      );
      navigate(getDefaultRouteForRole(demoRole));
    } catch (err) {
      setError(ownerLandingError(err));
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F7F9FC] font-sans text-slate-950">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="Ir para a página inicial">
            <CidadaoBrand compact iconClassName="size-11" />
          </Link>
          <nav aria-label="Acessos do backoffice" className="flex items-center gap-2">
            <Link
              to="/login-servidor"
              className="hidden h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#0758BD] hover:text-[#0758BD] sm:inline-flex"
            >
              Servidor
            </Link>
            <Link
              to={ownerAccessPath}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0758BD] px-4 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-[#0C326F]"
            >
              <LockKeyhole size={16} aria-hidden="true" />
              <span>{ownerAccessLabel}</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative min-h-[92dvh] overflow-hidden px-5 pb-12 pt-28 text-white sm:px-8 lg:px-12">
          <img
            src="/hero-dashboard-mockup.png"
            alt="Dashboard do Cidadão Informa com indicadores e mapa de protocolos"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#06172F]/80" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,rgba(6,23,47,0),#F7F9FC)]" aria-hidden="true" />

          <div className="relative mx-auto flex min-h-[calc(92dvh-7rem)] max-w-[1280px] flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="max-w-3xl"
            >
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#FFCD07]">
                <Crown size={18} aria-hidden="true" />
                Acesso dos donos
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Backoffice Cidadão Informa
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-blue-50 sm:text-lg">
                A entrada separada para Gabriel e Luis acompanharem prefeituras, cadastros, assinaturas e a visão global da plataforma.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <MotionLink
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  to={ownerAccessPath}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-[#FFCD07] px-7 text-base font-black text-slate-950 shadow-xl shadow-black/20 transition-colors hover:bg-[#FFD94A]"
                >
                  {ownerAccessLabel}
                  <ArrowRight size={19} aria-hidden="true" />
                </MotionLink>
                <button
                  type="button"
                  onClick={enterDemo}
                  disabled={loadingDemo}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-white/30 bg-white/10 px-7 text-base font-black text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingDemo ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : <Crown size={19} aria-hidden="true" />}
                  Entrar como dono demo
                </button>
              </div>

              {error && (
                <p className="mt-4 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                  {error}
                </p>
              )}
            </motion.div>

            <div className="mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
              {backofficeHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                    <Icon size={20} className="text-[#FFCD07]" aria-hidden="true" />
                    <p className="mt-3 text-lg font-black">{item.value}</p>
                    <p className="mt-1 text-xs font-semibold text-blue-100">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 pb-14 pt-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.1em] text-[#0758BD]">Backoffice</p>
                <h2 className="mt-2 text-3xl font-black text-[#071A3A]">O dono vê o produto por cima</h2>
              </div>
              <Link
                to="/cadastro-prefeitura"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-[#0758BD] transition-colors hover:bg-blue-50"
              >
                <Building2 size={17} aria-hidden="true" />
                Cadastro de prefeitura
              </Link>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {controlAreas.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-[#0758BD]">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-lg font-black text-[#071A3A]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-black text-[#071A3A]">Rota de entrada separada</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    A entrada do dono fica separada da área pública do cidadão e leva direto ao painel autenticado.
                  </p>
                </div>
              </div>
              <Link
                to={ownerAccessPath}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0758BD] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0C326F]"
              >
                Ir para o backoffice
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
