import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Headphones,
  Landmark,
  Layers3,
  MapPinned,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AccessibilityIcon } from '../components/AccessibilityIcon';
import { CidadaoBrand } from '../components/CidadaoBrand';
import { COMMERCIAL_PLANS } from '../constants/commercialPlans';

const capabilities = [
  {
    icon: MapPinned,
    title: 'Gestão territorial',
    description: 'Visualize ocorrências por região, identifique pontos críticos e organize prioridades no mapa.',
  },
  {
    icon: Users,
    title: 'Operação integrada',
    description: 'Distribua demandas entre secretarias, equipes e servidores com permissões bem definidas.',
  },
  {
    icon: BarChart3,
    title: 'Indicadores executivos',
    description: 'Acompanhe prazos, volume, resoluções e desempenho em painéis claros para a gestão.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparência e confiança',
    description: 'Mantenha o cidadão informado durante todo o atendimento e fortaleça a prestação de contas.',
  },
];

const implementationSteps = [
  {
    number: '01',
    title: 'Diagnóstico da operação',
    description: 'Mapeamos cobertura, volume, equipes, integrações, canais e objetivos prioritários.',
  },
  {
    number: '02',
    title: 'Configuração e implantação',
    description: 'Preparamos identidade visual, áreas atendidas, acessos e fluxo entre os setores responsáveis.',
  },
  {
    number: '03',
    title: 'Acompanhamento contínuo',
    description: 'A equipe recebe suporte, indicadores e evolução de capacidade conforme a operação cresce.',
  },
];

