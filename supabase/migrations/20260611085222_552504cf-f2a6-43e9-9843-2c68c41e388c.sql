CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'declined');

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  body TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  status public.review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read approved reviews for the homepage
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

-- Authenticated users can view their own reviews (pending/declined)
CREATE POLICY "Users view own reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins view all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can submit their own reviews
CREATE POLICY "Users insert own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can update reviews (approve/decline)
CREATE POLICY "Admins update reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete reviews
CREATE POLICY "Admins delete reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX reviews_status_idx ON public.reviews(status, created_at DESC);
CREATE INDEX reviews_user_idx ON public.reviews(user_id);

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admins when new review submitted
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (NULL, 'New review submitted',
    COALESCE(NEW.name, 'A user') || ' submitted a review for approval',
    'review', '/admin/reviews');
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_notify_new
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();

-- Notify user when their review status changes
CREATE OR REPLACE FUNCTION public.notify_review_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (NEW.user_id, 'Your review was approved',
        'Thanks! Your review is now live on the Tradewise home page.',
        'review_status', '/');
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (NEW.user_id, 'Your review was declined',
        'Your review was not approved. Feel free to submit another one.',
        'review_status', '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_notify_status
  AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_review_status_change();
