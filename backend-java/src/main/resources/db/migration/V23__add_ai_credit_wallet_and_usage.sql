ALTER TABLE subscription_payments
    ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'subscription';

CREATE TABLE IF NOT EXISTS ai_credit_wallets (
    establishment_id TEXT PRIMARY KEY REFERENCES establishments(id) ON DELETE CASCADE,
    balance_brl NUMERIC(18, 6) NOT NULL DEFAULT 0 CHECK (balance_brl >= 0),
    total_credited_brl NUMERIC(18, 6) NOT NULL DEFAULT 0 CHECK (total_credited_brl >= 0),
    total_consumed_brl NUMERIC(18, 6) NOT NULL DEFAULT 0 CHECK (total_consumed_brl >= 0),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_credit_transactions (
    id TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('recharge', 'monthly_credit', 'usage', 'adjustment')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'reversed')),
    amount_brl NUMERIC(18, 6) NOT NULL,
    reserved_amount_brl NUMERIC(18, 6) NOT NULL DEFAULT 0 CHECK (reserved_amount_brl >= 0),
    balance_after_brl NUMERIC(18, 6) NOT NULL CHECK (balance_after_brl >= 0),
    reference_id TEXT,
    description TEXT NOT NULL DEFAULT '',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_usage_records (
    id TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    transaction_id TEXT NOT NULL UNIQUE REFERENCES ai_credit_transactions(id) ON DELETE RESTRICT,
    generation_id TEXT,
    feature TEXT NOT NULL DEFAULT 'chatbot',
    model TEXT NOT NULL,
    prompt_tokens BIGINT NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens BIGINT NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
    total_tokens BIGINT NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
    reasoning_tokens BIGINT NOT NULL DEFAULT 0 CHECK (reasoning_tokens >= 0),
    cached_tokens BIGINT NOT NULL DEFAULT 0 CHECK (cached_tokens >= 0),
    openrouter_cost_usd NUMERIC(18, 10) NOT NULL DEFAULT 0 CHECK (openrouter_cost_usd >= 0),
    upstream_inference_cost_usd NUMERIC(18, 10) NOT NULL DEFAULT 0 CHECK (upstream_inference_cost_usd >= 0),
    usd_to_brl_rate NUMERIC(12, 6) NOT NULL CHECK (usd_to_brl_rate > 0),
    markup_percent NUMERIC(8, 4) NOT NULL DEFAULT 0 CHECK (markup_percent >= 0),
    charged_amount_brl NUMERIC(18, 6) NOT NULL DEFAULT 0 CHECK (charged_amount_brl >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ai_credit_transactions_establishment_created
    ON ai_credit_transactions (establishment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_ai_credit_transactions_reference
    ON ai_credit_transactions (reference_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_credit_transactions_establishment_reference
    ON ai_credit_transactions (establishment_id, reference_id)
    WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_ai_usage_records_establishment_created
    ON ai_usage_records (establishment_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_usage_records_generation_id
    ON ai_usage_records (generation_id)
    WHERE generation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_subscription_payments_purpose_status
    ON subscription_payments (purpose, status);

INSERT INTO ai_credit_wallets (establishment_id)
SELECT id FROM establishments
ON CONFLICT (establishment_id) DO NOTHING;

ALTER TABLE ai_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE ai_credit_wallets FROM anon, authenticated;
REVOKE ALL ON TABLE ai_credit_transactions FROM anon, authenticated;
REVOKE ALL ON TABLE ai_usage_records FROM anon, authenticated;
