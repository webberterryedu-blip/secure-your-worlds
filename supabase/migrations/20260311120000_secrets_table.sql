-- Create secrets table for API keys and tokens management
CREATE TABLE public.secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  token_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  secret_type TEXT NOT NULL DEFAULT 'api_key' CHECK (secret_type IN ('api_key', 'jwt_secret', 'oauth_token', 'ssh_key', 'env_variable')),
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own secrets" ON public.secrets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own secrets" ON public.secrets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own secrets" ON public.secrets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own secrets" ON public.secrets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_secrets_updated_at
  BEFORE UPDATE ON public.secrets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_secrets_user_id ON public.secrets(user_id);
CREATE INDEX idx_secrets_service_name ON public.secrets(service_name);
CREATE INDEX idx_secrets_secret_type ON public.secrets(secret_type);

-- Create user_secrets_password table for additional password protection
CREATE TABLE public.user_secrets_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  secrets_password_hash TEXT NOT NULL,
  secrets_password_salt TEXT NOT NULL,
  totp_secret TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_lock_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_secrets_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own secrets config" ON public.user_secrets_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own secrets config" ON public.user_secrets_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own secrets config" ON public.user_secrets_config FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_secrets_config_updated_at
  BEFORE UPDATE ON public.user_secrets_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
