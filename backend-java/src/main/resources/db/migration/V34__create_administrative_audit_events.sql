CREATE TABLE IF NOT EXISTS administrative_audit_events (
    id UUID PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id_hash TEXT,
    result TEXT NOT NULL,
    establishment_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT administrative_audit_result_check CHECK (result IN ('SUCCESS', 'DENIED'))
);

CREATE INDEX IF NOT EXISTS idx_administrative_audit_created_at
    ON administrative_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_administrative_audit_actor
    ON administrative_audit_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_administrative_audit_action
    ON administrative_audit_events (action, created_at DESC);

ALTER TABLE administrative_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE administrative_audit_events FROM anon, authenticated;

COMMENT ON TABLE administrative_audit_events IS
    'Trilha de consultas e exportacoes administrativas sensiveis, sem copia de dados pessoais.';
