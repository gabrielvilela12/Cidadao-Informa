import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Ear,
  Ellipsis,
  Eye,
  EyeOff,
  Flame,
  Layers3,
  Loader2,
  MapPin,
  Menu,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { type Protocol } from '../constants';
import { useProtocols } from '../hooks/useProtocols';
import { exportProtocolsToExcel } from '../utils/exportUtils';
import { countWithoutLocation, DEFAULT_MAP_CENTER, getMarkerPosition } from '../utils/mapUtils';
import {
  buildHeatPoints,
  HEAT_CONTROLS,
  heatDensityAnchor,
  heatRedThreshold,
  heatUnitAlpha,
  type HeatPointsResult,
} from '../utils/heatmap';
import {
  aggregateByState,
  cityScope as resolveCityScope,
  clusterCities,
  type CityAggregation,
  type CityScopeId,
  type StateAggregation,
  type StateShape,
} from '../utils/regions';
import { HeatGradientLayer } from '../components/admin/HeatGradientLayer';
import { HeatStateLayer } from '../components/admin/HeatStateLayer';
import { HeatCityLayer } from '../components/admin/HeatCityLayer';
import { HeatLegend, type HeatMode, type HeatSettings } from '../components/admin/HeatLegend';

type CanonicalStatus = 'Aberto' | 'Em análise' | 'Concluído' | 'Atrasado';

/** Pins = um marcador por protocolo. Calor = densidade agregada por área. */
type MapLayer = 'pins' | 'heat';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface VisibleProtocolMarker {
  protocol: Protocol;
  protocolIndex: number;
  exactPosition: [number, number];
  position: [number, number];
  overlapCount: number;
  overlapIndex: number;
}

const OVERLAP_COORDINATE_PRECISION = 6;
const OVERLAP_SPREAD_METERS = 32;
const METERS_PER_DEGREE_LATITUDE = 111_320;

function markerGroupKey(position: [number, number]): string {
  return `${position[0].toFixed(OVERLAP_COORDINATE_PRECISION)},${position[1].toFixed(OVERLAP_COORDINATE_PRECISION)}`;
}

function spreadOverlappingMarker(position: [number, number], overlapIndex: number, overlapCount: number): [number, number] {
  if (overlapCount <= 1) return position;

  const angle = ((Math.PI * 2) / overlapCount) * overlapIndex - Math.PI / 2;
  const radiusMeters = Math.min(64, OVERLAP_SPREAD_METERS + Math.floor((overlapCount - 1) / 6) * 8);
  const latitudeOffset = (Math.sin(angle) * radiusMeters) / METERS_PER_DEGREE_LATITUDE;
  const longitudeScale = Math.max(Math.cos((position[0] * Math.PI) / 180), 0.2);
  const longitudeOffset = (Math.cos(angle) * radiusMeters) / (METERS_PER_DEGREE_LATITUDE * longitudeScale);

  return [position[0] + latitudeOffset, position[1] + longitudeOffset];
}

const EMPTY_HEAT_POINTS: HeatPointsResult = { points: [], plotted: 0 };
const EMPTY_STATES: StateAggregation = { tallies: [], maxCount: 0, outside: 0 };
const EMPTY_CITIES: CityAggregation = { clusters: [], maxCount: 0 };

const ALL_CATEGORIES = ['Física', 'Visual', 'Auditiva', 'Outros'];
const ALL_STATUSES: CanonicalStatus[] = ['Aberto', 'Em análise', 'Concluído', 'Atrasado'];

const STATUS_COLORS: Record<CanonicalStatus, string> = {
  Aberto: '#0758BD',
  'Em análise': '#D97706',
  Concluído: '#168821',
  Atrasado: '#E52207',
};

const CATEGORY_COLORS: Record<string, string> = {
  Física: '#0758BD',
  Visual: '#8B5CF6',
  Auditiva: '#0D9488',
  Outros: '#D97706',
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  [ALL_CATEGORIES[0]]: Accessibility,
  [ALL_CATEGORIES[1]]: Eye,
  [ALL_CATEGORIES[2]]: Ear,
  [ALL_CATEGORIES[3]]: Ellipsis,
};

