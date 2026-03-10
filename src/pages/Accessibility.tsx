import React, { useState } from 'react';
import { Eye, Type, Palette, Sun, Moon, Contrast, AlignJustify, Activity, Volume2, Play, Pause, Square, Keyboard, LayoutTemplate } from 'lucide-react';
import { useA11y } from '../context/A11yContext';
import { motion } from 'framer-motion';

export function Accessibility() {
    const {
        fontSize, setFontSize,
        theme, setTheme,
        colorblindMode, setColorblindMode,
        textSpacing, setTextSpacing,
        reducedMotion, setReducedMotion,
        highFocus, setHighFocus,
        simplifiedMode, setSimplifiedMode
    } = useA11y();

    const [isReading, setIsReading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Screen Reader Logic
    const startReading = () => {
        if (!('speechSynthesis' in window)) return;
        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            return;
        }

        window.speechSynthesis.cancel();

        const textToRead = document.body.innerText;
        const utterance = new SpeechSynthesisUtterance(textToRead);
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
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.pause();
        setIsPaused(true);
    };

    const stopReading = () => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        setIsReading(false);
        setIsPaused(false);
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#080d12] font-sans">
            <main className="flex-grow flex flex-col items-center py-8 px-4 md:px-8">
                <div className="w-full max-w-[1000px] flex flex-col gap-6">
                    <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                            <Eye className="text-blue-500" size={36} />
                            Acessibilidade
                        </h1>
                        <p className="text-slate-400">Personalize o sistema para atender às suas necessidades visuais, motoras e cognitivas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Font Size Panel */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-2xl p-6 border border-white/8 flex flex-col gap-5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Type className="text-blue-500" size={24} />
                                Tamanho da Fonte
                            </h2>
                            <p className="text-sm text-slate-400 mb-2">Ajuste o tamanho de todos os textos da aplicação: <span className="text-white font-bold">{fontSize}%</span></p>

                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-6">
                                    <span className="text-slate-400 font-medium text-lg">A</span>
                                    <input
                                        type="range"
                                        min="100"
                                        max="200"
                                        step="5"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="flex-1 accent-blue-500 h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-slate-200 font-bold text-3xl">A</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
                                    <span>Padrão (100%)</span>
                                    <span>Máximo (200%)</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Espaçamento de Texto */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 rounded-2xl p-6 border border-white/8 flex flex-col gap-5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlignJustify className="text-blue-500" size={24} />
                                Espaçamento de Texto
                            </h2>
                            <p className="text-sm text-slate-400 mb-2">Ajuste o espaçamento entre linhas e letras para melhorar a leitura.</p>
                            <div className="flex flex-col gap-3">
                                <OptionButton label="Padrão" desc="Espaçamento original." active={textSpacing === 'normal'} onClick={() => setTextSpacing('normal')} />
                                <OptionButton label="Médio" desc="Aumenta espaçamento entre linhas em 20%" active={textSpacing === 'medium'} onClick={() => setTextSpacing('medium')} />
                                <OptionButton label="Amplo" desc="Aumenta espaçamento entre linhas em 35%" active={textSpacing === 'wide'} onClick={() => setTextSpacing('wide')} />
                            </div>
                        </motion.div>

                        {/* Tema Panel */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 rounded-2xl p-6 border border-white/8 flex flex-col gap-5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sun className="text-blue-500" size={24} />
                                Temas & Contraste
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                <OptionButton label="Modo Escuro (Padrão)" desc="Fundo escuro nativo do sistema." icon={<Moon size={20} />} active={theme === 'dark'} onClick={() => setTheme('dark')} />
                                <OptionButton label="Modo Claro" desc="Inverte a coloração para fundo branco." icon={<Sun size={20} />} active={theme === 'light'} onClick={() => setTheme('light')} />
                                <OptionButton label="Alto Contraste Branco" desc="Bordas brancas extremas para diferenciação." icon={<Contrast size={20} />} active={theme === 'high-contrast'} onClick={() => setTheme('high-contrast')} />
                            </div>
                        </motion.div>

                        {/* Navegação por Teclado */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 rounded-2xl p-6 border border-white/8 flex flex-col gap-5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Keyboard className="text-blue-500" size={24} />
                                Navegação por Teclado
                            </h2>
                            <p className="text-sm text-slate-400 mb-2">Destaca visualmente os elementos ao navegar usando a tecla TAB.</p>
                            <ToggleButton
                                label="Destacar foco de navegação"
                                active={highFocus}
                                onClick={() => setHighFocus(!highFocus)}
                            />
                        </motion.div>

                        {/* Movimento e Animações */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 rounded-2xl p-6 border border-white/8 flex flex-col gap-5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="text-blue-500" size={24} />
                                Movimento e Animações
                            </h2>
                            <p className="text-sm text-slate-400 mb-2">Reduza animações e transições para maior conforto visual. Ideal para pessoas com sensibilidade a movimento.</p>
                            <ToggleButton
                                label="Reduzir animações e efeitos visuais"
                                active={reducedMotion}
                                onClick={() => setReducedMotion(!reducedMotion)}
                            />
                        </motion.div>

                        {/* Modo Simplificado */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 rounded-2xl p-6 border border-white/8 flex flex-col gap-5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <LayoutTemplate className="text-blue-500" size={24} />
                                Modo Simplificado
                            </h2>
                            <p className="text-sm text-slate-400 mb-2">Exibe apenas as informações essenciais da página. Ideal para usuários com baixa alfabetização digital.</p>
                            <ToggleButton
                                label="Ativar modo simplificado"
                                active={simplifiedMode}
                                onClick={() => setSimplifiedMode(!simplifiedMode)}
                            />
                        </motion.div>

                        {/* Leitura em Voz */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#1c2632] rounded-xl p-6 shadow-sm border border-slate-700 flex flex-col gap-5 md:col-span-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Volume2 className="text-blue-500" size={24} />
                                Leitura em Voz
                            </h2>
                            <p className="text-sm text-slate-400 mb-2">Permite que o conteúdo da página seja lido em voz alta.</p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={startReading}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                                >
                                    <Play size={20} /> Ler conteúdo da página
                                </button>
                                <button
                                    onClick={pauseReading}
                                    disabled={!isReading && !isPaused}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                                >
                                    <Pause size={20} /> Pausar
                                </button>
                                <button
                                    onClick={stopReading}
                                    disabled={!isReading && !isPaused}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                                >
                                    <Square size={20} /> Parar
                                </button>
                            </div>
                        </motion.div>

                        {/* Colorblind Panel */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#1c2632] rounded-xl p-6 shadow-sm border border-slate-700 flex flex-col gap-5 md:col-span-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Palette className="text-blue-500" size={24} />
                                Filtros de Daltonismo
                            </h2>
                            <p className="text-sm text-slate-400 mb-2">As opções abaixo aplicam filtros de coloração que ajudam na distinção de mapas, semáforos e gráficos.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <CardButton label="Nenhum" desc="Cores Padrão" active={colorblindMode === 'none'} onClick={() => setColorblindMode('none')} />
                                <CardButton label="Protanopia" desc="Deficiência de vermelho" active={colorblindMode === 'protanopia'} onClick={() => setColorblindMode('protanopia')} />
                                <CardButton label="Deuteranopia" desc="Deficiência de verde" active={colorblindMode === 'deuteranopia'} onClick={() => setColorblindMode('deuteranopia')} />
                                <CardButton label="Tritanopia" desc="Deficiência de azul" active={colorblindMode === 'tritanopia'} onClick={() => setColorblindMode('tritanopia')} />
                            </div>
                        </motion.div>

                    </div>
                </div>
            </main>
        </div>
    );
}

function OptionButton({ label, desc, active, onClick, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all ${active
                ? 'bg-blue-500/10 border-blue-500'
                : 'bg-white/5 border-white/5 hover:border-white/15'
                }`}
        >
            <div className={`flex items-center justify-center min-w-5 h-5 rounded-full border-2 ${active ? 'border-blue-500' : 'border-slate-600'}`}>
                {active && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
            </div>
            <div className="flex-1 flex flex-col">
                <span className={`font-semibold flex items-center gap-2 ${active ? 'text-blue-400' : 'text-slate-200'}`}>
                    {icon} {label}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">{desc}</span>
            </div>
        </button>
    );
}

function CardButton({ label, desc, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-5 rounded-xl border text-center transition-all h-full ${active
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
        >
            <span className="font-bold mb-1">{label}</span>
            <span className={`text-xs ${active ? 'text-blue-100' : 'text-slate-500'}`}>{desc}</span>
        </button>
    );
}

function ToggleButton({ label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-between w-full p-4 rounded-xl border text-left transition-all ${active
                ? 'bg-blue-500/10 border-blue-500'
                : 'bg-white/5 border-white/5 hover:border-white/15'
                }`}
        >
            <span className={`font-semibold flex items-center gap-2 ${active ? 'text-blue-400' : 'text-slate-200'}`}>
                {label}
            </span>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors flex ${active ? 'bg-blue-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
        </button>
    );
}
