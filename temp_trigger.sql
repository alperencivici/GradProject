-- =============================================
-- 1. PROFILE AUTO-CREATION TRIGGER
-- Automatically creates a profile row when a
-- new user signs up via Supabase Auth.
-- This eliminates the need for client-side
-- profile INSERT (which fails under RLS).
-- =============================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'consumer'),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  RETURN NEW;
END;
$$;

-- Drop any existing trigger with the same name
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- 2. STOCK REDUCTION TRIGGER
-- Automatically decrements product stock when
-- order_items are inserted.
-- =============================================

CREATE OR REPLACE FUNCTION public.reduce_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_item_created ON order_items;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE PROCEDURE public.reduce_stock_on_order();

-- =============================================
-- 3. STOCK RESTORATION ON CANCELLATION
-- Restore stock when an order is cancelled.
-- =============================================

CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE products p
    SET stock_quantity = p.stock_quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_cancelled ON orders;

CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE public.restore_stock_on_cancel();
