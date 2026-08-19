CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.two_factor_ok()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN NOT c.totp_enabled THEN true
      WHEN c.totp_verified_session_id IS NOT NULL
       AND c.totp_verified_session_id = (auth.jwt() ->> 'session_id')
       AND c.totp_verified_at > now() - interval '12 hours' THEN true
      ELSE false
    END
    FROM public.user_secrets_config c
    WHERE c.user_id = auth.uid()
    LIMIT 1
  ), true);
$$;

REVOKE ALL ON FUNCTION private.two_factor_ok() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.two_factor_ok() TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can view own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.credentials;

CREATE POLICY "Users can view own credentials" ON public.credentials
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND private.two_factor_ok());
CREATE POLICY "Users can insert own credentials" ON public.credentials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND private.two_factor_ok());
CREATE POLICY "Users can update own credentials" ON public.credentials
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND private.two_factor_ok())
  WITH CHECK (auth.uid() = user_id AND private.two_factor_ok());
CREATE POLICY "Users can delete own credentials" ON public.credentials
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND private.two_factor_ok());

DROP POLICY IF EXISTS "Users can view own secrets" ON public.secrets;
DROP POLICY IF EXISTS "Users can insert own secrets" ON public.secrets;
DROP POLICY IF EXISTS "Users can update own secrets" ON public.secrets;
DROP POLICY IF EXISTS "Users can delete own secrets" ON public.secrets;

CREATE POLICY "Users can view own secrets" ON public.secrets
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND private.two_factor_ok());
CREATE POLICY "Users can insert own secrets" ON public.secrets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND private.two_factor_ok());
CREATE POLICY "Users can update own secrets" ON public.secrets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND private.two_factor_ok())
  WITH CHECK (auth.uid() = user_id AND private.two_factor_ok());
CREATE POLICY "Users can delete own secrets" ON public.secrets
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND private.two_factor_ok());

DROP FUNCTION IF EXISTS public.two_factor_ok();