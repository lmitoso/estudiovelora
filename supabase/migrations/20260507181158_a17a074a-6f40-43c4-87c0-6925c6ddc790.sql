
-- 1. Fix SECURITY DEFINER view: switch orders_public to security_invoker
ALTER VIEW public.orders_public SET (security_invoker = true);

-- 2. Tighten permissive RLS on leads (frontend never inserts directly; capture-lead edge fn uses service role)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

-- 3. Tighten permissive RLS on orders: still allow public creation but only for safe states
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Public can create pending orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND total_price >= 0
  AND email IS NOT NULL
  AND brand_name IS NOT NULL
);

-- 4. Revoke EXECUTE on SECURITY DEFINER trigger helper functions from public roles
REVOKE EXECUTE ON FUNCTION public.link_conversation_to_lead() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_lead_to_conversations() FROM PUBLIC, anon, authenticated;
