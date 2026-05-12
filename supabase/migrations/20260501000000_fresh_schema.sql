-- Fresh Kirsof schema.
-- Reset the database and apply this migration to rebuild the app from scratch.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.user_role AS ENUM ('consumer', 'farmer', 'admin');
CREATE TYPE public.delivery_type AS ENUM ('pickup', 'courier', 'cargo');
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'paid',
  'shipped',
  'completed',
  'cancelled',
  'canceled',
  'return_requested',
  'admin_review',
  'returned'
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'consumer',
  phone text,
  address text,
  location_lat numeric(10, 8),
  location_lng numeric(11, 8),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT profiles_location_pair CHECK (
    (location_lat IS NULL AND location_lng IS NULL)
    OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)
  )
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  delivery_method public.delivery_type NOT NULL DEFAULT 'pickup',
  shipping_fee numeric(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  withholding_tax numeric(10, 2) NOT NULL DEFAULT 0 CHECK (withholding_tax >= 0),
  return_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.address_lookup (
  id bigserial PRIMARY KEY,
  il text NOT NULL,
  ilce text NOT NULL,
  semt text,
  mahalle text
);

CREATE INDEX products_farmer_id_idx ON public.products(farmer_id);
CREATE INDEX orders_buyer_id_idx ON public.orders(buyer_id);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX order_items_farmer_id_idx ON public.order_items(farmer_id);
CREATE INDEX reviews_reviewer_id_idx ON public.reviews(reviewer_id);
CREATE INDEX reviews_farmer_id_idx ON public.reviews(farmer_id);
CREATE INDEX address_lookup_il_idx ON public.address_lookup(il);
CREATE INDEX address_lookup_ilce_idx ON public.address_lookup(il, ilce);
CREATE INDEX address_lookup_semt_idx ON public.address_lookup(il, ilce, semt);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_lookup ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.farmer_owns_order(p_order_id uuid, p_farmer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.farmer_id = p_farmer_id
  );
$$;

CREATE OR REPLACE FUNCTION public.buyer_owns_order(p_order_id uuid, p_buyer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = p_order_id
      AND o.buyer_id = p_buyer_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_distinct_cities()
RETURNS TABLE (il text)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT address_lookup.il
  FROM public.address_lookup
  ORDER BY address_lookup.il;
$$;

CREATE OR REPLACE FUNCTION public.get_distinct_districts(p_il text)
RETURNS TABLE (ilce text)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT address_lookup.ilce
  FROM public.address_lookup
  WHERE address_lookup.il = p_il
  ORDER BY address_lookup.ilce;
$$;

CREATE OR REPLACE FUNCTION public.get_distinct_semts(p_il text, p_ilce text)
RETURNS TABLE (semt text)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT address_lookup.semt
  FROM public.address_lookup
  WHERE address_lookup.il = p_il
    AND address_lookup.ilce = p_ilce
    AND address_lookup.semt IS NOT NULL
  ORDER BY address_lookup.semt;
$$;

GRANT EXECUTE ON FUNCTION public.get_distinct_cities() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_distinct_districts(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_distinct_semts(text, text) TO anon, authenticated, service_role;

CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.get_my_role() = 'admin');
CREATE POLICY "Users update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.get_my_role() = 'admin')
  WITH CHECK (auth.uid() = id OR public.get_my_role() = 'admin');

CREATE POLICY "Products are publicly readable" ON public.products
  FOR SELECT USING (true);
CREATE POLICY "Farmers create their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = farmer_id OR public.get_my_role() = 'admin');
CREATE POLICY "Farmers update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = farmer_id OR public.get_my_role() = 'admin')
  WITH CHECK (auth.uid() = farmer_id OR public.get_my_role() = 'admin');
CREATE POLICY "Farmers delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = farmer_id OR public.get_my_role() = 'admin');

CREATE POLICY "Buyers view their orders" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id OR public.farmer_owns_order(id, auth.uid()) OR public.get_my_role() = 'admin');
CREATE POLICY "Buyers create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Order owners update status" ON public.orders
  FOR UPDATE USING (auth.uid() = buyer_id OR public.farmer_owns_order(id, auth.uid()) OR public.get_my_role() = 'admin')
  WITH CHECK (auth.uid() = buyer_id OR public.farmer_owns_order(id, auth.uid()) OR public.get_my_role() = 'admin');

CREATE POLICY "Order participants view items" ON public.order_items
  FOR SELECT USING (auth.uid() = farmer_id OR public.buyer_owns_order(order_id, auth.uid()) OR public.get_my_role() = 'admin');
CREATE POLICY "Buyers create order items" ON public.order_items
  FOR INSERT WITH CHECK (public.buyer_owns_order(order_id, auth.uid()));

CREATE POLICY "Reviews are publicly readable" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Consumers create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers update reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers or admins delete reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = reviewer_id OR public.get_my_role() = 'admin');

CREATE POLICY "Address lookup is public" ON public.address_lookup
  FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF public.get_my_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete accounts.';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Admins cannot delete their own account from this panel.';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, address, location_lat, location_lng)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'consumer'),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'address',
    NULLIF(NEW.raw_user_meta_data ->> 'location_lat', '')::numeric,
    NULLIF(NEW.raw_user_meta_data ->> 'location_lng', '')::numeric
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    address = COALESCE(EXCLUDED.address, profiles.address),
    location_lat = COALESCE(EXCLUDED.location_lat, profiles.location_lat),
    location_lng = COALESCE(EXCLUDED.location_lng, profiles.location_lng);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.reduce_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE PROCEDURE public.reduce_stock_on_order();

CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status NOT IN ('cancelled', 'canceled') AND NEW.status IN ('cancelled', 'canceled') THEN
    UPDATE public.products p
    SET stock_quantity = p.stock_quantity + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.restore_stock_on_cancel();

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "Authenticated users can update images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
