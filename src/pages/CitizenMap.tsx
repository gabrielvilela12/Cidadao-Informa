import { MapPin, Search as SearchIcon, List as ListIcon, Bell as BellIcon, User as UserIcon, ChevronDown, Map as MapIconLucide, Info, Share2, X, Navigation, Plus, Minus, Layers as LayersIcon, AlertTriangle as WarningIcon, HardHat as ConstructionIcon, Check as CheckIcon, Bus as BusIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock occurrences data for citizens
const mockOccurrences = [
  { id: 1, lat: -15.7942, lng: -47.8822, title: 'Barreiras na calçada', status: 'Em Análise', date: 'Hoje, 09:30', category: 'Acessibilidade', address: 'Via Eixo Monumental' },
  { id: 2, lat: -15.7980, lng: -47.8900, title: 'Semáforo sem som', status: 'Em Aberto', date: 'Ontem, 18:45', category: 'Trânsito', address: 'W3 Sul' },
  { id: 3, lat: -15.7890, lng: -47.8750, title: 'Rampa bloqueada', status: 'Atrasado', date: '12/10/2023', category: 'Acessibilidade', address: 'Setor Comercial Sul' }
];

export function CitizenMap() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  return (
    <div className="flex-1 relative bg-[#1c2127] h-screen overflow-hidden font-sans">
      {/* Map Area */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[-15.7942, -47.8822]} // Center of Brasília
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          {/* Dark Mode Tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Render interactive markers */}
          {mockOccurrences.map(incident => (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              eventHandlers={{
                click: () => setSelectedIncident(incident),
              }}
            >
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button className="bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 text-white p-2 rounded-lg shadow-lg hover:bg-[#283039] transition-colors" title="Minha localização">
          <Navigation size={20} />
        </button>
        <button className="bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 text-white p-2 rounded-lg shadow-lg hover:bg-[#283039] transition-colors" title="Camadas">
          <LayersIcon size={20} />
        </button>
      </div>

      {/* Floating Search Bar */}
      <div className="absolute top-4 left-4 z-10 w-80">
        <div className="bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg p-3 flex items-center gap-3">
          <SearchIcon className="text-slate-400" size={20} />
          <input
            className="bg-transparent border-none focus:ring-0 text-white placeholder-slate-400 text-sm w-full p-0"
            placeholder="Buscar no mapa (ex: Águas Claras)"
            type="text"
          />
        </div>
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
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwreGr0yWcb42WeE2WtgpUht19vlZGZzK3T90ufPKo40VsxeB_6be3eNcGh4J5o0yd6L84qR-IzkezE4K7nyrpH1gSFoGNFSMfp1SDDXFSFGnyEl1EUyJjXFH69kKVU02abL8FS_YwNzN1GGFs_-vJLCgeM0_r-eRzbLqso9jC8jJGH9UHh25Poz_f8c_x-BIUDbE6dg1-F-Z3V7if9SrX34XMboHxhYnd4ly1T5H31hbX58rWDcKNgktMRYF_3dtOg3yjgxFKecA')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#111418] to-transparent"></div>
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${selectedIncident.status === 'Em Aberto' ? 'bg-blue-500/20 text-blue-400 ring-blue-500/40' :
                    selectedIncident.status === 'Em Análise' ? 'bg-yellow-500/20 text-yellow-500 ring-yellow-500/40' :
                      selectedIncident.status === 'Resolvido' ? 'bg-green-500/20 text-green-400 ring-green-500/40' :
                        'bg-red-500/20 text-red-400 ring-red-500/40'
                  }`}>
                  {selectedIncident.status}
                </span>
              </div>
            </div>

            <div className="p-4 -mt-4 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="text-slate-400" size={14} />
                <span className="text-xs text-slate-400 uppercase tracking-wide">{selectedIncident.address}</span>
              </div>
              <h3 className="text-white text-lg font-bold leading-tight mb-2">{selectedIncident.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {selectedIncident.category}
              </p>

              <div className="flex items-center justify-between border-t border-slate-700 pt-3 mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase">Protocolo</span>
                  <span className="text-sm text-white font-mono">#{selectedIncident.id}442-BG</span>
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
      <div className="absolute bottom-4 right-4 z-10 bg-[#1c2127]/90 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-lg">
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

