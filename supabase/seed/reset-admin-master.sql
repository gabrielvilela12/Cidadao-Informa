-- Reset explicito para a nova arquitetura admin-master/white-label.
-- Execute manualmente em ambiente de desenvolvimento.
-- Senha das contas de exemplo: Gabriel@2026

DO $$
DECLARE
    table_list TEXT[];
    truncate_sql TEXT;
BEGIN
    SELECT ARRAY_AGG(format('%I.%I', schemaname, tablename))
      INTO table_list
      FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename = ANY (ARRAY[
            'daily_operational_report_protocols',
            'daily_operational_reports',
            'subscription_payments',
            'subscriptions',
            'protocol_audit_chain',
            'ai_job_logs',
            'ai_priority_jobs',
            'protocols',
            'users',
            'establishments'
       ]);

    IF table_list IS NOT NULL THEN
        truncate_sql := 'TRUNCATE TABLE ' || array_to_string(table_list, ', ') || ' RESTART IDENTITY CASCADE';
        EXECUTE truncate_sql;
    END IF;
END $$;

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
) VALUES
    (
        'est-ribeirao-preto',
        'Prefeitura de Ribeirão Preto',
        'city_hall',
        '56.024.581/0001-56',
        'Ribeirão Preto',
        'SP',
        'active',
        '#0758BD',
        NOW()
    ),
    (
        'est-sao-carlos',
        'Prefeitura de São Carlos',
        'city_hall',
        '45.358.249/0001-01',
        'São Carlos',
        'SP',
        'active',
        '#168821',
        NOW()
    ),
    (
        'est-araraquara',
        'Prefeitura de Araraquara',
        'city_hall',
        '45.276.128/0001-10',
        'Araraquara',
        'SP',
        'blocked',
        '#C00F0C',
        NOW()
    );

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
) VALUES
    ('sub-ribeirao-preto', 'est-ribeirao-preto', 'Essencial Prefeitura', 'active', 1490.00, 10, NOW() - INTERVAL '60 days', NOW() + INTERVAL '30 days', NOW()),
    ('sub-sao-carlos', 'est-sao-carlos', 'Profissional Prefeitura', 'trial', 2490.00, 15, NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', NOW()),
    ('sub-araraquara', 'est-araraquara', 'Essencial Prefeitura', 'overdue', 1490.00, 5, NOW() - INTERVAL '90 days', NOW() - INTERVAL '12 days', NOW());

INSERT INTO subscription_payments (
    id,
    subscription_id,
    amount,
    status,
    due_date,
    paid_at,
    payment_method,
    external_reference,
    created_at
) VALUES
    ('pay-ribeirao-preto-001', 'sub-ribeirao-preto', 1490.00, 'paid', CURRENT_DATE - INTERVAL '20 days', NOW() - INTERVAL '18 days', 'pix', 'demo-paid-001', NOW()),
    ('pay-sao-carlos-001', 'sub-sao-carlos', 2490.00, 'pending', CURRENT_DATE + INTERVAL '6 days', NULL, 'boleto', 'demo-pending-001', NOW()),
    ('pay-araraquara-001', 'sub-araraquara', 1490.00, 'overdue', CURRENT_DATE - INTERVAL '12 days', NULL, 'boleto', 'demo-overdue-001', NOW());

INSERT INTO users (
    id,
    full_name,
    email,
    cpf,
    phone,
    role,
    establishment_id,
    status,
    password_hash,
    created_at
) VALUES
    (
        'user-gabriel-platform-owner',
        'Gabriel Vilela',
        'gabriel@adminmaster.local',
        '00000000000',
        '16999990000',
        'platform_owner',
        NULL,
        'active',
        '$2a$10$VvIXjyeqQAW.4nkOj.nWgOR4boyopuw3by1rRj6wExPzLDGbjNNXS',
        NOW()
    ),
    (
        'user-diretor-ribeirao',
        'Diretora Ribeirão Preto',
        'diretor@ribeirao.local',
        '11111111111',
        '16999991111',
        'establishment_owner',
        'est-ribeirao-preto',
        'active',
        '$2a$10$VvIXjyeqQAW.4nkOj.nWgOR4boyopuw3by1rRj6wExPzLDGbjNNXS',
        NOW()
    ),
    (
        'user-servidor-ribeirao',
        'Servidor Ribeirão Preto',
        'servidor@ribeirao.local',
        '22222222222',
        '16999992222',
        'admin',
        'est-ribeirao-preto',
        'active',
        '$2a$10$VvIXjyeqQAW.4nkOj.nWgOR4boyopuw3by1rRj6wExPzLDGbjNNXS',
        NOW()
    ),
    (
        'user-cidadao-ribeirao',
        'Cidadã Ribeirão Preto',
        'cidadao@ribeirao.local',
        '33333333333',
        '16999993333',
        'citizen',
        'est-ribeirao-preto',
        'active',
        '$2a$10$VvIXjyeqQAW.4nkOj.nWgOR4boyopuw3by1rRj6wExPzLDGbjNNXS',
        NOW()
    );

INSERT INTO protocols (
    id,
    category,
    description,
    address,
    created_at,
    status,
    resolution_cost,
    user_id,
    establishment_id,
    requester,
    ai_priority,
    ai_status,
    latitude,
    longitude,
    image_urls,
    corrected_image_urls,
    correction_status
) VALUES
    (
        'prot-ribeirao-001',
        'Física',
        'Rampa de acesso com inclinação inadequada na entrada do posto de saúde.',
        'Av. Presidente Vargas, 1265 - Ribeirão Preto/SP',
        NOW() - INTERVAL '3 days',
        'Em Análise',
        NULL,
        'user-cidadao-ribeirao',
        'est-ribeirao-preto',
        'Cidadã Ribeirão Preto',
        'alta',
        'success',
        -21.1859,
        -47.8078,
        '[]'::jsonb,
        '[]'::jsonb,
        'idle'
    ),
    (
        'prot-ribeirao-002',
        'Visual',
        'Faixa de pedestres sem piso tátil próximo à escola municipal.',
        'Rua São José, 933 - Ribeirão Preto/SP',
        NOW() - INTERVAL '9 days',
        'Aberto',
        NULL,
        'user-cidadao-ribeirao',
        'est-ribeirao-preto',
        'Cidadã Ribeirão Preto',
        'media',
        'success',
        -21.1783,
        -47.8101,
        '[]'::jsonb,
        '[]'::jsonb,
        'idle'
    );
