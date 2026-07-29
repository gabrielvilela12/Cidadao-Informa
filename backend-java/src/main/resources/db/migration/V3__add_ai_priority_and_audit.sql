ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS ai_priority TEXT,
    ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS ai_priority_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    result_priority TEXT,
    error_message TEXT,
    attempt_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    processing_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    priority TEXT NOT NULL,
    source TEXT NOT NULL,
    admin_id UUID,
    previous_priority TEXT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocol_audit_chain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_index BIGINT NOT NULL UNIQUE,
    protocol_id TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload_hash TEXT NOT NULL,
    previous_block_hash TEXT,
    block_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_priority_jobs_status
    ON ai_priority_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_priority_jobs_protocol_id
    ON ai_priority_jobs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_logs_created_at
    ON ai_job_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_chain_protocol_id
    ON protocol_audit_chain(protocol_id, block_index);
