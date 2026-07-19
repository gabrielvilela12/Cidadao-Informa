import React, { useState } from 'react';
import {
    Accessibility as AccessibilityIcon,
    Activity,
    AlignJustify,
    ArrowLeft,
    CheckCircle2,
    Contrast,
    Info,
    Keyboard,
    LayoutTemplate,
    Menu,
    Moon,
    Palette,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
    Square,
    Sun,
    Type,
    Volume2,
    X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CidadaoBrand } from '../components/CidadaoBrand';
import { useA11y, type Theme } from '../context/A11yContext';
import { useApp } from '../context/AppContext';

type TextSpacing = 'normal' | 'medium' | 'wide';

const spacingLabels: Record<TextSpacing, string> = {
    normal: 'Espaçamento padrão',
    medium: 'Espaçamento médio',
    wide: 'Espaçamento amplo',
};

const themeLabels: Record<Theme, string> = {
    dark: 'Modo escuro',
    light: 'Modo claro',
    'high-contrast': 'Alto contraste',
};

const panelClass = 'rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-[0_8px_24px_rgba(15,45,85,0.04)] sm:p-6';

export function Accessibility() {
    const {
        fontSize,
        setFontSize,
        theme,
        setTheme,
        colorblindMode,
        setColorblindMode,
        textSpacing,
        setTextSpacing,
        reducedMotion,
        setReducedMotion,
        highFocus,
        setHighFocus,
        simplifiedMode,
        setSimplifiedMode,
    } = useA11y();
    const [isReading, setIsReading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showNotice, setShowNotice] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, role, toggleMobileMenu } = useApp();

    const fallbackPath = isAuthenticated ? (role === 'admin' ? '/admin' : '/') : '/login';
    const handleBack = () => {
        if (location.key !== 'default') {
            navigate(-1);
            return;
        }

        navigate(fallbackPath);
    };

    const startReading = () => {
        if (!('speechSynthesis' in window)) return;

        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsReading(true);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(document.body.innerText);
        utterance.lang = 'pt-BR';
        utterance.onend = () => {
            setIsReading(false);
            setIsPaused(false);
        };
        window.speechSynthesis.speak(utterance);
        setIsReading(true);
        setIsPaused(false);
    };

    const pauseReading = () => {
        if (!('speechSynthesis' in window) || !isReading) return;
        window.speechSynthesis.pause();
        setIsPaused(true);
        setIsReading(false);
    };

    const stopReading = () => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        setIsReading(false);
        setIsPaused(false);
    };

    const resetPreferences = () => {
        setFontSize(100);
        setTheme('light');
        setColorblindMode('none');
        setTextSpacing('normal');
        setReducedMotion(false);
        setHighFocus(false);
        setSimplifiedMode(false);
        stopReading();
    };

    const readingStatus = isReading
        ? 'Leitura em andamento'
        : isPaused
            ? 'Leitura pausada'
            : 'Leitura não iniciada';

    return (
        <div className="flex h-full min-h-screen flex-1 flex-col overflow-y-auto bg-[linear-gradient(135deg,#F7FAFE_0%,#FFFFFF_48%,#F4F8FD_100%)] text-[#0B1B33]">
            {!isAuthenticated && (
                <header className="sticky top-0 z-20 border-b border-[#D9E1EC] bg-white/95 px-4 py-4 backdrop-blur sm:px-8">
                    <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between">
                        <CidadaoBrand />
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                        >
                            <ArrowLeft size={17} aria-hidden="true" />
                            Voltar
                        </button>
                    </div>
                </header>
            )}

            <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-10 lg:py-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        {isAuthenticated && (
                            <button
                                type="button"
                                onClick={toggleMobileMenu}
                                className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#C9D6E8] bg-white text-[#1351B4] md:hidden"
                                aria-label="Abrir menu"
                            >
                                <Menu size={21} aria-hidden="true" />
                            </button>
                        )}
                        <div className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_18px_rgba(7,88,189,0.2)] sm:flex sm:size-14">
                            <AccessibilityIcon size={30} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="break-words text-2xl font-black leading-tight sm:text-[34px]">Acessibilidade</h1>
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                                Personalize o sistema para atender às suas necessidades visuais, motoras e cognitivas.
                            </p>
                        </div>
                    </div>

                    {isAuthenticated && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-[0_7px_16px_rgba(7,88,189,0.18)] transition-colors hover:bg-blue-700 sm:w-auto sm:shrink-0"
                        >
                            <ArrowLeft size={17} aria-hidden="true" />
                            Voltar
                        </button>
                    )}
                </div>

                {showNotice && (
                    <div className="flex items-start gap-3 rounded-lg border border-[#A9C9F5] bg-[#F1F7FF] px-4 py-3 text-sm text-[#14233B]" role="status">
                        <Info className="mt-0.5 shrink-0 text-[#0758BD]" size={20} aria-hidden="true" />
                        <p className="flex-1 font-semibold leading-5">
                            As preferências são salvas neste navegador, então já funcionam antes do login e continuam ativas depois que você entrar.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowNotice(false)}
                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-blue-100 hover:text-[#0758BD]"
                            aria-label="Fechar aviso"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                )}

                <section className="flex flex-col gap-3 rounded-lg border border-[#D8E1ED] bg-white px-4 py-3 sm:flex-row sm:items-center">
                    <h2 className="shrink-0 text-sm font-bold text-[#17233A] sm:mr-2">Perfil atual</h2>
                    <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                        <ProfileChip icon={<Type size={18} />} label={`Fonte ${fontSize}%`} />
                        <ProfileChip icon={<AlignJustify size={18} />} label={spacingLabels[textSpacing]} />
                        <ProfileChip icon={theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Contrast size={18} />} label={themeLabels[theme]} />
                        <ProfileChip icon={<Sparkles size={18} />} label={reducedMotion ? 'Animações reduzidas' : 'Animações ativas'} />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${panelClass} flex min-h-[286px] flex-col`}>
                        <PanelTitle icon={<Type size={25} />} title="Tamanho da Fonte" />
                        <p className="mt-1 text-sm leading-5 text-slate-600 sm:text-base">
                            Ajuste o tamanho de todos os textos da aplicação: <strong className="text-[#0758BD]">{fontSize}%</strong>
                        </p>
                        <div className="mt-6 flex flex-1 flex-col justify-center rounded-lg border border-[#D7E0EC] bg-[#FBFCFE] px-5 py-6 sm:px-8">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <span className="text-xl font-bold text-slate-700" aria-hidden="true">A</span>
                                <input
                                    type="range"
                                    min="100"
                                    max="200"
                                    step="25"
                                    value={fontSize}
                                    onChange={(event) => setFontSize(Number(event.target.value))}
                                    className="h-2 min-w-0 flex-1 cursor-pointer accent-[#0758BD]"
                                    aria-label="Tamanho da fonte"
                                    aria-valuetext={`${fontSize}%`}
                                />
                                <span className="text-3xl font-black text-[#0B1B33]" aria-hidden="true">A</span>
                            </div>
                            <div className="mt-4 grid grid-cols-5 text-center text-xs font-semibold text-slate-600 sm:text-sm">
                                {[100, 125, 150, 175, 200].map((value) => <span key={value}>{value}%</span>)}
                            </div>
                        </div>
                    </motion.section>

                    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className={`${panelClass} min-h-[286px]`}>
                        <PanelTitle icon={<AlignJustify size={25} />} title="Espaçamento de Texto" />
                        <p className="mt-1 text-sm leading-5 text-slate-600 sm:text-base">Ajuste o espaçamento entre linhas e letras para melhorar a leitura.</p>
                        <div className="mt-4 flex flex-col gap-2.5" role="radiogroup" aria-label="Espaçamento de texto">
                            <SelectionRow label="Padrão" description="Espaçamento original." selected={textSpacing === 'normal'} onClick={() => setTextSpacing('normal')} />
                            <SelectionRow label="Médio" description="Aumenta o espaçamento entre linhas em 20%." selected={textSpacing === 'medium'} onClick={() => setTextSpacing('medium')} />
                            <SelectionRow label="Amplo" description="Aumenta o espaçamento entre linhas em 35%." selected={textSpacing === 'wide'} onClick={() => setTextSpacing('wide')} />
                        </div>
                    </motion.section>

                    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={`${panelClass} min-h-[282px]`}>
                        <PanelTitle icon={<Sun size={25} />} title="Temas & Contraste" />
                        <div className="mt-3 flex flex-col gap-2.5" role="radiogroup" aria-label="Tema e contraste">
                            <ThemeRow label="Modo Escuro" description="Aplica fundo escuro e reduz o brilho da interface." selected={theme === 'dark'} variant="dark" onClick={() => setTheme('dark')} />
                            <ThemeRow label="Modo Claro (Padrão)" description="Mantém fundo branco e cores mais suaves." selected={theme === 'light'} variant="light" onClick={() => setTheme('light')} />
                            <ThemeRow label="Alto Contraste Branco" description="Bordas claras reforçadas para diferenciação." selected={theme === 'high-contrast'} variant="contrast" onClick={() => setTheme('high-contrast')} />
                        </div>
                    </motion.section>

                    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className={`${panelClass} flex min-h-[282px] flex-col`}>
                        <PanelTitle icon={<Keyboard size={25} />} title="Navegação por Teclado" />
                        <p className="mt-1 text-sm leading-5 text-slate-600 sm:text-base">Destaca visualmente os elementos ao navegar usando a tecla TAB.</p>
                        <div className="mt-4">
                            <SwitchRow label="Destacar foco de navegação" active={highFocus} onClick={() => setHighFocus(!highFocus)} />
                        </div>
                        <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#9FC2F2] bg-[#FBFDFF] p-5">
                            <button
                                type="button"
                                className={`min-h-14 w-full max-w-[280px] rounded-lg bg-blue-600 px-5 font-bold text-white ${highFocus ? 'outline outline-[3px] outline-offset-4 outline-[#0758BD]' : ''}`}
                            >
                                Exemplo de foco
                            </button>
                        </div>
                    </motion.section>
                </div>

                <section className="mt-1">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${panelClass} min-h-[238px]`}>
                            <PanelTitle icon={<Activity size={25} />} title="Movimento e Animações" />
                            <p className="mb-5 mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                                Reduza animações e transições para maior conforto visual. Ideal para pessoas com sensibilidade a movimento.
                            </p>
                            <SwitchRow
                                label="Reduzir animações e efeitos visuais"
                                active={reducedMotion}
                                onClick={() => setReducedMotion(!reducedMotion)}
                                showStatus
                            />
                        </motion.section>

                        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className={`${panelClass} min-h-[238px]`}>
                            <PanelTitle icon={<LayoutTemplate size={25} />} title="Modo Simplificado" />
                            <p className="mb-5 mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                                Exibe apenas as informações essenciais da página. Ideal para usuários com baixa alfabetização digital.
                            </p>
                            <SwitchRow
                                label="Ativar modo simplificado"
                                active={simplifiedMode}
                                onClick={() => setSimplifiedMode(!simplifiedMode)}
                                showStatus
                            />
                        </motion.section>

                        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={`${panelClass} lg:col-span-2`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <PanelTitle icon={<Volume2 size={25} />} title="Leitura em Voz" />
                                    <p className="mt-3 text-sm leading-5 text-slate-600 sm:text-base">Permite que o conteúdo da página seja lido em voz alta.</p>
                                </div>
                                <div
                                    className={`inline-flex min-h-9 shrink-0 items-center gap-2 self-start rounded-lg px-4 text-sm font-semibold ${isReading ? 'bg-[#E5F4E7] text-[#157F2E]' : isPaused ? 'bg-[#FFF4CC] text-[#7A5600]' : 'bg-[#F1F3F6] text-slate-600'}`}
                                    aria-live="polite"
                                >
                                    <span className={`size-2 rounded-full ${isReading ? 'bg-green-600' : isPaused ? 'bg-amber-500' : 'bg-slate-500'}`} aria-hidden="true" />
                                    {readingStatus}
                                </div>
                            </div>
                            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <ActionButton
                                    icon={<Play size={19} />}
                                    label={isPaused ? 'Continuar leitura' : 'Ler conteúdo da página'}
                                    onClick={startReading}
                                    variant="primary"
                                />
                                <ActionButton icon={<Pause size={19} />} label="Pausar" onClick={pauseReading} disabled={!isReading} variant="secondary" />
                                <ActionButton icon={<Square size={18} />} label="Parar" onClick={stopReading} disabled={!isReading && !isPaused} variant="danger" />
                            </div>
                        </motion.section>

                        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className={`${panelClass} lg:col-span-2`}>
                            <PanelTitle icon={<Palette size={25} />} title="Filtros de Daltonismo" />
                            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                                As opções abaixo aplicam filtros de coloração que ajudam na distinção de mapas, semáforos e gráficos.
                            </p>
                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Filtro de daltonismo">
                                <FilterButton
                                    label="Nenhum"
                                    description="Cores padrão"
                                    colors={['#1769C2', '#4A9638', '#FFB800', '#DF2435']}
                                    active={colorblindMode === 'none'}
                                    onClick={() => setColorblindMode('none')}
                                />
                                <FilterButton
                                    label="Protanopia"
                                    description="Deficiência de vermelho"
                                    colors={['#5478CB', '#858B9C', '#E2B34D', '#B88B29']}
                                    active={colorblindMode === 'protanopia'}
                                    onClick={() => setColorblindMode('protanopia')}
                                />
                                <FilterButton
                                    label="Deuteranopia"
                                    description="Deficiência de verde"
                                    colors={['#596FC4', '#AF8C25', '#DFAF00', '#8EA9F0']}
                                    active={colorblindMode === 'deuteranopia'}
                                    onClick={() => setColorblindMode('deuteranopia')}
                                />
                                <FilterButton
                                    label="Tritanopia"
                                    description="Deficiência de azul"
                                    colors={['#3C70C1', '#82CBD2', '#EF8C9C', '#D85577']}
                                    active={colorblindMode === 'tritanopia'}
                                    onClick={() => setColorblindMode('tritanopia')}
                                />
                            </div>
                        </motion.section>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#CDD8E7] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,45,85,0.04)] sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={resetPreferences}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#C8D5E6] bg-white px-4 text-sm font-bold text-[#17233A] transition-colors hover:border-[#8FB2E1] hover:bg-[#F3F7FC]"
                        >
                            <RotateCcw size={17} aria-hidden="true" />
                            Restaurar padrões
                        </button>
                        <p className="flex items-center justify-center gap-2 text-sm font-bold text-[#168821] sm:justify-end">
                            <CheckCircle2 size={20} aria-hidden="true" />
                            Preferências salvas automaticamente
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <h2 className="flex items-center gap-3 text-xl font-black text-[#101A2C]">
            <span className="text-[#0758BD]" aria-hidden="true">{icon}</span>
            {title}
        </h2>
    );
}

function ProfileChip({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-[#FBFCFE] px-3 text-sm font-medium text-slate-700">
            <span className="text-[#1473E6]" aria-hidden="true">{icon}</span>
            <span>{label}</span>
        </div>
    );
}

function SelectionRow({ label, description, selected, onClick }: { label: string; description: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onClick}
            className={`flex min-h-[58px] w-full items-center gap-4 rounded-lg border px-4 py-2 text-left transition-colors ${selected ? 'border-[#0758BD] bg-[#F1F7FF]' : 'border-[#D6DFEA] bg-white hover:border-[#9EBCE4]'}`}
        >
            <RadioMark selected={selected} />
            <span className="min-w-0">
                <span className={`block font-bold ${selected ? 'text-[#0758BD]' : 'text-[#17233A]'}`}>{label}</span>
                <span className="block text-xs leading-4 text-slate-600">{description}</span>
            </span>
        </button>
    );
}

function ThemeRow({ label, description, selected, variant, onClick }: { label: string; description: string; selected: boolean; variant: 'dark' | 'light' | 'contrast'; onClick: () => void }) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onClick}
            className={`flex min-h-[58px] w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${selected ? 'border-[#0758BD] bg-[#F1F7FF]' : 'border-[#D6DFEA] bg-white hover:border-[#9EBCE4]'}`}
        >
            <RadioMark selected={selected} />
            <span className="min-w-0 flex-1">
                <span className={`block font-bold ${selected ? 'text-[#0758BD]' : 'text-[#17233A]'}`}>{label}</span>
                <span className="block text-xs leading-4 text-slate-600">{description}</span>
            </span>
            <ThemePreview variant={variant} />
        </button>
    );
}

