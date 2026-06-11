import { MapPin } from 'lucide-react';

interface CidadaoBrandProps {
  compact?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function CidadaoBrand({
  compact = false,
  showIcon = true,
  className = '',
}: CidadaoBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className="cidadao-brand-icon flex items-center justify-center size-9 rounded-lg bg-blue-600 shadow-sm">
          <MapPin size={18} />
        </div>
      )}
      <div className="leading-none">
        <div className="cidadao-wordmark font-black tracking-tight">
          <span className="text-[#1351B4]">Cidad&atilde;o</span>
          <span className="text-[#FFCD07]"> In</span>
          <span className="text-[#168821]">forma</span>
        </div>
        {!compact && (
          <div className="text-[11px] font-semibold tracking-wide text-slate-600 mt-1">
            Portal de Zeladoria e Acessibilidade
          </div>
        )}
      </div>
    </div>
  );
}
