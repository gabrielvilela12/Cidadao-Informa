CREATE TABLE IF NOT EXISTS ai_chat_request_events (
    id TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ai_chat_request_events_user_created
    ON ai_chat_request_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_ai_chat_request_events_establishment_created
    ON ai_chat_request_events (establishment_id, created_at DESC);

ALTER TABLE ai_chat_request_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ai_chat_request_events FROM anon, authenticated;
