-- Tabela de agendamento de emails para leads
CREATE TABLE IF NOT EXISTS public.lead_email_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  email_key text NOT NULL,
  send_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, email_key)
);

CREATE INDEX IF NOT EXISTS idx_lead_email_schedule_pending
  ON public.lead_email_schedule (send_at)
  WHERE status = 'pending';

ALTER TABLE public.lead_email_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to lead_email_schedule"
  ON public.lead_email_schedule
  FOR SELECT
  USING (false);

-- Extensões para cron + http
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Backfill: agendar lead-metodo-aprender para leads existentes do track 'aprender'
INSERT INTO public.lead_email_schedule (lead_id, email_key, send_at)
SELECT id, 'lead-metodo-aprender', created_at + interval '1 day'
FROM public.leads
WHERE track = 'aprender'
ON CONFLICT (lead_id, email_key) DO NOTHING;

-- Agendar cron a cada 5 minutos para processar fila
SELECT cron.schedule(
  'process-lead-email-schedule',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yujbvnyjzlgpfxksbyev.supabase.co/functions/v1/process-lead-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);