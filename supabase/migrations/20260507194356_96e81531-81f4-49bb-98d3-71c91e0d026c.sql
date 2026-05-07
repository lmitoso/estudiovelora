
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS followup_base_at timestamp with time zone;
