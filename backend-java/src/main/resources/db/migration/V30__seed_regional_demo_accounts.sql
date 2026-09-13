-- Dados exclusivamente fictícios para as duas demonstrações municipais.
-- IDs estáveis evitam duplicação em ambientes que já receberam o seed.

-- O fechamento diário guarda o vínculo municipal para consultas futuras por prefeitura.
ALTER TABLE daily_operational_report_protocols
    ADD COLUMN IF NOT EXISTS establishment_id TEXT;

UPDATE daily_operational_report_protocols AS detail
   SET establishment_id = protocol.establishment_id
  FROM protocols AS protocol
 WHERE detail.protocol_id = protocol.id
   AND detail.establishment_id IS NULL;

CREATE INDEX IF NOT EXISTS ix_daily_report_protocols_establishment
    ON daily_operational_report_protocols (report_id, establishment_id);

UPDATE establishments
   SET name = 'Prefeitura de Ribeirão Preto'
 WHERE id = 'est-demo-ribeirao-preto';

INSERT INTO establishments (id, name, type, city, state, status, primary_color, created_at)
VALUES ('est-demo-sao-paulo', 'Prefeitura de São Paulo', 'city_hall', 'São Paulo', 'SP', 'active', '#0758BD', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscriptions (
    id, establishment_id, plan_name, status, monthly_amount, billing_day,
    started_at, current_period_end, created_at
)
VALUES (
    'sub-demo-sao-paulo', 'est-demo-sao-paulo', 'Base Municipal', 'active', 0, 10,
    NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO regional_campaigns (
    id, establishment_id, name, scope_type, city, state, status, starts_at, created_at
)
VALUES (
    'campaign-demo-sao-paulo', 'est-demo-sao-paulo', 'Campanha São Paulo/SP',
    'city', 'São Paulo', 'SP', 'active', NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;

UPDATE users
   SET full_name = 'Servidor Demo - Ribeirão Preto'
 WHERE id = 'user-demo-servidor'
   AND cpf = '22233344455';

INSERT INTO users (
    id, full_name, email, cpf, phone, role, password_hash,
    establishment_id, status, created_at
)
VALUES (
    'user-demo-servidor-sao-paulo', 'Servidor Demo - São Paulo',
    'demo.servidor.saopaulo@cidadaoinforma.com', '44455566677', '11999990002',
    'admin', '$2a$10$awcMsluAoY.Jgqd6waGwzO8wXkTHQi3yYHJp48Z/W2Aiq4sCPCrwK',
    'est-demo-sao-paulo', 'active', NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO server_state_permissions (id, user_id, state_code)
SELECT gen_random_uuid(), users.id, 'SP'
  FROM users
 WHERE users.id = 'user-demo-servidor-sao-paulo'
ON CONFLICT (user_id, state_code) DO NOTHING;

INSERT INTO server_screen_permissions (id, user_id, screen_key)
SELECT gen_random_uuid(), users.id, screens.screen_key
  FROM users
 CROSS JOIN (VALUES ('CITIZENS'), ('USER_MANAGEMENT'), ('REPORTS'), ('AI')) AS screens(screen_key)
 WHERE users.id = 'user-demo-servidor-sao-paulo'
ON CONFLICT (user_id, screen_key) DO NOTHING;

-- Os cidadãos não têm credenciais utilizáveis. Os CPFs e e-mails são inventados.
WITH people(city_key, establishment_id, city, person_no, full_name, phone, address) AS (
    VALUES
    ('rp', 'est-demo-ribeirao-preto', 'Ribeirão Preto', 1, 'Ana Clara Monteiro', '16999001001', 'Rua General Osório, 425 - Centro, Ribeirão Preto - SP'),
    ('rp', 'est-demo-ribeirao-preto', 'Ribeirão Preto', 2, 'Bruno Henrique Tavares', '16999001002', 'Avenida Independência, 1250 - Jardim Sumaré, Ribeirão Preto - SP'),
    ('rp', 'est-demo-ribeirao-preto', 'Ribeirão Preto', 3, 'Camila Rocha Martins', '16999001003', 'Rua São José, 870 - Centro, Ribeirão Preto - SP'),
    ('rp', 'est-demo-ribeirao-preto', 'Ribeirão Preto', 4, 'Diego Almeida Costa', '16999001004', 'Avenida Nove de Julho, 1050 - Jardim América, Ribeirão Preto - SP'),
    ('rp', 'est-demo-ribeirao-preto', 'Ribeirão Preto', 5, 'Elisa Ferreira Nunes', '16999001005', 'Rua Álvares Cabral, 340 - Centro, Ribeirão Preto - SP'),
    ('rp', 'est-demo-ribeirao-preto', 'Ribeirão Preto', 6, 'Felipe Ribeiro Lopes', '16999001006', 'Avenida Presidente Vargas, 2200 - Jardim Califórnia, Ribeirão Preto - SP'),
    ('sp', 'est-demo-sao-paulo', 'São Paulo', 1, 'Gabriela Souza Oliveira', '11999002001', 'Rua Augusta, 1100 - Consolação, São Paulo - SP'),
    ('sp', 'est-demo-sao-paulo', 'São Paulo', 2, 'Henrique Lima Duarte', '11999002002', 'Avenida Paulista, 900 - Bela Vista, São Paulo - SP'),
    ('sp', 'est-demo-sao-paulo', 'São Paulo', 3, 'Isabela Pereira Santos', '11999002003', 'Rua da Consolação, 1250 - Consolação, São Paulo - SP'),
    ('sp', 'est-demo-sao-paulo', 'São Paulo', 4, 'João Victor Barros', '11999002004', 'Avenida Ipiranga, 600 - República, São Paulo - SP'),
    ('sp', 'est-demo-sao-paulo', 'São Paulo', 5, 'Larissa Mendes Silva', '11999002005', 'Rua Vergueiro, 1450 - Liberdade, São Paulo - SP'),
    ('sp', 'est-demo-sao-paulo', 'São Paulo', 6, 'Marcelo Carvalho Reis', '11999002006', 'Rua Teodoro Sampaio, 1000 - Pinheiros, São Paulo - SP')
)
INSERT INTO users (
    id, full_name, email, cpf, phone, role, password_hash,
    establishment_id, residence_state, residence_city, residence_address,
    status, created_at
)
SELECT 'demo-citizen-' || city_key || '-' || LPAD(person_no::text, 2, '0'),
       full_name,
       'cidadao.' || city_key || '.' || LPAD(person_no::text, 2, '0') || '@demo.local',
       CASE city_key WHEN 'rp' THEN '90000001' ELSE '90000002' END || LPAD(person_no::text, 3, '0'),
       phone, 'citizen', 'demo-sem-login', establishment_id, 'SP', city, address,
       'active', NOW() - (person_no * INTERVAL '5 days')
  FROM people
ON CONFLICT (id) DO NOTHING;

-- Três relatos por local, distribuídos entre os seis cidadãos de cada cidade.
WITH places(city_key, establishment_id, campaign_id, place_no, address, latitude, longitude,
            category, issue_key, description, priority) AS (
    VALUES
    ('rp', 'est-demo-ribeirao-preto', 'campaign-demo-ribeirao-preto', 1, 'Av. Independência, 1280 - Jardim Sumaré, Ribeirão Preto - SP', -21.1907, -47.8074, 'Física', 'calcada-sem-rampa', 'Calçada sem rampa de acesso na esquina, impedindo a passagem de cadeirantes.', 'alta'),
    ('rp', 'est-demo-ribeirao-preto', 'campaign-demo-ribeirao-preto', 2, 'Rua General Osório, 390 - Centro, Ribeirão Preto - SP', -21.1773, -47.8105, 'Visual', 'piso-tatil-interrompido', 'Piso tátil interrompido diante do ponto de ônibus.', 'media'),
    ('rp', 'est-demo-ribeirao-preto', 'campaign-demo-ribeirao-preto', 3, 'Av. Nove de Julho, 1050 - Jardim América, Ribeirão Preto - SP', -21.1936, -47.8149, 'Auditiva', 'painel-senhas-ausente', 'Atendimento anuncia senhas apenas por voz, sem painel visual.', 'media'),
    ('rp', 'est-demo-ribeirao-preto', 'campaign-demo-ribeirao-preto', 4, 'Rua São José, 850 - Centro, Ribeirão Preto - SP', -21.1786, -47.8088, 'Física', 'buraco-na-calcada', 'Buraco na calçada dificulta o percurso de pessoas com mobilidade reduzida.', 'alta'),
    ('rp', 'est-demo-ribeirao-preto', 'campaign-demo-ribeirao-preto', 5, 'Av. Presidente Vargas, 2200 - Jardim Califórnia, Ribeirão Preto - SP', -21.2018, -47.8063, 'Visual', 'semaforo-sem-sinal-sonoro', 'Semáforo de travessia sem sinal sonoro em via movimentada.', 'critica'),
    ('rp', 'est-demo-ribeirao-preto', 'campaign-demo-ribeirao-preto', 6, 'Rua Álvares Cabral, 340 - Centro, Ribeirão Preto - SP', -21.1756, -47.8117, 'Física', 'degrau-sem-rampa', 'Entrada do posto de atendimento tem degrau sem rampa.', 'baixa'),
    ('rp', 'est-demo-ribeirao-preto', 'campaign-demo-ribeirao-preto', 7, 'Av. Maurílio Biagi, 800 - Ribeirânia, Ribeirão Preto - SP', -21.1851, -47.7908, 'Outros', 'atendimento-prioritario', 'Fila de atendimento prioritário sem sinalização adequada.', 'media'),
    ('rp', 'est-demo-ribeirao-preto', 'campaign-demo-ribeirao-preto', 8, 'Rua Florêncio de Abreu, 500 - Centro, Ribeirão Preto - SP', -21.1739, -47.8081, 'Física', 'corrimao-danificado', 'Corrimão da escada pública está solto e precisa de reparo.', 'alta'),
    ('sp', 'est-demo-sao-paulo', 'campaign-demo-sao-paulo', 1, 'Avenida Paulista, 900 - Bela Vista, São Paulo - SP', -23.5632, -46.6537, 'Física', 'calcada-sem-rampa', 'Calçada sem rebaixamento junto à faixa de pedestres.', 'alta'),
    ('sp', 'est-demo-sao-paulo', 'campaign-demo-sao-paulo', 2, 'Rua Augusta, 1100 - Consolação, São Paulo - SP', -23.5558, -46.6561, 'Visual', 'piso-tatil-obstruido', 'Piso tátil coberto por mesas e obstáculos no passeio.', 'media'),
    ('sp', 'est-demo-sao-paulo', 'campaign-demo-sao-paulo', 3, 'Praça da Sé, 100 - Sé, São Paulo - SP', -23.5504, -46.6342, 'Auditiva', 'painel-senhas-ausente', 'Guichê chama senhas apenas por voz e não dispõe de painel.', 'media'),
    ('sp', 'est-demo-sao-paulo', 'campaign-demo-sao-paulo', 4, 'Rua da Consolação, 1250 - Consolação, São Paulo - SP', -23.5538, -46.6607, 'Física', 'elevador-parado', 'Elevador de acesso público está parado e sem previsão de conserto.', 'critica'),
    ('sp', 'est-demo-sao-paulo', 'campaign-demo-sao-paulo', 5, 'Avenida Ipiranga, 600 - República, São Paulo - SP', -23.5424, -46.6410, 'Visual', 'semaforo-sem-sinal-sonoro', 'Semáforo de travessia sem aviso sonoro para pessoas com deficiência visual.', 'alta'),
    ('sp', 'est-demo-sao-paulo', 'campaign-demo-sao-paulo', 6, 'Rua Vergueiro, 1450 - Liberdade, São Paulo - SP', -23.5720, -46.6416, 'Física', 'rampa-muito-inclinada', 'Rampa do posto de atendimento tem inclinação excessiva.', 'baixa'),
    ('sp', 'est-demo-sao-paulo', 'campaign-demo-sao-paulo', 7, 'Rua Teodoro Sampaio, 1000 - Pinheiros, São Paulo - SP', -23.5652, -46.6776, 'Outros', 'atendimento-prioritario', 'Atendimento prioritário não está sendo respeitado no guichê.', 'media'),
    ('sp', 'est-demo-sao-paulo', 'campaign-demo-sao-paulo', 8, 'Avenida Rebouças, 1800 - Pinheiros, São Paulo - SP', -23.5665, -46.6770, 'Física', 'ponto-onibus-inacessivel', 'Ponto de ônibus sem área acessível para embarque de cadeirantes.', 'alta')
), reports AS (
    SELECT places.*, series.report_no,
           'demo-citizen-' || places.city_key || '-' ||
               LPAD((((places.place_no + series.report_no - 2) % 6) + 1)::text, 2, '0') AS citizen_id
      FROM places
     CROSS JOIN generate_series(1, 3) AS series(report_no)
)
INSERT INTO protocols (
    id, category, description, address, location_key, cause_key, state_code,
    created_at, status, user_id, requester, establishment_id, campaign_id,
    ai_priority, ai_status, latitude, longitude
)
SELECT 'demo-protocol-' || reports.city_key || '-' || LPAD(reports.place_no::text, 2, '0') || '-' || reports.report_no,
       reports.category, reports.description, reports.address,
       TRIM(REGEXP_REPLACE(LOWER(TRANSLATE(
           reports.address,
           'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
           'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
       )), '[^a-z0-9]+', ' ', 'g')),
       CASE reports.category
           WHEN 'Física' THEN 'fisica'
           WHEN 'Visual' THEN 'visual'
           WHEN 'Auditiva' THEN 'auditiva'
           ELSE 'outros'
       END || '|' || reports.issue_key,
       'SP',
       NOW() - ((reports.place_no * 19 + reports.report_no * 72) * INTERVAL '1 hour'),
       CASE reports.place_no % 3
           WHEN 0 THEN 'Concluído'
           WHEN 1 THEN 'Aberto'
           ELSE 'Em Análise'
       END,
       reports.citizen_id, users.full_name, reports.establishment_id, reports.campaign_id,
       reports.priority, 'success', reports.latitude, reports.longitude
  FROM reports
  JOIN users ON users.id = reports.citizen_id
ON CONFLICT (id) DO NOTHING;
