import { ArrowLeft, Check, MapPin, Search, CheckCircle, Image as ImageIcon, CloudUpload, X, Info, ArrowRight, LocateFixed, Loader2, Footprints, Eye, Ear, MoreHorizontal, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

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
  const location = useLocation();
  const requestPreset = location.state as { category?: string; serviceDesc?: string } | null;
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [addressObj, setAddressObj] = useState({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [category, setCategory] = useState(requestPreset?.category || 'Física');
  const [serviceDesc, setServiceDesc] = useState(requestPreset?.serviceDesc || '');
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
    setSubmitStatus('idle');
    setSubmitMessage('');

    if (currentStep === 1) {
      if (!category) {
        setSubmitStatus('error');
        setSubmitMessage("Por favor, selecione uma categoria.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!addressObj.street || !serviceDesc) {
        setSubmitStatus('error');
        setSubmitMessage("Por favor, preencha o problema apontado e o endereço completo.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    setSubmitStatus('submitting');
    setSubmitMessage('Enviando solicitação para a API...');

    const fullAddress = `${addressObj.street}${addressObj.number ? ', ' + addressObj.number : ''}${addressObj.neighborhood ? ' - ' + addressObj.neighborhood : ''}, ${addressObj.city} - ${addressObj.state}`;

    try {
      await api.createProtocol({
        category: category,
        description: serviceDesc + (description ? ` - ${description}` : ''),
        address: fullAddress,
        userId: user?.id,
      });
      setLoading(false);
      setSubmitStatus('success');
      setSubmitMessage('Solicitação enviada com sucesso. Redirecionando para seus protocolos...');
      await new Promise(resolve => setTimeout(resolve, 900));
      navigate('/meus-protocolos');
    } catch (error) {
      setLoading(false);
      console.error(error);
      setSubmitStatus('error');
      setSubmitMessage(getErrorMessage(error, 'Erro ao criar solicitação. Tente novamente.'));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f8fc] text-[#0b1b33]">
      <main className="mx-auto flex min-h-full w-full max-w-[1480px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#0758bd] transition hover:text-[#0b3f88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <ArrowLeft size={18} />
              Voltar para início
            </button>
            <h1 className="text-3xl font-bold tracking-normal text-[#07162f] sm:text-4xl lg:text-[42px]">
              Nova Solicitação
            </h1>
            <p className="mt-2 text-base text-slate-600 sm:text-lg">
              Ajude a melhorar a acessibilidade da sua cidade.
            </p>
          </div>

          <div className="w-full lg:max-w-[520px]">
            <p className="mb-4 text-left text-sm font-medium text-slate-700 lg:text-right">
              Etapa {currentStep} de 3
            </p>
            <StepRail currentStep={currentStep} />
          </div>
        </section>

        <div className="grid flex-1 items-start gap-5 xl:grid-cols-[minmax(0,1.72fr)_minmax(320px,0.95fr)]">
          <div className="min-w-0">
            {currentStep === 1 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,42,73,0.04)] sm:p-7 lg:p-9"
              >
                <h2 className="text-2xl font-bold text-[#0b1b33]">Categoria de acessibilidade</h2>
                <p className="mt-1 text-slate-600">Selecione o tipo de problema que você deseja relatar.</p>

                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  {[
                    { id: 'Física', Icon: Footprints, desc: 'Buracos na calçada, rampas bloqueadas, etc.', card: 'border-blue-200 from-white to-blue-50/80', icon: 'text-[#1460c9]' },
                    { id: 'Visual', Icon: Eye, desc: 'Piso tátil ausente ou danificado, etc.', card: 'border-emerald-200 from-white to-emerald-50/70', icon: 'text-[#3d8737]' },
                    { id: 'Auditiva', Icon: Ear, desc: 'Falta de sinalização adequada, etc.', card: 'border-violet-200 from-white to-violet-50/70', icon: 'text-[#5b35a6]' },
                    { id: 'Outros', Icon: MoreHorizontal, desc: 'Outros problemas de acessibilidade.', card: 'border-amber-200 from-white to-amber-50/80', icon: 'text-[#dc9800]' },
                  ].map(({ id, Icon, desc, card, icon }) => {
                    const selected = category === id;
                    return (
                      <button
                        type="button"
                        key={id}
                        aria-pressed={selected}
                        onClick={() => setCategory(id)}
                        className={`relative flex min-h-[190px] flex-col items-start justify-center overflow-hidden rounded-lg border bg-gradient-to-br p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1260c9] focus-visible:ring-offset-2 ${card} ${selected ? 'border-[#1260c9] shadow-[0_10px_30px_rgba(18,96,201,0.12)]' : ''}`}
                      >
                        {selected && (
                          <span className="absolute right-5 top-4 flex size-8 items-center justify-center rounded-full bg-[#1260c9] text-white dashboard-inverse-text shadow-sm">
                            <Check size={20} strokeWidth={3} />
                          </span>
                        )}
                        <Icon className={icon} size={44} strokeWidth={1.8} />
                        <h3 className="mt-4 text-xl font-bold text-[#0b1b33]">{id}</h3>
                        <p className="mt-2 max-w-[250px] text-base leading-6 text-slate-600">{desc}</p>
                        {selected && (
                          <span className="mt-4 rounded bg-blue-100 px-2.5 py-1 text-sm font-semibold text-[#0758bd]">
                            Selecionado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,42,73,0.04)] sm:p-7">
                  <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0b1b33]">Localização e detalhes</h2>
                      <p className="mt-1 text-slate-600">Informe onde está o problema e descreva o que encontrou.</p>
                    </div>
                    <span className="w-fit rounded bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#0758bd]">{category}</span>
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <Field label="Qual é o problema apontado?" id="problem" wide>
                      <input
                        id="problem"
                        className={fieldClass}
                        placeholder="Ex: Buraco na calçada ou rampa bloqueada"
                        value={serviceDesc}
                        onChange={(event) => setServiceDesc(event.target.value)}
                      />
                    </Field>

                    <div className="relative lg:col-span-2">
                      <label htmlFor="street" className="mb-2 block text-sm font-semibold text-slate-700">Rua / Avenida</label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={20} />
                        <input
                          id="street"
                          className={`${fieldClass} pl-10 pr-10`}
                          placeholder="Ex: Avenida Paulista"
                          value={addressObj.street}
                          autoComplete="street-address"
                          onChange={(event) => {
                            setAddressObj({ ...addressObj, street: event.target.value });
                            handleAddressSearch(event.target.value);
                          }}
                        />
                        {isSearchingAddress && <Loader2 className="absolute right-3 top-3.5 animate-spin text-[#1260c9]" size={20} />}
                      </div>
                      {addressSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                          {addressSuggestions.map((suggestion, index) => (
                            <button
                              type="button"
                              key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                              onClick={() => selectAddress(suggestion)}
                              className="flex min-h-12 w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition last:border-b-0 hover:bg-blue-50"
                            >
                              <Search className="mt-0.5 shrink-0 text-slate-400" size={16} />
                              <span>{suggestion.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Field label="Número" id="number">
                      <input id="number" className={fieldClass} placeholder="Ex: 1578" value={addressObj.number} onChange={(event) => setAddressObj({ ...addressObj, number: event.target.value })} />
                    </Field>
                    <Field label="Bairro" id="neighborhood">
                      <input id="neighborhood" className={fieldClass} placeholder="Ex: Centro" value={addressObj.neighborhood} onChange={(event) => setAddressObj({ ...addressObj, neighborhood: event.target.value })} />
                    </Field>
                    <Field label="Cidade" id="city">
                      <input id="city" className={fieldClass} placeholder="São Paulo" value={addressObj.city} onChange={(event) => setAddressObj({ ...addressObj, city: event.target.value })} />
                    </Field>
                    <Field label="Estado" id="state">
                      <input id="state" className={fieldClass} placeholder="SP" value={addressObj.state} onChange={(event) => setAddressObj({ ...addressObj, state: event.target.value })} />
                    </Field>
                    <Field label="Descrição detalhada (opcional)" id="details" wide>
                      <textarea
                        id="details"
                        className={`${fieldClass} min-h-28 resize-y`}
                        placeholder="Inclua detalhes que ajudem a equipe responsável"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,42,73,0.04)] sm:p-7">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="text-[#1260c9]" size={24} />
                    <div>
                      <h2 className="text-xl font-bold text-[#0b1b33]">Fotos do local</h2>
                      <p className="text-sm text-slate-600">Adicione imagens que mostrem o problema.</p>
                    </div>
                  </div>
                  <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center transition hover:border-[#1260c9] hover:bg-blue-50">
                    <input className="sr-only" multiple type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} />
                    <CloudUpload className="text-[#1260c9]" size={34} />
                    <span className="mt-3 font-semibold text-[#0b1b33]">Selecionar fotos</span>
                    <span className="mt-1 text-sm text-slate-500">JPG ou PNG</span>
                  </label>
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {images.map((file, index) => (
                        <div key={`${file.name}-${file.lastModified}-${index}`} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                          <FileThumbnail file={file} alt={`Foto ${index + 1} do local`} />
                          <button type="button" onClick={() => removeImage(index)} title="Remover foto" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-[#07162f]/85 text-white shadow transition hover:bg-red-600">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,42,73,0.04)] sm:p-7 lg:p-9">
                <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle size={24} /></span>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0b1b33]">Revise sua solicitação</h2>
                    <p className="mt-1 text-slate-600">Confira as informações antes de enviar.</p>
                  </div>
                </div>
                <dl className="divide-y divide-slate-200">
                  <ReviewItem label="Categoria" value={category} />
                  <ReviewItem label="Problema relatado" value={serviceDesc} />
                  <ReviewItem label="Endereço" value={formatAddress(addressObj)} />
                  {description && <ReviewItem label="Descrição" value={description} />}
                </dl>
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-bold text-[#0b1b33]">Fotos anexadas ({images.length})</h3>
                  {images.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {images.map((file, index) => (
                        <div key={`${file.name}-${file.lastModified}-${index}`} className="aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                          <FileThumbnail file={file} alt={`Foto ${index + 1} anexada`} />
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-2 text-sm text-slate-500">Nenhuma foto anexada.</p>}
                </div>
              </motion.section>
            )}
          </div>

          <aside className="space-y-5">
            {currentStep === 1 && <CategoryGuide />}
            {currentStep === 2 && (
              <MapGuide
                mapCenter={mapCenter}
                position={position}
                setPosition={setPosition}
                setAddressObj={setAddressObj}
                onUseLocation={handleUseMyLocation}
              />
            )}
            {currentStep === 3 && <ReviewGuide />}
            <ProgressCard currentStep={currentStep} />
          </aside>
        </div>

        <section className="sticky bottom-0 z-40 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-[0_-6px_24px_rgba(15,42,73,0.08)] backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SubmitStatusBanner status={submitStatus} message={submitMessage} />
            <div className="flex w-full gap-3 sm:justify-end lg:w-auto">
              <button
                type="button"
                onClick={() => currentStep > 1 ? setCurrentStep((currentStep - 1) as 1 | 2 | 3) : navigate('/')}
                disabled={loading}
                className="min-h-12 flex-1 rounded-md border border-slate-300 bg-white px-6 text-base font-semibold text-[#0b1b33] transition hover:bg-slate-50 disabled:opacity-60 sm:flex-none sm:min-w-40"
              >
                {currentStep > 1 ? 'Voltar' : 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={currentStep < 3 ? handleNextStep : handleSubmit}
                disabled={loading}
                className="flex min-h-12 flex-[1.4] items-center justify-center gap-3 rounded-md bg-[#0758bd] px-7 text-base font-semibold text-white dashboard-inverse-text shadow-[0_8px_18px_rgba(7,88,189,0.22)] transition hover:bg-[#064c9f] disabled:opacity-60 sm:flex-none sm:min-w-56"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Enviando...' : currentStep === 1 ? 'Continuar' : currentStep === 2 ? 'Revisar' : 'Enviar solicitação'}
                {!loading && (currentStep < 3 ? <ArrowRight size={19} /> : <Check size={19} />)}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const fieldClass = 'block min-h-12 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base text-[#0b1b33] outline-none transition placeholder:text-slate-400 focus:border-[#1260c9] focus:ring-2 focus:ring-blue-100';

function formatAddress(address: { street: string; number: string; neighborhood: string; city: string; state: string }) {
  return `${address.street}${address.number ? `, ${address.number}` : ''}${address.neighborhood ? ` - ${address.neighborhood}` : ''}${address.city ? `, ${address.city}` : ''}${address.state ? ` - ${address.state}` : ''}`;
}

function FileThumbnail({ file, alt }: { file: File; alt: string }) {
  const [source, setSource] = useState('');
  React.useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSource(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return source ? <img src={source} alt={alt} className="h-full w-full object-cover" /> : null;
}

function Field({ label, id, wide = false, children }: { label: string; id: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? 'lg:col-span-2' : ''}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function StepRail({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [{ number: 1, label: 'Tipo' }, { number: 2, label: 'Localização' }, { number: 3, label: 'Revisão' }];
  return (
    <ol className="flex w-full items-center" aria-label="Etapas da solicitação">
      {steps.map((step, index) => {
        const active = currentStep === step.number;
        const complete = currentStep > step.number;
        return (
          <React.Fragment key={step.number}>
            <li className="flex min-w-fit items-center gap-2 sm:gap-3">
              <span className={`flex size-9 items-center justify-center rounded-full border text-sm font-bold sm:size-10 ${active || complete ? 'border-[#0758bd] bg-[#0758bd] text-white dashboard-inverse-text' : 'border-slate-300 bg-white text-slate-700'}`}>
                {complete ? <Check size={18} /> : step.number}
              </span>
              <span className={`hidden text-sm sm:block ${active ? 'font-bold text-[#0758bd]' : 'text-slate-600'}`}>{step.label}</span>
            </li>
            {index < steps.length - 1 && <span className={`mx-2 h-px flex-1 sm:mx-4 ${currentStep > step.number ? 'bg-[#0758bd]' : 'bg-slate-300'}`} />}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function CategoryGuide() {
  const tips = [
    { Icon: ImageIcon, text: 'Você poderá adicionar fotos', tone: 'bg-blue-100 text-[#0758bd]' },
    { Icon: MapPin, text: 'O endereço será confirmado na próxima etapa', tone: 'bg-emerald-100 text-emerald-700' },
    { Icon: CheckCircle, text: 'Revise tudo antes de enviar', tone: 'bg-amber-100 text-amber-700' },
  ];
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,42,73,0.04)] sm:p-6">
      <h2 className="text-xl font-bold text-[#0b1b33]">Qual categoria escolher?</h2>
      <img src="/new-request-category-visual.png" alt="Esquina acessível com rampa, piso tátil e sinalização" className="mx-auto mt-2 aspect-[16/9] w-full max-w-[420px] object-contain" />
      <p className="border-b border-slate-200 pb-4 text-base leading-6 text-slate-600">Escolha a opção que melhor representa o problema encontrado.</p>
      <ul className="mt-4 space-y-3">
        {tips.map(({ Icon, text, tone }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-slate-600 sm:text-base">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={18} /></span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MapGuide({ mapCenter, position, setPosition, setAddressObj, onUseLocation }: { mapCenter: [number, number]; position: { lat: number; lng: number } | null; setPosition: (position: { lat: number; lng: number }) => void; setAddressObj: (address: any) => void; onUseLocation: () => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,42,73,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold text-[#0b1b33]">Confirme no mapa</h2><p className="mt-1 text-sm text-slate-600">Toque no ponto exato do problema.</p></div>
        <button type="button" onClick={onUseLocation} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-[#0758bd] hover:bg-blue-100"><LocateFixed size={17} />Minha localização</button>
      </div>
      <div className="h-[390px] w-full bg-slate-100">
        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%', zIndex: 1 }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <LocationMarker position={position} setPosition={setPosition} setAddressObj={setAddressObj} />
          <MapController center={mapCenter} />
        </MapContainer>
      </div>
      <p className="flex items-center justify-center gap-2 border-t border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm text-[#0758bd]"><Info size={16} />O marcador define a posição enviada à equipe.</p>
    </section>
  );
}

function ReviewGuide() {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-6">
      <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle size={27} /></span>
      <h2 className="mt-5 text-xl font-bold text-[#0b1b33]">Tudo pronto para conferir</h2>
      <p className="mt-2 leading-6 text-slate-600">Ao enviar, sua solicitação receberá um protocolo para acompanhamento.</p>
    </section>
  );
}

function ProgressCard({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const rows = [{ number: 1, label: 'Tipo selecionado' }, { number: 2, label: 'Localização' }, { number: 3, label: 'Revisão' }];
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,42,73,0.04)] sm:p-6">
      <h2 className="text-xl font-bold text-[#0b1b33]">Seu progresso</h2>
      <ol className="mt-5">
        {rows.map((row, index) => {
          const complete = currentStep > row.number;
          const active = currentStep === row.number;
          return (
            <li key={row.number} className="relative flex min-h-13 items-center gap-3 pb-5 last:min-h-0 last:pb-0">
              {index < rows.length - 1 && <span className={`absolute left-[14px] top-8 h-[calc(100%-22px)] border-l border-dashed ${complete ? 'border-[#0758bd]' : 'border-slate-300'}`} />}
              <span className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${active || complete ? 'border-[#0758bd] bg-[#0758bd] text-white dashboard-inverse-text' : 'border-slate-300 bg-white text-slate-600'}`}>{complete ? <Check size={14} /> : row.number}</span>
              <span className={`text-sm ${active ? 'font-semibold text-[#0758bd]' : 'text-slate-600'}`}>{row.label}</span>
              {!active && !complete && <span className="ml-auto rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">Pendente</span>}
              {complete && <span className="ml-auto rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Concluído</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-2 py-5 sm:grid-cols-[170px_1fr] sm:gap-6"><dt className="text-sm font-semibold uppercase text-slate-500">{label}</dt><dd className="text-base leading-6 text-[#0b1b33]">{value || 'Não informado'}</dd></div>;
}

function SubmitStatusBanner({ status, message }: { status: SubmitStatus; message: string }) {
  if (status === 'idle' || !message) return <div className="hidden flex-1 lg:block" />;
  const styles = { submitting: 'border-blue-200 bg-blue-50 text-[#0758bd]', success: 'border-emerald-200 bg-emerald-50 text-emerald-700', error: 'border-red-200 bg-red-50 text-red-700' } as const;
  const icon = status === 'submitting' ? <Loader2 size={17} className="shrink-0 animate-spin" /> : status === 'success' ? <CheckCircle size={17} className="shrink-0" /> : <AlertCircle size={17} className="shrink-0" />;
  return <div aria-live="polite" className={`flex min-h-11 w-full items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium lg:flex-1 ${styles[status]}`}>{icon}<span>{message}</span></div>;
}