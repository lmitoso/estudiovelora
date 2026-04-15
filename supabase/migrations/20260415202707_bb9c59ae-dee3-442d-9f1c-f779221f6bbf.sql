
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule process-follow-ups to run every hour
SELECT cron.schedule(
  'process-follow-ups-hourly',
  '0 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://yujbvnyjzlgpfxksbyev.supabase.co/functions/v1/process-follow-ups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
