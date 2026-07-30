-- Coordenadas geograficas confirmadas pelo solicitante ao abrir o chamado.
--
-- Antes disso a posicao marcada no mapa era descartada e as telas derivavam a
-- localizacao de um hash do id do protocolo, exibindo pins ficticios com
-- aparencia plausivel. NULL passa a significar "sem localizacao confirmada", e
-- nesse caso nenhum pin deve ser renderizado.

ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Faixas validas, para erro de parse nao gravar coordenada impossivel.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocols_latitude_range') THEN
        ALTER TABLE protocols
            ADD CONSTRAINT protocols_latitude_range
            CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocols_longitude_range') THEN
        ALTER TABLE protocols
            ADD CONSTRAINT protocols_longitude_range
            CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
    END IF;

    -- Latitude e longitude andam juntas: uma sozinha nao localiza nada.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocols_coordinates_complete') THEN
        ALTER TABLE protocols
            ADD CONSTRAINT protocols_coordinates_complete
            CHECK ((latitude IS NULL) = (longitude IS NULL));
    END IF;
END $$;

-- Indice parcial: consultas geograficas ignoram registros sem coordenada.
CREATE INDEX IF NOT EXISTS ix_protocols_coordinates
    ON protocols (latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
