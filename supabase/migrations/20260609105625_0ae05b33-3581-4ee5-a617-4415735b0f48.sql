
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

-- Ensure admin role for the designated email if user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE LOWER(email) = 'tradewise676@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
