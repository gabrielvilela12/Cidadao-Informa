import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Database,
    Eye,
    FileLock2,
    Fingerprint,
    LockKeyhole,
    Mail,
    UserRoundCheck,
} from 'lucide-react';
import { CidadaoBrand } from '../components/CidadaoBrand';

const dataGroups = [
    {
        title: 'Dados de cadastro',
        text: 'Nome, e-mail, CPF, telefone e credenciais sao usados para identificar o usuario, proteger a conta e permitir o acompanhamento dos protocolos.',
    },
    {
        title: 'Dados do protocolo',
        text: 'Categoria, descricao, endereco, status, datas, prioridade e evidencias anexadas ajudam a registrar, triar e acompanhar solicitacoes de acessibilidade urbana.',
    },
    {
        title: 'Dados tecnicos',
        text: 'Informacoes de sessao, logs de operacao e registros de auditoria apoiam seguranca, integridade, prevencao de abuso e melhoria da plataforma.',
    },
];

const rights = [
    'Confirmar se seus dados sao tratados pela plataforma.',
    'Solicitar correcao de dados incompletos ou desatualizados.',
    'Pedir informacoes sobre uso, compartilhamento e finalidade dos dados.',
    'Solicitar exclusao ou revisao quando aplicavel ao contexto do servico publico.',
];

const commitments = [
    { icon: FileLock2, label: 'Minimizacao', text: 'Coletar somente dados necessarios para o servico.' },
    { icon: Eye, label: 'Transparencia', text: 'Explicar como os dados apoiam atendimento e auditoria.' },
    { icon: LockKeyhole, label: 'Seguranca', text: 'Usar controles de acesso, sessao e registros tecnicos.' },
];

export function PrivacyPolicy() {
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
                            Politica de Privacidade
                        </h1>
                        <p className="mt-4 text-slate-400 text-base sm:text-lg leading-relaxed max-w-3xl">
                            Entenda quais dados podem ser utilizados pelo Cidadao Informa,
                            por que eles sao necessarios e quais cuidados orientam o uso da
                            plataforma.
                        </p>
                        <p className="mt-4 text-sm text-slate-500">
                            Ultima atualizacao: julho de 2026
                        </p>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {commitments.map(({ icon: Icon, label, text }) => (
                            <div key={label} className="rounded-xl border border-white/8 bg-[#111820] p-5">
                                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-300 flex items-center justify-center mb-4">
                                    <Icon size={20} />
                                </div>
                                <h2 className="text-white font-bold">{label}</h2>
                                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </section>

                    <section className="rounded-2xl border border-white/8 bg-[#111820] overflow-hidden">
                        <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex items-center gap-2">
                            <Database size={18} className="text-blue-300" />
                            <h2 className="text-lg font-black text-white">Dados tratados</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {dataGroups.map((group) => (
                                <article key={group.title} className="px-5 sm:px-6 py-5">
                                    <h3 className="text-base font-bold text-white">{group.title}</h3>
                                    <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
                                        {group.text}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <Fingerprint size={18} className="text-blue-300" />
                                Finalidades de uso
                            </div>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    'Autenticar usuarios e proteger sessoes.',
                                    'Registrar e acompanhar protocolos.',
                                    'Permitir triagem por servidores autorizados.',
                                    'Gerar relatorios e indicadores administrativos.',
                                    'Auditar alteracoes relevantes no historico.',
                                    'Melhorar usabilidade, acessibilidade e seguranca.',
                                ].map((item) => (
                                    <div key={item} className="rounded-xl border border-white/8 bg-[#111820] p-3 text-sm text-slate-300">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <UserRoundCheck size={18} className="text-blue-300" />
                                Direitos do titular
                            </div>
                            <ul className="mt-4 space-y-3">
                                {rights.map((right) => (
                                    <li key={right} className="flex gap-2 text-sm text-slate-400 leading-relaxed">
                                        <span className="mt-2 size-1.5 rounded-full bg-blue-400 shrink-0" />
                                        <span>{right}</span>
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    </section>

                    <section className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <Mail size={18} className="text-blue-300" />
                            Contato sobre privacidade
                        </div>
                        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                            Duvidas, solicitacoes ou pedidos relacionados a dados pessoais devem ser
                            encaminhados aos canais institucionais da administracao responsavel pelo
                            Cidadao Informa.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
