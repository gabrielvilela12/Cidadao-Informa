import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  CircleAlert,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { Header } from '../components/Header';
import {
  serverPermissionService,
  type ServerPermission,
} from '../services/serverPermissionService';

type StateOption = readonly [code: string, name: string];

const STATE_GROUPS: ReadonlyArray<{ region: string; states: readonly StateOption[] }> = [
  { region: 'Norte', states: [['AC', 'Acre'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['PA', 'Pará'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['TO', 'Tocantins']] },
  { region: 'Nordeste', states: [['AL', 'Alagoas'], ['BA', 'Bahia'], ['CE', 'Ceará'], ['MA', 'Maranhão'], ['PB', 'Paraíba'], ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RN', 'Rio Grande do Norte'], ['SE', 'Sergipe']] },
  { region: 'Centro-Oeste', states: [['DF', 'Distrito Federal'], ['GO', 'Goiás'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul']] },
  { region: 'Sudeste', states: [['ES', 'Espírito Santo'], ['MG', 'Minas Gerais'], ['RJ', 'Rio de Janeiro'], ['SP', 'São Paulo']] },
  { region: 'Sul', states: [['PR', 'Paraná'], ['RS', 'Rio Grande do Sul'], ['SC', 'Santa Catarina']] },
];

const ALL_STATES: string[] = STATE_GROUPS.flatMap((group) => group.states.map((state) => state[0]));

function accessLabel(count: number) {
  if (count === 0) return { label: 'Sem acesso', className: 'bg-rose-50 text-rose-700 ring-rose-200' };
  if (count === ALL_STATES.length) return { label: 'Brasil inteiro', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
  return { label: `${count} ${count === 1 ? 'estado' : 'estados'}`, className: 'bg-blue-50 text-blue-700 ring-blue-200' };
}

export function AdminPermissions() {
  const [servers, setServers] = useState<ServerPermission[]>([]);
  const [selected, setSelected] = useState<ServerPermission | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setServers(await serverPermissionService.list());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os servidores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return servers.filter((server) => !term
      || server.name.toLocaleLowerCase('pt-BR').includes(term)
      || server.email.toLocaleLowerCase('pt-BR').includes(term));
  }, [search, servers]);

  const metrics = useMemo(() => ({
    total: servers.length,
    full: servers.filter((server) => server.states.length === ALL_STATES.length).length,
    restricted: servers.filter((server) => server.states.length > 0 && server.states.length < ALL_STATES.length).length,
    blocked: servers.filter((server) => server.states.length === 0).length,
  }), [servers]);

  const openEditor = (server: ServerPermission) => {
    setSelected(server);
    setSelectedStates([...server.states]);
    setError('');
    setSuccess('');
  };

  const closeEditor = () => {
    if (saving) return;
    setSelected(null);
    setSelectedStates([]);
  };

  const toggleState = (state: string) => {
    setSelectedStates((current) => current.includes(state)
      ? current.filter((item) => item !== state)
      : [...current, state]);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await serverPermissionService.update(selected.userId, selectedStates);
      setServers((current) => current.map((server) => server.userId === updated.userId ? updated : server));
      setSelected(updated);
      setSelectedStates([...updated.states]);
      setSuccess(`Permissões de ${updated.name} atualizadas.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar as permissões.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#F4F8FC] text-[#0B1B33]">
      <Header title="Permissões" subtitle="Acesso dos servidores por estado" />
      <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#D9E4F0] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <ShieldCheck size={25} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-950">Controle territorial de acesso</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  Defina quais UFs cada servidor pode consultar. O escopo vale para protocolos, cidadãos, mapas, relatórios e operações administrativas.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60">
              <RotateCcw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label="Servidores" value={metrics.total} tone="blue" />
          <Metric icon={Globe2} label="Acesso nacional" value={metrics.full} tone="green" />
          <Metric icon={SlidersHorizontal} label="Acesso parcial" value={metrics.restricted} tone="amber" />
          <Metric icon={LockKeyhole} label="Sem acesso" value={metrics.blocked} tone="red" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#D9E4F0] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E2E8F0] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-slate-950">Servidores cadastrados</h2>
              <p className="mt-1 text-sm text-slate-500">Selecione um servidor para configurar sua área de atuação.</p>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou e-mail" className="min-h-11 w-full rounded-xl border border-[#C9D6E5] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </label>
          </div>

          {error && !selected && <Notice tone="error" text={error} />}
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-semibold text-slate-500"><LoaderCircle className="animate-spin text-blue-600" /> Carregando servidores...</div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><UserCog size={36} className="text-slate-300" /><p className="mt-3 font-bold text-slate-700">Nenhum servidor encontrado</p><p className="mt-1 text-sm text-slate-500">Cadastros com perfil administrativo aparecerão aqui.</p></div>
          ) : (
            <div className="divide-y divide-[#E8EDF4]">
              {filtered.map((server) => {
                const access = accessLabel(server.states.length);
                return (
                  <button key={server.userId} type="button" onClick={() => openEditor(server)} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-blue-50/60 sm:px-6">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] font-black text-blue-700">{server.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{server.name}</p><p className="truncate text-sm text-slate-500">{server.email}</p></div>
                    <span className={`hidden rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset sm:inline-flex ${access.className}`}>{access.label}</span>
                    <ChevronRight size={20} className="shrink-0 text-slate-400" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[900] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="permission-title" className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><UserCog size={22} /></div>
                <div className="min-w-0"><h2 id="permission-title" className="truncate text-lg font-black text-slate-950">Permissões de {selected.name}</h2><p className="truncate text-sm text-slate-500">{selected.email}</p></div>
              </div>
              <button type="button" onClick={closeEditor} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={21} /></button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div><p className="font-bold text-blue-950">Estados permitidos</p><p className="text-sm text-blue-700">{selectedStates.length} de {ALL_STATES.length} UFs selecionadas</p></div>
                <div className="flex gap-2"><button type="button" onClick={() => setSelectedStates([...ALL_STATES])} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-100">Selecionar todas</button><button type="button" onClick={() => setSelectedStates([])} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">Limpar</button></div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {STATE_GROUPS.map((group) => (
                  <fieldset key={group.region} className="rounded-xl border border-slate-200 p-4">
                    <legend className="px-2 text-xs font-black uppercase tracking-wider text-slate-500">{group.region}</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.states.map(([code, name]) => {
                        const checked = selectedStates.includes(code);
                        return <label key={code} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${checked ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="checkbox" checked={checked} onChange={() => toggleState(code)} className="sr-only" /><span className={`flex size-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'}`}>{checked && <Check size={14} strokeWidth={3} />}</span><span className="min-w-0"><strong className="mr-1.5 text-sm text-slate-900">{code}</strong><span className="text-xs text-slate-500">{name}</span></span></label>;
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>

              {selectedStates.length === 0 && <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert size={19} className="shrink-0" /><p><strong>Servidor sem acesso territorial.</strong> Ele continuará conseguindo entrar, mas não visualizará protocolos, cidadãos, mapas ou relatórios.</p></div>}
              {error && <Notice tone="error" text={error} />}
              {success && <Notice tone="success" text={success} />}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button type="button" onClick={closeEditor} disabled={saving} className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60">Cancelar</button>
              <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">{saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />} Salvar permissões</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: 'blue' | 'green' | 'amber' | 'red' }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-rose-50 text-rose-700' };
  return <div className="flex items-center gap-4 rounded-2xl border border-[#D9E4F0] bg-white p-4 shadow-sm"><div className={`flex size-11 items-center justify-center rounded-xl ${colors[tone]}`}><Icon size={21} /></div><div><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p></div></div>;
}

function Notice({ tone, text }: { tone: 'error' | 'success'; text: string }) {
  return <div className={`mx-5 my-4 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold sm:mx-7 ${tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{tone === 'error' ? <CircleAlert size={18} className="shrink-0" /> : <Check size={18} className="shrink-0" />}{text}</div>;
}
