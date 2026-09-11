import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Home,
  Loader2,
  MapPinned,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { CidadaoBrand } from '../components/CidadaoBrand';
import { api, type PlatformPlan } from '../services/api';

type FormState = {
  establishmentName: string;
  document: string;
  city: string;
  state: string;
  primaryColor: string;
  logoUrl: string;
  campaignName: string;
  campaignScope: string;
  planCode: string;
  requesterName: string;
  requesterEmail: string;
  requesterCpf: string;
  requesterPhone: string;
  requesterPassword: string;
};

const initialForm: FormState = {
  establishmentName: '',
  document: '',
  city: '',
  state: '',
  primaryColor: '#0758BD',
  logoUrl: '',
  campaignName: '',
  campaignScope: 'city',
  planCode: '',
  requesterName: '',
  requesterEmail: '',
  requesterCpf: '',
  requesterPhone: '',
  requesterPassword: '',
};

const fallbackPlans: PlatformPlan[] = [
  {
    code: 'base',
    name: 'Base Municipal',
    description: 'Entrada para uma prefeitura organizar protocolos e campanha local.',
    sortOrder: 10,
  },
  {
    code: 'regional',
    name: 'Operacao Regional',
    description: 'Estrutura para prefeitura ou orgao com cobertura ampliada por cidade ou estado.',
    sortOrder: 20,
  },
  {
    code: 'avancado',
    name: 'Gestao Avancada',
    description: 'Base para operacao com mais equipe, relatorios e gestao executiva.',
    sortOrder: 30,
  },
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCpf(value: string) {
  return onlyDigits(value)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function formatCnpj(value: string) {
  return onlyDigits(value)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

export function PrefeituraRegistration() {
  const [plans, setPlans] = useState<PlatformPlan[]>(fallbackPlans);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === form.planCode) ?? plans[0],
    [form.planCode, plans],
  );

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const data = await api.getPlatformPlans();
      const sortedPlans = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
      if (sortedPlans.length > 0) {
        setPlans(sortedPlans);
        setForm((current) => ({
          ...current,
          planCode: current.planCode || sortedPlans[0].code,
        }));
      }
    } catch (err) {
      console.warn('Nao foi possivel carregar planos publicos.', err);
      setForm((current) => ({
        ...current,
        planCode: current.planCode || fallbackPlans[0].code,
      }));
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const requesterCpf = onlyDigits(form.requesterCpf);
      const requesterPhone = onlyDigits(form.requesterPhone);
      const document = onlyDigits(form.document);

      if (document.length !== 14) {
        throw new Error('Informe um CNPJ válido com 14 dígitos.');
      }
      if (requesterCpf.length !== 11) {
        throw new Error('O CPF do responsavel deve ter 11 digitos.');
      }
      if (form.requesterPassword.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      }
      if (!selectedPlan?.code) {
        throw new Error('Escolha um plano para continuar.');
      }

      await api.createEstablishmentApplication({
        establishmentName: form.establishmentName.trim(),
        document,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        primaryColor: form.primaryColor,
        logoUrl: form.logoUrl.trim() || undefined,
        campaignName: form.campaignName.trim() || undefined,
        campaignScope: form.campaignScope,
        planCode: selectedPlan.code,
        requesterName: form.requesterName.trim(),
        requesterEmail: form.requesterEmail.trim(),
        requesterCpf,
        requesterPhone: requesterPhone || undefined,
        requesterPassword: form.requesterPassword,
      });

      setSuccess(true);
      setForm({ ...initialForm, planCode: selectedPlan.code });
    } catch (err) {
      console.error('Erro ao enviar cadastro da prefeitura:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel enviar o cadastro.');
    } finally {
      setSaving(false);
    }
  };

  const inputClassName = 'h-11 w-full rounded-lg border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelClassName = 'text-xs font-black uppercase tracking-[0.08em] text-slate-500';
  const colorValue = /^#[0-9A-Fa-f]{6}$/.test(form.primaryColor) ? form.primaryColor : '#0758BD';

  return (
    <div className="min-h-dvh bg-[#F4F8FC] text-[#0B1B33]">
      <header className="border-b border-[#D9E1EC] bg-white">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center">
            <CidadaoBrand compact iconClassName="size-11" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login-servidor"
              className="hidden h-10 items-center rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-[#0758BD] transition-colors hover:bg-blue-50 sm:inline-flex"
            >
              Portal do servidor
            </Link>
            <Link
              to="/"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-[#B9CBE2] bg-white text-[#0758BD] transition-colors hover:bg-blue-50"
              title="Voltar"
              aria-label="Voltar"
            >
              <Home size={18} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1280px] grid-cols-1 gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-8">
        <section className="flex flex-col rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div>
            <p className="text-sm font-bold text-[#0758BD]">Cadastro institucional</p>
            <h1 className="mt-2 text-3xl font-black leading-tight">Prefeitura na plataforma</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A prefeitura escolhe um plano, registra seus dados e aguarda a liberacao dos donos da plataforma.
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-lg border border-[#E3EAF3] bg-[#F7F9FC]">
            <img
              src="/hero-dashboard-mockup.png"
              alt="Painel do Cidadao Informa com mapa e protocolos"
              className="aspect-[16/10] w-full object-cover object-center"
            />
          </div>

          <div className="mt-7 grid gap-3">
            <InfoRow icon={<Building2 size={19} />} title="White-label" text="A cidade ou estado vira uma area atendida pela assinatura." />
            <InfoRow icon={<MapPinned size={19} />} title="Campanha regional" text="Protocolos da regiao assinante passam para o estabelecimento correto." />
            <InfoRow icon={<UserRound size={19} />} title="Diretor" text="A conta do responsavel fica pronta para ativacao apos aprovacao." />
            <InfoRow icon={<ShieldCheck size={19} />} title="Sem cobranca agora" text="Planos sao apenas base operacional nesta etapa." />
          </div>
        </section>

        <form onSubmit={submit} className="rounded-lg border border-[#CDD8E7] bg-white shadow-[0_7px_20px_rgba(15,45,85,0.035)]">
          <div className="border-b border-[#E3EAF3] px-5 py-4">
            <h2 className="font-black">Dados da prefeitura</h2>
            <p className="mt-1 text-sm text-slate-600">Escolha o plano e cadastre o responsavel institucional.</p>
          </div>

          <div className="space-y-6 px-5 py-5">
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Cadastro recebido. A conta do responsavel sera liberada apos aprovacao.
              </div>
            )}

            <section>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black">Plano</h3>
                {loadingPlans && <Loader2 size={17} className="animate-spin text-slate-500" />}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {plans.map((plan) => {
                  const selected = selectedPlan?.code === plan.code;
                  return (
                    <button
                      key={plan.code}
                      type="button"
                      onClick={() => updateForm('planCode', plan.code)}
                      className={`flex min-h-[132px] flex-col rounded-lg border p-4 text-left transition-colors ${selected
                        ? 'border-[#0758BD] bg-blue-50 text-[#0B1B33] shadow-[0_0_0_2px_rgba(7,88,189,0.08)]'
                        : 'border-[#CDD8E7] bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-black">{plan.name}</span>
                        {selected && <CheckCircle2 size={18} className="shrink-0 text-[#0758BD]" />}
                      </span>
                      <span className="mt-2 text-sm leading-5 text-slate-600">{plan.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="border-t border-[#E3EAF3] pt-5">
              <h3 className="text-sm font-black">White-label</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className={labelClassName}>Prefeitura</span>
                  <input
                    required
                    value={form.establishmentName}
                    onChange={(event) => updateForm('establishmentName', event.target.value)}
                    className={inputClassName}
                    placeholder="Prefeitura de Ribeirao Preto"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>CNPJ</span>
                  <input
                    required
                    inputMode="numeric"
                    value={form.document}
                    onChange={(event) => updateForm('document', formatCnpj(event.target.value))}
                    className={inputClassName}
                    placeholder="00.000.000/0001-00"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>Cidade</span>
                  <input
                    required
                    value={form.city}
                    onChange={(event) => updateForm('city', event.target.value)}
                    className={inputClassName}
                    placeholder="Ribeirao Preto"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>UF</span>
                  <input
                    required
                    maxLength={2}
                    value={form.state}
                    onChange={(event) => updateForm('state', event.target.value.toUpperCase())}
                    className={inputClassName}
                    placeholder="SP"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>Cor principal</span>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(event) => updateForm('primaryColor', event.target.value)}
                      className="h-11 w-14 shrink-0 rounded-lg border border-[#CDD8E7] bg-white p-1"
                      title="Selecionar cor principal"
                      aria-label="Selecionar cor principal"
                    />
                    <input
                      required
                      value={form.primaryColor}
                      onChange={(event) => updateForm('primaryColor', event.target.value)}
                      className={inputClassName}
                      placeholder="#0758BD"
                    />
                  </div>
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>Logo URL</span>
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(event) => updateForm('logoUrl', event.target.value)}
                    className={inputClassName}
                    placeholder="https://..."
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-[#E3EAF3] pt-5">
              <h3 className="text-sm font-black">Campanha</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className={labelClassName}>Nome da campanha</span>
                  <input
                    value={form.campaignName}
                    onChange={(event) => updateForm('campaignName', event.target.value)}
                    className={inputClassName}
                    placeholder="Campanha Ribeirao Acessivel"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>Cobertura</span>
                  <select
                    value={form.campaignScope}
                    onChange={(event) => updateForm('campaignScope', event.target.value)}
                    className={inputClassName}
                  >
                    <option value="city">Cidade</option>
                    <option value="state">Estado</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="border-t border-[#E3EAF3] pt-5">
              <h3 className="text-sm font-black">Responsavel</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className={labelClassName}>Nome</span>
                  <input
                    required
                    value={form.requesterName}
                    onChange={(event) => updateForm('requesterName', event.target.value)}
                    className={inputClassName}
                    placeholder="Nome completo"
                    autoComplete="name"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>E-mail</span>
                  <input
                    required
                    type="email"
                    value={form.requesterEmail}
                    onChange={(event) => updateForm('requesterEmail', event.target.value)}
                    className={inputClassName}
                    placeholder="responsavel@prefeitura.gov.br"
                    autoComplete="email"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>CPF</span>
                  <input
                    required
                    inputMode="numeric"
                    value={form.requesterCpf}
                    onChange={(event) => updateForm('requesterCpf', formatCpf(event.target.value))}
                    className={inputClassName}
                    placeholder="000.000.000-00"
                    autoComplete="username"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClassName}>Telefone</span>
                  <input
                    inputMode="tel"
                    value={form.requesterPhone}
                    onChange={(event) => updateForm('requesterPhone', event.target.value)}
                    className={inputClassName}
                    placeholder="DDD + numero"
                    autoComplete="tel"
                  />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className={labelClassName}>Senha de acesso</span>
                  <input
                    required
                    type="password"
                    value={form.requesterPassword}
                    onChange={(event) => updateForm('requesterPassword', event.target.value)}
                    className={inputClassName}
                    placeholder="Minimo de 6 caracteres"
                    autoComplete="new-password"
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#E3EAF3] px-5 py-4 sm:flex-row sm:justify-end">
            <Link
              to="/login-dono"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Acesso dos donos
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0758BD] px-5 text-sm font-bold !text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ color: '#FFFFFF' }}
            >
              {saving ? <Loader2 size={17} className="animate-spin text-white" /> : <ArrowRight size={17} className="text-white" />}
              <span className="text-white">Enviar cadastro</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function InfoRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-[#E3EAF3] bg-[#F7F9FC] p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0758BD]">{icon}</span>
      <div>
        <p className="font-black">{title}</p>
        <p className="mt-0.5 text-sm leading-5 text-slate-600">{text}</p>
      </div>
    </div>
  );
}
