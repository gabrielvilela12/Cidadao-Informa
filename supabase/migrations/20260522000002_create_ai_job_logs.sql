-- Create ai_job_logs table for audit trail
CREATE TABLE IF NOT EXISTS ai_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  source TEXT NOT NULL CHECK (source IN ('ia', 'admin_manual', 'admin_regenerated')),
  admin_id UUID REFERENCES auth.users(id),
  previous_priority TEXT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_job_logs_protocol_id ON ai_job_logs(protocol_id);
CREATE INDEX idx_ai_job_logs_created_at ON ai_job_logs(created_at DESC);

-- Enable RLS - admins only
ALTER TABLE ai_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to admins"
  ON ai_job_logs FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );
