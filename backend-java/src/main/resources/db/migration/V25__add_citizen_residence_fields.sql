ALTER TABLE users
    ADD COLUMN IF NOT EXISTS residence_state TEXT,
    ADD COLUMN IF NOT EXISTS residence_city TEXT,
    ADD COLUMN IF NOT EXISTS residence_address TEXT;

CREATE TABLE IF NOT EXISTS user_residence_proofs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT,
    content_type TEXT NOT NULL,
    data_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_establishment_role
    ON users (establishment_id, role);

COMMENT ON COLUMN users.residence_state IS 'UF residencial informada pelo cidadao no cadastro.';
COMMENT ON COLUMN users.residence_city IS 'Cidade residencial informada pelo cidadao no cadastro.';
COMMENT ON COLUMN users.residence_address IS 'Endereco residencial informado pelo cidadao no cadastro.';
COMMENT ON TABLE user_residence_proofs IS 'Comprovantes de residencia enviados por cidadaos no cadastro.';
COMMENT ON COLUMN user_residence_proofs.data_url IS 'Conteudo do comprovante como data URL.';

ALTER TABLE IF EXISTS public.user_residence_proofs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_residence_proofs FROM anon, authenticated;
