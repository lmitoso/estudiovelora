ALTER TABLE public.lead_email_schedule
  ADD COLUMN IF NOT EXISTS conditional boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_lead_email_schedule_conditional
  ON public.lead_email_schedule (conditional, send_at)
  WHERE status = 'pending' AND conditional = true;