CREATE TABLE IF NOT EXISTS regional_campaigns (
    id TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scope_type TEXT NOT NULL DEFAULT 'city',
    city TEXT,
    state TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_regional_campaigns_scope CHECK (scope_type IN ('city', 'state')),
    CONSTRAINT ck_regional_campaigns_city_scope CHECK (
        scope_type = 'state' OR NULLIF(TRIM(city), '') IS NOT NULL
    ),
    CONSTRAINT ck_regional_campaigns_state CHECK (
        state IN (
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        )
    ),
    CONSTRAINT ck_regional_campaigns_period CHECK (ends_at IS NULL OR ends_at > starts_at)
);

ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS campaign_id TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'protocols_campaign_id_fkey'
          AND conrelid = 'protocols'::regclass
    ) THEN
        ALTER TABLE protocols
            ADD CONSTRAINT protocols_campaign_id_fkey
            FOREIGN KEY (campaign_id) REFERENCES regional_campaigns(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_regional_campaigns_region_status
    ON regional_campaigns (state, scope_type, city, status);
CREATE INDEX IF NOT EXISTS ix_regional_campaigns_establishment_id
    ON regional_campaigns (establishment_id);
CREATE INDEX IF NOT EXISTS ix_protocols_campaign_id
    ON protocols (campaign_id);

INSERT INTO regional_campaigns (
    id,
    establishment_id,
    name,
    scope_type,
    city,
    state,
    status,
    starts_at,
    created_at
)
SELECT
    'campaign-' || md5(establishments.id),
    establishments.id,
    'Campanha ' || establishments.city || '/' || upper(establishments.state),
    'city',
    establishments.city,
    upper(establishments.state),
    'active',
    NOW(),
    NOW()
FROM establishments
WHERE lower(establishments.status) = 'active'
  AND EXISTS (
      SELECT 1
      FROM subscriptions
      WHERE subscriptions.establishment_id = establishments.id
        AND lower(subscriptions.status) IN ('active', 'trial')
  )
ON CONFLICT (id) DO NOTHING;

DELETE FROM daily_operational_report_protocols;
DELETE FROM daily_operational_reports;
DELETE FROM ai_job_logs;
DELETE FROM ai_priority_jobs;
DELETE FROM protocol_audit_chain;
DELETE FROM protocols;

ALTER TABLE IF EXISTS public.regional_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.regional_campaigns FROM anon, authenticated;
