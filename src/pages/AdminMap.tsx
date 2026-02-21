import { Search, Map as MapIcon, List, Bell, User, ChevronDown, MapPin, Navigation, Layers, Download, Info, AlertTriangle, Plus, Minus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';

// Fix for default Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock occurrences data
const mockOccurrences = [
  { id: 1, lat: -15.7942, lng: -47.8822, title: 'Buraco na via', status: 'Em Análise', date: 'Hoje, 09:30', category: 'Infraestrutura' },
  { id: 2, lat: -15.7980, lng: -47.8900, title: 'Semáforo quebrado', status: 'Em Aberto', date: 'Ontem, 18:45', category: 'Trânsito' },
  { id: 3, lat: -15.7890, lng: -47.8750, title: 'Calçada irregular', status: 'Atrasado', date: '12/10/2023', category: 'Acessibilidade' },
  { id: 4, lat: -15.8010, lng: -47.8850, title: 'Iluminação pública', status: 'Resolvido', date: '10/10/2023', category: 'Serviços Públicos' },
  { id: 5, lat: -15.7910, lng: -47.8950, title: 'Árvore caída', status: 'Em Análise', date: 'Hoje, 07:15', category: 'Meio Ambiente' }
];

export function AdminMap() {
  const [activeIncident, setActiveIncident] = useState<any>(null);

  return (
    <div className="flex-1 relative bg-[#101922] overflow-hidden font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-800 px-6 py-3 bg-[#111418] shrink-0 z-30">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-white">
            <div className="size-8 flex items-center justify-center bg-blue-600 rounded-lg text-white">
              <MapPin size={20} />
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight">HackGov PCD</h2>
          </div>
          <div className="hidden md:flex flex-col min-w-40 h-10 w-96">
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
              <p className="text-sm font-medium text-white leading-none">Ana Silva</p>
              <p className="text-xs text-slate-400 mt-1">Analista Sênior</p>
            </div>
            <div
              className="aspect-square bg-cover rounded-full size-9 border-2 border-[#283039]"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4krNk7WKJNFrcXmNEKVETFSnO9ZUggNfWaABPO-LyN7b6xDQrqPNKFrm-fsHsFx8aRCPqF6UJa334hS5ff4JvvUSrOrWaAEcGI8s1-10UyeivE2dlgcEKTm31v2CpzzsahjjYWUumK91783sgaRlBT3_KPaCGtseABi58ZMmRCzeFaX-0bpW6ar5y3vviBRcQ8NddXkxqLnYs4MY0KVZsK87WLRoExPgdjkkUi1LxGKes5Mpq5cgFufy4C1p4Xpu4EghawLFqjgk')" }}
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
              <FilterGroup title="Região Administrativa" items={['Plano Piloto', 'Taguatinga', 'Ceilândia', 'Águas Claras']} />
              <FilterGroup title="Categoria" items={['Calçadas Irregulares', 'Sem Sinalização Sonora', 'Rampas Bloqueadas']} />
              <FilterGroup title="Status da Solicitação" items={['Em Aberto', 'Atrasado (> 7 dias)']} />
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-[#283039]">
            <button className="w-full bg-[#1c2127] hover:bg-[#283039] text-slate-300 font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
              <Download size={18} />
              Exportar Dados (.CSV)
            </button>
          </div>
        </nav>

        {/* Map Area */}
        <main className="flex-1 relative bg-slate-900 overflow-hidden z-0">
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
                  click: () => setActiveIncident(incident),
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <h3 className="font-bold text-gray-900 text-sm">{incident.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{incident.category}</p>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${incident.status === 'Em Aberto' ? 'bg-blue-100 text-blue-700' :
                          incident.status === 'Atrasado' ? 'bg-red-100 text-red-700' :
                            incident.status === 'Resolvido' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                        }`}>
                        {incident.status}
                      </span>
                      <span className="text-[10px] text-gray-400">{incident.date}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating UI Overlays */}
          <div className="absolute inset-0 z-[400] pointer-events-none flex flex-col justify-between p-6">
            <div className="flex justify-between items-start">
              {/* Metrics Widget */}
              <div className="bg-[#111418]/90 backdrop-blur-md border border-[#283039] rounded-lg p-4 shadow-xl max-w-sm w-full pointer-events-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Métricas em Tempo Real</h3>
                  <span className="flex size-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#9dabb9]">Total de Ocorrências</p>
                    <p className="text-xl font-bold text-white">1,245</p>
                    <p className="text-xs text-green-500 font-medium">+12% vs. mês anterior</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9dabb9]">Pontos Críticos</p>
                    <p className="text-xl font-bold text-red-500">86</p>
                    <p className="text-xs text-red-400 font-medium">Atenção Imediata</p>
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

            {/* Critical Alert */}
            <div className="pointer-events-auto self-end sm:self-auto mb-4 sm:mb-0 sm:absolute sm:bottom-6 sm:left-6">
              <div className="bg-red-500/10 backdrop-blur-md border border-red-500/50 rounded-lg p-4 shadow-xl max-w-xs animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500" size={20} />
                  <div>
                    <h4 className="text-red-500 font-bold text-sm">Alerta de Zona Crítica</h4>
                    <p className="text-white text-xs mt-1">Alta concentração de reclamações na <strong>Estação Central</strong>. 15 ocorrências nas últimas 24h.</p>
                    <button className="mt-2 text-xs text-red-400 hover:text-red-300 font-bold underline">Ver Detalhes</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Incident Details Panel */}
            {activeIncident && (
              <div className="pointer-events-auto absolute bottom-6 right-6 bg-[#111418]/90 backdrop-blur-md border border-blue-500/50 rounded-lg p-4 shadow-2xl max-w-sm w-full transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold">{activeIncident.title}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">{activeIncident.status}</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">{activeIncident.category} • {activeIncident.date}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded transition-colors">Ver Detalhes</button>
                  <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded transition-colors">Atribuir Equipe</button>
                </div>
              </div>
            )}
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

function FilterGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <details className="group" open>
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-slate-200 hover:text-blue-600 transition-colors py-1">
        {title}
        <ChevronDown size={18} className="transition group-open:rotate-180" />
      </summary>
      <div className="pt-2 pl-2 space-y-2">
        {items.map((item) => (
          <label key={item} className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="form-checkbox rounded border-slate-600 bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 h-4 w-4" />
            <span className="text-sm text-slate-400">{item}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
