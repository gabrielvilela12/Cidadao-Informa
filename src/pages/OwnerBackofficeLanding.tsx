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

const overviewItems = [
  { icon: Building2, label: 'Prefeituras', value: 'Credenciamento' },
  { icon: FileClock, label: 'Cadastros', value: 'Aprovação' },
  { icon: CreditCard, label: 'Assinaturas', value: 'Financeiro' },
  { icon: BarChart3, label: 'IA', value: 'Consumo' },
];

const controlAreas = [
  {
    icon: Building2,
    title: 'Prefeituras',
    text: 'Acompanhe solicitações de entrada, planos escolhidos e status de liberação.',
  },
  {
    icon: UserCog,
    title: 'Acessos',
    text: 'Veja donos, diretores e servidores vinculados a cada operação municipal.',
  },
  {
    icon: ClipboardList,
    title: 'Operação',
    text: 'Entre no detalhe de uma prefeitura para consultar protocolos e indicadores.',
  },
  {
    icon: ShieldCheck,
    title: 'Governança',
    text: 'Separe a visão executiva da rotina de servidores, mantendo rotas e permissões claras.',
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
          chat_enabled: data.chatEnabled ?? true,
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
    <div className="min-h-dvh bg-[#F6F8FB] font-sans text-slate-950">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" aria-label="Ir para a página inicial">
            <CidadaoBrand compact iconClassName="size-11" />
          </Link>
          <nav aria-label="Acessos do backoffice" className="flex items-center gap-2">
            <Link
              to="/login-servidor"
              className="hidden h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-blue-600 hover:text-blue-700 sm:inline-flex"
            >
              Servidor
            </Link>
            <Link
              to={ownerAccessPath}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-blue-700"
            >
              <LockKeyhole size={16} aria-hidden="true" />
              <span>{ownerAccessLabel}</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-10 pt-28 sm:px-8 lg:px-10">
          <img
            src="/hero-dashboard-mockup.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#F6F8FB_0%,rgba(246,248,251,0.96)_43%,rgba(246,248,251,0.76)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#F6F8FB]" />

          <div className="relative mx-auto flex min-h-[70dvh] max-w-[1320px] flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="max-w-3xl"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-blue-700 shadow-sm">
                <Crown size={16} aria-hidden="true" />
                Acesso dos donos
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight text-[#071A3A] sm:text-5xl lg:text-6xl">
                Backoffice Cidadão Informa
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                Entrada executiva para Gabriel e Luis acompanharem prefeituras, cadastros, assinaturas e consumo de IA em um só painel.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <MotionLink
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  to={ownerAccessPath}
                  className="inline-flex h-13 items-center justify-center gap-3 rounded-lg bg-blue-600 px-7 text-base font-black text-white shadow-xl shadow-blue-900/15 transition-colors hover:bg-blue-700"
                >
                  {ownerAccessLabel}
                  <ArrowRight size={19} aria-hidden="true" />
                </MotionLink>
                <button
                  type="button"
                  onClick={enterDemo}
                  disabled={loadingDemo}
                  className="inline-flex h-13 items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-7 text-base font-black text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
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

            <div className="mt-10 grid max-w-5xl grid-cols-2 gap-3 lg:grid-cols-4">
              {overviewItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,42,80,0.08)] backdrop-blur-sm">
                    <Icon size={20} className="text-blue-700" aria-hidden="true" />
                    <p className="mt-3 text-base font-black text-[#071A3A]">{item.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 pb-14 pt-4 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1320px]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.1em] text-blue-700">Painel executivo</p>
                <h2 className="mt-2 text-3xl font-black text-[#071A3A]">Controle da plataforma sem misturar com a operação diária</h2>
              </div>
              <Link
                to="/cadastro-prefeitura"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <Building2 size={17} aria-hidden="true" />
                Cadastro de prefeitura
              </Link>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {controlAreas.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,42,80,0.06)]">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-lg font-black text-[#071A3A]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
                  <CheckCircle2 size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-black text-[#071A3A]">Rota separada do cidadão</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    A área do dono fica fora da landing pública e leva direto ao backoffice autenticado.
                  </p>
                </div>
              </div>
              <Link
                to={ownerAccessPath}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
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
