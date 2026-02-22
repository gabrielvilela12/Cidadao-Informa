import { useState, useEffect, useRef } from 'react';
import { Bell, Type, Contrast, Check, Menu } from 'lucide-react';
import { useA11y } from '../context/A11yContext';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { fontSize, setFontSize, theme, setTheme } = useA11y();
  const { role, user, toggleMobileMenu } = useApp();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showFontSize, setShowFontSize] = useState(false);
  const fontSizeRef = useRef<HTMLDivElement>(null);

  const handleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else setTheme('dark'); // Assuming only light and dark for this button, high-contrast maybe elsewhere
  };

  useEffect(() => {
    if (!user) return;
    // Realtime capabilities removed as part of moving to native C# API.
    // Future: implement SignalR for polling/realtime notifications.
  }, [role, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(event.target as Node)) {
        setShowFontSize(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#101922]/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center w-full">
      <div className="flex items-center gap-3 md:gap-0">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden flex items-center justify-center size-10 rounded-full bg-[#1b2631] text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          {subtitle && <p className="text-slate-400 text-xs sm:text-sm font-medium truncate">{subtitle}</p>}
          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{title}</h2>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="relative" ref={fontSizeRef}>
          <button
            onClick={() => setShowFontSize(!showFontSize)}
            className="flex items-center justify-center size-10 rounded-full bg-[#1b2631] text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
            title="Tamanho da Fonte"
          >
            <Type size={20} />
          </button>

          {/* Font Size Dropdown */}
          {showFontSize && (
            <div className="absolute right-0 mt-2 w-72 bg-[#1c2632] border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 p-5">
              <div className="mb-4">
                <h3 className="font-bold text-white mb-1">Tamanho do Texto</h3>
                <p className="text-sm text-slate-400">Ajuste o tamanho: <span className="text-white font-bold">{fontSize}%</span></p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-400 text-sm font-medium">A</span>
                <input
                  type="range"
                  min="100"
                  max="200"
                  step="5"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1 accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-slate-200 text-xl font-bold">A</span>
              </div>
              <div className="flex justify-between mt-3 text-xs text-slate-500 font-medium">
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleTheme}
          className="flex items-center justify-center size-10 rounded-full bg-[#1b2631] text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
          title="Alternar Tema"
        >
          <Contrast size={20} />
        </button>
        <div className="h-8 w-px bg-slate-700 mx-2"></div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex items-center justify-center size-10 rounded-full bg-[#1b2631] text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 relative transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-[#101922]"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1c2632] border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-[#18212b]">
                <h3 className="font-bold text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Check size={14} /> Marcar lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-slate-700/50 hover:bg-[#202b38] transition-colors ${!notif.read ? 'bg-blue-900/10' : ''}`}
                    >
                      <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-slate-300'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
