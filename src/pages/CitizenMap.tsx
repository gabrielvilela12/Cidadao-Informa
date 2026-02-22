import { MapPin, Search as SearchIcon, List as ListIcon, Bell as BellIcon, User as UserIcon, ChevronDown, Map as MapIconLucide, Info, Share2, X, Navigation, Plus, Minus, Layers as LayersIcon, AlertTriangle as WarningIcon, HardHat as ConstructionIcon, Check as CheckIcon, Bus as BusIcon, Loader2, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useProtocols } from '../hooks/useProtocols';
import { getMarkerPosition } from '../utils/mapUtils';
import { useApp } from '../context/AppContext';

// Fix for default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Component to expose map instance to parent
function MapInstanceTracker({ setMap }: { setMap: (m: L.Map) => void }) {
  const map = useMap();
  React.useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  return null;
}

// Custom Zoom Controls Component
function CustomZoomControl({ map }: { map: L.Map | null }) {
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => map?.setZoom(map.getZoom() + 1)}
        className="bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 text-white p-2 rounded-lg shadow-lg hover:bg-[#283039] transition-colors"
        title="Aumentar zoom"
      >
        <Plus size={20} />
      </button>
      <button
        onClick={() => map?.setZoom(map.getZoom() - 1)}
        className="bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 text-white p-2 rounded-lg shadow-lg hover:bg-[#283039] transition-colors"
        title="Diminuir zoom"
      >
        <Minus size={20} />
      </button>
    </div>
  );
}

