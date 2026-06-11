CREATE TABLE IF NOT EXISTS protocol_audit_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_index BIGINT NOT NULL UNIQUE CHECK (block_index > 0),
  protocol_id TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('citizen', 'admin', 'system', 'ia')),
  previous_status TEXT,
  new_status TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_hash TEXT NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  previous_block_hash TEXT CHECK (previous_block_hash IS NULL OR previous_block_hash ~ '^[a-f0-9]{64}$'),
  block_hash TEXT NOT NULL UNIQUE CHECK (block_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protocol_audit_chain_protocol_id
  ON protocol_audit_chain(protocol_id, block_index);

CREATE INDEX IF NOT EXISTS idx_protocol_audit_chain_created_at
  ON protocol_audit_chain(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_protocol_audit_chain_event_type
  ON protocol_audit_chain(event_type);

ALTER TABLE protocol_audit_chain ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to admins" ON protocol_audit_chain;

CREATE POLICY "Allow read access to admins"
  ON protocol_audit_chain FOR SELECT
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );
