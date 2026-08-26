CREATE TABLE IF NOT EXISTS establishments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'city_hall',
    document TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    primary_color TEXT NOT NULL DEFAULT '#0758BD',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL DEFAULT 'Essencial',
    status TEXT NOT NULL DEFAULT 'trial',
    monthly_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_amount >= 0),
    billing_day INTEGER NOT NULL DEFAULT 10 CHECK (billing_day BETWEEN 1 AND 28),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    external_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS establishment_id TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS establishment_id TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_establishment_id_fkey'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_establishment_id_fkey
            FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'protocols_establishment_id_fkey'
          AND conrelid = 'protocols'::regclass
    ) THEN
        ALTER TABLE protocols
            ADD CONSTRAINT protocols_establishment_id_fkey
            FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE SET NULL;
    END IF;

    ALTER TABLE protocol_audit_chain
        DROP CONSTRAINT IF EXISTS protocol_audit_chain_actor_role_check;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'protocol_audit_chain_actor_role_check'
          AND conrelid = 'protocol_audit_chain'::regclass
    ) THEN
        ALTER TABLE protocol_audit_chain
            ADD CONSTRAINT protocol_audit_chain_actor_role_check
            CHECK (actor_role IN ('citizen', 'admin', 'master', 'establishment_owner', 'platform_owner', 'system', 'ia'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_users_establishment_id
    ON users (establishment_id);
CREATE INDEX IF NOT EXISTS ix_users_role_establishment
    ON users (role, establishment_id);
CREATE INDEX IF NOT EXISTS ix_protocols_establishment_id
    ON protocols (establishment_id);
CREATE INDEX IF NOT EXISTS ix_subscriptions_establishment_id
    ON subscriptions (establishment_id);
CREATE INDEX IF NOT EXISTS ix_subscriptions_status
    ON subscriptions (status);
CREATE INDEX IF NOT EXISTS ix_subscription_payments_subscription_id
    ON subscription_payments (subscription_id);
CREATE INDEX IF NOT EXISTS ix_subscription_payments_status_due
    ON subscription_payments (status, due_date);

INSERT INTO establishments (
    id,
    name,
    type,
    city,
    state,
    status,
    primary_color,
    created_at
) VALUES (
    'est-demo-ribeirao-preto',
    'Prefeitura de Ribeirão Preto',
    'city_hall',
    'Ribeirão Preto',
    'SP',
    'active',
    '#0758BD',
    NOW()
) ON CONFLICT (id) DO NOTHING;

UPDATE users
   SET establishment_id = 'est-demo-ribeirao-preto'
 WHERE establishment_id IS NULL
   AND role IN ('admin', 'citizen', 'establishment_owner');

UPDATE protocols protocol
   SET establishment_id = users.establishment_id
  FROM users
 WHERE protocol.user_id = users.id
   AND protocol.establishment_id IS NULL
   AND users.establishment_id IS NOT NULL;

INSERT INTO subscriptions (
    id,
    establishment_id,
    plan_name,
    status,
    monthly_amount,
    billing_day,
    started_at,
    current_period_end,
    created_at
) VALUES (
    'sub-demo-ribeirao-preto',
    'est-demo-ribeirao-preto',
    'Essencial Prefeitura',
    'active',
    1490.00,
    10,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    NOW()
) ON CONFLICT (id) DO NOTHING;

ALTER TABLE IF EXISTS public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_payments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.establishments FROM anon, authenticated;
REVOKE ALL ON TABLE public.subscriptions FROM anon, authenticated;
REVOKE ALL ON TABLE public.subscription_payments FROM anon, authenticated;

DROP POLICY IF EXISTS "Allow read access to admins" ON public.ai_priority_jobs;
CREATE POLICY "Allow read access to admins"
  ON public.ai_priority_jobs FOR SELECT
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'master', 'establishment_owner', 'platform_owner')
  );

DROP POLICY IF EXISTS "Allow read access to admins" ON public.ai_job_logs;
CREATE POLICY "Allow read access to admins"
  ON public.ai_job_logs FOR SELECT
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'master', 'establishment_owner', 'platform_owner')
  );

DROP POLICY IF EXISTS "Allow read access to admins" ON public.protocol_audit_chain;
CREATE POLICY "Allow read access to admins"
  ON public.protocol_audit_chain FOR SELECT
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'master', 'establishment_owner', 'platform_owner')
  );
