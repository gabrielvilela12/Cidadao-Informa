import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  List,
  Loader2,
  Menu,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link, useNavigate } from 'react-router-dom';
import { Protocol } from '../constants';
import { useApp } from '../context/AppContext';
import { useProtocols } from '../hooks/useProtocols';
import { getMarkerPosition } from '../utils/mapUtils';
import { StatusBadge } from './CitizenDashboard';

type CanonicalStatus = 'Aberto' | 'Em Análise' | 'Concluído' | 'Atrasado';

type AddressSuggestion = {
  lat: string;
  lon: string;
  display_name: string;
};

const allCategories = ['Física', 'Visual', 'Auditiva', 'Outros'];
const allStatuses: CanonicalStatus[] = ['Aberto', 'Em Análise', 'Concluído', 'Atrasado'];

function canonicalStatus(status: string): CanonicalStatus {
  if (status === 'Open' || status === 'Aberto') return 'Aberto';
  if (status === 'InProgress' || status === 'Em Análise') return 'Em Análise';
  if (status === 'Resolved' || status === 'Concluído') return 'Concluído';
  return 'Atrasado';
}

function markerConfig(status: string) {
  const normalized = canonicalStatus(status);
  if (normalized === 'Em Análise') return { color: '#F9B900', symbol: '♿' };
  if (normalized === 'Concluído') return { color: '#168821', symbol: '✓' };
  if (normalized === 'Atrasado') return { color: '#C00F0C', symbol: '!' };
  return { color: '#D7191C', symbol: '!' };
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

function MapInstanceTracker({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  return null;
}

export function CitizenMap() {
  const { protocols, loading } = useProtocols('citizen');
  const { toggleMobileMenu } = useApp();
  const navigate = useNavigate();
  const [selectedIncident, setSelectedIncident] = useState<Protocol | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7942, -47.8822]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [activeCategories, setActiveCategories] = useState(allCategories);
  const [activeStatuses, setActiveStatuses] = useState<CanonicalStatus[]>(allStatuses);
  const [searchQuery, setSearchQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeout = useRef<number | null>(null);

  const filteredProtocols = useMemo(() => {
    return protocols.filter((protocol) => {
      const category = protocol.category || 'Outros';
      return activeCategories.includes(category) && activeStatuses.includes(canonicalStatus(protocol.status));
    });
  }, [protocols, activeCategories, activeStatuses]);

  useEffect(() => {
    if (filteredProtocols.length === 0) {
      setSelectedIncident(null);
      setSelectedIndex(-1);
      return;
    }

    const selectedStillVisible = selectedIncident && filteredProtocols.some((protocol) => protocol.id === selectedIncident.id);
    if (!selectedStillVisible) {
      setSelectedIncident(filteredProtocols[0]);
      setSelectedIndex(0);
    }
  }, [filteredProtocols, selectedIncident]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, []);

  const focusProtocol = async (protocol: Protocol, index?: number) => {
    const targetIndex = index ?? filteredProtocols.findIndex((item) => item.id === protocol.id);
    setSelectedIncident(protocol);
    setSelectedIndex(targetIndex);
    const position = await getMarkerPosition(protocol.id, protocol.address || '');
    mapInstance?.flyTo(position, Math.max(mapInstance.getZoom(), 15), { duration: 0.7 });
  };

  const navigateProtocols = (direction: 'next' | 'previous') => {
    if (filteredProtocols.length === 0) return;
    const nextIndex = direction === 'next'
      ? (selectedIndex + 1) % filteredProtocols.length
      : (selectedIndex <= 0 ? filteredProtocols.length - 1 : selectedIndex - 1);
    focusProtocol(filteredProtocols[nextIndex], nextIndex);
  };

  const handleAddressSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);

    if (value.trim().length <= 3) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    setIsSearchingAddress(true);
    searchTimeout.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'pt-BR' } },
        );
        setAddressSuggestions((await response.json()) || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 800);
  };

  const selectAddress = (suggestion: AddressSuggestion) => {
    const nextCenter: [number, number] = [Number.parseFloat(suggestion.lat), Number.parseFloat(suggestion.lon)];
    setSearchQuery(suggestion.display_name);
    setAddressSuggestions([]);
    setMapCenter(nextCenter);
    mapInstance?.flyTo(nextCenter, 15, { duration: 0.7 });
  };

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const nextCenter: [number, number] = [coords.latitude, coords.longitude];
      setMapCenter(nextCenter);
      mapInstance?.flyTo(nextCenter, 16, { duration: 0.7 });
    });
  };

  const toggleCategory = (category: string) => {
    setActiveCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  };

  const toggleStatus = (status: string) => {
    setActiveStatuses((current) => current.includes(status as CanonicalStatus)
      ? current.filter((item) => item !== status)
      : [...current, status as CanonicalStatus]);
  };

  return (
    <div className="map-theme relative h-full flex-1 overflow-hidden bg-[#dbe7d6] font-sans">
      <div className="absolute inset-0 z-0" style={{ colorScheme: 'light' }}>
        <MapContainer center={mapCenter} zoom={13} zoomControl={false} style={{ width: '100%', height: '100%' }}>
          <MapController center={mapCenter} />
          <MapInstanceTracker onReady={setMapInstance} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {!loading && filteredProtocols.map((protocol, index) => (
            <ProtocolMarker
              key={protocol.id}
              protocol={protocol}
              selected={selectedIncident?.id === protocol.id}
              onClick={() => focusProtocol(protocol, index)}
            />
          ))}
        </MapContainer>
      </div>

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex items-start gap-2 md:left-5 md:right-auto md:top-5">
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Abrir menu"
          className="pointer-events-auto flex size-12 shrink-0 items-center justify-center rounded-md border border-[#CDD8E7] bg-white text-slate-600 shadow-lg md:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="relative pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="flex min-h-12 items-center gap-2 rounded-md border border-[#CDD8E7] bg-white px-3 text-sm font-semibold text-[#0b1b33] shadow-lg sm:px-4"
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filtros</span>
            <span className="dashboard-inverse-text flex size-6 items-center justify-center rounded-full bg-[#0758bd] text-xs font-bold text-white">2</span>
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 top-14 z-50 w-[290px] rounded-lg border border-[#CDD8E7] bg-white p-5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#E3E9F1] pb-3">
                  <h2 className="font-bold text-[#0b1b33]">Filtros do mapa</h2>
                  <button type="button" onClick={() => setShowFilters(false)} className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Fechar filtros"><X size={17} /></button>
                </div>
                <FilterGroup
                  title="Categoria"
                  items={[
                    { label: 'Física', value: 'Física', color: '#0758BD' },
                    { label: 'Visual', value: 'Visual', color: '#633BB1' },
                    { label: 'Auditiva', value: 'Auditiva', color: '#8A42C7' },
                    { label: 'Outros', value: 'Outros', color: '#168821' },
                  ]}
                  selectedItems={activeCategories}
                  onChange={toggleCategory}
                />
                <FilterGroup
                  title="Status"
                  items={[
                    { label: 'Aberto', value: 'Aberto', color: '#D7191C' },
                    { label: 'Em análise', value: 'Em Análise', color: '#F9B900' },
                    { label: 'Concluído', value: 'Concluído', color: '#168821' },
                    { label: 'Atrasado', value: 'Atrasado', color: '#C00F0C' },
                  ]}
                  selectedItems={activeStatuses}
                  onChange={toggleStatus}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto relative flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-md border border-[#CDD8E7] bg-white px-3 shadow-lg md:w-[480px] md:flex-none">
          <Search className="shrink-0 text-slate-500" size={19} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => handleAddressSearch(event.target.value)}
            placeholder="Buscar no mapa (ex: Águas Claras)"
            aria-label="Buscar endereço no mapa"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-[#0b1b33] outline-none placeholder:text-slate-500 focus:ring-0"
          />
          {isSearchingAddress && <Loader2 className="shrink-0 animate-spin text-[#0758bd]" size={17} />}
          {addressSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-14 overflow-hidden rounded-lg border border-[#CDD8E7] bg-white shadow-2xl">
              {addressSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={`${suggestion.lat}-${suggestion.lon}`}
                  onClick={() => selectAddress(suggestion)}
                  className="flex w-full items-start gap-3 border-b border-[#E3E9F1] px-4 py-3 text-left text-sm text-slate-700 last:border-b-0 hover:bg-blue-50"
                >
                  <Search className="mt-0.5 shrink-0 text-slate-400" size={16} />
                  <span className="line-clamp-2">{suggestion.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          title="Minha localização"
          className="pointer-events-auto hidden size-12 shrink-0 items-center justify-center rounded-md border border-[#CDD8E7] bg-white text-slate-700 shadow-lg sm:flex"
        >
          <Crosshair size={20} />
        </button>
      </div>

      <NearbyPanel
        protocols={filteredProtocols}
        loading={loading}
        selected={selectedIncident}
        selectedIndex={selectedIndex}
        onSelect={focusProtocol}
        onNavigate={navigateProtocols}
        onDetails={(protocol) => navigate(`/protocolo/${protocol.id}`)}
      />

      <div className="absolute right-3 top-20 z-20 md:right-5 md:top-5">
        <ZoomControls map={mapInstance} />
      </div>

      <Legend />
    </div>
  );
}

function NearbyPanel({ protocols, loading, selected, selectedIndex, onSelect, onNavigate, onDetails }: {
  protocols: Protocol[];
  loading: boolean;
  selected: Protocol | null;
  selectedIndex: number;
  onSelect: (protocol: Protocol, index?: number) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
  onDetails: (protocol: Protocol) => void;
}) {
  const visibleProtocols = selected
    ? [selected, ...protocols.filter((protocol) => protocol.id !== selected.id)].slice(0, 3)
    : protocols.slice(0, 3);

  return (
    <section className="absolute bottom-3 left-3 right-3 z-20 flex max-h-[48vh] flex-col overflow-hidden rounded-lg border border-[#CDD8E7] bg-white/97 shadow-2xl backdrop-blur md:bottom-20 md:left-5 md:right-auto md:top-24 md:max-h-none md:w-[360px]">
      <div className="border-b border-[#E3E9F1] px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[#0b1b33]">Solicitações próximas</h2>
          <button type="button" className="hidden size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 md:flex" aria-label="Recolher painel"><ChevronLeft size={18} /></button>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <span>{protocols.length} encontrada{protocols.length !== 1 ? 's' : ''}</span>
          {protocols.length > 0 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onNavigate('previous')} className="flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Solicitação anterior"><ChevronLeft size={17} /></button>
              <span className="font-semibold text-[#0b1b33]">{selectedIndex + 1} de {protocols.length}</span>
              <button type="button" onClick={() => onNavigate('next')} className="flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Próxima solicitação"><ChevronRight size={17} /></button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && <p className="py-10 text-center text-sm text-slate-500">Carregando solicitações...</p>}
        {!loading && visibleProtocols.map((protocol) => {
          const index = protocols.findIndex((item) => item.id === protocol.id);
          const isSelected = selected?.id === protocol.id;
          return (
            <article key={protocol.id} className={`rounded-lg border bg-white p-4 transition ${isSelected ? 'border-[#F9B900] shadow-[0_6px_18px_rgba(177,126,0,0.10)]' : 'border-[#CDD8E7]'}`}>
              <button type="button" onClick={() => onSelect(protocol, index)} className="flex w-full items-start gap-3 text-left">
                <MarkerBadge status={protocol.status} />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-base text-[#0b1b33]">{protocol.description || protocol.service}</strong>
                  <span className="mt-1 block truncate text-sm text-slate-600">{protocol.address}</span>
                  <span className="mt-2 block"><StatusBadge status={protocol.status} /></span>
                  <span className="mt-2 block text-sm text-slate-600">Protocolo: {protocol.id.slice(0, 8)}</span>
                </span>
                <ChevronRight className="mt-5 shrink-0 text-slate-600" size={20} />
              </button>
              {isSelected && (
                <button type="button" onClick={() => onDetails(protocol)} className="mt-4 min-h-10 w-full rounded-md border border-[#0758bd] bg-white text-sm font-semibold text-[#0758bd] transition hover:bg-blue-50">Ver detalhes</button>
              )}
            </article>
          );
        })}
        {!loading && protocols.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Nenhuma solicitação encontrada com estes filtros.</p>}
      </div>

      <Link to="/meus-protocolos" className="flex min-h-12 items-center gap-2 border-t border-[#E3E9F1] px-5 text-sm font-semibold text-[#0758bd] hover:bg-blue-50">
        <List size={18} />
        Ver lista completa
      </Link>
    </section>
  );
}

function MarkerBadge({ status }: { status: string }) {
  const config = markerConfig(status);
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-black" style={{ backgroundColor: `${config.color}1A`, color: config.color }}>
      {config.symbol}
    </span>
  );
}

function ProtocolMarker({ protocol, selected, onClick }: { protocol: Protocol; selected: boolean; onClick: () => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    let mounted = true;
    getMarkerPosition(protocol.id, protocol.address || '')
      .then((result) => { if (mounted) setPosition(result); })
      .catch(console.error);
    return () => { mounted = false; };
  }, [protocol.id, protocol.address]);

  if (!position) return null;

  const config = markerConfig(protocol.status);
  const icon = L.divIcon({
    className: 'protocol-marker-icon',
    html: `<span class="protocol-marker-pin${selected ? ' is-selected' : ''}" style="--marker-color:${config.color}"><span>${config.symbol}</span></span>`,
    iconSize: [42, 48],
    iconAnchor: [21, 46],
  });

  return <Marker position={position} icon={icon} title={protocol.description || protocol.service} eventHandlers={{ click: onClick }} />;
}

function ZoomControls({ map }: { map: L.Map | null }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#CDD8E7] bg-white shadow-lg">
      <button type="button" onClick={() => map?.zoomIn()} className="flex size-12 items-center justify-center border-b border-[#E3E9F1] text-[#0b1b33] hover:bg-slate-50" title="Aumentar zoom"><Plus size={21} /></button>
      <button type="button" onClick={() => map?.zoomOut()} className="flex size-12 items-center justify-center text-[#0b1b33] hover:bg-slate-50" title="Diminuir zoom"><Minus size={21} /></button>
    </div>
  );
}

function FilterGroup({ title, items, selectedItems, onChange }: {
  title: string;
  items: Array<{ label: string; value: string; color: string }>;
  selectedItems: string[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-bold text-[#0b1b33]">{title}</legend>
      <div className="mt-3 space-y-2.5">
        {items.map((item) => {
          const checked = selectedItems.includes(item.value);
          return (
            <label key={item.value} className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={checked} onChange={() => onChange(item.value)} className="sr-only" />
              <span className={`flex size-5 items-center justify-center rounded border ${checked ? 'border-[#0758bd] bg-[#0758bd] text-white dashboard-inverse-text' : 'border-slate-300 bg-white'}`}>
                {checked && <Check size={14} />}
              </span>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Legend() {
  const items = [
    { label: 'Aberto', color: '#D7191C' },
    { label: 'Em análise', color: '#F9B900' },
    { label: 'Resolvido', color: '#168821' },
    { label: 'Transporte', color: '#0758BD' },
  ];

  return (
    <div className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-6 rounded-full border border-[#CDD8E7] bg-white/95 px-6 py-3 text-sm text-[#0b1b33] shadow-lg backdrop-blur sm:flex">
      {items.map((item) => <span key={item.label} className="flex items-center gap-2 whitespace-nowrap"><span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}
    </div>
  );
}