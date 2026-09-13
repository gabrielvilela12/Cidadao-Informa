-- Complementa a base municipal de V27: 100 cidadãos e 350 chamados por cidade.
-- Todos os IDs/CPFs/e-mails são sintéticos e estáveis. Nenhum novo cidadão pode entrar.

WITH regions(city_key, establishment_id, city, cpf_prefix, area_code, people_count) AS (
    VALUES
        ('rp', 'est-demo-ribeirao-preto', 'Ribeirão Preto', '91', '16', 93),
        ('sp', 'est-demo-sao-paulo', 'São Paulo', '92', '11', 94)
), people AS (
    SELECT regions.*, sequence.person_no,
           (ARRAY['Ana', 'Bruno', 'Carolina', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
                  'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Pedro', 'Rafaela', 'Thiago'])
               [((sequence.person_no - 1) % 16) + 1] || ' ' ||
           (ARRAY['Almeida', 'Barbosa', 'Carvalho', 'Costa', 'Ferreira', 'Lima', 'Martins', 'Oliveira',
                  'Pereira', 'Ribeiro', 'Rocha', 'Santos', 'Silva', 'Souza'])
               [(((sequence.person_no - 1) / 16) % 14) + 1] || ' ' ||
           (ARRAY['Dias', 'Gomes', 'Lopes', 'Mendes', 'Nunes', 'Reis', 'Tavares'])
               [((sequence.person_no - 1) % 7) + 1] AS full_name
      FROM regions
     CROSS JOIN LATERAL generate_series(1, regions.people_count) AS sequence(person_no)
), anchors AS (
    SELECT split_part(id, '-', 3) AS city_key,
           split_part(id, '-', 4)::integer AS place_no,
           address
      FROM protocols
     WHERE id ~ '^demo-protocol-(rp|sp)-[0-9]{2}-1$'
)
INSERT INTO users (
    id, full_name, email, cpf, phone, role, password_hash,
    establishment_id, residence_state, residence_city, residence_address,
    status, created_at
)
SELECT 'demo-bulk-citizen-' || people.city_key || '-' || LPAD(people.person_no::text, 3, '0'),
       people.full_name,
       'demo.' || people.city_key || '.' || LPAD(people.person_no::text, 3, '0') || '@example.invalid',
       people.cpf_prefix || LPAD(people.person_no::text, 9, '0'),
       CASE WHEN people.person_no % 4 = 0 THEN NULL
            ELSE people.area_code || '0000' || LPAD(people.person_no::text, 5, '0') END,
       'citizen', 'demo-sem-login', people.establishment_id, 'SP', people.city,
       regexp_replace(anchors.address, ', [0-9]+', ', ' || (100 + people.person_no * 11)::text),
       'active', NOW() - ((people.person_no % 100 + 1) * INTERVAL '1 day')
  FROM people
  JOIN anchors ON anchors.city_key = people.city_key
              AND anchors.place_no = ((people.person_no - 1) % 8) + 1
ON CONFLICT (id) DO NOTHING;

WITH regions(city_key, establishment_id, people_count) AS (
    VALUES
        ('rp', 'est-demo-ribeirao-preto', 93),
        ('sp', 'est-demo-sao-paulo', 94)
), anchors AS (
    SELECT split_part(id, '-', 3) AS city_key,
           split_part(id, '-', 4)::integer AS place_no,
           category, description, address, cause_key, campaign_id, ai_priority,
           latitude, longitude
      FROM protocols
     WHERE id ~ '^demo-protocol-(rp|sp)-[0-9]{2}-1$'
), reports AS (
    SELECT regions.*, sequence.report_no,
           ((sequence.report_no - 1) % 8) + 1 AS place_no,
           (((sequence.report_no - 1) / 8) % 10) AS house_variant,
           'demo-bulk-citizen-' || regions.city_key || '-' ||
               LPAD((((sequence.report_no - 1) % regions.people_count) + 1)::text, 3, '0') AS citizen_id
      FROM regions
     CROSS JOIN generate_series(1, 326) AS sequence(report_no)
), prepared AS (
    SELECT reports.*, anchors.category, anchors.description, anchors.cause_key,
           anchors.campaign_id, anchors.ai_priority,
           regexp_replace(anchors.address, ', [0-9]+',
                          ', ' || (100 + reports.house_variant * 110)::text) AS address,
           anchors.latitude + (reports.house_variant - 4.5) * 0.00035 AS latitude,
           anchors.longitude + ((reports.house_variant % 3) - 1) * 0.0004 AS longitude
      FROM reports
      JOIN anchors ON anchors.city_key = reports.city_key
                  AND anchors.place_no = reports.place_no
)
INSERT INTO protocols (
    id, category, description, address, location_key, cause_key, state_code,
    created_at, status, resolution_cost, user_id, requester, establishment_id,
    campaign_id, ai_priority, ai_status, latitude, longitude
)
SELECT 'demo-bulk-protocol-' || prepared.city_key || '-' || LPAD(prepared.report_no::text, 3, '0'),
       prepared.category, prepared.description, prepared.address,
       TRIM(REGEXP_REPLACE(LOWER(TRANSLATE(
           prepared.address,
           'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÏÓÒÕÔÖÚÙÛÜÇ',
           'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
       )), '[^a-z0-9]+', ' ', 'g')),
       prepared.cause_key, 'SP',
       NOW() - ((1 + (prepared.report_no * 17) % 550) * INTERVAL '1 hour'),
       CASE prepared.house_variant % 3
           WHEN 0 THEN 'Aberto'
           WHEN 1 THEN 'Em Análise'
           ELSE 'Concluído'
       END,
       CASE WHEN prepared.house_variant % 3 = 2
            THEN (150 + prepared.place_no * 35)::numeric(12, 2)
            ELSE NULL END,
       prepared.citizen_id, users.full_name, prepared.establishment_id,
       prepared.campaign_id, prepared.ai_priority, 'success',
       prepared.latitude, prepared.longitude
  FROM prepared
  JOIN users ON users.id = prepared.citizen_id
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users WHERE id LIKE 'demo-bulk-citizen-rp-%') <> 93
       OR (SELECT COUNT(*) FROM users WHERE id LIKE 'demo-bulk-citizen-sp-%') <> 94
       OR (SELECT COUNT(*) FROM protocols WHERE id LIKE 'demo-bulk-protocol-rp-%') <> 326
       OR (SELECT COUNT(*) FROM protocols WHERE id LIKE 'demo-bulk-protocol-sp-%') <> 326 THEN
        RAISE EXCEPTION 'Carga demo regional incompleta; transação cancelada.';
    END IF;
END $$;
