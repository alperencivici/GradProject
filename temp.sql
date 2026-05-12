-- Add return_requested and returned to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_requested';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'canceled';

-- Add return_reason column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;

-- Update RLS: farmers must be able to update order status for their own order items
-- We add a new policy so farmer can update the order status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Farmers can update status of orders they fulfill.'
  ) THEN
    CREATE POLICY "Farmers can update status of orders they fulfill." ON orders
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM order_items
          WHERE order_items.order_id = orders.id
            AND order_items.farmer_id = auth.uid()
        )
      );
  END IF;
END $$;
