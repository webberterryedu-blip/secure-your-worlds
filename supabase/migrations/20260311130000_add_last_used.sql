-- Add last_used field for ordering credentials
ALTER TABLE public.credentials 
ADD COLUMN IF NOT EXISTS last_used TIMESTAMP WITH TIME ZONE;

-- Create index for last_used sorting
CREATE INDEX IF NOT EXISTS idx_credentials_last_used ON public.credentials(last_used DESC NULLS LAST);

-- Create index for service filtering
CREATE INDEX IF NOT EXISTS idx_credentials_service ON public.credentials(service);

-- Create index for email filtering
CREATE INDEX IF NOT EXISTS idx_credentials_email ON public.credentials(email);

-- Create GIN index for devices array
CREATE INDEX IF NOT EXISTS idx_credentials_devices_gin ON public.credentials USING GIN (devices);

-- Create GIN index for projects array
CREATE INDEX IF NOT EXISTS idx_credentials_projects_gin ON public.credentials USING GIN (projects);
