-- Mantem as fotos originais separadas das simulacoes geradas por IA.
ALTER TABLE protocols
    ADD COLUMN corrected_image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN correction_status VARCHAR(20) NOT NULL DEFAULT 'idle',
    ADD COLUMN correction_error TEXT,
    ADD COLUMN correction_generated_at TIMESTAMPTZ;

