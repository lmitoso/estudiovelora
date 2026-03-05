-- Remove the overly permissive SELECT policy on storage that allows anonymous access
DROP POLICY IF EXISTS "Read product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow read product uploads" ON storage.objects;