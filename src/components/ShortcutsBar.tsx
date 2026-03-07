import { useState } from 'react';
import { Keyboard, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    CITIZEN_SHORTCUTS,
    ADMIN_SHORTCUTS,
    SHARED_SHORTCUTS,
    ShortcutDefinition,
} from '../hooks/useKeyboardShortcuts';

interface ShortcutsBarProps {
    role: 'citizen' | 'admin';
}

function KbdTag({ children }: { children: string }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {children.split('+').map((part, i) => (
                <span key={i} className="flex items-center gap-0.5">
                    {i > 0 && <span className="text-slate-500 text-[10px]">+</span>}
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0d1822] border border-slate-600 text-[11px] font-mono text-slate-200 shadow-sm">
                        {part}
                    </kbd>
                </span>
            ))}
        </span>
    );
}

export function ShortcutsBar({ role }: ShortcutsBarProps) {
    const [open, setOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const navigate = useNavigate();

    if (dismissed) return null;

    const mainShortcuts: ShortcutDefinition[] =
        role === 'citizen' ? CITIZEN_SHORTCUTS : ADMIN_SHORTCUTS;

    return (
        <div className="w-full z-40 sticky top-0">
            {/* Collapsed bar */}
            <div
                className={`
          flex items-center justify-between px-4 py-1.5 cursor-pointer select-none
          bg-gradient-to-r from-blue-900/60 to-indigo-900/50 border-b border-blue-700/40
          backdrop-blur-sm transition-all duration-200
          ${open ? '' : 'hover:bg-blue-900/70'}
        `}
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-2 text-blue-300 text-xs font-medium">
                    <Keyboard size={13} className="shrink-0" />
                    <span>Atalhos de Teclado</span>
                    {/* Quick inline preview (collapsed) */}
                    {!open && (
                        <span className="hidden sm:flex items-center gap-2 ml-2 text-slate-400">
                            {mainShortcuts.slice(0, 3).map(s => (
                                <span key={s.key} className="flex items-center gap-1">
                                    <KbdTag>{s.key}</KbdTag>
                                    <span className="text-[10px]">{s.description}</span>
                                </span>
                            ))}
                            {mainShortcuts.length > 3 && (
                                <span className="text-[10px] text-slate-500">+{mainShortcuts.length - 3 + SHARED_SHORTCUTS.length} mais</span>
                            )}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 hover:text-white transition-colors">
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                    <button
                        onClick={e => { e.stopPropagation(); setDismissed(true); }}
                        className="text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded"
                        title="Fechar barra de atalhos"
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>

            {/* Expanded panel */}
            {open && (
                <div className="bg-[#101e2b]/95 border-b border-blue-800/30 backdrop-blur-sm px-6 py-4 animate-fadeIn">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Main navigation */}
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold mb-2">
                                    Navegação Principal
                                </p>
                                <div className="space-y-1.5">
                                    {mainShortcuts.map(s => (
                                        <button
                                            key={s.key}
                                            onClick={() => { navigate(s.path); setOpen(false); }}
                                            className="flex items-center justify-between w-full px-2 py-1 rounded hover:bg-blue-900/30 transition-colors group text-left"
                                        >
                                            <span className="text-slate-300 text-xs group-hover:text-white transition-colors">
                                                {s.description}
                                            </span>
                                            <KbdTag>{s.key}</KbdTag>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Shared shortcuts */}
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold mb-2">
                                    Páginas Compartilhadas
                                </p>
                                <div className="space-y-1.5">
                                    {SHARED_SHORTCUTS.map(s => (
                                        <button
                                            key={s.key}
                                            onClick={() => { navigate(s.path); setOpen(false); }}
                                            className="flex items-center justify-between w-full px-2 py-1 rounded hover:bg-blue-900/30 transition-colors group text-left"
                                        >
                                            <span className="text-slate-300 text-xs group-hover:text-white transition-colors">
                                                {s.description}
                                            </span>
                                            <KbdTag>{s.key}</KbdTag>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="hidden lg:block">
                                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold mb-2">
                                    Dicas
                                </p>
                                <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                                    <li>Pressione <KbdTag>Alt+1</KbdTag> a qualquer momento para voltar ao Dashboard.</li>
                                    <li>Os atalhos não funcionam enquanto um campo de texto está focado.</li>
                                    <li>Clique em qualquer atalho para navegar diretamente.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
