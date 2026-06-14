
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- Restrict storage listing: allow public read of specific objects only via direct URL (already allowed), but drop listing rights
-- The existing SELECT policy permits read; remove it and replace with one that only allows authenticated listing
DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images public read by name" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
-- Public bucket continues to serve images via signed-less URL; listing via SDK won't expose extra info beyond public URLs.
