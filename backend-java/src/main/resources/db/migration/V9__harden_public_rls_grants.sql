-- Public clients no longer access application tables directly. The React app
-- talks to the Java API, and Edge Functions use the service role key.
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_priority_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.protocol_audit_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flyway_schema_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON TABLE public.protocols FROM anon, authenticated;
REVOKE ALL ON TABLE public.ai_priority_jobs FROM anon, authenticated;
REVOKE ALL ON TABLE public.ai_job_logs FROM anon, authenticated;
REVOKE ALL ON TABLE public.protocol_audit_chain FROM anon, authenticated;
REVOKE ALL ON TABLE public.flyway_schema_history FROM anon, authenticated;

DROP POLICY IF EXISTS "Allow update protocols ai fields" ON public.protocols;
DROP POLICY IF EXISTS "Allow insert to authenticated" ON public.ai_job_logs;

DROP POLICY IF EXISTS "Allow read access to admins" ON public.ai_priority_jobs;
CREATE POLICY "Allow read access to admins"
  ON public.ai_priority_jobs FOR SELECT
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Allow read access to admins" ON public.ai_job_logs;
CREATE POLICY "Allow read access to admins"
  ON public.ai_job_logs FOR SELECT
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Allow read access to admins" ON public.protocol_audit_chain;
CREATE POLICY "Allow read access to admins"
  ON public.protocol_audit_chain FOR SELECT
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP INDEX IF EXISTS public.protocols_coordinates_idx;