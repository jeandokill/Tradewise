
-- Add new order status values
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'awaiting_payment_review';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'payment_declined';

-- Add payment proof column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payer_phone text;
