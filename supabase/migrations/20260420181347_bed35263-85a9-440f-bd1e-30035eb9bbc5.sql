-- Add unsubscribed column to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS unsubscribed boolean NOT NULL DEFAULT false;

-- Allow public to update only the unsubscribed flag (needed for unsubscribe link without auth)
CREATE POLICY "Anyone can unsubscribe"
ON public.leads
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);