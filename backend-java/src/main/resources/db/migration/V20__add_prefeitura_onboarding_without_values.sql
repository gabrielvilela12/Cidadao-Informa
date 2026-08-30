CREATE TABLE IF NOT EXISTS platform_plans (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT platform_plans_status_check CHECK (status IN ('active', 'inactive'))
);

INSERT INTO platform_plans (
    code,
    name,
    description,
    status,
    sort_order,
    created_at,
    updated_at
) VALUES
    (
        'base',
        'Base Municipal',
        'Entrada para uma prefeitura organizar protocolos e campanha local.',
        'active',
        10,
        NOW(),
        NOW()
    ),
    (
        'regional',
        'Operacao Regional',
        'Estrutura para prefeitura ou orgao com cobertura ampliada por cidade ou estado.',
        'active',
        20,
        NOW(),
        NOW()
    ),
    (
        'avancado',
        'Gestao Avancada',
        'Base para operacao com mais equipe, relatorios e gestao executiva.',
        'active',
        30,
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO UPDATE
   SET name = EXCLUDED.name,
       description = EXCLUDED.description,
       status = EXCLUDED.status,
       sort_order = EXCLUDED.sort_order,
       updated_at = NOW();

CREATE TABLE IF NOT EXISTS establishment_applications (
    id TEXT PRIMARY KEY,
    establishment_name TEXT NOT NULL,
    document TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    primary_color TEXT NOT NULL DEFAULT '#0758BD',
    logo_url TEXT,
    campaign_name TEXT,
    campaign_scope TEXT NOT NULL DEFAULT 'city',
    plan_code TEXT NOT NULL REFERENCES platform_plans(code),
    requester_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_establishment_id TEXT REFERENCES establishments(id) ON DELETE SET NULL,
    created_subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
    created_campaign_id TEXT REFERENCES regional_campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT establishment_applications_scope_check CHECK (campaign_scope IN ('city', 'state')),
    CONSTRAINT establishment_applications_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS ix_platform_plans_status_sort
    ON platform_plans (status, sort_order, name);
CREATE INDEX IF NOT EXISTS ix_establishment_applications_status_created
    ON establishment_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_establishment_applications_plan_code
    ON establishment_applications (plan_code);
CREATE INDEX IF NOT EXISTS ix_establishment_applications_requester_user
    ON establishment_applications (requester_user_id);

UPDATE subscriptions
   SET monthly_amount = 0;

UPDATE subscription_payments
   SET amount = 0;

ALTER TABLE IF EXISTS public.platform_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.establishment_applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.platform_plans FROM anon, authenticated;
REVOKE ALL ON TABLE public.establishment_applications FROM anon, authenticated;
