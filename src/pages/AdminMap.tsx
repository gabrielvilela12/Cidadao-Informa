import { Search, Map as MapIcon, List, Bell, User, ChevronDown, MapPin, Navigation, Layers, Download, Info, AlertTriangle, Plus, Minus, Loader2, Menu } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { exportToCSV } from '../utils/exportUtils';
import { useProtocols } from '../hooks/useProtocols';
import { getMarkerPosition } from '../utils/mapUtils';
import { useApp } from '../context/AppContext';

// Fix for default Leaflet marker icons in React
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
        className="bg-[#111418]/90 backdrop-blur-md border border-[#283039] text-white p-2 rounded-lg shadow-xl hover:bg-[#283039] transition-colors pointer-events-auto"
        title="Aumentar zoom"
      >
        <Plus size={20} />
      </button>
      <button
        onClick={() => map?.setZoom(map.getZoom() - 1)}
        className="bg-[#111418]/90 backdrop-blur-md border border-[#283039] text-white p-2 rounded-lg shadow-xl hover:bg-[#283039] transition-colors pointer-events-auto"
        title="Diminuir zoom"
      >
        <Minus size={20} />
      </button>
    </div>
  );
}

export function AdminMap() {
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7942, -47.8822]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const { toggleMobileMenu } = useApp();

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const { protocols, loading } = useProtocols('admin');
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
    setActiveIncident(incident);

    // Pan to incident if we have coordinates
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
    <div className="flex-1 relative bg-[#101922] overflow-hidden font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-800 px-4 sm:px-6 py-3 bg-[#111418] shrink-0 z-30">
        <div className="flex items-center gap-3 sm:gap-8">
          <div className="flex items-center gap-3 text-white">
            <button
              onClick={toggleMobileMenu}
              className="md:hidden flex items-center justify-center size-9 rounded-full bg-[#1b2631] text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex size-8 items-center justify-center bg-blue-600 rounded-lg text-white">
              <MapPin size={20} />
            </div>
            <h2 className="text-base sm:text-lg font-bold leading-tight tracking-tight">Zeladoria Pública</h2>
          </div>
          <div className="hidden lg:flex flex-col min-w-40 h-10 w-96">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-[#283039]">
              <div className="text-[#9dabb9] flex items-center justify-center pl-4">
                <Search size={20} />
              </div>
              <input
                className="flex w-full min-w-0 flex-1 bg-transparent text-white focus:outline-none border-none px-4 text-sm placeholder:text-[#9dabb9]"
                placeholder="Buscar endereço, protocolo ou região..."
              />
            </div>
          </div>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <div className="hidden sm:flex gap-2">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition">
              Novo Relatório
            </button>
            <button className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-[#283039] text-white hover:bg-[#3b4754] transition">
              <Bell size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white leading-none">Admin</p>
              <p className="text-xs text-slate-400 mt-1">Gestor Público</p>
            </div>
            <div
              className="aspect-square bg-cover rounded-full size-9 border-2 border-[#283039]"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4krNk7WKJNFrcXmNEKVETFSnO9ZUggNfWaABPO-LyN7b6xDQrqPNKFrm-fsHsFx8aRCPqF6UJa334hS5ff4JvvUSrOrWaAEcGI8s1-10UyeivE2dlgcEKTm31v2CpzzsahjjYWUumK91783sgaRlBT3_KPaCGtseABi58ZMmRCzeFaX-0bpW6ar5y3vviBRcQ8NddXkxqLnYs4MY0KVZsK87WLRoExPgdjkkUi1LxGKes5Mpq5cgFufy4C1p4Xpu4EghawLFqjgj')" }}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Filters */}
        <nav className="hidden md:flex flex-col w-64 bg-[#111418] border-r border-[#283039] overflow-y-auto shrink-0 z-20">
          <div className="p-4 space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">Painel</div>
            <SidebarItem icon={List} label="Visão Geral" />
            <SidebarItem icon={MapIcon} label="Mapa de Calor" active />
            <SidebarItem icon={List} label="Relatórios" />
            <SidebarItem icon={AlertTriangle} label="Alertas" badge="12" />
          </div>

          <div className="mt-4 border-t border-[#283039] p-4">
            <div className="px-3 py-2 text-xs font-bold text-[#9dabb9] uppercase tracking-wider mb-2">Filtros de Mapa</div>
            <div className="space-y-3">
              <FilterGroup
                title="Categoria de Acessibilidade"
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
                title="Status da Solicitação"
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
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-[#283039]">
            <button onClick={() => exportToCSV(filteredProtocols, 'mapa_dados.csv')} className="w-full bg-[#1c2127] hover:bg-[#283039] text-slate-300 font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
              <Download size={18} />
              Exportar Dados (.CSV)
            </button>
          </div>
        </nav>

        {/* Map Area */}
        {/* Map Area */}
        <main className="flex-1 relative bg-slate-900 overflow-hidden z-0 flex flex-col">
          {/* Header */}
          <div className="bg-[#1c2127]/90 backdrop-blur-md border-b border-[#283039] p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-10 relative shrink-0">
            <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar ocorrências por rua, bairro ou ID..."
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  className="w-full bg-[#111418] border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                />
                {isSearchingAddress && (
                  <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                )}

                {/* Suggestions Dropdown */}
                {addressSuggestions.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-[#1c2632] border border-slate-700 rounded-lg shadow-xl overflow-hidden divide-y divide-slate-800/50 z-50">
                    {addressSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => selectAddress(sug)}
                        className="w-full text-left px-4 py-3 hover:bg-[#283039] transition-colors text-sm text-slate-200 flex items-start gap-3"
                      >
                        <Search size={16} className="text-slate-500 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{sug.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            {/* Interactive Map */}
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ width: '100%', height: '100%', zIndex: 0 }}
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

            {/* Floating UI Overlays */}
            <div className="absolute inset-0 z-[400] pointer-events-none flex flex-col justify-between p-3 sm:p-6 overflow-hidden">
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-2">
                  <button className="bg-[#111418]/90 backdrop-blur-md border border-[#283039] text-white p-2 rounded-lg shadow-xl hover:bg-[#283039] transition-colors pointer-events-auto" title="Minha localização">
                    <Navigation size={20} />
                  </button>
                  <div className="hidden md:block">
                    <CustomZoomControl map={mapInstance} />
                  </div>
                </div>
                {/* Metrics Widget */}
                <div className="bg-[#111418]/90 backdrop-blur-md border border-[#283039] rounded-lg p-3 sm:p-4 shadow-xl max-w-[200px] sm:max-w-sm w-full pointer-events-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Métricas em Tempo Real</h3>
                    <span className="flex size-2 bg-green-500 rounded-full animate-pulse"></span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#9dabb9]">Total de Solicitações</p>
                      <p className="text-xl font-bold text-white">{protocols.length}</p>
                      <p className="text-xs text-green-500 font-medium">Dados atualizados</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9dabb9]">Exibindo no Mapa</p>
                      <p className="text-xl font-bold text-blue-500">{filteredProtocols.length}</p>
                      <p className="text-xs text-blue-400 font-medium">Conforme filtros</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#283039]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#9dabb9]">Meta de Resolução (SLA)</span>
                      <span className="text-white font-bold">78%</span>
                    </div>
                    <div className="w-full bg-[#283039] rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Elements: Critical Alert & Selected Incident */}
              <div className="flex flex-col lg:flex-row justify-between items-end gap-2 lg:gap-4 pointer-events-none mt-auto">
                {/* Left Side: Critical Alert & Navigation */}
                <div className="flex flex-col gap-2 lg:gap-4 max-w-[280px] lg:max-w-xs pointer-events-auto">
                  {/* Navigation Controls */}
                  {filteredProtocols.length > 0 && (
                    <div className="bg-[#111418]/90 backdrop-blur-md border border-slate-700 rounded-lg p-2 shadow-xl flex items-center justify-between">
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

                  {/* Critical Alert */}
                  <div className="bg-red-500/10 backdrop-blur-md border border-red-500/50 rounded-lg p-4 shadow-xl animate-pulse">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-500" size={20} />
                      <div>
                        <h4 className="text-red-500 font-bold text-sm">Alerta de Zona Crítica</h4>
                        <p className="text-white text-xs mt-1">Alta concentração de reclamações na <strong>Estação Central</strong>.</p>
                        <button className="mt-2 text-xs text-red-400 hover:text-red-300 font-bold underline">Ver Detalhes</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Incident Details Panel */}
                {activeIncident && (
                  <div className="pointer-events-auto bg-[#111418]/90 backdrop-blur-md border border-blue-500/50 rounded-lg p-3 lg:p-4 shadow-2xl max-w-[280px] lg:max-w-sm w-full transition-all mt-2 lg:mt-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-sm lg:text-base max-w-[60%] lg:max-w-[70%] truncate" title={activeIncident.description}>{activeIncident.description || 'Problema de Acessibilidade'}</h3>
                      <span className="text-[10px] lg:text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">{activeIncident.status === 'Open' ? 'Aberto' : activeIncident.status === 'InProgress' ? 'Em Análise' : activeIncident.status === 'Resolved' ? 'Concluído' : 'Fechado/Atraso'}</span>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-400 mb-3 lg:mb-4 truncate" title={activeIncident.address}>{activeIncident.category} • {activeIncident.address}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded transition-colors">Ver Detalhes</button>
                      <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded transition-colors">Atribuir Equipe</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, badge }: any) {
  return (
    <a className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${active ? 'bg-[#283039] text-white' : 'text-[#9dabb9] hover:bg-[#1c2127]'}`} href="#">
      <Icon size={20} className={active ? 'text-white' : 'group-hover:text-blue-600'} />
      <span className={`text-sm font-medium ${active ? 'text-white' : 'group-hover:text-white'}`}>{label}</span>
      {badge && <span className="ml-auto bg-red-500/20 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </a>
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
    >
      <Popup className="custom-popup">
        <div className="p-1">
          <h3 className="font-bold text-gray-900 text-sm whitespace-pre-wrap">{incident.address}</h3>
          <p className="text-xs text-gray-500 mt-1">{incident.category} • {incident.description}</p>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${incident.status === 'Open' ? 'bg-blue-100 text-blue-700' :
              incident.status === 'Closed' || incident.status === 'Atrasado' ? 'bg-red-100 text-red-700' :
                incident.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
              }`}>
              {incident.status === 'Open' ? 'Aberto' : incident.status === 'InProgress' ? 'Em Análise' : incident.status === 'Resolved' ? 'Concluído' : 'Fechado/Atraso'}
            </span>
            <span className="text-[10px] text-gray-400">{incident.date}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
