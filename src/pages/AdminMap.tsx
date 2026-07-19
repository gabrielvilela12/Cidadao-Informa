import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Ear,
  Ellipsis,
  Eye,
  Layers3,
  Loader2,
  LocateFixed,
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
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { type Protocol } from '../constants';
import { useProtocols } from '../hooks/useProtocols';
import { exportToExcel } from '../utils/exportUtils';
import { getMarkerPosition } from '../utils/mapUtils';

type CanonicalStatus = 'Aberto' | 'Em análise' | 'Concluído' | 'Atrasado';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const ALL_CATEGORIES = ['Física', 'Visual', 'Auditiva', 'Outros'];
const ALL_STATUSES: CanonicalStatus[] = ['Aberto', 'Em análise', 'Concluído', 'Atrasado'];

const STATUS_COLORS: Record<CanonicalStatus, string> = {
  Aberto: '#0758BD',
  'Em análise': '#FFB800',
  Concluído: '#168821',
  Atrasado: '#E52207',
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
  const navigate = useNavigate();
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7939, -47.8828]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeCategories, setActiveCategories] = useState<string[]>(ALL_CATEGORIES);
  const [activeStatuses, setActiveStatuses] = useState<CanonicalStatus[]>(ALL_STATUSES);
  const [quickStatus, setQuickStatus] = useState<'all' | CanonicalStatus>('all');
  const [activeIncident, setActiveIncident] = useState<Protocol | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const filteredProtocols = useMemo(() => protocols.filter((protocol) => {
    const status = canonicalStatus(protocol.status);
    return activeCategories.includes(protocol.category || 'Outros')
      && activeStatuses.includes(status)
      && (quickStatus === 'all' || status === quickStatus);
  }), [activeCategories, activeStatuses, protocols, quickStatus]);

  const stats = useMemo(() => ALL_STATUSES.map((status) => ({
    status,
    count: protocols.filter((protocol) => canonicalStatus(protocol.status) === status).length,
  })), [protocols]);

  const topAreas = useMemo(() => {
    const counts = new Map<string, number>();
    protocols.forEach((protocol) => {
      const area = protocol.address?.split('-')[0]?.split(',')[0]?.trim() || 'Região central';
      counts.set(area, (counts.get(area) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2);
  }, [protocols]);

  const filterCount = (ALL_CATEGORIES.length - activeCategories.length) + (ALL_STATUSES.length - activeStatuses.length);

  useEffect(() => {
    if (!filteredProtocols.length) {
      setActiveIncident(null);
      setSelectedIndex(-1);
      return;
    }

    const currentIndex = activeIncident
      ? filteredProtocols.findIndex((protocol) => protocol.id === activeIncident.id)
      : -1;

    if (currentIndex >= 0) {
      setSelectedIndex(currentIndex);
      return;
    }

    setActiveIncident(filteredProtocols[0]);
    setSelectedIndex(0);
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

  const locateUser = () => {
    navigator.geolocation?.getCurrentPosition((position) => {
      const center: [number, number] = [position.coords.latitude, position.coords.longitude];
      setMapCenter(center);
      map?.flyTo(center, 15);
    });
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
    setSelectedIndex(nextIndex);
    setActiveIncident(incident);
    getMarkerPosition(incident.id, incident.address || '').then((position) => {
      if (position) map?.flyTo(position, 16);
    });
  }, [filteredProtocols, map, selectedIndex]);

  const handleMarkerClick = (protocol: Protocol, index: number) => {
    setActiveIncident(protocol);
    setSelectedIndex(index);
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
        {!loading && filteredProtocols.map((protocol, index) => (
          <ProtocolMarker
            key={protocol.id}
            protocol={protocol}
            selected={activeIncident?.id === protocol.id}
            showMarker={showMarkers}
            showHeatmap={showHeatmap}
            onClick={() => handleMarkerClick(protocol, index)}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 sm:p-5">
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

          <select value={quickStatus} onChange={(event) => setQuickStatus(event.target.value as 'all' | CanonicalStatus)} className="h-12 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 shadow-lg">
            <option value="all">Status: todos</option>
            {ALL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <div className="relative">
            <button type="button" onClick={() => setShowLayers((value) => !value)} className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 shadow-lg">
              <Layers3 size={18} /> Camadas <ChevronDown size={16} />
            </button>
            {showLayers && (
              <div className="absolute left-0 top-14 w-52 rounded-lg border border-[#CDD8E7] bg-white p-3 shadow-2xl">
                <LayerSwitch label="Marcadores por tipo" active={showMarkers} onClick={() => setShowMarkers((value) => !value)} />
                <LayerSwitch label="Mapa de calor" active={showHeatmap} onClick={() => setShowHeatmap((value) => !value)} />
              </div>
            )}
          </div>

          <button type="button" onClick={() => exportToExcel(filteredProtocols, 'mapa_estrategico.xlsx')} className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 shadow-lg">
            <Download size={18} /> <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button type="button" onClick={locateUser} className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#CDD8E7] bg-white px-4 text-sm font-bold text-slate-700 shadow-lg">
            <LocateFixed size={18} /> <span className="hidden lg:inline">Localização atual</span>
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute right-5 top-36 z-[450] hidden w-72 space-y-4 lg:block">
        <section className="pointer-events-auto rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-xl">
          <h2 className="font-black">Visão operacional</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 border-b border-[#D8E1ED] pb-5 text-center">
            <div><p className="text-3xl font-black text-[#0758BD]">{protocols.length}</p><p className="text-sm text-slate-600">Total</p></div>
            <div><p className="text-3xl font-black text-[#0758BD]">{filteredProtocols.length}</p><p className="text-sm text-slate-600">Visíveis</p></div>
          </div>
          <div className="mt-4 space-y-3">
            {stats.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />{item.status}</span>
                <strong className="rounded-full border px-3 py-1" style={{ borderColor: STATUS_COLORS[item.status], color: STATUS_COLORS[item.status] }}>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="pointer-events-auto rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-xl">
          <h2 className="font-black">Áreas com mais ocorrências</h2>
          <div className="mt-3 divide-y divide-[#E2E8F0]">
            {topAreas.map(([area, count]) => (
              <div key={area} className="flex items-center justify-between py-3 text-sm"><span>{area}</span><strong>{count}</strong></div>
            ))}
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-5 z-[450] flex flex-col items-center gap-3 lg:inset-x-5 lg:flex-row lg:items-end">
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[#CDD8E7] bg-white p-2 shadow-xl">
          <button type="button" onClick={() => navigateIncident('previous')} className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100"><ChevronLeft size={19} /></button>
          <strong className="text-sm">{selectedIndex >= 0 ? selectedIndex + 1 : 0} de {filteredProtocols.length}</strong>
          <button type="button" onClick={() => navigateIncident('next')} className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100"><ChevronRight size={19} /></button>
        </div>

        <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-lg border border-[#CDD8E7] bg-white px-5 py-3 text-xs shadow-xl lg:mx-auto">
          <span className="font-black">Tipo</span>
          {ALL_CATEGORIES.map((category) => { const CategoryIcon = CATEGORY_ICONS[category] || Ellipsis; return <span key={category} className="flex items-center gap-2"><CategoryIcon size={15} strokeWidth={2.5} className="text-[#0758BD]" />{category}</span>; })}
          <span className="hidden h-7 w-px bg-[#D8E1ED] sm:block" />
          <span className="font-black">Status</span>
          {ALL_STATUSES.map((status) => <span key={status} className="flex items-center gap-2"><span className="size-3 rounded-full border-2" style={{ borderColor: STATUS_COLORS[status] }} />{status}</span>)}
        </div>
      </div>

      <div className="absolute right-5 top-20 z-[450] flex flex-col overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-xl">
        <button type="button" onClick={() => map?.setZoom((map?.getZoom() || 13) + 1)} className="flex size-11 items-center justify-center border-b border-[#D8E1ED] hover:bg-slate-50"><Plus size={20} /></button>
        <button type="button" onClick={() => map?.setZoom((map?.getZoom() || 13) - 1)} className="flex size-11 items-center justify-center hover:bg-slate-50"><Minus size={20} /></button>
      </div>

      {activeIncident && (
        <div className="pointer-events-auto absolute bottom-24 left-1/2 z-[460] hidden w-[330px] -translate-x-1/2 rounded-lg border border-[#CDD8E7] bg-white p-4 shadow-2xl sm:block">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-bold text-slate-500">#{activeIncident.id.slice(0, 8)}</p><h2 className="mt-1 font-black">{activeIncident.description || 'Solicitação de acessibilidade'}</h2></div>
            <button type="button" onClick={() => setActiveIncident(null)} className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100"><X size={17} /></button>
          </div>
          <p className="mt-2 text-sm text-slate-600">{activeIncident.address}</p>
          <button type="button" onClick={() => navigate(`/protocolo/${activeIncident.id}`)} className="mt-4 min-h-10 w-full rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700">Ver detalhes</button>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border border-[#CDD8E7] bg-white px-5 py-4 text-sm font-bold shadow-xl"><Loader2 size={22} className="animate-spin text-[#0758BD]" />Carregando solicitações...</div>
        </div>
      )}
    </div>
  );
}

function LayerSwitch({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={active} onClick={onClick} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold hover:bg-slate-50">
      {label}
      <span className={`flex h-6 w-10 items-center rounded-full p-1 ${active ? 'justify-end bg-blue-600' : 'justify-start bg-slate-300'}`}><span className="size-4 rounded-full bg-white" /></span>
    </button>
  );
}

function FilterGroup({ title, values, selected, onToggle, status = false }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void; status?: boolean }) {
  return (
    <fieldset className="mt-4">
      <legend className="text-xs font-black uppercase text-slate-500">{title}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {values.map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E2E8F0] px-2 py-2 text-xs font-semibold">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} className="size-4 rounded" />
            {status && <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[value as CanonicalStatus] }} />}
            <span className="truncate">{value}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProtocolMarker({ protocol, selected, showMarker, showHeatmap, onClick }: { protocol: Protocol; selected: boolean; showMarker: boolean; showHeatmap: boolean; onClick: () => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const status = canonicalStatus(protocol.status);

  useEffect(() => {
    let active = true;
    getMarkerPosition(protocol.id, protocol.address || '').then((value) => {
      if (active) setPosition(value);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [protocol.address, protocol.id]);

  if (!position) return null;

  const categoryIconMarkup = CATEGORY_MARKER_ICONS[protocol.category] || '&hellip;';

  const icon = L.divIcon({
    className: 'protocol-marker-icon',
    html: `<span class="protocol-marker-pin ${selected ? 'is-selected' : ''}" style="--marker-color:${STATUS_COLORS[status]}"><span>${categoryIconMarkup}</span></span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });

  return (
    <>
      {showHeatmap && <Circle center={position} radius={900} pathOptions={{ stroke: false, fillColor: status === 'Atrasado' ? '#E52207' : '#FFB800', fillOpacity: status === 'Atrasado' ? 0.18 : 0.11 }} />}
      {showMarker && (
        <Marker position={position} icon={icon} eventHandlers={{ click: onClick }}>
          <Popup>
            <div className="min-w-[210px] p-1">
              <p className="text-xs font-bold text-slate-500">#{protocol.id.slice(0, 8)}</p>
              <h3 className="mt-1 font-bold text-slate-900">{protocol.description || protocol.category}</h3>
              <p className="mt-2 text-sm text-slate-600">{protocol.address}</p>
              <p className="mt-2 text-xs font-bold" style={{ color: STATUS_COLORS[status] }}>{status}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}
