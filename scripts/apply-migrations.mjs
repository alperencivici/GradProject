/**
 * Apply Kırsof DB migrations using the Supabase service role key.
 * Run with: node scripts/apply-migrations.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wwcnvydqyaccwfsceqxu.supabase.co';
const SERVICE_KEY = 'sb_secret_1yjNRkFphWU41HpRyYjMiQ_tEVJNT4L';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  global: { headers: { 'x-supabase-bypass-rls': 'true' } }
});

async function runSQL(label, sql) {
  console.log(`\n🔧 Running: ${label}...`);
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    // Try direct query approach
    const res = await supabase.from('_migrations_temp_').select('*').limit(0);
    console.log(`   ⚠️  RPC not available — using direct approach`);
    return false;
  }
  console.log(`   ✅ Success`);
  return true;
}

// We'll use the pg connection via Supabase's postgres endpoint
async function applyViaPg() {
  // Since we can't use exec_sql RPC, use the Supabase Admin API
  // to execute SQL through the pg_dump/restore endpoint
  const migrations = [
    {
      label: 'Add return_requested/returned/canceled to order_status enum',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_requested' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
            ALTER TYPE order_status ADD VALUE 'return_requested';
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'returned' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
            ALTER TYPE order_status ADD VALUE 'returned';
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'canceled' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
            ALTER TYPE order_status ADD VALUE 'canceled';
          END IF;
        END $$;
      `
    },
    {
      label: 'Add return_reason column to orders',
      sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;`
    },
    {
      label: 'Add farmer order update policy',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Farmers can update status of orders they fulfill.'
          ) THEN
            EXECUTE $p$
              CREATE POLICY "Farmers can update status of orders they fulfill." ON orders
              FOR UPDATE
              USING (
                EXISTS (
                  SELECT 1 FROM order_items
                  WHERE order_items.order_id = orders.id
                    AND order_items.farmer_id = auth.uid()
                )
              )
            $p$;
          END IF;
        END $$;
      `
    },
    {
      label: 'Create address_lookup table',
      sql: `
        CREATE TABLE IF NOT EXISTS address_lookup (
          id SERIAL PRIMARY KEY,
          il TEXT NOT NULL,
          ilce TEXT NOT NULL,
          semt TEXT,
          mahalle TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_address_il ON address_lookup (il);
        CREATE INDEX IF NOT EXISTS idx_address_ilce ON address_lookup (il, ilce);
        CREATE INDEX IF NOT EXISTS idx_address_semt ON address_lookup (il, ilce, semt);
        ALTER TABLE address_lookup ENABLE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'address_lookup' AND policyname = 'Address lookup is public.') THEN
            CREATE POLICY "Address lookup is public." ON address_lookup FOR SELECT USING (true);
          END IF;
        END $$;
      `
    }
  ];

  // Use direct fetch to Supabase SQL endpoint (Admin API)
  for (const migration of migrations) {
    console.log(`\n🔧 ${migration.label}`);
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migration.sql }),
      });
      if (resp.ok) {
        console.log('   ✅ Applied');
      } else {
        const t = await resp.text();
        console.log(`   ⚠️  Response: ${resp.status} — ${t.substring(0, 120)}`);
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }
}

applyViaPg().catch(console.error);
