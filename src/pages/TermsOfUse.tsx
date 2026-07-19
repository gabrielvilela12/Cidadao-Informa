import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    LockKeyhole,
    Mail,
    RefreshCw,
    ShieldCheck,
    UserCheck,
} from 'lucide-react';
import { CidadaoBrand } from '../components/CidadaoBrand';

const sections = [
    {
        title: '1. Aceite dos termos',
        text: 'Ao acessar ou utilizar o Cidadao Informa, voce declara que leu, compreendeu e concorda com estes Termos de Uso. Caso nao concorde, interrompa o uso da plataforma.',
    },
    {
        title: '2. Objetivo da plataforma',
        text: 'O Cidadao Informa e um portal de zeladoria publica voltado ao registro, acompanhamento e gestao de solicitacoes relacionadas a acessibilidade urbana.',
    },
    {
        title: '3. Cadastro e responsabilidade da conta',
        text: 'O usuario deve informar dados verdadeiros, manter suas credenciais em sigilo e comunicar qualquer uso indevido de sua conta. A conta e pessoal e nao deve ser compartilhada.',
    },
    {
        title: '4. Uso adequado',
        text: 'Nao e permitido enviar conteudo falso, ofensivo, discriminatorio, ilegal, sem relacao com o servico ou que comprometa a seguranca, estabilidade ou finalidade publica da plataforma.',
    },
    {
        title: '5. Protocolos e evidencias',
        text: 'As solicitacoes podem conter descricao, endereco, categoria e evidencias visuais do problema relatado. O usuario e responsavel por enviar informacoes pertinentes e evitar exposicao indevida de terceiros.',
    },
    {
        title: '6. Dados pessoais e privacidade',
        text: 'Os dados pessoais sao utilizados para autenticacao, acompanhamento de protocolos, comunicacao e seguranca. O tratamento deve observar principios de necessidade, transparencia e protecao previstos na LGPD.',
    },
    {
        title: '7. Atendimento e disponibilidade',
        text: 'A plataforma organiza solicitacoes e auxilia a triagem administrativa, mas nao substitui canais oficiais de emergencia. Em risco imediato, procure os servicos publicos competentes.',
    },
    {
        title: '8. Auditoria e integridade',
        text: 'Eventos relevantes podem gerar registros tecnicos de auditoria para aumentar a transparencia e preservar a integridade historica das alteracoes realizadas nos protocolos.',
    },
    {
        title: '9. Atualizacoes dos termos',
        text: 'Estes termos podem ser atualizados para refletir melhorias do sistema, mudancas legais ou ajustes operacionais. A versao vigente ficara disponivel nesta pagina.',
    },
];

const principles = [
    { icon: ShieldCheck, label: 'Transparencia', detail: 'Clareza sobre uso, dados e responsabilidades.' },
    { icon: LockKeyhole, label: 'Protecao de dados', detail: 'Uso proporcional das informacoes do cidadao.' },
    { icon: UserCheck, label: 'Uso responsavel', detail: 'Relatos reais e respeito aos demais usuarios.' },
];

export function TermsOfUse() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen h-full overflow-y-auto bg-[#080d12] text-white font-sans">
            <nav className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 md:px-12 py-4 bg-white border-b border-slate-200">
                <Link to="/" className="min-w-0">
                    <CidadaoBrand compact />
                </Link>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Voltar
                </button>
            </nav>

            <main className="px-4 sm:px-6 py-10 md:py-14">
                <div className="max-w-5xl mx-auto flex flex-col gap-8">
                    <section className="border-b border-white/8 pb-8">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
                            Termos de Uso
                        </h1>
                        <p className="mt-4 text-slate-400 text-base sm:text-lg leading-relaxed max-w-3xl">
                            Regras para utilizacao do Cidadao Informa, incluindo cadastro,
                            abertura de protocolos, acompanhamento das solicitacoes e uso das
                            funcionalidades administrativas.
                        </p>
                        <p className="mt-4 text-sm text-slate-500">
                            Ultima atualizacao: julho de 2026
                        </p>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {principles.map(({ icon: Icon, label, detail }) => (
                            <div key={label} className="rounded-xl border border-white/8 bg-[#111820] p-5">
                                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-300 flex items-center justify-center mb-4">
                                    <Icon size={20} />
                                </div>
                                <h2 className="text-white font-bold">{label}</h2>
                                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{detail}</p>
                            </div>
                        ))}
                    </section>

                    <section className="rounded-2xl border border-white/8 bg-[#111820] overflow-hidden">
                        <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-400" />
                            <h2 className="text-lg font-black text-white">Condicoes principais</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {sections.map((section) => (
                                <article key={section.title} className="px-5 sm:px-6 py-5">
                                    <h3 className="text-base font-bold text-white">{section.title}</h3>
                                    <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
                                        {section.text}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <RefreshCw size={18} className="text-blue-300" />
                                Alteracoes futuras
                            </div>
                            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                                Novas funcionalidades, regras de seguranca ou exigencias legais podem
                                exigir revisoes destes termos. Quando houver mudancas relevantes, a
                                plataforma podera destacar a nova versao.
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <Mail size={18} className="text-blue-300" />
                                Canal de contato
                            </div>
                            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                                Para duvidas sobre estes termos, privacidade ou uso da plataforma, utilize
                                os canais institucionais indicados pela administracao responsavel pelo
                                Cidadao Informa.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
