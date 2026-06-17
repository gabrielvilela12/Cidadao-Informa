import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Filter,
  Plus,
  ReceiptText,
  Repeat,
  RotateCcw,
  Search,
  Tag,
  Tags,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react';
import { Header } from '../components/Header';

type EntryType = 'cost' | 'revenue';
type EntryStatus = 'pending' | 'paid' | 'planned';
type FilterType = EntryType | 'all';
type ConfigTab = 'entry' | 'categories' | 'fixed' | 'people';

interface FinanceCategory {
  id: string;
  name: string;
  type: EntryType | 'both';
  color: string;
}

interface FinanceEntry {
  id: string;
  title: string;
  type: EntryType;
  amount: number;
  dueDate: string;
  category: string;
  person: string;
  status: EntryStatus;
  isFixed: boolean;
  note?: string;
}

interface FixedTemplate {
  id: string;
  title: string;
  type: EntryType;
  amount: number;
  category: string;
  person: string;
  dueDay: number;
  active: boolean;
}

interface FinanceState {
  entries: FinanceEntry[];
  categories: FinanceCategory[];
  people: string[];
  fixedTemplates: FixedTemplate[];
}

const STORAGE_KEY = 'cidadaoinforma_finance_workspace';
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const NUMBER = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const categoryColors = ['#1351b4', '#168821', '#8a6100', '#e52207', '#7c3aed', '#0f766e'];

