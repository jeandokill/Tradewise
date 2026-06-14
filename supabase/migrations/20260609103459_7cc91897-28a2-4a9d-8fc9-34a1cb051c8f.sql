
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  IF LOWER(NEW.email) = 'tradewise676@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (NULL, 'New signup', COALESCE(NEW.email, 'A new user') || ' just created an account', 'signup', '/admin/users');
  RETURN NEW;
END;
$function$;

-- Promote tradewise676@gmail.com if it already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE LOWER(email) = 'tradewise676@gmail.com'
ON CONFLICT DO NOTHING;
