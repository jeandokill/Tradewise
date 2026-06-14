
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_title text;
  v_body text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id IS NOT NULL THEN
    IF NEW.status = 'awaiting_payment_review' THEN
      v_title := 'Payment approval pending';
      v_body := 'We received order #' || substring(NEW.id::text,1,8) || '. Our team is verifying your payment proof and will confirm in a few minutes.';
    ELSIF NEW.status = 'paid' THEN
      v_title := 'Payment approved';
      v_body := 'Great news! Payment for order #' || substring(NEW.id::text,1,8) || ' has been approved. Your package is being prepared for delivery.';
    ELSIF NEW.status = 'payment_declined' THEN
      v_title := 'Payment declined';
      v_body := 'Payment for order #' || substring(NEW.id::text,1,8) || ' could not be verified. Please contact us via WhatsApp to resolve this.';
    ELSE
      v_title := 'Order ' || NEW.status::text;
      v_body := 'Your order #' || substring(NEW.id::text,1,8) || ' is now ' || NEW.status::text || '.';
    END IF;

    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (NEW.user_id, v_title, v_body, 'order_status', '/dashboard');
  END IF;
  RETURN NEW;
END;
$function$;
