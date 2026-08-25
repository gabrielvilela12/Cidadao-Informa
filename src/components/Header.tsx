import { useState, useEffect, useRef } from 'react';
import { Menu, Keyboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CITIZEN_SHORTCUTS, ADMIN_SHORTCUTS, SHARED_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { ThemeSwitch } from './ThemeSwitch';

interface HeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, description, action }: HeaderProps) {
  const { role, toggleMobileMenu } = useApp();
  const navigate = useNavigate();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  const mainShortcuts = role === 'citizen' ? CITIZEN_SHORTCUTS : ADMIN_SHORTCUTS;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shortcutsRef.current && !shortcutsRef.current.contains(event.target as Node)) setShowShortcuts(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const iconBtnClass = "header-icon-btn flex size-11 items-center justify-center rounded-lg border border-[#CDD8E7] bg-white text-slate-600 shadow-sm transition-all";

  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between gap-3 bg-[#F4F8FC]/95 px-4 py-5 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className={`md:hidden ${iconBtnClass}`}
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          {subtitle && <p className="truncate text-sm font-medium text-slate-600">{subtitle}</p>}
          <h1 className="truncate text-xl font-black text-[#111827] sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 hidden truncate text-sm text-slate-600 sm:block">{description}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {action && <div className="mr-1 hidden md:block">{action}</div>}
        {/* Keyboard shortcuts */}
        <div className="relative hidden sm:block" ref={shortcutsRef}>
          <button onClick={() => setShowShortcuts(s => !s)} className={iconBtnClass} title="Atalhos de Teclado">
            <Keyboard size={16} />
          </button>
          {showShortcuts && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] bg-white border border-[#CDD8E7] rounded-lg shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                <Keyboard size={14} className="text-blue-400" />
                <h3 className="font-bold text-white text-sm">Atalhos de Teclado</h3>
              </div>
              <div className="p-3 space-y-0.5">
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold px-2 mb-1">Navegação</p>
                {mainShortcuts.map(s => (
                  <button key={s.key} onClick={() => { navigate(s.path); setShowShortcuts(false); }}
                    className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group">
                    <span className="text-slate-400 text-xs group-hover:text-white">{s.description}</span>
                    <span className="flex items-center gap-0.5">
                      {s.key.split('+').map((part, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {i > 0 && <span className="text-slate-600 text-[10px]">+</span>}
                          <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">{part}</kbd>
                        </span>
                      ))}
                    </span>
                  </button>
                ))}
                <div className="border-t border-white/5 my-2" />
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold px-2 mb-1">Gerais</p>
                {SHARED_SHORTCUTS.map(s => (
                  <button key={s.key} onClick={() => { navigate(s.path); setShowShortcuts(false); }}
                    className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group">
                    <span className="text-slate-400 text-xs group-hover:text-white">{s.description}</span>
                    <span className="flex items-center gap-0.5">
                      {s.key.split('+').map((part, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {i > 0 && <span className="text-slate-600 text-[10px]">+</span>}
                          <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">{part}</kbd>
                        </span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ThemeSwitch />
      </div>
    </header>
  );
}
