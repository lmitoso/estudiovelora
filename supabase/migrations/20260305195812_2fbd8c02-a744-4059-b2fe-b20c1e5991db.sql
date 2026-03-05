
-- 1. Drop overly permissive UPDATE policy on orders (only service role should update)
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

-- 2. Drop overly permissive INSERT/UPDATE/DELETE on generations
DROP POLICY IF EXISTS "Anyone can insert generations" ON public.generations;
DROP POLICY IF EXISTS "Anyone can update generations" ON public.generations;
DROP POLICY IF EXISTS "Service can delete generations" ON public.generations;

-- 3. Create a public view for orders that hides PII (for OrderContent page)
CREATE VIEW public.orders_public
WITH (security_invoker = on) AS
  SELECT id, brand_name, status, photos_qty, videos_qty, model_type, created_at
  FROM public.orders;

-- 4. Restrict orders SELECT to only non-PII via the base table
-- We keep the existing SELECT policy since OrderContent needs it,
-- but the admin panel will use edge function with service role
-- The view provides a safer interface for public pages

-- 5. Enable RLS on the view isn't needed since security_invoker=on
-- uses the invoker's permissions (the existing SELECT policy)
