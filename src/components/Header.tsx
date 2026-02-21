import { Bell, Type, Contrast } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#101922]/80 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex justify-between items-center">
      <div>
        {subtitle && <p className="text-slate-400 text-sm font-medium">{subtitle}</p>}
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center justify-center size-10 rounded-full bg-[#1b2631] text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors" title="Aumentar Fonte">
          <Type size={20} />
        </button>
        <button className="flex items-center justify-center size-10 rounded-full bg-[#1b2631] text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors" title="Alto Contraste">
          <Contrast size={20} />
        </button>
        <div className="h-8 w-px bg-slate-700 mx-2"></div>
        <button className="flex items-center justify-center size-10 rounded-full bg-[#1b2631] text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-[#101922]"></span>
        </button>
      </div>
    </header>
  );
}
