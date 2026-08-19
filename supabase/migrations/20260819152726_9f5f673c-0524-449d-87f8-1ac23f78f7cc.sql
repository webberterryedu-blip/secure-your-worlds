-- 1. Credential encryption support
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS enc_salt text;
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS enc_version smallint NOT NULL DEFAULT 0;

-- 2. Server-side 2FA verification state
ALTER TABLE public.user_secrets_config ADD COLUMN IF NOT EXISTS totp_verified_session_id text;
ALTER TABLE public.user_secrets_config ADD COLUMN IF NOT EXISTS totp_verified_at timestamptz;

-- 3. Hide/lock TOTP columns from the client (only edge functions via service_role may touch them)
REVOKE ALL ON public.user_secrets_config FROM authenticated;
GRANT SELECT (id, user_id, secrets_password_hash, secrets_password_salt, totp_enabled, auto_lock_minutes, created_at, updated_at)
  ON public.user_secrets_config TO authenticated;
GRANT INSERT (id, user_id, secrets_password_hash, secrets_password_salt, auto_lock_minutes)
  ON public.user_secrets_config TO authenticated;
GRANT UPDATE (secrets_password_hash, secrets_password_salt, auto_lock_minutes, updated_at)
  ON public.user_secrets_config TO authenticated;
GRANT ALL ON public.user_secrets_config TO service_role;

-- 4. Server-side enforcement helper: is the current session allowed past 2FA?
CREATE OR REPLACE FUNCTION public.two_factor_ok()
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

REVOKE ALL ON FUNCTION public.two_factor_ok() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.two_factor_ok() TO authenticated, service_role;

-- 5. Require 2FA completion at the database level for vault data
DROP POLICY IF EXISTS "Users can view own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.credentials;

CREATE POLICY "Users can view own credentials" ON public.credentials
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.two_factor_ok());
CREATE POLICY "Users can insert own credentials" ON public.credentials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.two_factor_ok());
CREATE POLICY "Users can update own credentials" ON public.credentials
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.two_factor_ok())
  WITH CHECK (auth.uid() = user_id AND public.two_factor_ok());
CREATE POLICY "Users can delete own credentials" ON public.credentials
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.two_factor_ok());

DROP POLICY IF EXISTS "Users can view own secrets" ON public.secrets;
DROP POLICY IF EXISTS "Users can insert own secrets" ON public.secrets;
DROP POLICY IF EXISTS "Users can update own secrets" ON public.secrets;
DROP POLICY IF EXISTS "Users can delete own secrets" ON public.secrets;

CREATE POLICY "Users can view own secrets" ON public.secrets
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.two_factor_ok());
CREATE POLICY "Users can insert own secrets" ON public.secrets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.two_factor_ok());
CREATE POLICY "Users can update own secrets" ON public.secrets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.two_factor_ok())
  WITH CHECK (auth.uid() = user_id AND public.two_factor_ok());
CREATE POLICY "Users can delete own secrets" ON public.secrets
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.two_factor_ok());