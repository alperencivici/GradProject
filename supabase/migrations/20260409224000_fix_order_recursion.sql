-- ============================================================
-- FIX: Orders ↔ Order_Items circular RLS dependency
-- The farmer SELECT/UPDATE policies on `orders` use
--   EXISTS(SELECT 1 FROM order_items WHERE ...)
-- But order_items SELECT policies use
--   EXISTS(SELECT 1 FROM orders WHERE ...)
-- This creates infinite recursion.
-- 
-- SOLUTION: Use a SECURITY DEFINER function that bypasses RLS
-- to check if a farmer has items in a given order.
-- ============================================================

-- Create function to check farmer order ownership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.farmer_owns_order(p_order_id uuid, p_farmer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM order_items
    WHERE order_items.order_id = p_order_id
    AND order_items.farmer_id = p_farmer_id
  );
$$;

-- Create function to check buyer order ownership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.buyer_owns_order(p_order_id uuid, p_buyer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = p_order_id
    AND orders.buyer_id = p_buyer_id
  );
$$;

-- Drop the broken farmer/admin order policies
DROP POLICY IF EXISTS "Farmers can view orders containing their products" ON orders;
DROP POLICY IF EXISTS "Farmers can update orders containing their products" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Recreate with SECURITY DEFINER functions (no recursion)
CREATE POLICY "Farmers can view their orders" ON orders FOR SELECT USING (
    public.farmer_owns_order(id, auth.uid())
);
CREATE POLICY "Farmers can update their orders" ON orders FOR UPDATE USING (
    public.farmer_owns_order(id, auth.uid())
);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
    public.get_my_role() = 'admin'
);
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (
    public.get_my_role() = 'admin'
);

-- Fix order_items: also use SECURITY DEFINER to avoid recursion
DROP POLICY IF EXISTS "Buyers can view their own order items." ON order_items;
CREATE POLICY "Buyers can view their own order items" ON order_items FOR SELECT USING (
    public.buyer_owns_order(order_id, auth.uid())
);

-- Drop old buyer insert policy and recreate with function
DROP POLICY IF EXISTS "Buyers can create order items." ON order_items;
CREATE POLICY "Buyers can create order items" ON order_items FOR INSERT WITH CHECK (
    public.buyer_owns_order(order_id, auth.uid())
);

-- Also fix: original "Users can update own profile" may be too restrictive
-- The original policy only allows auth.uid() = id.
-- We already added admin policy via get_my_role(), but let's ensure the 
-- original update policy still works
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (
    auth.uid() = id
);

-- Ensure farmer product policies are clean
DROP POLICY IF EXISTS "Farmers can update their own products." ON products;
CREATE POLICY "Farmers can update their own products" ON products FOR UPDATE USING (
    auth.uid() = farmer_id
);

DROP POLICY IF EXISTS "Farmers can delete their own products." ON products;
CREATE POLICY "Farmers can delete their own products" ON products FOR DELETE USING (
    auth.uid() = farmer_id
);