export function CitizenMap() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7942, -47.8822]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const { toggleMobileMenu } = useApp();

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const { protocols, loading } = useProtocols('all');
  const [activeCategories, setActiveCategories] = useState<string[]>(['Física', 'Visual', 'Auditiva', 'Outros']);
  const [activeStatuses, setactiveStatuses] = useState<string[]>(['Open', 'InProgress', 'Resolved', 'Closed', 'Atrasado']);

  const filteredProtocols = protocols.filter(p => activeCategories.includes(p.category || 'Outros') && activeStatuses.includes(p.status));

  // Handle sequential navigation
  const handleNavigate = (direction: 'next' | 'prev') => {
    if (filteredProtocols.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = selectedIndex >= filteredProtocols.length - 1 ? 0 : selectedIndex + 1;
    } else {
      newIndex = selectedIndex <= 0 ? filteredProtocols.length - 1 : selectedIndex - 1;
    }

    setSelectedIndex(newIndex);
    const incident = filteredProtocols[newIndex];
    setSelectedIncident(incident);

    // Pan to incident if we have coordinates
    if (mapInstance && incident) {
      getMarkerPosition(incident.id.toString(), incident.address || '').then(pos => {
        if (pos) mapInstance.flyTo(pos, 16);
      });
    }
  };

  const handleMarkerClick = (incident: any, index: number) => {
    setSelectedIncident(incident);
    setSelectedIndex(index);
  };

  const handleAddressSearch = (value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.length > 3) {
      setIsSearchingAddress(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`, {
            headers: { 'Accept-Language': 'pt-BR' }
          });
          const data = await res.json();
          setAddressSuggestions(data || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearchingAddress(false);
        }
      }, 800);
    } else {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
    }
  };

  const selectAddress = (sug: any) => {
    setAddressSuggestions([]);
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);
    setMapCenter([lat, lon]);
  };

  return (
    <div className="flex-1 relative bg-[#1c2127] h-screen overflow-hidden font-sans">
      {/* Map Area */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={mapCenter} // Center of Brasília
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <MapController center={mapCenter} />
          <MapInstanceTracker setMap={setMapInstance} />
          {/* Dark Mode Tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Render interactive markers */}
          {!loading && filteredProtocols.map((incident, idx) => (
            <ProtocolMarker key={incident.id} incident={incident} onClick={() => handleMarkerClick(incident, idx)} />
          ))}
        </MapContainer>
      </div>

      {/* Map Controls */}
      <div className="absolute top-20 md:top-4 right-4 flex flex-col gap-2 z-10">
        <button className="bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 text-white p-2 rounded-lg shadow-lg hover:bg-[#283039] transition-colors" title="Minha localização">
          <Navigation size={20} />
        </button>
        <button onClick={() => setShowFilters(!showFilters)} className={`bg-[#1c2127]/90 backdrop-blur-sm border ${showFilters ? 'border-blue-500 text-blue-500' : 'border-slate-700 text-white'} p-2 rounded-lg shadow-lg hover:bg-[#283039] transition-colors`} title="Camadas">
          <LayersIcon size={20} />
        </button>
        <div className="mt-2 hidden md:block" />
        <div className="hidden md:block">
          <CustomZoomControl map={mapInstance} />
        </div>

        {/* Floating Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-24 right-0 w-64 bg-[#111418]/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-xl p-4 z-20 flex flex-col gap-3"
            >
              <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2 mb-2">Filtros de Mapa</h3>
              <FilterGroup
                title="Categoria"
                items={[
                  { label: 'Física', value: 'Física' },
                  { label: 'Visual', value: 'Visual' },
                  { label: 'Auditiva', value: 'Auditiva' },
                  { label: 'Outros', value: 'Outros' }
                ]}
                selectedItems={activeCategories}
                onChange={(val) => {
                  setActiveCategories(prev => prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]);
                }}
              />
              <FilterGroup
                title="Status"
                items={[
                  { label: 'Aberto', value: 'Open' },
                  { label: 'Em Análise', value: 'InProgress' },
                  { label: 'Resolvido', value: 'Resolved' }
                ]}
                selectedItems={activeStatuses}
                onChange={(val) => {
                  setactiveStatuses(prev => prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Toggle & Floating Search Bar */}
      <div className="absolute top-4 left-4 right-16 md:right-auto z-10 md:w-80 flex flex-col gap-4 pointer-events-none">

        {/* Mobile menu button */}
        <div className="pointer-events-auto md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="flex items-center justify-center size-12 rounded-xl bg-[#1c2127]/90 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-white shadow-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg p-3 flex items-center gap-3 relative pointer-events-auto">
          <SearchIcon className="text-slate-400" size={20} />
          <input
            className="bg-transparent border-none focus:ring-0 text-white placeholder-slate-400 text-sm w-full p-0"
            placeholder="Buscar no mapa (ex: Águas Claras)"
            type="text"
            onChange={(e) => handleAddressSearch(e.target.value)}
          />
          {isSearchingAddress && (
            <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />
          )}

          {/* Suggestions Dropdown */}
          {addressSuggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#1c2632] border border-slate-700 rounded-lg shadow-xl overflow-hidden divide-y divide-slate-800/50">
              {addressSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => selectAddress(sug)}
                  className="w-full text-left px-4 py-3 hover:bg-[#283039] transition-colors text-sm text-slate-200 flex items-start gap-3"
                >
                  <SearchIcon size={16} className="text-slate-500 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{sug.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {filteredProtocols.length > 0 && (
          <div className="bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 rounded-lg p-2 shadow-lg flex items-center justify-between w-48 pointer-events-auto">
            <button
              onClick={() => handleNavigate('prev')}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Anterior"
            >
              <ChevronDown size={20} className="rotate-90" />
            </button>
            <span className="text-sm font-bold text-white">
              {selectedIndex >= 0 ? selectedIndex + 1 : 0} <span className="text-slate-500 font-normal">/ {filteredProtocols.length}</span>
            </span>
            <button
              onClick={() => handleNavigate('next')}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Próximo"
            >
              <ChevronDown size={20} className="-rotate-90" />
            </button>
          </div>
        )}
      </div>

      {/* Issue Details Card */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-[360px] max-w-[90vw] bg-[#111418] border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div
              className="h-32 bg-cover bg-center relative"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwreGr0yWcb42WeE2WtgpUht19vlZGzZK3T90ufPKo40VsxeB_6be3eNcGh4J5o0yd6L84qR-IzkezE4K7nyrpH1gSFoGNFSMfp1SDDXFSFGnyEl1EUyJjXFH69kKVU02abL8FS_YwNzN1GGFs_-vJLCgeM0_r-eRzbLqso9jC8jJGH9UHh25Poz_f8c_x-BIUDbE6dg1-F-Z3V7if9SrX34XMboHxhYnd4ly1T5H31hbX58rWDcKNgktMRYF_3dtOg3yjgxFKecA')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#111418] to-transparent"></div>
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${selectedIncident.status === 'Open' ? 'bg-blue-500/20 text-blue-400 ring-blue-500/40' :
                  selectedIncident.status === 'InProgress' ? 'bg-yellow-500/20 text-yellow-500 ring-yellow-500/40' :
                    selectedIncident.status === 'Resolved' ? 'bg-green-500/20 text-green-400 ring-green-500/40' :
                      'bg-red-500/20 text-red-400 ring-red-500/40'
                  }`}>
                  {selectedIncident.status === 'Open' ? 'Aberto' : selectedIncident.status === 'InProgress' ? 'Em Análise' : selectedIncident.status === 'Resolved' ? 'Concluído' : 'Fechado/Atraso'}
                </span>
              </div>
            </div>

            <div className="p-4 -mt-4 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="text-slate-400" size={14} />
                <span className="text-xs text-slate-400 uppercase tracking-wide truncate pr-2" title={selectedIncident.address}>{selectedIncident.address}</span>
              </div>
              <h3 className="text-white text-lg font-bold leading-tight mb-2 max-w-[90%] truncate" title={selectedIncident.description}>{selectedIncident.description || 'Problema de Acessibilidade'}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {selectedIncident.category}
              </p>

              <div className="flex items-center justify-between border-t border-slate-700 pt-3 mb-4">
                <div className="flex flex-col w-1/2">
                  <span className="text-[10px] text-slate-400 uppercase">Protocolo</span>
                  <span className="text-sm text-white font-mono truncate mr-2" title={selectedIncident.id.toString()}>#{selectedIncident.id.toString().split('-')[0]}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase">Data</span>
                  <span className="text-sm text-white">{selectedIncident.date}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">
                  Acompanhar
                </button>
                <button className="bg-[#283039] hover:bg-[#3b4754] text-white p-2 rounded-lg transition-colors">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIncident(null);
              }}
              className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-20 md:bottom-4 right-4 z-10 bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-lg max-w-[120px] md:max-w-none">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Legenda</h4>
        <div className="flex flex-col gap-2">
          <LegendItem color="bg-red-500" label="Problema Aberto" />
          <LegendItem color="bg-yellow-500" label="Em Análise" />
          <LegendItem color="bg-green-500" label="Resolvido" />
          <LegendItem color="bg-blue-600" label="Transporte" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-xs text-white">{label}</span>
    </div>
  );
}

function FilterGroup({ title, items, selectedItems, onChange }: { title: string; items: { label: string, value: string }[]; selectedItems: string[]; onChange: (val: string) => void }) {
  return (
    <details className="group" open>
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-slate-200 hover:text-blue-600 transition-colors py-1">
        {title}
        <ChevronDown size={18} className="transition group-open:rotate-180" />
      </summary>
      <div className="pt-2 pl-2 space-y-2">
        {items.map((item) => (
          <label key={item.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedItems.includes(item.value)}
              onChange={() => onChange(item.value)}
              className="form-checkbox rounded border-slate-600 bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 h-4 w-4"
            />
            <span className="text-sm text-slate-400">{item.label}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

function ProtocolMarker({ incident, onClick }: { key?: any; incident: any; onClick: () => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    let isMounted = true;
    getMarkerPosition(incident.id.toString(), incident.address || '').then(pos => {
      if (isMounted) setPosition(pos);
    }).catch(console.error);
    return () => { isMounted = false; };
  }, [incident.id, incident.address]);

  if (!position) return null;

  return (
    <Marker
      position={position}
      eventHandlers={{ click: onClick }}
    />
  );
}
