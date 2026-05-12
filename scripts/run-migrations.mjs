/**
 * Apply DB migrations using Supabase postgres connection via node-postgres.
 * This script uses the direct postgres URL (not REST API).
 * 
 * Usage: $env:DB_URL="postgresql://postgres.wwcnvydqyaccwfsceqxu:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"; node scripts/run-migrations.mjs
 * 
 * Get your database password from:
 * Supabase Dashboard → Project Settings → Database → Database password → "Reset" to see it
 */
import pkg from 'pg';
const { Pool } = pkg;

const DB_URL = process.env.DB_URL;
if (!DB_URL || DB_URL.includes('[PASSWORD]')) {
  console.error('\n❌ Please set DB_URL with your database password.\n');
  console.error('Example:');
  console.error('  $env:DB_URL="postgresql://postgres.wwcnvydqyaccwfsceqxu:YOUR_PASS@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"');
  console.error('  node scripts/run-migrations.mjs\n');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

const STEPS = [
  ['Add return_requested to order_status',
   `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='return_requested' AND enumtypid=(SELECT oid FROM pg_type WHERE typname='order_status')) THEN ALTER TYPE order_status ADD VALUE 'return_requested'; END IF; END $$;`],
  ['Add returned to order_status',
   `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='returned' AND enumtypid=(SELECT oid FROM pg_type WHERE typname='order_status')) THEN ALTER TYPE order_status ADD VALUE 'returned'; END IF; END $$;`],
  ['Add canceled to order_status',
   `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='canceled' AND enumtypid=(SELECT oid FROM pg_type WHERE typname='order_status')) THEN ALTER TYPE order_status ADD VALUE 'canceled'; END IF; END $$;`],
  ['Add return_reason column to orders',
   `ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;`],
  ['Add farmer order-update RLS policy',
   `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Farmers can update status of orders they fulfill.') THEN CREATE POLICY "Farmers can update status of orders they fulfill." ON orders FOR UPDATE USING (EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id=orders.id AND order_items.farmer_id=auth.uid())); END IF; END $$;`],
  ['Create address_lookup table',
   `CREATE TABLE IF NOT EXISTS address_lookup (id SERIAL PRIMARY KEY, il TEXT NOT NULL, ilce TEXT NOT NULL, semt TEXT, mahalle TEXT);`],
  ['Index: il',
   `CREATE INDEX IF NOT EXISTS idx_address_il ON address_lookup(il);`],
  ['Index: ilce',
   `CREATE INDEX IF NOT EXISTS idx_address_ilce ON address_lookup(il, ilce);`],
  ['Index: semt',
   `CREATE INDEX IF NOT EXISTS idx_address_semt ON address_lookup(il, ilce, semt);`],
  ['Enable RLS on address_lookup',
   `ALTER TABLE address_lookup ENABLE ROW LEVEL SECURITY;`],
  ['Public read policy on address_lookup',
   `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='address_lookup' AND policyname='Address lookup is public.') THEN CREATE POLICY "Address lookup is public." ON address_lookup FOR SELECT USING (true); END IF; END $$;`],
];

async function main() {
  const client = await pool.connect();
  console.log('✅ Connected to Supabase Postgres\n');

  let ok = 0;
  for (const [name, sql] of STEPS) {
    try {
      await client.query(sql);
      console.log(`✅ ${name}`);
      ok++;
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
    }
  }

  client.release();
  await pool.end();
  console.log(`\n🎉 Done: ${ok}/${STEPS.length} migrations applied`);
}

main().catch(e => { console.error(e); process.exit(1); });
