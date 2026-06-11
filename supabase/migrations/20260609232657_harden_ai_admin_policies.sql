DROP POLICY IF EXISTS "Allow read access to admins" ON ai_priority_jobs;
DROP POLICY IF EXISTS "Allow read access to admins" ON ai_job_logs;

CREATE POLICY "Allow read access to admins"
  ON ai_priority_jobs FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Allow read access to admins"
  ON ai_job_logs FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );
