import { Search, ChevronDown, MapPin, Navigation, Download, AlertTriangle, Plus, Minus, Loader2, SlidersHorizontal, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { exportToExcel } from '../utils/exportUtils';
import { useProtocols } from '../hooks/useProtocols';
import { getMarkerPosition } from '../utils/mapUtils';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// Fix for default Leaflet marker icons in Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Helper components ────────────────────────────────────────────────────────

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function MapInstanceTracker({ setMap }: { setMap: (m: L.Map) => void }) {
  const map = useMap();
  React.useEffect(() => { setMap(map); }, [map, setMap]);
  return null;
}

// Emits center on moveend
function MapMoveTracker({ onMoveEnd }: { onMoveEnd: (c: [number, number]) => void }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onMoveEnd([c.lat, c.lng]);
    },
  });
  return null;
}

function CustomZoomControl({ map }: { map: L.Map | null }) {
  return (
    <div className="flex flex-col gap-1">
      <button onClick={() => map?.setZoom(map.getZoom() + 1)}
        className="bg-[#111820]/90 backdrop-blur-md border border-white/10 text-white p-2 rounded-xl shadow-xl hover:bg-white/10 transition-colors pointer-events-auto">
        <Plus size={18} />
      </button>
      <button onClick={() => map?.setZoom(map.getZoom() - 1)}
        className="bg-[#111820]/90 backdrop-blur-md border border-white/10 text-white p-2 rounded-xl shadow-xl hover:bg-white/10 transition-colors pointer-events-auto">
        <Minus size={18} />
      </button>
    </div>
  );
}

