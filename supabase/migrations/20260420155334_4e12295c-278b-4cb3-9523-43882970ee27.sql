ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS track text;
CREATE INDEX IF NOT EXISTS idx_leads_track ON public.leads(track);