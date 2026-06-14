
-- Public read for storefront content
CREATE POLICY "public read active hero slides" ON public.hero_slides FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.hero_slides TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.products TO authenticated;
