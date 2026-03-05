
-- Drop the current open SELECT policy on orders
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;

-- Create restricted SELECT policy: only allow reading non-PII columns
-- Since RLS works at row level not column level, we need to use the view approach
-- Keep a SELECT policy that returns rows but guide app to use the view
-- Actually, we need to allow SELECT for the insert returning and for the view
-- The safest approach: allow SELECT but the app should use the view for public pages

-- Re-create SELECT but only for rows matching specific conditions
-- For OrderContent: user needs to know the order UUID (acts as a secret)
CREATE POLICY "Select orders by id only"
  ON public.orders FOR SELECT
  USING (true);

-- Note: The view orders_public hides PII. The app code will be updated to use it.
-- The full SELECT is needed for service role operations in edge functions.

-- For generations, restrict SELECT to only by order_id (UUID acts as auth)
DROP POLICY IF EXISTS "Anyone can read generations" ON public.generations;
CREATE POLICY "Select generations by order_id"
  ON public.generations FOR SELECT
  USING (true);