const initialState: FinanceState = {
  categories: [
    { id: 'cat-impressora', name: 'Impressora', type: 'cost', color: '#1351b4' },
    { id: 'cat-ferramentas', name: 'Ferramentas', type: 'cost', color: '#7c3aed' },
    { id: 'cat-insumos', name: 'Insumos', type: 'cost', color: '#8a6100' },
    { id: 'cat-faturamento', name: 'Faturamento', type: 'revenue', color: '#168821' },
    { id: 'cat-servicos', name: 'Servicos', type: 'revenue', color: '#0f766e' },
  ],
  people: ['Gabriel', 'Kaique', 'Operacao'],
  fixedTemplates: [
    {
      id: 'fix-chatgpt',
      title: 'CHATGPT',
      type: 'cost',
      amount: 103,
      category: 'Ferramentas',
      person: 'Gabriel',
      dueDay: 10,
      active: true,
    },
    {
      id: 'fix-impressora',
      title: 'Impressora Combo 1',
      type: 'cost',
      amount: 487,
      category: 'Impressora',
      person: 'Kaique',
      dueDay: 10,
      active: true,
    },
    {
      id: 'fix-loja',
      title: 'Faturamento mensal',
      type: 'revenue',
      amount: 4200,
      category: 'Faturamento',
      person: 'Operacao',
      dueDay: 30,
      active: true,
    },
  ],
  entries: [
    {
      id: 'entry-mai-revenue',
      title: 'Faturamento loja',
      type: 'revenue',
      amount: 5100,
      dueDate: '2026-05-30',
      category: 'Faturamento',
      person: 'Operacao',
      status: 'paid',
      isFixed: false,
    },
    {
      id: 'entry-mai-cost',
      title: 'Insumos e manutencao',
      type: 'cost',
      amount: 4393.63,
      dueDate: '2026-05-14',
      category: 'Insumos',
      person: 'Gabriel',
      status: 'paid',
      isFixed: false,
    },
    {
      id: 'entry-jun-chatgpt',
      title: 'CHATGPT',
      type: 'cost',
      amount: 103,
      dueDate: '2026-06-10',
      category: 'Ferramentas',
      person: 'Gabriel',
      status: 'paid',
      isFixed: true,
      note: 'Mensal',
    },
    {
      id: 'entry-jun-combo',
      title: 'Impressora Combo 1',
      type: 'cost',
      amount: 487,
      dueDate: '2026-06-10',
      category: 'Impressora',
      person: 'Kaique',
      status: 'pending',
      isFixed: true,
      note: 'Mensal ate 10/2026',
    },
    {
      id: 'entry-jun-insumos',
      title: 'Papel fotografico e tinta',
      type: 'cost',
      amount: 710.4,
      dueDate: '2026-06-18',
      category: 'Insumos',
      person: 'Gabriel',
      status: 'planned',
      isFixed: false,
    },
    {
      id: 'entry-jun-revenue-a',
      title: 'Faturamento mensal',
      type: 'revenue',
      amount: 4200,
      dueDate: '2026-06-30',
      category: 'Faturamento',
      person: 'Operacao',
      status: 'paid',
      isFixed: true,
    },
    {
      id: 'entry-jun-revenue-b',
      title: 'Pedido personalizado',
      type: 'revenue',
      amount: 1300,
      dueDate: '2026-06-24',
      category: 'Servicos',
      person: 'Gabriel',
      status: 'pending',
      isFixed: false,
    },
    {
      id: 'entry-jul-chatgpt',
      title: 'CHATGPT',
      type: 'cost',
      amount: 103,
      dueDate: '2026-07-10',
      category: 'Ferramentas',
      person: 'Gabriel',
      status: 'planned',
      isFixed: true,
      note: 'Projetado',
    },
    {
      id: 'entry-jul-combo',
      title: 'Impressora Combo 1',
      type: 'cost',
      amount: 487,
      dueDate: '2026-07-10',
      category: 'Impressora',
      person: 'Kaique',
      status: 'pending',
      isFixed: true,
    },
    {
      id: 'entry-jul-tinta',
      title: 'Reposicao de tinta',
      type: 'cost',
      amount: 250.58,
      dueDate: '2026-07-18',
      category: 'Insumos',
      person: 'Gabriel',
      status: 'planned',
      isFixed: false,
    },
    {
      id: 'entry-ago-cost',
      title: 'Parcela equipamento',
      type: 'cost',
      amount: 840.58,
      dueDate: '2026-08-10',
      category: 'Impressora',
      person: 'Kaique',
      status: 'planned',
      isFixed: true,
    },
    {
      id: 'entry-set-cost',
      title: 'Parcela equipamento',
      type: 'cost',
      amount: 840.58,
      dueDate: '2026-09-10',
      category: 'Impressora',
      person: 'Kaique',
      status: 'planned',
      isFixed: true,
    },
    {
      id: 'entry-out-cost',
      title: 'Ferramentas mensais',
      type: 'cost',
      amount: 353.58,
      dueDate: '2026-10-10',
      category: 'Ferramentas',
      person: 'Gabriel',
      status: 'planned',
      isFixed: true,
    },
    {
      id: 'entry-nov-cost',
      title: 'Ferramentas mensais',
      type: 'cost',
      amount: 353.58,
      dueDate: '2026-11-10',
      category: 'Ferramentas',
      person: 'Gabriel',
      status: 'planned',
      isFixed: true,
    },
    {
      id: 'entry-dez-cost',
      title: 'Ferramentas mensais',
      type: 'cost',
      amount: 353.58,
      dueDate: '2026-12-10',
      category: 'Ferramentas',
      person: 'Gabriel',
      status: 'planned',
      isFixed: true,
    },
    {
      id: 'entry-jan-cost',
      title: 'CHATGPT',
      type: 'cost',
      amount: 103,
      dueDate: '2027-01-10',
      category: 'Ferramentas',
      person: 'Gabriel',
      status: 'planned',
      isFixed: true,
    },
  ],
};

const defaultEntryDraft = (monthKey: string) => ({
  title: '',
  type: 'cost' as EntryType,
  amount: '',
  dueDate: `${monthKey}-15`,
  category: 'Impressora',
  person: 'Gabriel',
  status: 'pending' as EntryStatus,
  isFixed: false,
});

const defaultFixedDraft = {
  title: '',
  type: 'cost' as EntryType,
  amount: '',
  category: 'Impressora',
  person: 'Gabriel',
  dueDay: '10',
};

function currentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function dateFromMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function addMonths(monthKey: string, offset: number) {
  const date = dateFromMonthKey(monthKey);
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(monthKey: string, format: 'short' | 'long' = 'short') {
  const date = dateFromMonthKey(monthKey);
  const label = date.toLocaleDateString('pt-BR', {
    month: format === 'short' ? 'short' : 'long',
    year: format === 'short' ? undefined : 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function statusLabel(status: EntryStatus) {
  const labels: Record<EntryStatus, string> = {
    pending: 'Pendente',
    paid: 'Fechado',
    planned: 'Projetado',
  };
  return labels[status];
}

function loadFinanceState(): FinanceState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState;
    const parsed = JSON.parse(saved) as FinanceState;
    return {
      entries: parsed.entries?.length ? parsed.entries : initialState.entries,
      categories: parsed.categories?.length ? parsed.categories : initialState.categories,
      people: parsed.people?.length ? parsed.people : initialState.people,
      fixedTemplates: parsed.fixedTemplates?.length ? parsed.fixedTemplates : initialState.fixedTemplates,
    };
  } catch {
    return initialState;
  }
}

function totalsFor(entries: FinanceEntry[]) {
  const revenue = entries.filter(item => item.type === 'revenue').reduce((sum, item) => sum + item.amount, 0);
  const costs = entries.filter(item => item.type === 'cost').reduce((sum, item) => sum + item.amount, 0);
  const pending = entries.filter(item => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0);
  const closedRevenue = entries.filter(item => item.type === 'revenue' && item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
  const closedCosts = entries.filter(item => item.type === 'cost' && item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);

  return {
    revenue,
    costs,
    pending,
    balance: revenue - costs,
    closedBalance: closedRevenue - closedCosts,
  };
}

function FinanceStat({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CircleDollarSign;
  tone: 'blue' | 'green' | 'red' | 'amber';
}) {
  const toneClasses = {
    blue: 'bg-blue-500/10 text-blue-700',
    green: 'bg-green-500/10 text-green-700',
    red: 'bg-red-500/10 text-red-700',
    amber: 'bg-yellow-500/10 text-amber-700',
  };

  return (
    <section className="rounded-lg border border-white/8 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

export function Finance() {
  const [finance, setFinance] = useState<FinanceState>(() => loadFinanceState());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<EntryStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [onlyFixed, setOnlyFixed] = useState(false);
  const [search, setSearch] = useState('');
  const [configTab, setConfigTab] = useState<ConfigTab>('entry');
  const [entryDraft, setEntryDraft] = useState(() => defaultEntryDraft(currentMonthKey()));
  const [categoryDraft, setCategoryDraft] = useState({ name: '', type: 'both' as EntryType | 'both', color: categoryColors[0] });
  const [personDraft, setPersonDraft] = useState('');
  const [fixedDraft, setFixedDraft] = useState(defaultFixedDraft);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finance));
  }, [finance]);

  useEffect(() => {
    setEntryDraft(prev => ({ ...prev, dueDate: `${selectedMonth}-${prev.dueDate.slice(-2) || '15'}` }));
  }, [selectedMonth]);

  const selectedMonthEntries = useMemo(
    () => finance.entries.filter(entry => getMonthKey(entry.dueDate) === selectedMonth),
    [finance.entries, selectedMonth],
  );

  const selectedTotals = useMemo(() => totalsFor(selectedMonthEntries), [selectedMonthEntries]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 9 }, (_, index) => {
      const key = addMonths(selectedMonth, index - 4);
      const entries = finance.entries.filter(entry => getMonthKey(entry.dueDate) === key);
      return { key, totals: totalsFor(entries), count: entries.length };
    });
  }, [finance.entries, selectedMonth]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return selectedMonthEntries
      .filter(entry => filterType === 'all' || entry.type === filterType)
      .filter(entry => filterStatus === 'all' || entry.status === filterStatus)
      .filter(entry => filterCategory === 'all' || entry.category === filterCategory)
      .filter(entry => filterPerson === 'all' || entry.person === filterPerson)
      .filter(entry => !onlyFixed || entry.isFixed)
      .filter(entry => !normalizedSearch || [entry.title, entry.category, entry.person, entry.note]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedSearch)))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [filterCategory, filterPerson, filterStatus, filterType, onlyFixed, search, selectedMonthEntries]);

  const categoryBreakdown = useMemo(() => {
    return finance.categories
      .map(category => {
        const entries = selectedMonthEntries.filter(entry => entry.category === category.name);
        return {
          ...category,
          total: entries.reduce((sum, entry) => sum + entry.amount, 0),
          count: entries.length,
        };
      })
      .filter(category => category.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [finance.categories, selectedMonthEntries]);

  const personBreakdown = useMemo(() => {
    return finance.people
      .map(person => {
        const entries = selectedMonthEntries.filter(entry => entry.person === person);
        return {
          person,
          total: entries.reduce((sum, entry) => sum + entry.amount, 0),
          count: entries.length,
        };
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [finance.people, selectedMonthEntries]);

  const maxMonthTotal = Math.max(1, ...monthOptions.map(item => Math.max(item.totals.revenue, item.totals.costs)));

  const resetFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterPerson('all');
    setOnlyFixed(false);
    setSearch('');
  };

  const updateEntryStatus = (id: string, status: EntryStatus) => {
    setFinance(prev => ({
      ...prev,
      entries: prev.entries.map(entry => entry.id === id ? { ...entry, status } : entry),
    }));
  };

  const removeEntry = (id: string) => {
    setFinance(prev => ({
      ...prev,
      entries: prev.entries.filter(entry => entry.id !== id),
    }));
  };

  const handleEntrySubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseAmount(entryDraft.amount);
    if (!entryDraft.title.trim() || amount <= 0) return;

    const entry: FinanceEntry = {
      id: createId('entry'),
      title: entryDraft.title.trim(),
      type: entryDraft.type,
      amount,
      dueDate: entryDraft.dueDate,
      category: entryDraft.category,
      person: entryDraft.person,
      status: entryDraft.status,
      isFixed: entryDraft.isFixed,
    };

    setFinance(prev => ({ ...prev, entries: [...prev.entries, entry] }));
    setEntryDraft(defaultEntryDraft(selectedMonth));
  };

  const handleCategorySubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = categoryDraft.name.trim();
    if (!name || finance.categories.some(category => category.name.toLowerCase() === name.toLowerCase())) return;

    setFinance(prev => ({
      ...prev,
      categories: [...prev.categories, { id: createId('cat'), name, type: categoryDraft.type, color: categoryDraft.color }],
    }));
    setCategoryDraft({ name: '', type: 'both', color: categoryColors[0] });
  };

  const handlePersonSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = personDraft.trim();
    if (!name || finance.people.some(person => person.toLowerCase() === name.toLowerCase())) return;

    setFinance(prev => ({ ...prev, people: [...prev.people, name] }));
    setPersonDraft('');
  };

  const handleFixedSubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseAmount(fixedDraft.amount);
    const dueDay = Number(fixedDraft.dueDay);
    if (!fixedDraft.title.trim() || amount <= 0 || dueDay < 1 || dueDay > 31) return;

    setFinance(prev => ({
      ...prev,
      fixedTemplates: [
        ...prev.fixedTemplates,
        {
          id: createId('fix'),
          title: fixedDraft.title.trim(),
          type: fixedDraft.type,
          amount,
          category: fixedDraft.category,
          person: fixedDraft.person,
          dueDay,
          active: true,
        },
      ],
    }));
    setFixedDraft(defaultFixedDraft);
  };

  const generateFixedEntry = (template: FixedTemplate) => {
    const day = String(Math.min(template.dueDay, 28)).padStart(2, '0');
    const dueDate = `${selectedMonth}-${day}`;
    const alreadyExists = finance.entries.some(entry =>
      entry.title === template.title &&
      entry.amount === template.amount &&
      getMonthKey(entry.dueDate) === selectedMonth &&
      entry.isFixed,
    );

    if (alreadyExists) return;

    setFinance(prev => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: createId('entry'),
          title: template.title,
          type: template.type,
          amount: template.amount,
          dueDate,
          category: template.category,
          person: template.person,
          status: 'planned',
          isFixed: true,
          note: 'Gerado dos fixos',
        },
      ],
    }));
  };

  const toggleFixedTemplate = (id: string) => {
    setFinance(prev => ({
      ...prev,
      fixedTemplates: prev.fixedTemplates.map(template =>
        template.id === id ? { ...template, active: !template.active } : template,
      ),
    }));
  };

  const removeFixedTemplate = (id: string) => {
    setFinance(prev => ({
      ...prev,
      fixedTemplates: prev.fixedTemplates.filter(template => template.id !== id),
    }));
  };

  const availableEntryCategories = finance.categories.filter(category => category.type === 'both' || category.type === entryDraft.type);
  const availableFixedCategories = finance.categories.filter(category => category.type === 'both' || category.type === fixedDraft.type);
  const selectedMonthTitle = monthLabel(selectedMonth, 'long');

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080d12]">
      <Header title="Financeiro" subtitle="Operacao mensal" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Visao geral do mes</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">{selectedMonthTitle}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Receitas, custos, pendencias e detalhes filtrados pelo mes selecionado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
              className="flex size-10 items-center justify-center rounded-lg border border-white/8 bg-white text-slate-700 transition-colors hover:bg-blue-500/10"
              title="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-white/8 bg-white px-3 text-sm font-semibold text-slate-700">
              <CalendarDays size={16} className="text-blue-700" />
              <input
                type="month"
                value={selectedMonth}
                onChange={event => setSelectedMonth(event.target.value)}
                className="min-w-36 border-0 bg-transparent p-0 text-sm font-semibold focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              className="flex size-10 items-center justify-center rounded-lg border border-white/8 bg-white text-slate-700 transition-colors hover:bg-blue-500/10"
              title="Proximo mes"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                setConfigTab('entry');
                setEntryDraft(prev => ({ ...prev, type: 'revenue' }));
              }}
              className="flex h-10 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-bold text-white transition-colors hover:bg-green-500"
            >
              <Plus size={16} /> Lucro
            </button>
            <button
              type="button"
              onClick={() => {
                setConfigTab('entry');
                setEntryDraft(prev => ({ ...prev, type: 'cost' }));
              }}
              className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-500"
            >
              <Plus size={16} /> Custo
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FinanceStat
            label="Lucro/faturamento"
            value={BRL.format(selectedTotals.revenue)}
            detail={`${selectedMonthEntries.filter(entry => entry.type === 'revenue').length} lancamentos no mes`}
            icon={BadgeDollarSign}
            tone="green"
          />
          <FinanceStat
            label="Custos"
            value={BRL.format(selectedTotals.costs)}
            detail={`${selectedMonthEntries.filter(entry => entry.type === 'cost').length} custos no mes`}
            icon={ReceiptText}
            tone="red"
          />
          <FinanceStat
            label="Saldo previsto"
            value={BRL.format(selectedTotals.balance)}
            detail={`${selectedTotals.balance >= 0 ? 'positivo' : 'negativo'} considerando o mes inteiro`}
            icon={CircleDollarSign}
            tone={selectedTotals.balance >= 0 ? 'blue' : 'amber'}
          />
          <FinanceStat
            label="Pendente/projetado"
            value={BRL.format(selectedTotals.pending)}
            detail={`${selectedMonthEntries.filter(entry => entry.status !== 'paid').length} itens em aberto`}
            icon={Clock3}
            tone="amber"
          />
        </div>

        <section className="mb-5 rounded-lg border border-white/8 bg-white/90 p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WalletCards size={18} className="text-blue-700" />
              <h2 className="text-sm font-black text-slate-950">Linha do tempo mensal</h2>
            </div>
            <span className="text-xs text-slate-500">{monthOptions.length} meses visiveis</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {monthOptions.map(item => {
              const isSelected = item.key === selectedMonth;
              const revenueWidth = `${Math.max(4, (item.totals.revenue / maxMonthTotal) * 100)}%`;
              const costWidth = `${Math.max(4, (item.totals.costs / maxMonthTotal) * 100)}%`;

              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setSelectedMonth(item.key)}
                  className={`min-w-36 rounded-lg border p-3 text-left transition-colors ${isSelected
                    ? 'border-blue-600 bg-blue-500/10'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                >
                  <span className="text-sm font-black text-slate-950">{monthLabel(item.key)}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{item.count} lancamentos</span>
                  <span className="mt-3 block space-y-1">
                    <span className="block h-2 rounded-full bg-slate-100">
                      <span className="block h-2 rounded-full bg-green-600" style={{ width: revenueWidth }} />
                    </span>
                    <span className="block h-2 rounded-full bg-slate-100">
                      <span className="block h-2 rounded-full bg-red-500" style={{ width: costWidth }} />
                    </span>
                  </span>
                  <span className={`mt-3 block text-xs font-bold ${item.totals.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {BRL.format(item.totals.balance)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="rounded-lg border border-white/8 bg-white/90 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-blue-700" />
                <h2 className="text-sm font-black text-slate-950">Filtros do mes</h2>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                title="Limpar filtros"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Buscar</span>
                <span className="relative block">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Titulo, categoria, pessoa"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </span>
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Tipo</span>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                  {[
                    ['all', 'Todos'],
                    ['revenue', 'Lucros'],
                    ['cost', 'Custos'],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setFilterType(value as FilterType)}
                      className={`h-8 rounded-md text-xs font-bold ${filterType === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Status</span>
                <select
                  value={filterStatus}
                  onChange={event => setFilterStatus(event.target.value as EntryStatus | 'all')}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Fechado</option>
                  <option value="planned">Projetado</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Categoria</span>
                <select
                  value={filterCategory}
                  onChange={event => setFilterCategory(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">Todas</option>
                  {finance.categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Pessoa</span>
                <select
                  value={filterPerson}
                  onChange={event => setFilterPerson(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">Todas</option>
                  {finance.people.map(person => (
                    <option key={person} value={person}>{person}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Repeat size={16} className="text-blue-700" /> Apenas fixos
                </span>
                <input
                  type="checkbox"
                  checked={onlyFixed}
                  onChange={event => setOnlyFixed(event.target.checked)}
                  className="size-4 accent-blue-600"
                />
              </label>
            </div>
          </aside>

          <main className="min-w-0 space-y-5">
            <section className="rounded-lg border border-white/8 bg-white/90 p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Detalhe de {selectedMonthTitle}</h2>
                  <p className="text-sm text-slate-500">
                    {filteredEntries.length} de {selectedMonthEntries.length} lancamentos exibidos
                  </p>
                </div>
                <div className={`rounded-lg px-3 py-2 text-sm font-black ${selectedTotals.balance >= 0 ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                  Saldo {BRL.format(selectedTotals.balance)}
                </div>
              </div>

              {filteredEntries.length === 0 ? (
                <EmptyState text="Nenhum lancamento encontrado para os filtros atuais." />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Lancamento</th>
                        <th className="px-4 py-3">Venc.</th>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3">Pessoa</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3 text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEntries.map(entry => {
                        const category = finance.categories.find(item => item.name === entry.category);
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className={`flex size-9 items-center justify-center rounded-lg ${entry.type === 'revenue' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                                  {entry.type === 'revenue' ? <BadgeDollarSign size={17} /> : <ReceiptText size={17} />}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-black text-slate-950">{entry.title}</p>
                                  <p className="text-xs text-slate-500">{entry.isFixed ? 'Fixo' : 'Avulso'}{entry.note ? ` · ${entry.note}` : ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700">{formatDate(entry.dueDate)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                                <span className="size-2 rounded-full" style={{ backgroundColor: category?.color ?? '#64748b' }} />
                                {entry.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{entry.person}</td>
                            <td className="px-4 py-3">
                              <select
                                value={entry.status}
                                onChange={event => updateEntryStatus(entry.id, event.target.value as EntryStatus)}
                                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700"
                              >
                                <option value="pending">Pendente</option>
                                <option value="paid">Fechado</option>
                                <option value="planned">Projetado</option>
                              </select>
                            </td>
                            <td className={`px-4 py-3 text-right font-black ${entry.type === 'revenue' ? 'text-green-700' : 'text-red-700'}`}>
                              {entry.type === 'revenue' ? '+' : '-'} {BRL.format(entry.amount)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeEntry(entry.id)}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-700"
                                title="Remover lancamento"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-lg border border-white/8 bg-white/90 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Tags size={18} className="text-blue-700" />
                  <h2 className="text-sm font-black text-slate-950">Categorias no mes</h2>
                </div>
                {categoryBreakdown.length === 0 ? (
                  <EmptyState text="Sem categorias para este mes." />
                ) : (
                  <div className="space-y-3">
                    {categoryBreakdown.map(category => {
                      const width = `${Math.max(8, (category.total / Math.max(selectedTotals.revenue, selectedTotals.costs, 1)) * 100)}%`;
                      return (
                        <div key={category.id}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                            <span className="font-bold text-slate-800">{category.name}</span>
                            <span className="text-xs font-black text-slate-600">{BRL.format(category.total)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full" style={{ width, backgroundColor: category.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-white/8 bg-white/90 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Users size={18} className="text-blue-700" />
                  <h2 className="text-sm font-black text-slate-950">Pessoas no mes</h2>
                </div>
                {personBreakdown.length === 0 ? (
                  <EmptyState text="Sem responsaveis para este mes." />
                ) : (
                  <div className="space-y-3">
                    {personBreakdown.map(item => (
                      <div key={item.person} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div>
                          <p className="font-black text-slate-900">{item.person}</p>
                          <p className="text-xs text-slate-500">{item.count} lancamentos</p>
                        </div>
                        <span className="text-sm font-black text-slate-700">{BRL.format(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </main>

          <aside className="rounded-lg border border-white/8 bg-white/90 p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-950">Adicionar e organizar</h2>
              <p className="mt-1 text-xs text-slate-500">Lancamentos, categorias, fixos e pessoas em um unico lugar.</p>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1">
              {[
                ['entry', Plus, 'Lanc.'],
                ['categories', Tag, 'Cat.'],
                ['fixed', Repeat, 'Fixos'],
                ['people', Users, 'Pess.'],
              ].map(([tab, Icon, label]) => (
                <button
                  type="button"
                  key={tab as string}
                  onClick={() => setConfigTab(tab as ConfigTab)}
                  className={`flex h-9 items-center justify-center gap-1 rounded-md text-xs font-bold ${configTab === tab ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                  title={label as string}
                >
                  <Icon size={14} /> {label as string}
                </button>
              ))}
            </div>

            {configTab === 'entry' && (
              <form onSubmit={handleEntrySubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['cost', ReceiptText, 'Custo'],
                    ['revenue', BadgeDollarSign, 'Lucro'],
                  ].map(([value, Icon, label]) => (
                    <button
                      type="button"
                      key={value as string}
                      onClick={() => setEntryDraft(prev => ({
                        ...prev,
                        type: value as EntryType,
                        category: finance.categories.find(category => category.type === 'both' || category.type === value)?.name ?? prev.category,
                      }))}
                      className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-bold ${entryDraft.type === value
                        ? 'border-blue-600 bg-blue-500/10 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-500'
                        }`}
                    >
                      <Icon size={16} /> {label as string}
                    </button>
                  ))}
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-500">Titulo</span>
                  <input
                    value={entryDraft.title}
                    onChange={event => setEntryDraft(prev => ({ ...prev, title: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    placeholder="Ex: Manutencao impressora"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">Valor</span>
                    <input
                      value={entryDraft.amount}
                      onChange={event => setEntryDraft(prev => ({ ...prev, amount: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">Data</span>
                    <input
                      type="date"
                      value={entryDraft.dueDate}
                      onChange={event => setEntryDraft(prev => ({ ...prev, dueDate: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">Categoria</span>
                    <select
                      value={entryDraft.category}
                      onChange={event => setEntryDraft(prev => ({ ...prev, category: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {availableEntryCategories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">Pessoa</span>
                    <select
                      value={entryDraft.person}
                      onChange={event => setEntryDraft(prev => ({ ...prev, person: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {finance.people.map(person => (
                        <option key={person} value={person}>{person}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">Status</span>
                    <select
                      value={entryDraft.status}
                      onChange={event => setEntryDraft(prev => ({ ...prev, status: event.target.value as EntryStatus }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="pending">Pendente</option>
                      <option value="paid">Fechado</option>
                      <option value="planned">Projetado</option>
                    </select>
                  </label>
                  <label className="mt-6 flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                    Fixo
                    <input
                      type="checkbox"
                      checked={entryDraft.isFixed}
                      onChange={event => setEntryDraft(prev => ({ ...prev, isFixed: event.target.checked }))}
                      className="size-4 accent-blue-600"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-500"
                >
                  <Plus size={16} /> Adicionar lancamento
                </button>
              </form>
            )}

            {configTab === 'categories' && (
              <div className="space-y-4">
                <form onSubmit={handleCategorySubmit} className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">Nova categoria</span>
                    <input
                      value={categoryDraft.name}
                      onChange={event => setCategoryDraft(prev => ({ ...prev, name: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      placeholder="Ex: Marketing"
                    />
                  </label>
                  <div className="grid grid-cols-[1fr_88px] gap-2">
                    <select
                      value={categoryDraft.type}
                      onChange={event => setCategoryDraft(prev => ({ ...prev, type: event.target.value as EntryType | 'both' }))}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="both">Ambos</option>
                      <option value="cost">Custos</option>
                      <option value="revenue">Lucros</option>
                    </select>
                    <div className="grid grid-cols-3 gap-1">
                      {categoryColors.slice(0, 6).map(color => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => setCategoryDraft(prev => ({ ...prev, color }))}
                          className={`h-10 rounded-lg border ${categoryDraft.color === color ? 'border-slate-950' : 'border-slate-200'}`}
                          style={{ backgroundColor: color }}
                          title={`Cor ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-500"
                  >
                    <Tag size={16} /> Adicionar categoria
                  </button>
                </form>

                <div className="space-y-2">
                  {finance.categories.map(category => (
                    <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <span className="size-3 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {category.type === 'both' ? 'Ambos' : category.type === 'cost' ? 'Custos' : 'Lucros'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {configTab === 'fixed' && (
              <div className="space-y-4">
                <form onSubmit={handleFixedSubmit} className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">Novo fixo</span>
                    <input
                      value={fixedDraft.title}
                      onChange={event => setFixedDraft(prev => ({ ...prev, title: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      placeholder="Ex: Assinatura mensal"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={fixedDraft.type}
                      onChange={event => setFixedDraft(prev => ({
                        ...prev,
                        type: event.target.value as EntryType,
                        category: finance.categories.find(category => category.type === 'both' || category.type === event.target.value)?.name ?? prev.category,
                      }))}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="cost">Custo</option>
                      <option value="revenue">Lucro</option>
                    </select>
                    <input
                      value={fixedDraft.amount}
                      onChange={event => setFixedDraft(prev => ({ ...prev, amount: event.target.value }))}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={fixedDraft.category}
                      onChange={event => setFixedDraft(prev => ({ ...prev, category: event.target.value }))}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {availableFixedCategories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                    <select
                      value={fixedDraft.person}
                      onChange={event => setFixedDraft(prev => ({ ...prev, person: event.target.value }))}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {finance.people.map(person => (
                        <option key={person} value={person}>{person}</option>
                      ))}
                    </select>
                    <input
                      value={fixedDraft.dueDay}
                      onChange={event => setFixedDraft(prev => ({ ...prev, dueDay: event.target.value }))}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      placeholder="Dia"
                      inputMode="numeric"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-500"
                  >
                    <Repeat size={16} /> Adicionar fixo
                  </button>
                </form>

                <div className="space-y-2">
                  {finance.fixedTemplates.map(template => (
                    <div key={template.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{template.title}</p>
                          <p className="text-xs text-slate-500">
                            Dia {template.dueDay} · {template.person} · {BRL.format(template.amount)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFixedTemplate(template.id)}
                          className={`rounded-md px-2 py-1 text-xs font-bold ${template.active ? 'bg-green-500/10 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {template.active ? 'Ativo' : 'Pausado'}
                        </button>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => generateFixedEntry(template)}
                          className="flex h-8 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-blue-500/10"
                          disabled={!template.active}
                        >
                          <CalendarPlus size={14} /> Gerar no mes
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFixedTemplate(template.id)}
                          className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-700"
                          title="Remover fixo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {configTab === 'people' && (
              <div className="space-y-4">
                <form onSubmit={handlePersonSubmit} className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">Nova pessoa</span>
                    <input
                      value={personDraft}
                      onChange={event => setPersonDraft(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      placeholder="Ex: Ana"
                    />
                  </label>
                  <button
                    type="submit"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-500"
                  >
                    <UserPlus size={16} /> Adicionar pessoa
                  </button>
                </form>

                <div className="space-y-2">
                  {finance.people.map(person => (
                    <div key={person} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="font-bold text-slate-800">{person}</span>
                      <span className="text-xs text-slate-500">
                        {finance.entries.filter(entry => entry.person === person).length} lancamentos
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <CheckCircle2 size={15} className="text-green-700" />
                  Fechado no mes
                </span>
                <span className={`text-sm font-black ${selectedTotals.closedBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {BRL.format(selectedTotals.closedBalance)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{selectedMonthEntries.length} lancamentos</span>
                <span>{NUMBER.format(selectedTotals.costs)} em custos</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
