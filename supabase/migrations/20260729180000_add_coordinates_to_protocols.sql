-- Coordenadas geograficas confirmadas pelo solicitante no momento da abertura.
--
-- Antes desta migration o sistema nao persistia a posicao marcada no mapa: o
-- frontend descartava o marcador e as telas de mapa derivavam a posicao de um
-- hash do id do protocolo, exibindo localizacoes ficticias. NULL passa a
-- significar explicitamente "sem localizacao confirmada" e nesse caso nenhum
-- pin deve ser renderizado.

alter table public.protocols
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.protocols.latitude is
  'Latitude confirmada pelo solicitante no mapa. NULL = sem localizacao confirmada.';
comment on column public.protocols.longitude is
  'Longitude confirmada pelo solicitante no mapa. NULL = sem localizacao confirmada.';

-- Faixas validas. Impede que erro de parse grave coordenada impossivel.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'protocols_latitude_range'
  ) then
    alter table public.protocols
      add constraint protocols_latitude_range
      check (latitude is null or (latitude >= -90 and latitude <= 90));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'protocols_longitude_range'
  ) then
    alter table public.protocols
      add constraint protocols_longitude_range
      check (longitude is null or (longitude >= -180 and longitude <= 180));
  end if;

  -- Latitude e longitude andam juntas: uma sozinha nao localiza nada.
  if not exists (
    select 1 from pg_constraint where conname = 'protocols_coordinates_complete'
  ) then
    alter table public.protocols
      add constraint protocols_coordinates_complete
      check ((latitude is null) = (longitude is null));
  end if;
end $$;

-- Indice parcial: consultas geograficas ignoram registros sem coordenada.
create index if not exists protocols_coordinates_idx
  on public.protocols (latitude, longitude)
  where latitude is not null and longitude is not null;
