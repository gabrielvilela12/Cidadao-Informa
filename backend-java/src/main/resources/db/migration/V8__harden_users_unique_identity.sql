DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM users
        GROUP BY cpf
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot create unique index ux_users_cpf: duplicated CPF values exist.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM users
        GROUP BY lower(email)
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot create unique index ux_users_email_lower: duplicated email values exist.';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_cpf
    ON users (cpf);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower
    ON users (lower(email));