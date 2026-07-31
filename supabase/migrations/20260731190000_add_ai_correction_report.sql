ALTER TABLE public.protocols
    ADD COLUMN IF NOT EXISTS correction_report TEXT;
