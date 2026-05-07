
-- Profiles table for riders
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  phone TEXT,
  bio TEXT,
  photo_url TEXT,
  vehicle_type TEXT,
  plate_number TEXT,
  route TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_payment','active','suspended')),
  qr_slug UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('mpesa','till','paybill','bank')),
  label TEXT,
  account_name TEXT,
  account_number TEXT,
  paybill_number TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.payment_methods(profile_id);

CREATE TABLE public.merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_kes INTEGER NOT NULL DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.merch_orders(profile_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_orders ENABLE ROW LEVEL SECURITY;

-- Owners full access
CREATE POLICY "owner_select_profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "owner_update_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
-- public read of active profiles only, limited columns are enforced in client by SELECT list
CREATE POLICY "public_active_profile_read" ON public.profiles FOR SELECT TO anon, authenticated USING (status = 'active');

CREATE POLICY "owner_pm_all" ON public.payment_methods FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.id = auth.uid()));
CREATE POLICY "public_pm_read_active" ON public.payment_methods FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.status = 'active'));

CREATE POLICY "owner_orders_all" ON public.merch_orders FOR ALL TO authenticated
  USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
