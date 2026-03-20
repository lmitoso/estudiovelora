
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  source text DEFAULT 'campanha',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "No public select on leads"
ON public.leads
FOR SELECT
TO public
USING (false);
