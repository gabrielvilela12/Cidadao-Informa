-- Add AI priority fields to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS ai_priority TEXT CHECK (ai_priority IN ('baixa', 'media', 'alta', 'critica'));
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'pending' CHECK (ai_status IN ('pending', 'success', 'failed'));

-- Create index for fast filtering by priority
CREATE INDEX IF NOT EXISTS idx_protocols_ai_priority ON protocols(ai_priority);
CREATE INDEX IF NOT EXISTS idx_protocols_ai_status ON protocols(ai_status);
