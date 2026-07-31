-- Imagens anexadas pelo solicitante. Os arquivos chegam compactados pelo
-- cliente como data URLs JPEG/PNG e ficam vinculados ao protocolo para serem
-- devolvidos nas telas autenticada e publica.
ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
