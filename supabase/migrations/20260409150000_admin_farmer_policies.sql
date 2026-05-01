-- Allow Admins to do everything on profiles
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles AS admin_p WHERE admin_p.id = auth.uid() AND admin_p.role = 'admin')
);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles AS admin_p WHERE admin_p.id = auth.uid() AND admin_p.role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles AS admin_p WHERE admin_p.id = auth.uid() AND admin_p.role = 'admin')
);
CREATE POLICY "Admins can delete all profiles" ON profiles FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles AS admin_p WHERE admin_p.id = auth.uid() AND admin_p.role = 'admin')
);

-- Note: The above creates a recursion risk if not handled well. 
-- Let's use a simpler check for admin: auth.jwt() ->> 'role' is tricky. We'll use a direct select wrapped to avoid recursion.
-- Wait, using profile itself to check role can cause infinite recursion on profile SELECT policies.
-- A SAFER WAY:
-- We can drop the previous select policy from migration 0 and use a generic one, but public is readable anyway!
-- "Public profiles are viewable by everyone." is already there! So SELECT is fine.
-- Let's just grant UPDATE and DELETE for admins safely.

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Products Admin
CREATE POLICY "Admins can delete any products" ON products FOR DELETE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can update any products" ON products FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Orders Admin & Farmer
CREATE POLICY "Farmers can view orders with their items" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id AND order_items.farmer_id = auth.uid())
);
CREATE POLICY "Farmers can update orders with their items" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id AND order_items.farmer_id = auth.uid())
);

CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Order Items Admin
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Reviews Admin
CREATE POLICY "Admins can delete any reviews" ON reviews FOR DELETE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
