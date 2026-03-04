-- Create orders table: tracks each customer purchase
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  whatsapp text,
  brand_name text NOT NULL,
  brand_description text,
  campaign_goal text,
  model_type text NOT NULL DEFAULT 'feminino',
  piece_description text,
  photos_qty int NOT NULL DEFAULT 3,
  videos_qty int NOT NULL DEFAULT 0,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create generations table: tracks each individual AI generation
CREATE TABLE public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  prompt text,
  input_image_url text,
  output_url text,
  fal_request_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Orders policies (public access since no auth required)
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);

-- Generations policies
CREATE POLICY "Anyone can read generations" ON public.generations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert generations" ON public.generations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update generations" ON public.generations FOR UPDATE USING (true);

-- Storage bucket for product uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('product-uploads', 'product-uploads', true);

CREATE POLICY "Anyone can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-uploads');
CREATE POLICY "Anyone can read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-uploads');

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();