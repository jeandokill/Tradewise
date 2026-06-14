
-- Auto-create profile + role + admin signup notification on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notify customer when their order status changes
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      'Order ' || NEW.status,
      'Your order #' || substring(NEW.id::text,1,8) || ' is now ' || NEW.status::text || '.',
      'order_status',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();
