import { Flame, Grid3x3 } from 'lucide-react';
import {
    formatCellSize,
    HEAT_CONTROLS,
    HEAT_RESOLUTIONS,
    heatScaleCss,
    type HeatResolutionId,
} from '../../utils/heatmap';

export type HeatMode = 'gradient' | 'grid';

function formatMeters(meters: number): string {
    return meters >= 1000
        ? `${(meters / 1000).toFixed(1).replace('.', ',')} km`
        : `${meters} m`;
}

export interface HeatSettings {
    radiusMeters: number;
    /** Largura da borda difusa, em % do raio. */
    softness: number;
    /** Opacidade da camada, em %. */
    opacity: number;
}

interface HeatLegendProps {
    mode: HeatMode;
    onModeChange: (mode: HeatMode) => void;
    settings: HeatSettings;
    onSettingsChange: (settings: HeatSettings) => void;
    resolution: HeatResolutionId;
    onResolutionChange: (resolution: HeatResolutionId) => void;
    /** Maior contagem numa unica celula da grade. */
    maxCount: number;
    /** Lado da celula em metros, derivado do zoom. */
    cellMeters: number;
    /** Chamados no raio que pintam vermelho, de heatRedThreshold. */
    redThreshold: number;
    plotted: number;
    withoutLocation: number;
}

/**
 * Legenda e controles do mapa de calor.
 *
 * Os controles moram aqui, e nao na barra superior, porque so fazem sentido com
 * a camada de calor ligada - e a barra superior ja disputa espaco com busca,
 * filtros e exportacao em telas de 1366 px.
 */
export function HeatLegend({
    mode,
    onModeChange,
    settings,
    onSettingsChange,
    resolution,
    onResolutionChange,
    maxCount,
    cellMeters,
    redThreshold,
    plotted,
    withoutLocation,
}: HeatLegendProps) {
    const update = (patch: Partial<HeatSettings>) => onSettingsChange({ ...settings, ...patch });

    return (
        <section className="pointer-events-auto absolute bottom-20 right-3 z-[450] max-h-[calc(100%-11rem)] w-[18.5rem] overflow-y-auto rounded-lg border border-[#CDD8E7] bg-white p-3 shadow-2xl sm:bottom-5 sm:right-5 sm:max-h-[calc(100%-9rem)]">
            <div className="flex items-center gap-2">
                <Flame size={17} className="shrink-0 text-[#E52207]" />
                <h2 className="font-black">Mapa de calor</h2>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-[#EEF3F9] p-1">
                <ModeButton active={mode === 'gradient'} onClick={() => onModeChange('gradient')} icon={<Flame size={14} />} label="Gradiente" />
                <ModeButton active={mode === 'grid'} onClick={() => onModeChange('grid')} icon={<Grid3x3 size={14} />} label="Grade" />
            </div>

            <div className="mt-3.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Escala de cor</h3>
                <div className="mt-1.5 h-3 w-full rounded-full border border-[#CDD8E7]" style={{ background: heatScaleCss(mode) }} />
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Menos chamados</span>
                    <span>Mais chamados</span>
                </div>
                {mode === 'grid' && maxCount > 0 && (
                    <p className="mt-1 text-[11px] text-slate-600">
                        <strong className="text-slate-900">1</strong> a <strong className="text-slate-900">{maxCount}</strong> {maxCount === 1 ? 'chamado' : 'chamados'} por célula de <strong className="text-slate-900">{formatCellSize(cellMeters)}</strong>. Clique para aproximar.
                    </p>
                )}
                {/* A escala do gradiente e relativa a base filtrada, entao o topo
                    tem de vir escrito: sem isso, "vermelho" mudaria de
                    significado a cada filtro sem avisar. */}
                {mode === 'gradient' && redThreshold > 0 && (
                    <p className="mt-1 text-[11px] text-slate-600">
                        Vermelho = <strong className="text-slate-900">{redThreshold}+</strong> {redThreshold === 1 ? 'chamado' : 'chamados'} dentro do raio de {formatMeters(settings.radiusMeters)}.
                    </p>
                )}
            </div>

            <div className="mt-3.5 space-y-3 border-t border-[#E2E8F0] pt-3">
                <Slider
                    label="Opacidade"
                    value={settings.opacity}
                    display={`${settings.opacity}%`}
                    bounds={HEAT_CONTROLS.opacity}
                    onChange={(opacity) => update({ opacity })}
                />

                {mode === 'gradient' ? (
                    <>
                        <Slider
                            label="Raio"
                            value={settings.radiusMeters}
                            display={formatMeters(settings.radiusMeters)}
                            bounds={HEAT_CONTROLS.radius}
                            hint="Alcance de cada chamado no chão. Vale em metros, então a mancha cobre a mesma área em qualquer zoom."
                            onChange={(radiusMeters) => update({ radiusMeters })}
                        />
                        <Slider
                            label="Suavização"
                            value={settings.softness}
                            display={`${settings.softness}%`}
                            bounds={HEAT_CONTROLS.softness}
                            hint="Largura da borda difusa, em porcentagem do raio."
                            onChange={(softness) => update({ softness })}
                        />
                    </>
                ) : (
                    <fieldset>
                        {/* Relativo, nao absoluto: o lado da celula segue o zoom,
                            senao ela vira sub-pixel e a grade desaparece ao
                            afastar. Aqui se escolhe mais ou menos refinamento. */}
                        <legend className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Grade — células de {formatCellSize(cellMeters)}
                        </legend>
                        <div className="mt-1.5 grid grid-cols-3 gap-1">
                            {HEAT_RESOLUTIONS.map((option) => {
                                const active = option.id === resolution;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => onResolutionChange(option.id)}
                                        aria-pressed={active}
                                        title={option.description}
                                        className={`min-h-9 rounded-lg border px-1 text-xs font-bold transition-colors ${
                                            active
                                                ? 'border-[#0758BD] bg-[#EAF2FF] text-[#0758BD]'
                                                : 'border-[#CDD8E7] bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                )}
            </div>

            <p className="mt-3 border-t border-[#E2E8F0] pt-2.5 text-[11px] text-slate-600">
                <strong className="text-slate-900">{plotted}</strong> {plotted === 1 ? 'chamado' : 'chamados'} no cálculo
                {withoutLocation > 0 && (
                    <>
                        {' · '}
                        <strong className="text-[#B8460E]">{withoutLocation}</strong> sem localização confirmada, fora do mapa
                    </>
                )}
            </p>
        </section>
    );
}

function Slider({ label, value, display, bounds, hint, onChange }: {
    label: string;
    value: number;
    display: string;
    bounds: { min: number; max: number; step: number };
    hint?: string;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block" title={hint}>
            <span className="flex items-baseline justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
                <span className="text-xs font-bold text-slate-900">{display}</span>
            </span>
            <input
                type="range"
                min={bounds.min}
                max={bounds.max}
                step={bounds.step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="heat-slider mt-1 w-full"
            />
        </label>
    );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-bold transition-colors ${
                active ? 'bg-white text-[#0758BD] shadow-sm' : 'text-slate-600 hover:bg-white/70'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}
