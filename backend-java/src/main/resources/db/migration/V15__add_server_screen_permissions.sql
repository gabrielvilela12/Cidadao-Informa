CREATE TABLE IF NOT EXISTS server_screen_permissions (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    screen_key VARCHAR(40) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_server_screen_permissions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_server_screen_permissions_user_screen UNIQUE (user_id, screen_key),
    CONSTRAINT ck_server_screen_permissions_screen CHECK (
        screen_key IN ('CITIZENS', 'USER_MANAGEMENT', 'REPORTS', 'AI')
    )
);

CREATE INDEX IF NOT EXISTS ix_server_screen_permissions_user_id
    ON server_screen_permissions (user_id);

-- Administradores existentes mantêm as telas que já podiam acessar.
INSERT INTO server_screen_permissions (id, user_id, screen_key)
SELECT gen_random_uuid(), users.id, screens.screen_key
  FROM users
 CROSS JOIN (VALUES
    ('CITIZENS'), ('USER_MANAGEMENT'), ('REPORTS'), ('AI')
 ) AS screens(screen_key)
 WHERE lower(users.role) = 'admin'
ON CONFLICT (user_id, screen_key) DO NOTHING;
