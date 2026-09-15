ALTER TABLE public.protocols
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_protocols_resolved_at
    ON public.protocols (resolved_at)
    WHERE resolved_at IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_protocols_active_created_at
    ON public.protocols (created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_protocols_deleted_at
    ON public.protocols (deleted_at)
    WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN public.protocols.resolved_at IS
    'Instante da conclusao mais recente; fica nulo ao reabrir o protocolo.';
COMMENT ON COLUMN public.protocols.deleted_at IS
    'Exclusao logica solicitada pelo cidadao proprietario.';
COMMENT ON COLUMN public.protocols.deleted_by IS
    'Identificador do cidadao que solicitou a exclusao logica.';