function RadioMark({ selected }: { selected: boolean }) {
    return (
        <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-[#0758BD]' : 'border-slate-500'}`} aria-hidden="true">
            {selected && <span className="size-2.5 rounded-full bg-blue-600" />}
        </span>
    );
}

function ThemePreview({ variant }: { variant: 'dark' | 'light' | 'contrast' }) {
    const isLight = variant === 'light';
    const isContrast = variant === 'contrast';
    return (
        <span className={`a11y-theme-preview hidden h-10 w-36 shrink-0 overflow-hidden rounded-md border sm:flex ${isContrast ? 'border-white bg-black' : isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-[#171C24]'}`} aria-hidden="true">
            <span className={`w-8 border-r ${isContrast ? 'border-white bg-black' : isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-[#222A35]'}`} />
            <span className="flex flex-1 flex-col gap-1.5 p-2">
                <span className="h-1.5 w-1/2 rounded-full bg-[#0B66D4]" />
                <span className={`h-1.5 w-4/5 rounded-full ${isContrast ? 'bg-white' : isLight ? 'bg-slate-300' : 'bg-slate-500'}`} />
                <span className={`h-1.5 w-3/5 rounded-full ${isContrast ? 'bg-white' : isLight ? 'bg-slate-200' : 'bg-slate-700'}`} />
            </span>
        </span>
    );
}

function SwitchRow({ label, active, onClick, showStatus = false }: { label: string; active: boolean; onClick: () => void; showStatus?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={onClick}
            className={`flex w-full items-center justify-between gap-4 rounded-lg border border-[#D5DFEB] bg-white px-4 text-left font-bold text-[#17233A] transition-colors hover:border-[#9EBCE4] ${showStatus ? 'min-h-[104px] py-4' : 'min-h-[52px]'}`}
        >
            <span className="min-w-0">{label}</span>
            <span className="flex shrink-0 flex-col items-end gap-2.5">
                <span className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors ${active ? 'justify-end bg-blue-600' : 'justify-start bg-[#E5EAF1]'}`} aria-hidden="true">
                    <span className="size-6 rounded-full bg-white shadow-[0_1px_4px_rgba(15,45,85,0.2)]" />
                </span>
                {showStatus && (
                    <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${active ? 'bg-[#E5F4E7] text-[#157F2E]' : 'bg-[#F1F3F6] text-slate-600'}`}>
                        {active ? 'Ativado' : 'Desativado'}
                    </span>
                )}
            </span>
        </button>
    );
}

function ActionButton({ icon, label, onClick, variant, disabled = false }: { icon: React.ReactNode; label: string; onClick: () => void; variant: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'border border-[#C8D5E6] bg-white text-[#17233A] hover:bg-[#F1F6FC]',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]}`}
        >
            {icon}
            {label}
        </button>
    );
}

function FilterButton({ label, description, colors, active, onClick }: { label: string; description: string; colors: string[]; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={active}
            onClick={onClick}
            className={`flex min-h-[132px] flex-col items-center justify-center rounded-lg border px-3 py-4 text-center transition-colors ${active ? 'border-[#0758BD] bg-[#F5F9FF] shadow-[inset_0_0_0_1px_#0758BD]' : 'border-[#CDD8E7] bg-white hover:border-[#8FB2E1]'}`}
        >
            <span className="mb-4 flex items-center justify-center gap-2" aria-hidden="true">
                {colors.map((color) => (
                    <span key={color} className="size-7 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                ))}
            </span>
            <span className={`font-bold ${active ? 'text-[#0758BD]' : 'text-[#17233A]'}`}>{label}</span>
            <span className={`mt-1 text-sm ${active ? 'text-[#0758BD]' : 'text-slate-600'}`}>{description}</span>
        </button>
    );
}
