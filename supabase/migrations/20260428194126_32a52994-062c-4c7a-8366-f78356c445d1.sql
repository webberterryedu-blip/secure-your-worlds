ALTER TABLE public.user_secrets_config
  ALTER COLUMN secrets_password_hash DROP NOT NULL,
  ALTER COLUMN secrets_password_salt DROP NOT NULL;