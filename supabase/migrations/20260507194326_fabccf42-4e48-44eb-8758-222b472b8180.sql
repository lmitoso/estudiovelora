
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS lead_type text,
  ADD COLUMN IF NOT EXISTS followup_step integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_conversations_lead_type ON public.conversations(lead_type);
