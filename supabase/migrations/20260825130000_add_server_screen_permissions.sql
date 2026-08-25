CREATE TABLE IF NOT EXISTS public.server_screen_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    screen_key VARCHAR(40) NOT NULL CHECK (
        screen_key IN ('CITIZENS', 'USER_MANAGEMENT', 'REPORTS', 'AI')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, screen_key)
);

CREATE INDEX IF NOT EXISTS ix_server_screen_permissions_user_id
    ON public.server_screen_permissions (user_id);

INSERT INTO public.server_screen_permissions (user_id, screen_key)
SELECT users.id, screens.screen_key
  FROM public.users
 CROSS JOIN (VALUES
    ('CITIZENS'), ('USER_MANAGEMENT'), ('REPORTS'), ('AI')
 ) AS screens(screen_key)
 WHERE lower(users.role) = 'admin'
ON CONFLICT (user_id, screen_key) DO NOTHING;

ALTER TABLE public.server_screen_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.server_screen_permissions FROM anon, authenticated;
