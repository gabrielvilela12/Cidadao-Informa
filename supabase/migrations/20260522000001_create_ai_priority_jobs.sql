-- Create ai_priority_jobs table
CREATE TABLE IF NOT EXISTS ai_priority_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  result_priority TEXT CHECK (result_priority IN ('baixa', 'media', 'alta', 'critica')),
  error_message TEXT,
  attempt_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_ai_priority_jobs_status ON ai_priority_jobs(status);
CREATE INDEX idx_ai_priority_jobs_protocol_id ON ai_priority_jobs(protocol_id);
CREATE INDEX idx_ai_priority_jobs_created_at ON ai_priority_jobs(created_at DESC);

-- Enable RLS (Row Level Security) - admins only
ALTER TABLE ai_priority_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to admins"
  ON ai_priority_jobs FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );
