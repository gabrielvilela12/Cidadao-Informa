UPDATE users
   SET role = 'master'
 WHERE lower(email) = 'gabrielvilela.dev@gmail.com';

INSERT INTO server_state_permissions (id, user_id, state_code)
SELECT gen_random_uuid(), users.id, states.state_code
  FROM users
 CROSS JOIN (VALUES
    ('AC'),('AL'),('AP'),('AM'),('BA'),('CE'),('DF'),('ES'),('GO'),
    ('MA'),('MT'),('MS'),('MG'),('PA'),('PB'),('PR'),('PE'),('PI'),
    ('RJ'),('RN'),('RS'),('RO'),('RR'),('SC'),('SP'),('SE'),('TO')
 ) AS states(state_code)
 WHERE lower(users.email) = 'gabrielvilela.dev@gmail.com'
ON CONFLICT (user_id, state_code) DO NOTHING;

INSERT INTO server_screen_permissions (id, user_id, screen_key)
SELECT gen_random_uuid(), users.id, screens.screen_key
  FROM users
 CROSS JOIN (VALUES
    ('CITIZENS'), ('USER_MANAGEMENT'), ('REPORTS'), ('AI')
 ) AS screens(screen_key)
 WHERE lower(users.email) = 'gabrielvilela.dev@gmail.com'
ON CONFLICT (user_id, screen_key) DO NOTHING;

ALTER TABLE protocol_audit_chain
    DROP CONSTRAINT IF EXISTS protocol_audit_chain_actor_role_check;
ALTER TABLE protocol_audit_chain
    ADD CONSTRAINT protocol_audit_chain_actor_role_check
    CHECK (actor_role IN ('citizen', 'admin', 'master', 'system', 'ia'));

DROP POLICY IF EXISTS "Allow read access to admins" ON ai_priority_jobs;
CREATE POLICY "Allow read access to admins"
  ON ai_priority_jobs FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'master'));

DROP POLICY IF EXISTS "Allow read access to admins" ON ai_job_logs;
CREATE POLICY "Allow read access to admins"
  ON ai_job_logs FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'master'));

DROP POLICY IF EXISTS "Allow read access to admins" ON protocol_audit_chain;
CREATE POLICY "Allow read access to admins"
  ON protocol_audit_chain FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'master'));
