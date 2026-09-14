-- A conta publica de demonstracao fica em um tenant exclusivo. A campanha demo
-- continua ativa para o cidadao demo, mas nao recebe cadastros publicos.
ALTER TABLE regional_campaigns
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO establishments (id, name, type, city, state, status, primary_color, created_at)
VALUES (
    'est-demo-campanha-ribeirao-preto', 'Campanha demo de Ribeirão Preto',
    'city_hall', 'Ribeirão Preto', 'SP', 'active', '#0758BD', NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscriptions (
    id, establishment_id, plan_name, status, monthly_amount, billing_day,
    started_at, current_period_end, created_at
)
VALUES (
    'sub-demo-campanha-ribeirao-preto', 'est-demo-campanha-ribeirao-preto',
    'Demonstração', 'active', 0, 10, NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days', NOW()
)
ON CONFLICT (id) DO NOTHING;

UPDATE regional_campaigns
   SET establishment_id = 'est-demo-campanha-ribeirao-preto',
       is_demo = TRUE
 WHERE id = 'campaign-demo-ribeirao-preto';

UPDATE users
   SET establishment_id = 'est-demo-campanha-ribeirao-preto'
 WHERE establishment_id = 'est-demo-ribeirao-preto'
   AND (id = 'user-demo-servidor' OR id = 'user-demo-cidadao'
        OR id LIKE 'demo-citizen-rp-%' OR id LIKE 'demo-bulk-citizen-rp-%');

UPDATE protocols
   SET establishment_id = 'est-demo-campanha-ribeirao-preto'
 WHERE establishment_id = 'est-demo-ribeirao-preto'
   AND campaign_id = 'campaign-demo-ribeirao-preto';

UPDATE daily_operational_report_protocols AS detail
   SET establishment_id = 'est-demo-campanha-ribeirao-preto'
  FROM protocols AS protocol
 WHERE detail.protocol_id = protocol.id
   AND protocol.campaign_id = 'campaign-demo-ribeirao-preto';

-- O servidor demo nao administra contas de funcionarios.
DELETE FROM server_screen_permissions
 WHERE user_id = 'user-demo-servidor' AND screen_key = 'USER_MANAGEMENT';

-- A antiga conta de Sao Paulo tinha senha publicada na interface demo.
UPDATE users SET status = 'inactive'
 WHERE id = 'user-demo-servidor-sao-paulo';

-- A senha do funcionario e definida fora do repositorio antes da ativacao.
INSERT INTO users (
    id, full_name, email, cpf, phone, role, password_hash,
    establishment_id, status, created_at
)
VALUES (
    'user-prefeitura-sao-paulo-mariana', 'Mariana Costa - Prefeitura de São Paulo',
    'mariana.costa.sp@example.invalid', '55566677788', NULL, 'admin',
    'aguardando-credencial-individual', 'est-demo-sao-paulo', 'inactive', NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO server_state_permissions (id, user_id, state_code)
VALUES (gen_random_uuid(), 'user-prefeitura-sao-paulo-mariana', 'SP')
ON CONFLICT (user_id, state_code) DO NOTHING;

INSERT INTO server_screen_permissions (id, user_id, screen_key)
SELECT gen_random_uuid(), 'user-prefeitura-sao-paulo-mariana', screen_key
  FROM (VALUES ('CITIZENS'), ('REPORTS'), ('AI')) AS screens(screen_key)
ON CONFLICT (user_id, screen_key) DO NOTHING;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users
         WHERE role = 'citizen' AND establishment_id = 'est-demo-campanha-ribeirao-preto') <> 100
       OR (SELECT COUNT(*) FROM protocols
            WHERE establishment_id = 'est-demo-campanha-ribeirao-preto'
              AND campaign_id = 'campaign-demo-ribeirao-preto'
              AND (id LIKE 'demo-protocol-rp-%' OR id LIKE 'demo-bulk-protocol-rp-%')) <> 350
       OR EXISTS (SELECT 1 FROM protocols
                   WHERE establishment_id = 'est-demo-ribeirao-preto'
                     AND campaign_id = 'campaign-demo-ribeirao-preto')
       OR (SELECT COUNT(*) FROM regional_campaigns
            WHERE id = 'campaign-demo-ribeirao-preto' AND is_demo
              AND establishment_id = 'est-demo-campanha-ribeirao-preto') <> 1
       OR (SELECT COUNT(*) FROM users
            WHERE id = 'user-demo-servidor' AND establishment_id = 'est-demo-campanha-ribeirao-preto') <> 1
       OR (SELECT COUNT(*) FROM users
            WHERE id = 'user-prefeitura-sao-paulo-mariana' AND establishment_id = 'est-demo-sao-paulo') <> 1 THEN
        RAISE EXCEPTION 'Separacao das contas municipais incompleta; transacao cancelada.';
    END IF;
END $$;