const CATEGORY_MARKER_ICONS: Record<string, string> = {
  [ALL_CATEGORIES[0]]: '&#9855;&#xfe0e;',
  [ALL_CATEGORIES[1]]: '&#128065;&#xfe0e;',
  [ALL_CATEGORIES[2]]: '&#128066;&#xfe0e;',
  [ALL_CATEGORIES[3]]: '&hellip;',
};

function canonicalStatus(status: Protocol['status']): CanonicalStatus {
  if (['Em Análise', 'InProgress'].includes(status)) return 'Em análise';
  if (['Concluído', 'Resolved', 'Closed'].includes(status)) return 'Concluído';
  if (status === 'Atrasado') return 'Atrasado';
  return 'Aberto';
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
    window.setTimeout(() => map.invalidateSize(), 120);
  }, [center, map]);
  return null;
}

function MapTracker({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    window.setTimeout(() => map.invalidateSize(), 120);
  }, [map, onReady]);
  return null;
}

export function AdminMap() {
  const { protocols, loading } = useProtocols('admin');
  const { toggleMobileMenu } = useApp();
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>(ALL_CATEGORIES);
  const [activeStatuses, setActiveStatuses] = useState<CanonicalStatus[]>(ALL_STATUSES);
  const [activeIncident, setActiveIncident] = useState<Protocol | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [mapOnlyMode, setMapOnlyMode] = useState(false);
  const [showOperationalPanel, setShowOperationalPanel] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('pins');
  const [heatMode, setHeatMode] = useState<HeatMode>('gradient');
  const [cityScopeId, setCityScopeId] = useState<CityScopeId>('medium');
  const [heatSettings, setHeatSettings] = useState<HeatSettings>({
    radiusMeters: HEAT_CONTROLS.radius.default,
    softness: HEAT_CONTROLS.softness.default,
    opacity: HEAT_CONTROLS.opacity.default,
  });

  const [states, setStates] = useState<StateShape[] | null>(null);

  const showHeat = activeLayer === 'heat';
  const showStates = showHeat && heatMode === 'state';
  const showCities = showHeat && heatMode === 'city';

  // O contorno das 27 UFs sao ~160 KB, carregados so quando o modo estado e
  // acionado - nenhuma outra tela precisa deles. Vite separa em chunk proprio.
  useEffect(() => {
    if (!showStates || states) return;

    let active = true;
    import('../data/estados-brasil')
      .then((module) => {
        if (active) setStates(module.ESTADOS_BRASIL);
      })
      .catch(() => {
        if (active) setStates([]);
      });

    return () => {
      active = false;
    };
  }, [showStates, states]);

  const filteredProtocols = useMemo(() => protocols.filter((protocol) => {
    const status = canonicalStatus(protocol.status);
    return activeCategories.includes(protocol.category || 'Outros')
      && activeStatuses.includes(status);
  }), [activeCategories, activeStatuses, protocols]);

  const visibleProtocolMarkers = useMemo<VisibleProtocolMarker[]>(() => {
    const positioned = filteredProtocols.flatMap((protocol, protocolIndex) => {
      const exactPosition = getMarkerPosition(protocol);
      return exactPosition ? [{ protocol, protocolIndex, exactPosition }] : [];
    });

    const groups = new Map<string, typeof positioned>();
    positioned.forEach((marker) => {
      const key = markerGroupKey(marker.exactPosition);
      const group = groups.get(key);

      if (group) {
        group.push(marker);
        return;
      }

      groups.set(key, [marker]);
    });

    return positioned.map((marker) => {
      const group = groups.get(markerGroupKey(marker.exactPosition)) || [marker];
      const overlapIndex = group.findIndex((item) => item.protocol.id === marker.protocol.id);
      const resolvedOverlapIndex = overlapIndex >= 0 ? overlapIndex : 0;

      return {
        ...marker,
        position: spreadOverlappingMarker(marker.exactPosition, resolvedOverlapIndex, group.length),
        overlapCount: group.length,
        overlapIndex: resolvedOverlapIndex,
      };
    });
  }, [filteredProtocols]);

  // O calor le a mesma lista filtrada dos pins: mexer em tipo ou status na
  // barra de filtros muda as duas camadas junto. Cada modo agrega so quando
  // esta na tela - sao passadas O(n) sobre a base inteira.
  const heatPoints = useMemo(
    () => (showHeat && heatMode === 'gradient' ? buildHeatPoints(filteredProtocols) : EMPTY_HEAT_POINTS),
    [filteredProtocols, heatMode, showHeat],
  );
  const stateAggregation = useMemo(
    () => (showStates && states?.length ? aggregateByState(filteredProtocols, states) : EMPTY_STATES),
    [filteredProtocols, showStates, states],
  );
  const cityAggregation = useMemo(
    () => (showCities ? clusterCities(filteredProtocols, resolveCityScope(cityScopeId).joinMeters) : EMPTY_CITIES),
    [cityScopeId, filteredProtocols, showCities],
  );
  // Densidade do decil mais quente da base filtrada: e o que normaliza a escala
  // do gradiente. O numero que a legenda anuncia sai da opacidade resultante, e
  // nao da ancora - heatRedThreshold explica por que.
  const heatUnit = useMemo(
    () => heatUnitAlpha(heatDensityAnchor(heatPoints.points, heatSettings.radiusMeters)),
    [heatPoints.points, heatSettings.radiusMeters],
  );
  const withoutLocation = useMemo(() => countWithoutLocation(filteredProtocols), [filteredProtocols]);

  const stats = useMemo(() => ALL_STATUSES.map((status) => ({
    status,
    count: protocols.filter((protocol) => canonicalStatus(protocol.status) === status).length,
  })), [protocols]);

  const filterCount = (ALL_CATEGORIES.length - activeCategories.length) + (ALL_STATUSES.length - activeStatuses.length);

  useEffect(() => {
    if (!filteredProtocols.length) {
      setActiveIncident(null);
      setSelectedIndex(-1);
      return;
    }

    if (!activeIncident) {
      setSelectedIndex(-1);
      return;
    }

    const currentIndex = filteredProtocols.findIndex((protocol) => protocol.id === activeIncident.id);

    if (currentIndex >= 0) {
      setSelectedIndex(currentIndex);
      return;
    }

    setActiveIncident(null);
    setSelectedIndex(-1);
  }, [activeIncident, filteredProtocols]);
  const handleAddressSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 4) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`, {
          headers: { 'Accept-Language': 'pt-BR' },
        });
        const data = await response.json() as AddressSuggestion[];
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 650);
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    const center: [number, number] = [Number(suggestion.lat), Number(suggestion.lon)];
    setSearch(suggestion.display_name);
    setSuggestions([]);
    setMapCenter(center);
    map?.flyTo(center, 15);
  };

  const toggleCategory = (category: string) => {
    setActiveCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  };

  const toggleStatus = (status: CanonicalStatus) => {
    setActiveStatuses((current) => current.includes(status)
      ? current.filter((item) => item !== status)
      : [...current, status]);
  };

  const navigateIncident = useCallback((direction: 'previous' | 'next') => {
    if (!filteredProtocols.length) return;
    const nextIndex = direction === 'next'
      ? (selectedIndex + 1) % filteredProtocols.length
      : selectedIndex <= 0 ? filteredProtocols.length - 1 : selectedIndex - 1;
    const incident = filteredProtocols[nextIndex];
    const visibleMarker = visibleProtocolMarkers.find((marker) => marker.protocol.id === incident.id);
    setSelectedIndex(nextIndex);
    setActiveIncident(incident);
    const position = visibleMarker?.position || getMarkerPosition(incident);
    if (position) map?.flyTo(position, 16);
  }, [filteredProtocols, map, selectedIndex, visibleProtocolMarkers]);

  const handleMarkerClick = (protocol: Protocol, index: number) => {
    setActiveIncident(protocol);
    setSelectedIndex(index);
  };

  const closeIncident = () => {
    setActiveIncident(null);
    setSelectedIndex(-1);
    map?.closePopup();
  };

  const enableMapOnlyMode = () => {
    closeIncident();
    setShowFilters(false);
    setShowOperationalPanel(false);
    setMapOnlyMode(true);
  };

  // Ir para o calor fecha a ocorrencia selecionada: sem pins na tela, um popup
  // de protocolo aberto fica sem ancora visivel.
  const selectLayer = (layer: MapLayer) => {
    if (layer === activeLayer) return;
    if (layer === 'heat') closeIncident();
    setActiveLayer(layer);
  };

  return (
    <div className="relative h-full flex-1 overflow-hidden bg-[#DDEAF3]">
      <MapContainer center={mapCenter} zoom={13} zoomControl={false} style={{ width: '100%', height: '100%' }}>
        <MapController center={mapCenter} />
        <MapTracker onReady={setMap} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {!loading && !showHeat && visibleProtocolMarkers.map(({ protocol, protocolIndex, position, overlapCount, overlapIndex }) => (
          <ProtocolMarker
            key={protocol.id}
            protocol={protocol}
            position={position}
            selected={activeIncident?.id === protocol.id}
            overlapCount={overlapCount}
            overlapIndex={overlapIndex}
            onClick={() => handleMarkerClick(protocol, protocolIndex)}
          />
        ))}
        {!loading && showHeat && heatMode === 'gradient' && (
          <HeatGradientLayer
            points={heatPoints.points}
            unitAlpha={heatUnit}
            radiusMeters={heatSettings.radiusMeters}
            softness={heatSettings.softness / 100}
            opacity={heatSettings.opacity / 100}
          />
        )}
        {!loading && showStates && (
          <HeatStateLayer
            tallies={stateAggregation.tallies}
            maxCount={stateAggregation.maxCount}
            opacity={heatSettings.opacity / 100}
          />
        )}
        {!loading && showCities && (
          <HeatCityLayer
            clusters={cityAggregation.clusters}
            maxCount={cityAggregation.maxCount}
            opacity={heatSettings.opacity / 100}
          />
        )}
      </MapContainer>

      {!mapOnlyMode ? <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 sm:p-5">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={toggleMobileMenu} className="flex size-12 items-center justify-center rounded-lg border border-[#CDD8E7] bg-white text-[#0758BD] shadow-lg md:hidden" aria-label="Abrir menu">
            <Menu size={20} />
          </button>

          <div className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => handleAddressSearch(event.target.value)}
              placeholder="Buscar no mapa (ex: Águas Claras, DF)"
              className="h-12 w-full rounded-lg border border-[#CDD8E7] bg-white pl-11 pr-10 text-sm shadow-lg outline-none focus:border-[#0758BD]"
            />
            {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#0758BD]" size={17} />}
            {suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-14 overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-2xl">
                {suggestions.map((suggestion) => (
                  <button key={`${suggestion.lat}-${suggestion.lon}`} type="button" onClick={() => selectSuggestion(suggestion)} className="flex w-full items-start gap-2 border-b border-[#E2E8F0] px-4 py-3 text-left text-sm hover:bg-blue-50">
                    <MapPin className="mt-0.5 shrink-0 text-[#0758BD]" size={16} />
                    <span className="line-clamp-2">{suggestion.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button type="button" onClick={() => setShowFilters((value) => !value)} className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 shadow-lg">
              <SlidersHorizontal size={18} />
              Filtros
              {filterCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">{filterCount}</span>}
            </button>
            {showFilters && (
              <div className="absolute left-0 top-14 w-72 rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="font-black">Filtros do mapa</h2>
                  <button type="button" onClick={() => setShowFilters(false)} className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100"><X size={17} /></button>
                </div>
                <FilterGroup title="Tipo" values={ALL_CATEGORIES} selected={activeCategories} onToggle={toggleCategory} />
                <FilterGroup title="Status" values={ALL_STATUSES} selected={activeStatuses} onToggle={(value) => toggleStatus(value as CanonicalStatus)} status />
              </div>
            )}
          </div>

          <div role="group" aria-label="Camada do mapa" className="inline-flex h-12 items-center gap-1 rounded-lg border border-[#CDD8E7] bg-white p-1 shadow-lg">
            <LayerButton active={!showHeat} onClick={() => selectLayer('pins')} icon={MapPin} label="Pins" title="Um marcador por solicitação" />
            <LayerButton active={showHeat} onClick={() => selectLayer('heat')} icon={Flame} label="Calor" title="Densidade de chamados por área" />
          </div>

          <button
            type="button"
            onClick={() => exportProtocolsToExcel(filteredProtocols, 'mapa_estrategico.xlsx', 'Mapa estratégico')}
            disabled={filteredProtocols.length === 0}
            aria-label="Exportar Excel"
            title={filteredProtocols.length === 0 ? 'Nenhuma solicitação visível nos filtros atuais' : 'Exportar Excel'}
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} /> <span className="hidden 2xl:inline">Exportar Excel</span>
          </button>
          <button type="button" onClick={enableMapOnlyMode} className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 shadow-lg" title="Ocultar painéis e deixar somente o mapa">
            <EyeOff size={18} /> <span className="hidden xl:inline">Somente mapa</span>
          </button>
        </div>
      </div> : (
        <button
          type="button"
          onClick={() => setMapOnlyMode(false)}
          className="absolute left-4 top-4 z-[500] inline-flex h-11 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-[#0758BD] shadow-xl"
        >
          <SlidersHorizontal size={18} /> Mostrar controles
        </button>
      )}

      {!mapOnlyMode && !showOperationalPanel && (
        <button
          type="button"
          onClick={() => setShowOperationalPanel(true)}
          aria-expanded="false"
          className="absolute left-5 top-24 z-[450] hidden min-h-10 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-3 text-xs font-bold text-[#0758BD] shadow-xl lg:inline-flex"
        >
          <Layers3 size={18} /> Visão operacional
        </button>
      )}

      {!mapOnlyMode && showOperationalPanel && <div className="pointer-events-auto absolute left-5 top-24 z-[450] hidden max-h-[calc(100%-7rem)] w-72 overflow-y-auto rounded-lg border border-[#CDD8E7] bg-white p-3 shadow-2xl lg:block">
        <section className="pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black">Visão operacional</h2>
            <button type="button" onClick={() => setShowOperationalPanel(false)} aria-label="Fechar visão operacional" title="Fechar" className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"><X size={17} /></button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 border-b border-[#D8E1ED] pb-4 text-center">
            <div><p className="text-2xl font-black text-[#0758BD]">{protocols.length}</p><p className="text-xs text-slate-600">Total</p></div>
            <div><p className="text-2xl font-black text-[#0758BD]">{filteredProtocols.length}</p><p className="text-xs text-slate-600">Visíveis</p></div>
          </div>
          <div className="mt-3 space-y-2.5">
            {stats.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />{item.status}</span>
                <strong className="rounded-full border px-3 py-1" style={{ borderColor: STATUS_COLORS[item.status], color: STATUS_COLORS[item.status] }}>{item.count}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-3 text-sm">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Tipo</h3>
              <div className="mt-2 space-y-2.5">
                {ALL_CATEGORIES.map((category) => {
                  const CategoryIcon = CATEGORY_ICONS[category] || Ellipsis;
                  return <div key={category} className="flex items-center gap-2"><CategoryIcon size={16} strokeWidth={2.5} className="shrink-0 text-[#0758BD]" /><span>{category}</span></div>;
                })}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Status</h3>
              <div className="mt-2 space-y-2.5">
                {ALL_STATUSES.map((status) => <div key={status} className="flex items-center gap-2"><span className="size-3 shrink-0 rounded-full border-2" style={{ borderColor: STATUS_COLORS[status] }} /><span>{status}</span></div>)}
              </div>
            </div>
          </div>
        </section>
      </div>}

      {!mapOnlyMode && showHeat && (
        <HeatLegend
          mode={heatMode}
          onModeChange={setHeatMode}
          settings={heatSettings}
          onSettingsChange={setHeatSettings}
          cityScope={cityScopeId}
          onCityScopeChange={setCityScopeId}
          maxCount={showStates ? stateAggregation.maxCount : cityAggregation.maxCount}
          regionCount={showStates ? stateAggregation.tallies.length : cityAggregation.clusters.length}
          outsideStates={stateAggregation.outside}
          loadingStates={showStates && states === null}
          redThreshold={heatRedThreshold(heatUnit)}
          plotted={filteredProtocols.length - withoutLocation}
          withoutLocation={withoutLocation}
        />
      )}

      {!mapOnlyMode && !showHeat && <div className="pointer-events-none absolute inset-x-3 bottom-5 z-[450] flex items-end gap-3 lg:inset-x-5">
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[#CDD8E7] bg-white p-2 shadow-xl">
          <button type="button" onClick={() => navigateIncident('previous')} aria-label="Ocorrência anterior" className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100"><ChevronLeft size={19} /></button>
          <strong className="text-sm">{selectedIndex >= 0 ? selectedIndex + 1 : 0} de {filteredProtocols.length}</strong>
          <button type="button" onClick={() => navigateIncident('next')} aria-label="Próxima ocorrência" className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100"><ChevronRight size={19} /></button>
        </div>
      </div>}

      <div className="absolute right-5 top-24 z-[450] flex flex-col overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-xl">
        <button type="button" onClick={() => map?.setZoom((map?.getZoom() || 13) + 1)} className="flex size-11 items-center justify-center border-b border-[#D8E1ED] hover:bg-slate-50"><Plus size={20} /></button>
        <button type="button" onClick={() => map?.setZoom((map?.getZoom() || 13) - 1)} className="flex size-11 items-center justify-center hover:bg-slate-50"><Minus size={20} /></button>
      </div>
      {loading && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border border-[#CDD8E7] bg-white px-5 py-4 text-sm font-bold shadow-xl"><Loader2 size={22} className="animate-spin text-[#0758BD]" />Carregando solicitações...</div>
        </div>
      )}
    </div>
  );
}

function LayerButton({ active, onClick, icon: Icon, label, title }: { active: boolean; onClick: () => void; icon: LucideIcon; label: string; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={`inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-bold transition-colors ${
        active ? 'bg-[#EAF2FF] text-[#0758BD]' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function FilterGroup({ title, values, selected, onToggle, status = false }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void; status?: boolean }) {
  return (
    <fieldset className="mt-4">
      <legend className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</legend>
      <div className="mt-2.5 space-y-1.5">
        {values.map((value) => {
          const checked = selected.includes(value);
          const itemColor = status ? STATUS_COLORS[value as CanonicalStatus] : CATEGORY_COLORS[value] || '#0758BD';
          return (
            <label
              key={value}
              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                checked ? 'border-slate-200 bg-slate-50/80 text-slate-900 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: itemColor }} />
                <span className="truncate">{value}</span>
              </div>
              <input type="checkbox" checked={checked} onChange={() => onToggle(value)} className="sr-only" />
              {/* O check usa dashboard-inverse-text, nao text-white: o overlay
                  institucional repinta .text-white para texto escuro, e a cor
                  deste quadrado vem de style inline, que perde para o
                  !important da folha. Sem isso o check sai preto. */}
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded transition-all ${
                  checked ? 'dashboard-inverse-text shadow-sm' : 'border border-slate-300 bg-white'
                }`}
                style={checked ? { backgroundColor: itemColor, borderColor: itemColor } : {}}
              >
                {checked && <Check size={11} strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ProtocolMarker({ protocol, position, selected, overlapCount, overlapIndex, onClick }: { protocol: Protocol; position: [number, number]; selected: boolean; overlapCount: number; overlapIndex: number; onClick: () => void }) {
  const status = canonicalStatus(protocol.status);
  const categoryIconMarkup = CATEGORY_MARKER_ICONS[protocol.category] || '&hellip;';
  const overlapBadge = overlapCount > 1 ? `<small class="protocol-marker-count">${overlapIndex + 1}</small>` : '';

  const icon = L.divIcon({
    className: 'protocol-marker-icon',
    html: `<span class="protocol-marker-pin ${selected ? 'is-selected' : ''}" style="--marker-color:${STATUS_COLORS[status]}"><span>${categoryIconMarkup}</span>${overlapBadge}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });

  return (
    <Marker position={position} icon={icon} eventHandlers={{ click: onClick }}>
      <Popup>
        <div className="min-w-[260px] p-1">
          <p className="text-xs font-bold text-slate-500">#{protocol.id.slice(0, 8)}</p>
          <h3 className="mt-1 font-bold text-slate-900">{protocol.description || protocol.category}</h3>
          <p className="mt-2 text-sm text-slate-600">{protocol.address}</p>
          <p className="mt-2 text-xs font-bold" style={{ color: STATUS_COLORS[status] }}>{status}</p>
          {overlapCount > 1 && (
            <p className="mt-2 rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-[#0758BD]">
              {overlapCount} protocolos neste mesmo local
            </p>
          )}
          <Link to={`/protocolo/${protocol.id}`} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
            Ver detalhes
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
