CREATE TABLE public.curso_visit_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_curso_visit_triggers_lead_time ON public.curso_visit_triggers(lead_id, triggered_at);
CREATE INDEX idx_curso_visit_triggers_status ON public.curso_visit_triggers(status, triggered_at);
ALTER TABLE public.curso_visit_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to curso_visit_triggers" ON public.curso_visit_triggers FOR SELECT USING (false);