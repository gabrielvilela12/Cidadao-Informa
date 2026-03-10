import { useState, useEffect, useRef } from 'react';
import { Bell, Type, Contrast, Check, Menu, Keyboard } from 'lucide-react';
import { useA11y } from '../context/A11yContext';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CITIZEN_SHORTCUTS, ADMIN_SHORTCUTS, SHARED_SHORTCUTS } from '../hooks/useKeyboardShortcuts';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { fontSize, setFontSize, theme, setTheme } = useA11y();
  const { role, toggleMobileMenu } = useApp();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showFontSize, setShowFontSize] = useState(false);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  const mainShortcuts = role === 'citizen' ? CITIZEN_SHORTCUTS : ADMIN_SHORTCUTS;

  const handleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else setTheme('dark');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (fontSizeRef.current && !fontSizeRef.current.contains(event.target as Node)) setShowFontSize(false);
      if (shortcutsRef.current && !shortcutsRef.current.contains(event.target as Node)) setShowShortcuts(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllAsRead = () => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setShowNotifications(false); };

  const iconBtnClass = "flex items-center justify-center size-9 rounded-xl bg-white/5 border border-white/8 text-slate-400 hover:text-white hover:bg-white/10 transition-all";

  return (
    <header className="sticky top-0 z-30 bg-[#080d12]/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-3 flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className={`md:hidden ${iconBtnClass}`}
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          {subtitle && <p className="text-slate-500 text-xs font-medium truncate">{subtitle}</p>}
          <h2 className="text-xl font-black text-white tracking-tight truncate">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Keyboard shortcuts */}
        <div className="relative" ref={shortcutsRef}>
          <button onClick={() => setShowShortcuts(s => !s)} className={iconBtnClass} title="Atalhos de Teclado">
            <Keyboard size={16} />
          </button>
          {showShortcuts && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0d1520] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
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

        {/* Font size */}
        <div className="relative" ref={fontSizeRef}>
          <button onClick={() => setShowFontSize(!showFontSize)} className={iconBtnClass} title="Tamanho da Fonte">
            <Type size={16} />
          </button>
          {showFontSize && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0d1520] border border-white/10 rounded-2xl shadow-2xl z-50 p-5">
              <h3 className="font-bold text-white mb-1 text-sm">Tamanho do Texto</h3>
              <p className="text-xs text-slate-500 mb-4">Ajuste: <span className="text-white font-bold">{fontSize}%</span></p>
              <div className="flex items-center gap-4">
                <span className="text-slate-400 text-sm font-medium">A</span>
                <input type="range" min="100" max="200" step="5" value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1 accent-blue-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                <span className="text-slate-200 text-xl font-bold">A</span>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-medium">
                <span>100%</span><span>200%</span>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleTheme} className={iconBtnClass} title="Alternar Tema">
          <Contrast size={16} />
        </button>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className={`${iconBtnClass} relative`}>
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-1.5 bg-red-500 rounded-full" />
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0d1520] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/8 flex justify-between items-center">
                <h3 className="font-bold text-white text-sm">Notificações</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Check size={12} /> Marcar lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">Nenhuma notificação.</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-blue-600/5' : ''}`}>
                      <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-slate-400'}`}>{notif.message}</p>
                      <p className="text-xs text-slate-600 mt-1">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