export function PrefeituraLandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F8FC] font-sans text-[#071A3A]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link to="/" aria-label="Ir para a página do cidadão">
            <CidadaoBrand iconClassName="size-12" />
          </Link>

          <nav aria-label="Navegação para prefeituras" className="hidden items-center gap-6 lg:flex">
            <a href="#solucao" className="text-sm font-bold text-slate-600 transition-colors hover:text-[#1351B4]">Solução</a>
            <a href="#planos" className="text-sm font-bold text-slate-600 transition-colors hover:text-[#1351B4]">Planos</a>
            <a href="#implantacao" className="text-sm font-bold text-slate-600 transition-colors hover:text-[#1351B4]">Implantação</a>
            <Link to="/" className="text-sm font-bold text-slate-600 transition-colors hover:text-[#1351B4]">Sou cidadão</Link>
            <Link
              to="/acessibilidade"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-[#1351B4]"
            >
              <AccessibilityIcon size={17} className="text-[#1351B4]" aria-hidden="true" />
              Acessibilidade
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login-servidor"
              className="hidden h-11 items-center justify-center rounded-lg border border-[#B9CBE2] bg-white px-5 text-sm font-black text-[#0758BD] transition-colors hover:bg-blue-50 sm:inline-flex"
            >
              Portal do servidor
            </Link>
            <Link
              to="/cadastro-prefeitura"
              className="landing-dark-text inline-flex h-11 items-center justify-center rounded-lg bg-[#1351B4] px-4 text-sm font-black shadow-lg shadow-blue-900/15 transition-colors hover:bg-[#0C326F] sm:px-5"
            >
              Solicitar proposta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#061B3A] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            <div className="absolute -right-32 -top-40 size-[520px] rounded-full bg-[#1351B4]/35 blur-3xl" />
            <div className="absolute -bottom-52 left-[20%] size-[520px] rounded-full bg-[#168821]/20 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto grid max-w-[1360px] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <span className="landing-dark-text inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#1351B4] px-4 py-2 text-xs font-black uppercase tracking-[0.13em]">
                <Landmark size={17} className="landing-inverse-icon" aria-hidden="true" />
                Plataforma para gestão pública
              </span>
              <h1 className="landing-dark-text mt-6 max-w-3xl text-4xl font-black leading-[1.06] sm:text-5xl xl:text-6xl">
                Atendimento urbano que aproxima a prefeitura do cidadão.
              </h1>
              <p className="landing-dark-muted mt-6 max-w-2xl text-lg leading-8">
                Centralize solicitações, coordene equipes, acompanhe indicadores e ofereça transparência em uma operação adaptada à realidade do município.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/cadastro-prefeitura"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#FFCD07] px-7 text-base font-black text-[#071A3A] shadow-xl shadow-black/20 transition-colors hover:bg-[#FFD83D]"
                >
                  Solicitar análise e reunião
                  <ArrowRight size={20} aria-hidden="true" />
                </Link>
                <a
                  href="#planos"
                  className="landing-outline-button inline-flex min-h-14 items-center justify-center rounded-lg border-2 bg-transparent px-7 text-base font-black transition-colors"
                >
                  Conhecer faixas comerciais
                </a>
              </div>

              <p className="landing-dark-muted mt-6 flex items-start gap-2 text-sm leading-6">
                <CheckCircle2 size={20} className="landing-inverse-icon mt-0.5 shrink-0" aria-hidden="true" />
                A solicitação não gera cobrança nem ativa assinatura automaticamente.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-3 shadow-[0_28px_70px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-5">
                <img
                  src="/hero-dashboard-mockup.png"
                  alt="Painel de gestão do Cidadão Informa com mapa, protocolos e indicadores"
                  className="w-full rounded-xl bg-white object-cover"
                />
              </div>
              <div className="absolute -bottom-6 left-5 right-5 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:left-10 sm:right-10 sm:grid-cols-4">
                {[
                  ['White-label', 'Sua identidade'],
                  ['Regional', 'Cobertura flexível'],
                  ['Gestão', 'Acessos por equipe'],
                  ['IA', 'Uso controlado'],
                ].map(([title, description]) => (
                  <div key={title} className="px-2 py-1 text-center">
                    <p className="text-sm font-black text-[#1351B4]">{title}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section id="solucao" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1360px]">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <span className="text-sm font-black uppercase tracking-[0.12em] text-[#1351B4]">Uma operação conectada</span>
                <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Da solicitação do cidadão à decisão da gestão.</h2>
              </div>
              <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                O Cidadão Informa organiza a jornada completa: entrada da demanda, localização, triagem, encaminhamento, acompanhamento, resolução e transparência pública.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {capabilities.map((capability) => {
                const Icon = capability.icon;
                return (
                  <article key={capability.title} className="rounded-xl border border-[#D8E2EF] bg-white p-6 shadow-[0_10px_30px_rgba(15,42,80,0.06)]">
                    <span className="landing-dark-text flex size-12 items-center justify-center rounded-lg bg-[#1351B4]">
                      <Icon size={24} className="landing-inverse-icon" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-black">{capability.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{capability.description}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 rounded-xl border border-[#C9DAF1] bg-[#EAF2FF] p-6 md:grid-cols-3 lg:p-8">
              {[
                { icon: Settings2, title: 'Fluxos configuráveis', text: 'Status, categorias e responsabilidades ajustados ao município.' },
                { icon: Layers3, title: 'Visão multissetorial', text: 'Secretarias e equipes trabalhando na mesma fonte de informação.' },
                { icon: Sparkles, title: 'IA com governança', text: 'Carteira, limites e histórico de consumo separados da mensalidade.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4">
                    <Icon size={24} className="mt-0.5 shrink-0 text-[#1351B4]" aria-hidden="true" />
                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="planos" className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1360px]">
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF2FF] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#1351B4]">
                <Building2 size={17} aria-hidden="true" />
                Faixas para prefeituras e órgãos públicos
              </span>
              <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                Uma referência comercial. <span className="text-[#1657C8]">Uma proposta para cada operação.</span>
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                O valor final considera cidadãos ativos, cobertura regional, usuários internos, integrações, implantação, suporte e SLA.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {COMMERCIAL_PLANS.map((plan) => (
                <article
                  key={plan.code}
                  className={`flex min-h-[310px] flex-col rounded-xl border p-6 shadow-[0_10px_30px_rgba(15,42,80,0.07)] ${plan.featured
                    ? 'border-[#1351B4] bg-[#F3F8FF] ring-2 ring-[#1351B4]/10'
                    : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#1351B4]">{plan.audience}</p>
                      <h3 className="mt-2 text-xl font-black">{plan.name}</h3>
                    </div>
                    {plan.featured ? (
                      <span className="landing-dark-text shrink-0 rounded-full bg-[#1351B4] px-3 py-1 text-xs font-black">Recomendado</span>
                    ) : null}
                  </div>
                  <p className="mt-5 text-2xl font-black text-[#168821]">{plan.priceRange}</p>
                  <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{plan.description}</p>
                  <div className="mt-5 border-t border-slate-200 pt-4 text-sm font-bold text-slate-700">
                    <p className="flex items-center gap-2"><Users size={17} className="text-[#1351B4]" aria-hidden="true" />{plan.internalUsers}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-xl bg-[#061B3A] p-6 lg:flex-row lg:items-center lg:px-8">
              <div>
                <h3 className="landing-dark-text text-xl font-black">A faixa é o ponto de partida para a conversa.</h3>
                <p className="landing-dark-muted mt-2 max-w-4xl text-sm leading-6">Nossa equipe confirma o cenário, dimensiona a implantação e constrói uma proposta comercial adequada à operação.</p>
              </div>
              <Link
                to="/cadastro-prefeitura"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#FFCD07] px-6 text-sm font-black text-[#071A3A] transition-colors hover:bg-[#FFD83D]"
              >
                <CalendarCheck size={19} aria-hidden="true" />
                Solicitar análise
              </Link>
            </div>
          </div>
        </section>

        <section id="implantacao" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1360px]">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm font-black uppercase tracking-[0.12em] text-[#1351B4]">Implantação assistida</span>
              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Tecnologia acompanhada de operação.</h2>
              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">A contratação é construída em conjunto para que plataforma, equipe e processos entrem em funcionamento com clareza.</p>
            </div>

            <ol className="mt-12 grid gap-5 lg:grid-cols-3">
              {implementationSteps.map((step) => (
                <li key={step.number} className="relative overflow-hidden rounded-xl border border-[#D8E2EF] bg-white p-7 shadow-[0_10px_30px_rgba(15,42,80,0.05)]">
                  <span className="absolute right-5 top-3 text-6xl font-black text-[#6F8FB8]" aria-hidden="true">{step.number}</span>
                  <span className="landing-dark-text relative flex size-11 items-center justify-center rounded-full bg-[#1351B4] text-sm font-black">{step.number}</span>
                  <h3 className="relative mt-6 text-xl font-black">{step.title}</h3>
                  <p className="relative mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                </li>
              ))}
            </ol>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icon: Headphones, title: 'Suporte e SLA', text: 'Níveis de serviço dimensionados para a necessidade da operação.' },
                { icon: WalletCards, title: 'IA separada', text: 'Créditos pré-pagos, limites configuráveis e consumo rastreável.' },
                { icon: ShieldCheck, title: 'Sem ativação automática', text: 'O cadastro inicia uma análise e não representa aceite ou cobrança.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4 rounded-lg bg-[#EAF2FF] p-5">
                    <Icon size={23} className="mt-0.5 shrink-0 text-[#1351B4]" aria-hidden="true" />
                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#1351B4] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="landing-dark-muted text-sm font-black uppercase tracking-[0.12em]">Próximo passo</p>
              <h2 className="landing-dark-text mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">Vamos entender a realidade da sua prefeitura?</h2>
              <p className="landing-dark-muted mt-4 max-w-2xl text-base leading-7">Envie as informações iniciais e nossa equipe entrará em contato para agendar uma reunião.</p>
            </div>
            <Link
              to="/cadastro-prefeitura"
              className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-7 text-base font-black text-[#071A3A] shadow-xl transition-colors hover:bg-blue-50"
            >
              Solicitar proposta
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <CidadaoBrand compact iconClassName="size-10" />
          <nav aria-label="Links institucionais" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-bold text-slate-600">
            <Link to="/" className="transition-colors hover:text-[#1351B4]">Página do cidadão</Link>
            <Link to="/login-servidor" className="transition-colors hover:text-[#1351B4]">Portal do servidor</Link>
            <Link to="/termos-de-uso" className="transition-colors hover:text-[#1351B4]">Termos de uso</Link>
            <Link to="/privacidade" className="transition-colors hover:text-[#1351B4]">Privacidade</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
