ALTER TABLE public.protocols
    ADD COLUMN IF NOT EXISTS corrected_image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS correction_status VARCHAR(20) NOT NULL DEFAULT 'idle',
    ADD COLUMN IF NOT EXISTS correction_error TEXT,
    ADD COLUMN IF NOT EXISTS correction_generated_at TIMESTAMPTZ;

