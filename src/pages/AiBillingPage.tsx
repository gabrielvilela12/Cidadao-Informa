import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import {
  AlertTriangle,
  Bot,
  Coins,
  CreditCard,
  DollarSign,
  Loader2,
  Menu,
  PlusCircle,
  RefreshCw,
  ReceiptText,
  WalletCards,
  Zap,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { aiBillingService, type AiBillingDashboard } from '../services/aiBillingService';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const usd = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 4,
  maximumFractionDigits: 8,
});
const integer = new Intl.NumberFormat('pt-BR');

function dateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR') : '—';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Ativa',
    trial: 'Teste',
    pending: 'Pendente',
    paid: 'Confirmada',
    completed: 'Concluída',
    reversed: 'Estornada',
  };
  return labels[status.toLowerCase()] || status;
}

export function AiBillingPage() {
  const { establishmentId } = useParams();
  const { role, toggleMobileMenu } = useApp();
  const isPlatformView = role === 'platform_owner' && Boolean(establishmentId);
  const [data, setData] = useState<AiBillingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('100');
  const [description, setDescription] = useState('Crédito manual de IA');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(isPlatformView && establishmentId
        ? await aiBillingService.getEstablishment(establishmentId)
        : await aiBillingService.getMine());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o consumo de IA.');
    } finally {
      setLoading(false);
    }
  }, [establishmentId, isPlatformView]);

  useEffect(() => { void load(); }, [load]);

  const submitCredit = async () => {
    const numericAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Informe um valor válido.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const updated = isPlatformView && establishmentId
        ? await aiBillingService.addCredit(establishmentId, numericAmount, description)
        : await aiBillingService.requestTopUp(numericAmount);
      setData(updated);
      setSuccess(isPlatformView ? 'Crédito adicionado e registrado no extrato.' : 'Solicitação de recarga criada. O saldo entra após a confirmação do pagamento.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível processar a recarga.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmTopUp = async (paymentId: string) => {
    setSubmitting(true);
    setError('');
    try {
      setData(await aiBillingService.confirmTopUp(paymentId));
      setSuccess('Pagamento confirmado e créditos liberados.');
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Não foi possível confirmar a recarga.');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRequest = useMemo(() => {
    if (!data?.currentMonth.requests) return 0;
    return data.currentMonth.chargedAmountBrl / data.currentMonth.requests;
  }, [data]);

  if (loading && !data) {
    return <div className="flex h-full items-center justify-center bg-[#F4F8FC] text-slate-600"><Loader2 className="mr-3 animate-spin" />Carregando faturamento de IA...</div>;
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#F4F8FC] px-6 text-center text-slate-700">
        <AlertTriangle size={46} className="text-red-600" />
        <h1 className="mt-4 text-2xl font-black">Faturamento indisponível</h1>
        <p className="mt-2 text-sm">{error}</p>
        <button type="button" onClick={load} className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white">Tentar novamente</button>
      </div>
    );
  }

  const lowBalance = data.wallet.balanceBrl < 10;

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <button type="button" onClick={toggleMobileMenu} className="mt-1 flex size-11 items-center justify-center rounded-lg border border-[#CDD8E7] bg-white text-blue-700 md:hidden" aria-label="Abrir menu"><Menu size={20} /></button>
            <div>
              <p className="text-sm font-semibold text-slate-600">Assinatura / Inteligência artificial</p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">Créditos e consumo de IA</h1>
              <p className="mt-1 text-sm text-slate-600">Tokens, custos do provedor, cobranças e saldo pré-pago do chatbot.</p>
            </div>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B9CBE2] bg-white px-4 text-sm font-bold text-blue-700 disabled:opacity-60"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} />Atualizar</button>
        </header>

        {lowBalance && <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="shrink-0" size={20} /><div><p className="font-black">Saldo baixo</p><p className="mt-1">Faça uma recarga para evitar a interrupção das respostas pagas do chatbot.</p></div></div>}
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi icon={<WalletCards />} label="Saldo disponível" value={brl.format(data.wallet.balanceBrl)} hint={`${brl.format(data.wallet.totalCreditedBrl)} recarregados`} tone="blue" />
          <Kpi icon={<Zap />} label="Tokens no mês" value={integer.format(data.currentMonth.totalTokens)} hint={`${integer.format(data.currentMonth.requests)} chamadas`} tone="violet" />
          <Kpi icon={<DollarSign />} label="Cobrado no mês" value={brl.format(data.currentMonth.chargedAmountBrl)} hint={`${usd.format(data.currentMonth.openRouterCostUsd)} na OpenRouter`} tone="emerald" />
          <Kpi icon={<CreditCard />} label="Mensalidade" value={brl.format(data.subscription.monthlyAmountBrl)} hint={`${data.subscription.planName} · dia ${data.subscription.billingDay}`} tone="amber" />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-lg border border-[#CDD8E7] bg-white p-5 xl:col-span-2">
            <div className="flex items-center gap-3"><Bot className="text-blue-700" /><div><h2 className="font-black">Resumo do mês</h2><p className="text-sm text-slate-600">O custo é fotografado no momento de cada resposta.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Mini label="Tokens de entrada" value={integer.format(data.currentMonth.promptTokens)} />
              <Mini label="Tokens de saída" value={integer.format(data.currentMonth.completionTokens)} />
              <Mini label="Tokens em cache" value={integer.format(data.currentMonth.cachedTokens)} />
              <Mini label="Média por chamada" value={brl.format(averageRequest)} />
            </div>
          </article>

          <article className="rounded-lg border border-[#CDD8E7] bg-white p-5">
            <div className="flex items-center gap-3"><PlusCircle className="text-emerald-700" /><div><h2 className="font-black">{isPlatformView ? 'Adicionar crédito' : 'Solicitar recarga'}</h2><p className="text-sm text-slate-600">Valores em reais.</p></div></div>
            <label className="mt-4 block text-xs font-black uppercase text-slate-500">Valor</label>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="mt-1 h-11 w-full rounded-lg border border-[#CDD8E7] px-3 font-bold outline-none focus:border-blue-500" />
            {isPlatformView && <><label className="mt-3 block text-xs font-black uppercase text-slate-500">Motivo</label><input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#CDD8E7] px-3 text-sm outline-none focus:border-blue-500" /></>}
            <button type="button" onClick={submitCredit} disabled={submitting} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-60">{submitting ? <Loader2 size={17} className="animate-spin" /> : <Coins size={17} />}{isPlatformView ? 'Creditar saldo' : 'Solicitar recarga'}</button>
          </article>
        </section>

        <section className="rounded-lg border border-[#CDD8E7] bg-white">
          <SectionTitle icon={<Bot size={20} />} title="Detalhes das chamadas do chatbot" subtitle="Até 100 usos mais recentes; o conteúdo das conversas não é armazenado aqui." />
          {data.usage.length === 0 ? <Empty text="Nenhuma chamada paga registrada." /> : <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Data</th><th className="px-4 py-3">Modelo / geração</th><th className="px-4 py-3">Entrada</th><th className="px-4 py-3">Saída</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">OpenRouter USD</th><th className="px-4 py-3">Provedor USD</th><th className="px-5 py-3">Cobrado BRL</th></tr></thead><tbody className="divide-y divide-slate-100">{data.usage.map((item) => <tr key={item.id}><td className="px-5 py-4 text-slate-600">{dateTime(item.createdAt)}</td><td className="px-4 py-4"><p className="font-bold">{item.model}</p><p className="mt-1 max-w-52 truncate font-mono text-xs text-slate-500">{item.generationId || item.id}</p></td><td className="px-4 py-4">{integer.format(item.promptTokens)}</td><td className="px-4 py-4">{integer.format(item.completionTokens)}</td><td className="px-4 py-4 font-black">{integer.format(item.totalTokens)}</td><td className="px-4 py-4">{usd.format(item.openRouterCostUsd)}</td><td className="px-4 py-4">{usd.format(item.upstreamInferenceCostUsd)}</td><td className="px-5 py-4 font-black text-blue-700">{brl.format(item.chargedAmountBrl)}</td></tr>)}</tbody></table></div>}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-lg border border-[#CDD8E7] bg-white"><SectionTitle icon={<ReceiptText size={20} />} title="Extrato de créditos" subtitle="Débitos negativos e créditos positivos." /><Records rows={data.transactions.map((item) => ({ id: item.id, title: item.description, subtitle: dateTime(item.createdAt), amount: item.amountBrl, status: item.status }))} /></article>
          <article className="rounded-lg border border-[#CDD8E7] bg-white"><SectionTitle icon={<CreditCard size={20} />} title="Recargas" subtitle="Solicitações e pagamentos confirmados." />{data.topUps.length === 0 ? <Empty text="Nenhuma recarga solicitada." /> : <div className="divide-y divide-slate-100">{data.topUps.map((item) => <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">{brl.format(item.amountBrl)}</p><p className="mt-1 text-xs text-slate-500">{dateTime(item.createdAt)} · {statusLabel(item.status)}</p></div>{isPlatformView && item.status.toLowerCase() === 'pending' ? <button type="button" disabled={submitting} onClick={() => confirmTopUp(item.id)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">Confirmar pagamento</button> : <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-700">{statusLabel(item.status)}</span>}</div>)}</div>}</article>
        </section>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint: string; tone: 'blue' | 'violet' | 'emerald' | 'amber' }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', violet: 'bg-violet-50 text-violet-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700' };
  return <article className="rounded-lg border border-[#CDD8E7] bg-white p-4"><div className="flex gap-3"><span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${colors[tone]}`}>{icon}</span><div><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-1 text-xl font-black">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></div></div></article>;
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xl font-black">{value}</p><p className="mt-1 text-xs font-semibold text-slate-600">{label}</p></div>; }
function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) { return <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4"><span className="text-blue-700">{icon}</span><div><h2 className="font-black">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div></div>; }
function Empty({ text }: { text: string }) { return <p className="px-5 py-10 text-center text-sm font-semibold text-slate-500">{text}</p>; }
function Records({ rows }: { rows: Array<{ id: string; title: string; subtitle: string; amount: number; status: string }> }) { if (!rows.length) return <Empty text="Nenhum lançamento registrado." />; return <div className="divide-y divide-slate-100">{rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-bold">{row.title}</p><p className="mt-1 text-xs text-slate-500">{row.subtitle} · {statusLabel(row.status)}</p></div><p className={`font-black ${row.amount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{row.amount >= 0 ? '+' : ''}{brl.format(row.amount)}</p></div>)}</div>; }
