import { Building2, Flame, Map as MapIcon } from 'lucide-react';
import { HEAT_CONTROLS, heatScaleCss } from '../../utils/heatmap';
import { CITY_SCOPES, type CityScopeId } from '../../utils/regions';

/**
 * gradiente: mancha continua de densidade.
 * estado: perimetro da UF, com a contagem dentro.
 * cidade: circulo em volta de onde os chamados estao.
 */
export type HeatMode = 'gradient' | 'state' | 'city';

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
    cityScope: CityScopeId;
    onCityScopeChange: (scope: CityScopeId) => void;
    /** Maior contagem numa unica regiao (estado ou cidade). */
    maxCount: number;
    /** Quantas regioes tem chamado. */
    regionCount: number;
    /** Chamados no raio que pintam vermelho no gradiente, de heatRedThreshold. */
    redThreshold: number;
    plotted: number;
    withoutLocation: number;
    /** Com coordenada, mas fora de qualquer UF (so no modo estado). */
    outsideStates: number;
    loadingStates: boolean;
}

function formatMeters(meters: number): string {
    return meters >= 1000
        ? `${(meters / 1000).toFixed(1).replace('.', ',')} km`
        : `${meters} m`;
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
    cityScope,
    onCityScopeChange,
    maxCount,
    regionCount,
    redThreshold,
    plotted,
    withoutLocation,
    outsideStates,
    loadingStates,
}: HeatLegendProps) {
    const update = (patch: Partial<HeatSettings>) => onSettingsChange({ ...settings, ...patch });

    return (
        <section className="pointer-events-auto absolute bottom-20 right-3 z-[450] max-h-[calc(100%-11rem)] w-[18.5rem] overflow-y-auto rounded-lg border border-[#CDD8E7] bg-white p-3 shadow-2xl sm:bottom-5 sm:right-5 sm:max-h-[calc(100%-9rem)]">
            <div className="flex items-center gap-2">
                <Flame size={17} className="shrink-0 text-[#E52207]" />
                <h2 className="font-black">Mapa de calor</h2>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-[#EEF3F9] p-1">
                <ModeButton active={mode === 'gradient'} onClick={() => onModeChange('gradient')} icon={<Flame size={14} />} label="Calor" />
                <ModeButton active={mode === 'state'} onClick={() => onModeChange('state')} icon={<MapIcon size={14} />} label="Estado" />
                <ModeButton active={mode === 'city'} onClick={() => onModeChange('city')} icon={<Building2 size={14} />} label="Cidade" />
            </div>

            <div className="mt-3.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Escala de cor</h3>
                <div
                    className="mt-1.5 h-3 w-full rounded-full border border-[#CDD8E7]"
                    style={{ background: heatScaleCss(mode === 'gradient' ? 'gradient' : 'region') }}
                />
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Menos chamados</span>
                    <span>Mais chamados</span>
                </div>

                {/* A escala e relativa a base filtrada, entao o topo tem de vir
                    escrito: sem isso, "vermelho" mudaria de significado a cada
                    filtro sem avisar. */}
                {mode === 'gradient' && redThreshold > 0 && (
                    <p className="mt-1 text-[11px] text-slate-600">
                        Vermelho = <strong className="text-slate-900">{redThreshold}+</strong> {redThreshold === 1 ? 'chamado' : 'chamados'} dentro do raio de {formatMeters(settings.radiusMeters)}.
                    </p>
                )}
                {mode === 'state' && maxCount > 0 && (
                    <p className="mt-1 text-[11px] text-slate-600">
                        <strong className="text-slate-900">1</strong> a <strong className="text-slate-900">{maxCount}</strong> {maxCount === 1 ? 'chamado' : 'chamados'} por estado, em <strong className="text-slate-900">{regionCount}</strong> {regionCount === 1 ? 'UF' : 'UFs'}. Estado sem chamado não é pintado.
                    </p>
                )}
                {mode === 'city' && maxCount > 0 && (
                    <p className="mt-1 text-[11px] text-slate-600">
                        <strong className="text-slate-900">1</strong> a <strong className="text-slate-900">{maxCount}</strong> {maxCount === 1 ? 'chamado' : 'chamados'} por cidade, em <strong className="text-slate-900">{regionCount}</strong> {regionCount === 1 ? 'círculo' : 'círculos'}. Clique para aproximar.
                    </p>
                )}
                {mode === 'state' && loadingStates && (
                    <p className="mt-1 text-[11px] text-slate-600">Carregando o contorno dos estados…</p>
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

                {mode === 'gradient' && (
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
                )}

                {mode === 'city' && (
                    <fieldset>
                        <legend className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            O que conta como uma cidade
                        </legend>
                        <div className="mt-1.5 grid grid-cols-3 gap-1">
                            {CITY_SCOPES.map((option) => {
                                const active = option.id === cityScope;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => onCityScopeChange(option.id)}
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
                {mode === 'state' && outsideStates > 0 && (
                    <>
                        {' · '}
                        <strong className="text-[#B8460E]">{outsideStates}</strong> com coordenada fora do território brasileiro
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
            className={`flex min-h-9 items-center justify-center gap-1 rounded-md px-1 text-xs font-bold transition-colors ${
                active ? 'bg-white text-[#0758BD] shadow-sm' : 'text-slate-600 hover:bg-white/70'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}
