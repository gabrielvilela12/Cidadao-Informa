interface CidadaoBrandProps {
  compact?: boolean;
  showIcon?: boolean;
  className?: string;
  iconClassName?: string;
}

export function CidadaoBrand({
  compact = false,
  showIcon = true,
  className = '',
  iconClassName = '',
}: CidadaoBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className={`cidadao-brand-icon flex shrink-0 items-center justify-center ${iconClassName || (compact ? 'size-10' : 'size-11')}`}>
          <svg viewBox="0 0 76 76" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M38 4C22.8 4 10.5 15.9 10.5 30.5C10.5 50 38 74 38 74C38 74 65.5 50 65.5 30.5C65.5 15.9 53.2 4 38 4Z" fill="#168821" />
            <path d="M38 13L60 30L38 47L16 30Z" fill="#FFCD07" />
            <circle cx="38" cy="30" r="10" fill="#1351B4" />
            <path d="M33 30L36.8 34L45 24.5" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
