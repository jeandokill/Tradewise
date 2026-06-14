
-- 1. Restrict profiles public read - only owner or admin can read
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;

CREATE POLICY "users read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "admins read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Restrict product-images storage mutations to admins only
DROP POLICY IF EXISTS "authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated update product images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated delete product images" ON storage.objects;
DROP POLICY IF EXISTS "product images public read by name" ON storage.objects;

CREATE POLICY "admins upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Public read by exact name (not listing) - PostgREST/storage SELECT for public file access still works for direct URLs
CREATE POLICY "product images public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- 3. Lock down SECURITY DEFINER functions - revoke EXECUTE from anon/authenticated
-- has_role is called from RLS context (no direct API access needed)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- 4. Realtime authorization for notifications: scope to authenticated user's own topic
-- Topic convention: 'notifications:<user_id>'
CREATE POLICY "users subscribe own notification topic"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'notifications:' || auth.uid()::text
);

-- 5. Orders: enforce no guest checkout (user_id required)
-- First delete any orphaned rows then set NOT NULL
DELETE FROM public.orders WHERE user_id IS NULL;
ALTER TABLE public.orders ALTER COLUMN user_id SET NOT NULL;
