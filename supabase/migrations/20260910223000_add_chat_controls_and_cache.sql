ALTER TABLE establishments
    ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS ai_chat_cache (
    id TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    normalized_question TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    topics_json TEXT NOT NULL DEFAULT '[]',
    model TEXT NOT NULL DEFAULT 'cache',
    embedding TEXT NOT NULL,
    source_generation_id TEXT,
    hit_count BIGINT NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
    last_hit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    CONSTRAINT ck_ai_chat_cache_question_not_blank CHECK (length(trim(question)) >= 3),
    CONSTRAINT ck_ai_chat_cache_answer_not_blank CHECK (length(trim(answer)) >= 3)
);

CREATE INDEX IF NOT EXISTS ix_ai_chat_cache_establishment_normalized
    ON ai_chat_cache (establishment_id, normalized_question);
CREATE INDEX IF NOT EXISTS ix_ai_chat_cache_establishment_expires
    ON ai_chat_cache (establishment_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS ix_ai_chat_cache_hits
    ON ai_chat_cache (establishment_id, hit_count DESC, last_hit_at DESC);

ALTER TABLE ai_chat_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ai_chat_cache FROM anon, authenticated;
