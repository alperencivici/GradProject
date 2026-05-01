-- ============================================================
-- FIX: Remove all recursive admin policies on profiles
-- The previous migration created policies that query profiles
-- from within profiles policies, causing infinite recursion.
-- ============================================================

-- 1. Drop ALL the broken admin policies from the previous migration
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

-- 2. Recreate admin UPDATE policy on profiles using auth.jwt()
--    auth.jwt() reads from the JWT token directly and does NOT
--    query the profiles table, so there is zero recursion risk.
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
    (auth.jwt() ->> 'role') = 'service_role'
    OR auth.uid() = id
    OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Wait — the above still has recursion potential on the EXISTS.
-- The SAFE approach for profiles: use a security-definer function.

-- Drop it again and use a proper function approach
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

-- Now recreate admin policies using the function (no recursion since SECURITY DEFINER bypasses RLS)
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
    auth.uid() = id OR public.get_my_role() = 'admin'
);

-- Products: drop duplicates first, then recreate
DROP POLICY IF EXISTS "Admins can delete any products" ON products;
DROP POLICY IF EXISTS "Admins can update any products" ON products;

CREATE POLICY "Admins can delete any products" ON products FOR DELETE USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins can update any products" ON products FOR UPDATE USING (
    auth.uid() = farmer_id OR public.get_my_role() = 'admin'
);

-- Orders: drop duplicates first
DROP POLICY IF EXISTS "Farmers can view orders with their items" ON orders;
DROP POLICY IF EXISTS "Farmers can update orders with their items" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

CREATE POLICY "Farmers can view orders containing their products" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id AND order_items.farmer_id = auth.uid())
);
CREATE POLICY "Farmers can update orders containing their products" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id AND order_items.farmer_id = auth.uid())
);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (public.get_my_role() = 'admin');

-- Order items: drop duplicates
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (public.get_my_role() = 'admin');

-- Reviews: drop duplicates
DROP POLICY IF EXISTS "Admins can delete any reviews" ON reviews;
CREATE POLICY "Admins can delete any reviews" ON reviews FOR DELETE USING (public.get_my_role() = 'admin');
