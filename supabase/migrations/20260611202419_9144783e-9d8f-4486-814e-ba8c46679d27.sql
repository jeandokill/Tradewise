
CREATE POLICY "users upload payment proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'payment-proofs');

CREATE POLICY "public read payment proofs"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'payment-proofs');
