
-- 1. Drop permissive SELECT policies on orders and generations
DROP POLICY IF EXISTS "Select orders by id only" ON public.orders;
DROP POLICY IF EXISTS "Select generations by order_id" ON public.generations;

-- 2. Create restrictive SELECT on orders: only allow selecting by specific UUID (for OrderContent page)
-- Uses the orders_public view instead, so no direct SELECT needed on base table for public
-- But we need SELECT for insert returning and for service role
CREATE POLICY "No public select on orders"
  ON public.orders FOR SELECT
  USING (false);

-- 3. Create restrictive SELECT on generations: only by order_id
CREATE POLICY "No public select on generations"
  ON public.generations FOR SELECT
  USING (false);

-- 4. Grant SELECT on orders_public view to anon and authenticated 
-- (the view only exposes non-PII columns and security_invoker is on,
-- but since we blocked base table SELECT, we need to use security_definer instead)
DROP VIEW IF EXISTS public.orders_public;
CREATE VIEW public.orders_public
WITH (security_invoker = false) AS
  SELECT id, brand_name, status, photos_qty, videos_qty, model_type, created_at
  FROM public.orders;

GRANT SELECT ON public.orders_public TO anon, authenticated;

-- 5. Make product-uploads bucket private
UPDATE storage.buckets SET public = false WHERE id = 'product-uploads';

-- 6. Drop overly permissive storage INSERT policy and create a more restrictive one
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- Allow uploads only for product-uploads bucket with mime type validation
CREATE POLICY "Upload product images with validation"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-uploads' 
    AND (storage.extension(name) = 'jpg' 
      OR storage.extension(name) = 'jpeg' 
      OR storage.extension(name) = 'png' 
      OR storage.extension(name) = 'webp')
  );

-- Allow reading only from product-uploads bucket (needed for edge functions)
CREATE POLICY "Read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-uploads');
