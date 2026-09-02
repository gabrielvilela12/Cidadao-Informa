INSERT INTO establishments (
    id,
    name,
    type,
    document,
    city,
    state,
    status,
    primary_color,
    created_at
) VALUES (
    'est-demo-ribeirao-preto',
    'Prefeitura de Ribeirao Preto',
    'city_hall',
    '46347283000129',
    'Ribeirao Preto',
    'SP',
    'active',
    '#0758BD',
    NOW()
) ON CONFLICT (id) DO UPDATE
   SET name = EXCLUDED.name,
       type = EXCLUDED.type,
       document = EXCLUDED.document,
       city = EXCLUDED.city,
       state = EXCLUDED.state,
       status = EXCLUDED.status,
       primary_color = EXCLUDED.primary_color;

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
    'Base Municipal',
    'active',
    0,
    10,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    NOW()
) ON CONFLICT (id) DO UPDATE
   SET establishment_id = EXCLUDED.establishment_id,
       plan_name = EXCLUDED.plan_name,
       status = EXCLUDED.status,
       monthly_amount = EXCLUDED.monthly_amount,
       billing_day = EXCLUDED.billing_day,
       current_period_end = EXCLUDED.current_period_end;

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
) VALUES (
    'campaign-demo-ribeirao-preto',
    'est-demo-ribeirao-preto',
    'Campanha Ribeirao Preto/SP',
    'city',
    'Ribeirao Preto',
    'SP',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE
   SET establishment_id = EXCLUDED.establishment_id,
       name = EXCLUDED.name,
       scope_type = EXCLUDED.scope_type,
       city = EXCLUDED.city,
       state = EXCLUDED.state,
       status = EXCLUDED.status;

INSERT INTO users (
    id,
    full_name,
    email,
    cpf,
    phone,
    role,
    password_hash,
    establishment_id,
    status,
    created_at
) VALUES
    (
        'user-demo-cidadao',
        'Cidadao Demo',
        'demo.cidadao@cidadaoinforma.com',
        '11122233344',
        '16999990001',
        'citizen',
        '$2a$10$awcMsluAoY.Jgqd6waGwzO8wXkTHQi3yYHJp48Z/W2Aiq4sCPCrwK',
        NULL,
        'active',
        NOW()
    ),
    (
        'user-demo-servidor',
        'Servidor Demo',
        'demo.servidor@cidadaoinforma.com',
        '22233344455',
        '16999990002',
        'admin',
        '$2a$10$awcMsluAoY.Jgqd6waGwzO8wXkTHQi3yYHJp48Z/W2Aiq4sCPCrwK',
        'est-demo-ribeirao-preto',
        'active',
        NOW()
    ),
    (
        'user-demo-dono',
        'Dono Demo da Plataforma',
        'demo.dono@cidadaoinforma.com',
        '33344455566',
        '16999990003',
        'master',
        '$2a$10$awcMsluAoY.Jgqd6waGwzO8wXkTHQi3yYHJp48Z/W2Aiq4sCPCrwK',
        NULL,
        'active',
        NOW()
    )
ON CONFLICT (cpf) DO UPDATE
   SET full_name = EXCLUDED.full_name,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       role = EXCLUDED.role,
       password_hash = EXCLUDED.password_hash,
       establishment_id = EXCLUDED.establishment_id,
       status = EXCLUDED.status;

INSERT INTO server_state_permissions (id, user_id, state_code)
SELECT gen_random_uuid(), users.id, 'SP'
  FROM users
 WHERE users.cpf = '22233344455'
ON CONFLICT (user_id, state_code) DO NOTHING;

INSERT INTO server_screen_permissions (id, user_id, screen_key)
SELECT gen_random_uuid(), users.id, screens.screen_key
  FROM users
 CROSS JOIN (VALUES
    ('CITIZENS'), ('USER_MANAGEMENT'), ('REPORTS'), ('AI')
 ) AS screens(screen_key)
 WHERE users.cpf = '22233344455'
ON CONFLICT (user_id, screen_key) DO NOTHING;
