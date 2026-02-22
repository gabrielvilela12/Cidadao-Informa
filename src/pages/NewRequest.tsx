import { ArrowLeft, Check, MapPin, Search, CheckCircle, Image as ImageIcon, CloudUpload, X, Info, ArrowRight, LocateFixed, Plus, Minus, Loader2, Footprints, Eye, Ear, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

async function fetchAddress(lat: number, lon: number, setAddressObj: (a: any) => void) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'pt-BR' }
    });
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      setAddressObj({
        street: addr.road || addr.pedestrian || addr.path || '',
        number: addr.house_number || '',
        neighborhood: addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || '',
        city: addr.city || addr.town || addr.village || addr.municipality || '',
        state: addr.state || ''
      });
    }
  } catch (error) {
    console.error("Erro ao buscar endereço", error);
  }
}

function LocationMarker({ position, setPosition, setAddressObj }: { position: any, setPosition: any, setAddressObj: any }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng, setAddressObj);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function NewRequest() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addressObj, setAddressObj] = useState({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [category, setCategory] = useState('Física');
  const [serviceDesc, setServiceDesc] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333]);
  const [position, setPosition] = useState<{ lat: number, lng: number } | null>({ lat: -23.5505, lng: -46.6333 });

  // 1 = Type | 2 = Form & Map | 3 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Address search debounce timer
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

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
    const addr = sug.address || {};
    setAddressObj({
      street: addr.road || addr.pedestrian || addr.path || sug.name || '',
      number: addr.house_number || '',
      neighborhood: addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || '',
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      state: addr.state || ''
    });
    setAddressSuggestions([]);
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);
    setPosition({ lat, lng: lon });
    setMapCenter([lat, lon]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          fetchAddress(latitude, longitude, setAddressObj);
        },
        (err) => {
          alert("Não foi possível obter a sua localização exata.");
          console.error(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocalização não é suportada neste navegador.");
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!category) {
        alert("Por favor, selecione uma categoria.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!addressObj.street || !serviceDesc) {
        alert("Por favor, preencha o problema apontado e o endereço completo.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    // TODO: Imagens devem ser enviadas para o C# no futuro e salvas em disco/cloud storage
    // Por enquanto, enviamos arrays vazios, pois removemos o Supabase
    const uploadedUrls: string[] = [];

    const fullAddress = `${addressObj.street}${addressObj.number ? ', ' + addressObj.number : ''}${addressObj.neighborhood ? ' - ' + addressObj.neighborhood : ''}, ${addressObj.city} - ${addressObj.state}`;

    try {
      await api.createProtocol({
        category: category,
        description: serviceDesc + (description ? ` - ${description}` : ''),
        address: fullAddress,
        userId: user?.id,
        // Status and Date are handled by the C# backend by default
      });
      setLoading(false);
      navigate('/meus-protocolos');
    } catch (error) {
      setLoading(false);
      console.error(error);
      alert('Erro ao criar solicitação de acessibilidade.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#101922] font-sans">
      <main className="flex-grow flex flex-col items-center py-8 px-4 md:px-8">
        <div className="w-full max-w-[1200px] flex flex-col gap-6">
          {/* Page Title & Progress */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-blue-500 font-medium text-sm">
                <ArrowLeft size={16} />
                <a className="hover:underline" href="#">Voltar para Início</a>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Nova Solicitação</h1>
              <p className="text-slate-400">Ajude a melhorar a acessibilidade da sua cidade.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Step number={1} label="Tipo" status={currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "pending"} />
              <div className={`w-12 h-0.5 mx-3 ${currentStep >= 2 ? 'bg-green-500' : 'bg-slate-700'}`}></div>
              <Step number={2} label="Localização" status={currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "pending"} />
              <div className={`w-12 h-0.5 mx-3 ${currentStep >= 3 ? 'bg-green-500' : 'bg-slate-700'}`}></div>
              <Step number={3} label="Revisão" status={currentStep === 3 ? "active" : "pending"} />
            </div>
          </div>

          {/* Content Area */}
          {/* Step 1: Tipo */}
          {currentStep === 1 && (
            <div className="bg-[#1c2632] rounded-xl p-8 shadow-sm border border-slate-700 flex flex-col gap-8 min-h-[400px]">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Categoria de Acessibilidade</h2>
                  <p className="text-slate-400">Selecione o tipo de problema que você deseja relatar.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: 'Física', icon: <Footprints size={40} className={category === 'Física' ? 'text-blue-400' : 'text-slate-400'} />, title: 'Física', desc: 'Buracos na calçada, rampas bloqueadas, etc.' },
                  { id: 'Visual', icon: <Eye size={40} className={category === 'Visual' ? 'text-blue-400' : 'text-slate-400'} />, title: 'Visual', desc: 'Piso tátil ausente ou danificado, etc.' },
                  { id: 'Auditiva', icon: <Ear size={40} className={category === 'Auditiva' ? 'text-blue-400' : 'text-slate-400'} />, title: 'Auditiva', desc: 'Falta de sinalização adequada, etc.' },
                  { id: 'Outros', icon: <MoreHorizontal size={40} className={category === 'Outros' ? 'text-blue-400' : 'text-slate-400'} />, title: 'Outros', desc: 'Outros problemas de acessibilidade.' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-6 rounded-xl border text-left transition-all flex flex-col gap-4 ${category === cat.id ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-[#111418] border-slate-700 hover:border-slate-500 hover:bg-[#1a2027]'}`}
                  >
                    <div>{cat.icon}</div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{cat.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Form */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[600px]">
              {/* Left Column */}
              <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
                <div className="bg-[#1c2632] rounded-xl p-6 shadow-sm border border-slate-700 flex flex-col gap-5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin className="text-blue-500" size={20} />
                    Detalhes do Local
                  </h2>

                  {/* Informação da Categoria Selecionada */}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-400">Categoria Selecionada:</span>
                    <span className="text-white font-bold">{category}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-300">Qual é o problema apontado?</label>
                    <input
                      className="block w-full p-3 rounded-lg bg-[#111418] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                      placeholder="Ex: Buraco na calçada, rampa bloqueada..."
                      value={serviceDesc}
                      onChange={(e) => setServiceDesc(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <label className="text-sm font-medium text-slate-300">Rua / Avenida</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                        <MapPin size={20} />
                      </div>
                      <input
                        className="block w-full pl-10 pr-3 py-3 rounded-lg bg-[#111418] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm relative z-0"
                        placeholder="Ex: Av. Paulista"
                        value={addressObj.street}
                        onChange={(e) => {
                          setAddressObj({ ...addressObj, street: e.target.value });
                          handleAddressSearch(e.target.value);
                        }}
                      />
                      {isSearchingAddress && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500">
                          <Loader2 size={16} className="animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {addressSuggestions.length > 0 && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-[#1c2632] border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-800/50">
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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2 col-span-1">
                      <label className="text-sm font-medium text-slate-300">Número</label>
                      <input
                        className="block w-full p-3 rounded-lg bg-[#111418] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        placeholder="Ex: 1578"
                        value={addressObj.number}
                        onChange={(e) => setAddressObj({ ...addressObj, number: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2 col-span-2">
                      <label className="text-sm font-medium text-slate-300">Bairro</label>
                      <input
                        className="block w-full p-3 rounded-lg bg-[#111418] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        placeholder="Ex: Centro"
                        value={addressObj.neighborhood}
                        onChange={(e) => setAddressObj({ ...addressObj, neighborhood: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-300">Cidade</label>
                      <input
                        className="block w-full p-3 rounded-lg bg-[#111418] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        placeholder="São Paulo"
                        value={addressObj.city}
                        onChange={(e) => setAddressObj({ ...addressObj, city: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-300">Estado</label>
                      <input
                        className="block w-full p-3 rounded-lg bg-[#111418] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        placeholder="SP"
                        value={addressObj.state}
                        onChange={(e) => setAddressObj({ ...addressObj, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-300">
                      Descrição Detalhada <span className="text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    <textarea
                      className="block w-full p-3 rounded-lg bg-[#111418] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-sm"
                      placeholder="Por favor, forneça mais detalhes sobre o incidente..."
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-[#1c2632] rounded-xl p-6 shadow-sm border border-slate-700 flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ImageIcon className="text-blue-500" size={20} />
                    Evidências
                  </h2>
                  <label className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[#283039] hover:border-blue-500/50 transition-colors cursor-pointer group">
                    <input
                      className="hidden"
                      multiple
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleImageUpload}
                    />
                    <div className="bg-[#111418] p-4 rounded-full mb-3 group-hover:bg-blue-500/10 transition-colors duration-300">
                      <CloudUpload className="text-slate-400 group-hover:text-blue-500 transition-colors" size={32} />
                    </div>
                    <p className="text-white font-medium mb-1">Arraste fotos aqui ou clique para selecionar</p>
                    <p className="text-slate-400 text-xs">JPG, PNG até 5MB</p>
                  </label>

                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {images.map((file, index) => (
                      <div key={index} className="aspect-square rounded-lg bg-[#283039] relative overflow-hidden group">
                        <img
                          alt={`Evidência ${index + 1}`}
                          className="w-full h-full object-cover"
                          src={URL.createObjectURL(file)}
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="aspect-square rounded-lg bg-[#283039] relative overflow-hidden flex items-center justify-center text-slate-500 border border-slate-700">
                      <ImageIcon size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Map */}
              <div className="lg:col-span-7 flex flex-col h-full order-1 lg:order-2">
                <div className="bg-[#1c2632] rounded-xl shadow-sm border border-slate-700 overflow-hidden flex flex-col h-full min-h-[400px]">
                  <div className="p-3 border-b border-slate-700 bg-[#1c2632] flex justify-between items-center z-10">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">Mapa Interativo</span>
                    <button onClick={handleUseMyLocation} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#283039] border border-slate-700 text-slate-200 text-xs font-medium hover:bg-[#3b4754] transition-colors shadow-sm focus:outline-none">
                      <LocateFixed size={16} />
                      Usar minha localização atual
                    </button>
                  </div>

                  <div className="relative w-full flex-grow bg-[#101922] overflow-hidden group z-0">
                    <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={true}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      />
                      <LocationMarker position={position} setPosition={setPosition} setAddressObj={setAddressObj} />
                      <MapController center={mapCenter} />
                    </MapContainer>
                  </div>

                  <div className="bg-blue-500/10 p-3 text-center border-t border-blue-500/20">
                    <p className="text-xs text-blue-400 flex items-center justify-center gap-2">
                      <Info size={14} />
                      Dica: Clique no mapa para indicar a posição exata do problema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 3 && (
            <div className="bg-[#1c2632] rounded-xl p-8 shadow-sm border border-slate-700 flex flex-col gap-8 min-h-[400px]">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                <CheckCircle className="text-green-500 shrink-0" size={32} />
                <div>
                  <h2 className="text-2xl font-bold text-white">Revise os Dados da Solicitação</h2>
                  <p className="text-slate-400">Verifique se as informações abaixo estão corretas antes de finalizar.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Categoria</span>
                    <p className="text-white text-lg">{category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Problema Relatado</span>
                    <p className="text-white text-lg">{serviceDesc}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Endereço Completo</span>
                    <p className="text-white text-lg">
                      {`${addressObj.street}${addressObj.number ? ', ' + addressObj.number : ''}${addressObj.neighborhood ? ' - ' + addressObj.neighborhood : ''}, ${addressObj.city} - ${addressObj.state}`}
                    </p>
                  </div>
                  {description && (
                    <div>
                      <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Descrição Detalhada</span>
                      <p className="text-slate-300 leading-relaxed max-w-xl">{description}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Imagens Anexadas ({images.length})</span>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {images.map((file, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-700 bg-[#111418]">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Nenhuma imagem anexada.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="sticky bottom-0 bg-[#101922] pt-4 pb-8 border-t border-slate-800 mt-4 flex items-center justify-between lg:justify-end gap-4 z-40">
            <button
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
                } else {
                  navigate(-1);
                }
              }}
              className="px-6 py-3 rounded-lg border border-slate-700 text-slate-200 font-bold hover:bg-[#283039] transition-colors w-full lg:w-auto"
            >
              {currentStep > 1 ? 'Voltar' : 'Cancelar'}
            </button>
            <button
              onClick={currentStep < 3 ? handleNextStep : handleSubmit}
              disabled={loading}
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 w-full lg:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {currentStep === 1 ? 'Continuar' : currentStep === 2 ? 'Revisar Solicitação' : (!loading && 'Finalizar Solicitação')}
              {currentStep < 3 ? <ArrowRight size={16} /> : (!loading && <Check size={16} />)}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Step({ number, label, status }: { number: number; label: string; status: 'completed' | 'active' | 'pending' }) {
  return (
    <div className={`flex items-center group min-w-fit ${status === 'pending' ? 'opacity-50' : ''}`}>
      <div className={`flex items-center justify-center size-8 rounded-full font-bold text-sm ${status === 'completed' ? 'bg-green-500 text-white' :
        status === 'active' ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.2)]' :
          'bg-slate-700 text-slate-400'
        }`}>
        {status === 'completed' ? <Check size={18} /> : number}
      </div>
      <span className={`ml-3 text-sm whitespace-nowrap ${status === 'active' ? 'font-bold text-blue-500' : 'font-medium text-white'}`}>
        {label}
      </span>
    </div>
  );
}