// Status badge helper
const STATUS_STYLES: Record<string, string> = {
  'Aberto': 'bg-blue-600/20 text-blue-300 border border-blue-500/50',
  'Em Análise': 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/50',
  'Concluído': 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/50',
  'Atrasado': 'bg-red-600/20 text-red-300 border border-red-500/50',
};

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminMap() {
  const navigate = useNavigate();
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7942, -47.8822]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toggleMobileMenu } = useApp();

  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Region info
  const [regionInfo, setRegionInfo] = useState<{ neighbourhood?: string; suburb?: string; city?: string; state?: string } | null>(null);
  const regionTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchRegionInfo = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const data = await res.json();
      if (data?.address) {
        setRegionInfo({
          neighbourhood: data.address.neighbourhood || data.address.quarter || data.address.suburb,
          suburb: data.address.suburb || data.address.district,
          city: data.address.city || data.address.town || data.address.municipality,
          state: data.address.state,
        });
      }
    } catch { /* ignore */ }
  }, []);

  const handleMapMoveEnd = useCallback((center: [number, number]) => {
    if (regionTimeout.current) clearTimeout(regionTimeout.current);
    regionTimeout.current = setTimeout(() => fetchRegionInfo(center[0], center[1]), 600);
  }, [fetchRegionInfo]);

  useEffect(() => { fetchRegionInfo(mapCenter[0], mapCenter[1]); }, []);

  const { protocols, loading } = useProtocols('admin');

  const ALL_CATEGORIES = ['Física', 'Visual', 'Auditiva', 'Outros'];
  const ALL_STATUSES = ['Aberto', 'Em Análise', 'Concluído', 'Atrasado'];

  const [activeCategories, setActiveCategories] = useState<string[]>(ALL_CATEGORIES);
  const [activeStatuses, setActiveStatuses] = useState<string[]>(ALL_STATUSES);

  const filteredProtocols = protocols.filter(p =>
    activeCategories.includes(p.category || 'Outros') &&
    activeStatuses.includes(p.status)
  );

  // Sequential navigation
  const handleNavigate = (direction: 'next' | 'prev') => {
    if (filteredProtocols.length === 0) return;
    let newIndex = direction === 'next'
      ? (selectedIndex >= filteredProtocols.length - 1 ? 0 : selectedIndex + 1)
      : (selectedIndex <= 0 ? filteredProtocols.length - 1 : selectedIndex - 1);
    setSelectedIndex(newIndex);
    const incident = filteredProtocols[newIndex];
    setActiveIncident(incident);
    if (mapInstance && incident) {
      getMarkerPosition(incident.id.toString(), incident.address || '').then(pos => {
        if (pos) mapInstance.flyTo(pos, 16);
      });
    }
  };

  const handleMarkerClick = (incident: any, index: number) => {
    setActiveIncident(incident);
    setSelectedIndex(index);
  };

  // Address search via Nominatim
  const handleAddressSearch = (value: string) => {
    setAddressSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length > 3) {
      setIsSearchingAddress(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          setAddressSuggestions(await res.json() || []);
        } catch { /* ignore */ }
        finally { setIsSearchingAddress(false); }
      }, 800);
    } else {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
    }
  };

  const selectAddress = (sug: any) => {
    setAddressSuggestions([]);
    setAddressSearch(sug.display_name);
    setMapCenter([parseFloat(sug.lat), parseFloat(sug.lon)]);
  };

  const toggleCategory = (cat: string) =>
    setActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const toggleStatus = (st: string) =>
    setActiveStatuses(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);

  // Stats
  const stats = ALL_STATUSES.map(s => ({
    label: s,
    count: protocols.filter(p => p.status === s).length,
    style: STATUS_STYLES[s],
  }));

  return (
    <div className="flex-1 relative bg-[#080d12] overflow-hidden font-sans flex flex-col">

      {/* ── Top toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#080d12] border-b border-white/5 shrink-0 z-30">

        {/* Mobile menu toggle */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden flex items-center justify-center size-9 rounded-xl bg-white/5 border border-white/8 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <Menu size={18} />
        </button>

        {/* Address search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={addressSearch}
            onChange={e => handleAddressSearch(e.target.value)}
            placeholder="Buscar no mapa (ex: Águas Claras, DF)"
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-9 pr-9 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          {isSearchingAddress && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
          )}

          {/* Suggestions */}
          {addressSuggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#111820] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              {addressSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => selectAddress(sug)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors text-sm text-slate-300 flex items-start gap-2 border-b border-white/5 last:border-0"
                >
                  <MapPin size={14} className="text-slate-500 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{sug.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter toggle */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showFilters
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {(activeCategories.length < ALL_CATEGORIES.length || activeStatuses.length < ALL_STATUSES.length) && (
              <span className="flex items-center justify-center size-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {(ALL_CATEGORIES.length - activeCategories.length) + (ALL_STATUSES.length - activeStatuses.length)}
              </span>
            )}
          </button>

          {/* Filters Dropdown */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 w-64 bg-[#111418]/97 backdrop-blur-md border border-slate-700 shadow-2xl rounded-xl p-4 z-50 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-1">
                  <h3 className="text-sm font-bold text-white">Filtros do Mapa</h3>
                  <button onClick={() => setShowFilters(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <FilterGroup
                  title="Categoria"
                  items={[
                    { label: 'Física', value: 'Física', color: 'bg-orange-500' },
                    { label: 'Visual', value: 'Visual', color: 'bg-blue-500' },
                    { label: 'Auditiva', value: 'Auditiva', color: 'bg-purple-500' },
                    { label: 'Outros', value: 'Outros', color: 'bg-slate-400' }
                  ]}
                  selectedItems={activeCategories}
                  onChange={(val) => toggleCategory(val)}
                />
                <FilterGroup
                  title="Status"
                  items={[
                    { label: 'Aberto', value: 'Aberto', color: 'bg-blue-500' },
                    { label: 'Em Análise', value: 'Em Análise', color: 'bg-yellow-500' },
                    { label: 'Concluído', value: 'Concluído', color: 'bg-green-500' },
                    { label: 'Atrasado', value: 'Atrasado', color: 'bg-red-500' }
                  ]}
                  selectedItems={activeStatuses}
                  onChange={(val) => toggleStatus(val)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Export */}
        <button
          onClick={() => exportToExcel(filteredProtocols, 'mapa_admin.xlsx')}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
          title="Exportar Excel"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Excel</span>
        </button>
      </div>

      {/* ── Map area ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden z-0">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ width: '100%', height: '100%', zIndex: 0 }}
          zoomControl={false}
        >
          <MapController center={mapCenter} />
          <MapInstanceTracker setMap={setMapInstance} />
          <MapMoveTracker onMoveEnd={handleMapMoveEnd} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {!loading && filteredProtocols.map((incident, idx) => (
            <ProtocolMarker
              key={incident.id}
              incident={incident}
              onClick={() => handleMarkerClick(incident, idx)}
            />
          ))}
        </MapContainer>

        {/* ── Floating overlays ─────────────────────────────────────── */}
        <div className="absolute inset-0 z-[400] pointer-events-none flex flex-col justify-between p-4 sm:p-6 gap-4">

          {/* Top: Zoom + Stats widget */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button
                onClick={() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => setMapCenter([p.coords.latitude, p.coords.longitude])); }}
                className="bg-[#111820]/90 backdrop-blur-md border border-white/10 text-white p-2 rounded-xl shadow-xl hover:bg-white/10 transition-colors"
                title="Minha localização"
              >
                <Navigation size={18} />
              </button>
              <div className="hidden md:flex">
                <CustomZoomControl map={mapInstance} />
              </div>
            </div>

            {/* Stats widget */}
            <div className="bg-[#111820]/90 backdrop-blur-md border border-white/8 rounded-2xl p-4 shadow-2xl pointer-events-auto min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Solicitações</p>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">Ao vivo</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-2xl font-black text-white">{protocols.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-400">{filteredProtocols.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Visível</p>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                {stats.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{s.label}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.style}`}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Navigation + Incident detail */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-3">

            {/* Navigation controls */}
            {filteredProtocols.length > 0 && (
              <div className="pointer-events-auto bg-[#111820]/90 backdrop-blur-md border border-white/8 rounded-xl p-2 shadow-xl flex items-center gap-2">
                <button
                  onClick={() => handleNavigate('prev')}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  <ChevronDown size={18} className="rotate-90" />
                </button>
                <span className="text-sm font-bold text-white px-1">
                  {selectedIndex >= 0 ? selectedIndex + 1 : 0}
                  <span className="text-slate-500 font-normal"> / {filteredProtocols.length}</span>
                </span>
                <button
                  onClick={() => handleNavigate('next')}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  <ChevronDown size={18} className="-rotate-90" />
                </button>
              </div>
            )}

            {/* Selected incident detail panel */}
            {activeIncident && (
              <div className="pointer-events-auto bg-[#111820]/90 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 shadow-2xl w-full max-w-sm">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">#{String(activeIncident.id).slice(0, 8)}</p>
                    <h3 className="text-white font-bold text-sm truncate">{activeIncident.description || 'Sem descrição'}</h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_STYLES[activeIncident.status] || STATUS_STYLES['Aberto']}`}>
                      {activeIncident.status}
                    </span>
                    <button
                      onClick={() => setActiveIncident(null)}
                      className="text-slate-600 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate mb-3">
                  {activeIncident.category} • {activeIncident.address}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/protocolo/${activeIncident.id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => navigate(`/admin/solicitacoes`)}
                    className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-white/10"
                  >
                    Fila de Atenção
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-[450] flex items-center justify-center bg-[#080d12]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-slate-400 text-sm">Carregando solicitações...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[400] bg-[#111820]/90 backdrop-blur-md border border-white/8 rounded-xl p-3 text-xs pointer-events-none">
          <p className="text-slate-500 uppercase tracking-wide font-bold mb-2 text-[10px]">Legenda</p>
          {[
            { label: 'Aberto', color: 'bg-blue-500' },
            { label: 'Em Análise', color: 'bg-yellow-500' },
            { label: 'Concluído', color: 'bg-emerald-500' },
            { label: 'Atrasado', color: 'bg-red-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <span className={`size-2 rounded-full ${item.color}`} />
              <span className="text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Region Info Panel */}
        {regionInfo && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-[#111820]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-3 pointer-events-none">
            <MapPin size={14} className="text-blue-400 shrink-0" />
            <div className="flex flex-col">
              {regionInfo.neighbourhood && (
                <span className="text-white text-xs font-bold leading-tight">{regionInfo.neighbourhood}</span>
              )}
              <span className="text-slate-400 text-[11px] leading-tight">
                {[regionInfo.suburb, regionInfo.city, regionInfo.state].filter(Boolean).join(' · ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, items, selectedItems, onChange }: {
  title: string;
  items: { label: string; value: string; color?: string }[];
  selectedItems: string[];
  onChange: (val: string) => void;
}) {
  return (
    <details className="group" open>
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-200 hover:text-white transition-colors py-1">
        {title}
        <ChevronDown size={16} className="text-slate-500 transition group-open:rotate-180" />
      </summary>
      <div className="pt-2 pl-1 space-y-1.5">
        {items.map((item) => {
          const isChecked = selectedItems.includes(item.value);
          return (
            <label key={item.value} className="flex items-center gap-2.5 cursor-pointer group/item">
              <span className={`flex items-center justify-center size-4 rounded border transition-all shrink-0 ${isChecked
                ? `${item.color ? item.color.replace('bg-', 'bg-').replace('/20', '') : 'bg-blue-600'} border-transparent`
                : 'bg-transparent border-slate-600 group-hover/item:border-slate-400'
                }`}>
                {isChecked && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-none stroke-white stroke-[2]">
                    <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onChange(item.value)}
                className="sr-only"
              />
              {item.color && (
                <span className={`size-2.5 rounded-full shrink-0 ${item.color} ${!isChecked ? 'opacity-40' : ''}`} />
              )}
              <span className={`text-sm transition-colors ${isChecked ? 'text-white font-medium' : 'text-slate-400 group-hover/item:text-slate-300'}`}>
                {item.label}
              </span>
            </label>
          );
        })}
      </div>
    </details>
  );
}

// ─── Protocol Marker ──────────────────────────────────────────────────────────
function ProtocolMarker({ incident, onClick }: { incident: any; onClick: () => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    let mounted = true;
    getMarkerPosition(incident.id.toString(), incident.address || '')
      .then(pos => { if (mounted) setPosition(pos); })
      .catch(console.error);
    return () => { mounted = false; };
  }, [incident.id, incident.address]);

  if (!position) return null;

  return (
    <Marker position={position} eventHandlers={{ click: onClick }}>
      <Popup>
        <div className="p-1 min-w-[160px]">
          <p className="font-bold text-gray-900 text-sm">{incident.address}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{incident.description}</p>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${incident.status === 'Aberto' ? 'bg-blue-100 text-blue-700' :
              incident.status === 'Em Análise' ? 'bg-yellow-100 text-yellow-700' :
                incident.status === 'Concluído' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
              }`}>
              {incident.status}
            </span>
            <span className="text-[10px] text-gray-400">{incident.date}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
