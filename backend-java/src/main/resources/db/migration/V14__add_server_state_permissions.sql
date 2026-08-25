ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS state_code VARCHAR(2);

UPDATE protocols
   SET state_code = upper(substring(address FROM '(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)[[:space:]]*$'))
 WHERE state_code IS NULL;

UPDATE protocols SET state_code = CASE
    WHEN address ~* 'Acre[[:space:]]*$' THEN 'AC' WHEN address ~* 'Alagoas[[:space:]]*$' THEN 'AL'
    WHEN address ~* 'Amapá[[:space:]]*$' THEN 'AP' WHEN address ~* 'Amazonas[[:space:]]*$' THEN 'AM'
    WHEN address ~* 'Bahia[[:space:]]*$' THEN 'BA' WHEN address ~* 'Ceará[[:space:]]*$' THEN 'CE'
    WHEN address ~* 'Distrito Federal[[:space:]]*$' THEN 'DF' WHEN address ~* 'Espírito Santo[[:space:]]*$' THEN 'ES'
    WHEN address ~* 'Goiás[[:space:]]*$' THEN 'GO' WHEN address ~* 'Maranhão[[:space:]]*$' THEN 'MA'
    WHEN address ~* 'Mato Grosso do Sul[[:space:]]*$' THEN 'MS' WHEN address ~* 'Mato Grosso[[:space:]]*$' THEN 'MT'
    WHEN address ~* 'Minas Gerais[[:space:]]*$' THEN 'MG' WHEN address ~* 'Pará[[:space:]]*$' THEN 'PA'
    WHEN address ~* 'Paraíba[[:space:]]*$' THEN 'PB' WHEN address ~* 'Paraná[[:space:]]*$' THEN 'PR'
    WHEN address ~* 'Pernambuco[[:space:]]*$' THEN 'PE' WHEN address ~* 'Piauí[[:space:]]*$' THEN 'PI'
    WHEN address ~* 'Rio de Janeiro[[:space:]]*$' THEN 'RJ' WHEN address ~* 'Rio Grande do Norte[[:space:]]*$' THEN 'RN'
    WHEN address ~* 'Rio Grande do Sul[[:space:]]*$' THEN 'RS' WHEN address ~* 'Rondônia[[:space:]]*$' THEN 'RO'
    WHEN address ~* 'Roraima[[:space:]]*$' THEN 'RR' WHEN address ~* 'Santa Catarina[[:space:]]*$' THEN 'SC'
    WHEN address ~* 'São Paulo[[:space:]]*$' THEN 'SP' WHEN address ~* 'Sergipe[[:space:]]*$' THEN 'SE'
    WHEN address ~* 'Tocantins[[:space:]]*$' THEN 'TO' ELSE NULL END
 WHERE state_code IS NULL;

ALTER TABLE protocols
    DROP CONSTRAINT IF EXISTS ck_protocols_state_code;

ALTER TABLE protocols
    ADD CONSTRAINT ck_protocols_state_code CHECK (
        state_code IS NULL OR state_code IN (
            'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
            'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
        )
    );

CREATE INDEX IF NOT EXISTS ix_protocols_state_code
    ON protocols (state_code);

CREATE OR REPLACE FUNCTION set_protocol_state_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.state_code IS NULL THEN
        NEW.state_code := upper(substring(NEW.address FROM '(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)[[:space:]]*$'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protocols_state_code ON protocols;
CREATE TRIGGER trg_protocols_state_code
    BEFORE INSERT OR UPDATE OF address, state_code ON protocols
    FOR EACH ROW EXECUTE FUNCTION set_protocol_state_code();

ALTER TABLE daily_operational_report_protocols
    ADD COLUMN IF NOT EXISTS state_code VARCHAR(2);

UPDATE daily_operational_report_protocols
   SET state_code = upper(substring(address FROM '(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)[[:space:]]*$'))
 WHERE state_code IS NULL;

UPDATE daily_operational_report_protocols details
   SET state_code = protocols.state_code
  FROM protocols
 WHERE details.protocol_id = protocols.id
   AND details.state_code IS NULL;

CREATE INDEX IF NOT EXISTS ix_daily_report_protocols_state_code
    ON daily_operational_report_protocols (state_code);

CREATE TABLE IF NOT EXISTS server_state_permissions (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_server_state_permissions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_server_state_permissions_user_state UNIQUE (user_id, state_code),
    CONSTRAINT ck_server_state_permissions_state CHECK (
        state_code IN (
            'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
            'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
        )
    )
);

CREATE INDEX IF NOT EXISTS ix_server_state_permissions_user_id
    ON server_state_permissions (user_id);

-- Mantém o acesso dos administradores já existentes após a implantação.
INSERT INTO server_state_permissions (id, user_id, state_code)
SELECT gen_random_uuid(), users.id, states.state_code
  FROM users
 CROSS JOIN (VALUES
    ('AC'),('AL'),('AP'),('AM'),('BA'),('CE'),('DF'),('ES'),('GO'),
    ('MA'),('MT'),('MS'),('MG'),('PA'),('PB'),('PR'),('PE'),('PI'),
    ('RJ'),('RN'),('RS'),('RO'),('RR'),('SC'),('SP'),('SE'),('TO')
 ) AS states(state_code)
 WHERE lower(users.role) = 'admin'
ON CONFLICT (user_id, state_code) DO NOTHING;
