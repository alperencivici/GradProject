/**
 * Apply Kırsof DB migrations directly via pg (Postgres).
 * Run with: node scripts/migrate.mjs
 * 
 * You need to set DB_PASSWORD in your environment first.
 * Find it in: Supabase Dashboard -> Settings -> Database -> Database password
 */
import pkg from 'pg';
const { Client } = pkg;

// Connection string from supabase/.temp/pooler-url
// Replace [YOUR-DB-PASSWORD] with your actual database password
const DB_URL = process.env.DB_URL || 
  `postgresql://postgres.wwcnvydqyaccwfsceqxu:${process.env.DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;

const MIGRATIONS = [
  {
    name: 'Add return_requested enum value',
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_requested' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE 'return_requested';
      END IF;
    END $$;`,
  },
  {
    name: 'Add returned enum value',
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'returned' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE 'returned';
      END IF;
    END $$;`,
  },
  {
    name: 'Add canceled enum value',
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'canceled' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE 'canceled';
      END IF;
    END $$;`,
  },
  {
    name: 'Add return_reason column',
    sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;`,
  },
  {
    name: 'Add farmer order update RLS policy',
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Farmers can update status of orders they fulfill.') THEN
        CREATE POLICY "Farmers can update status of orders they fulfill." ON orders
        FOR UPDATE USING (
          EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id AND order_items.farmer_id = auth.uid())
        );
      END IF;
    END $$;`,
  },
  {
    name: 'Create address_lookup table',
    sql: `CREATE TABLE IF NOT EXISTS address_lookup (
      id SERIAL PRIMARY KEY,
      il TEXT NOT NULL,
      ilce TEXT NOT NULL,
      semt TEXT,
      mahalle TEXT
    );`,
  },
  {
    name: 'Create address_lookup indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_address_il ON address_lookup (il);
      CREATE INDEX IF NOT EXISTS idx_address_ilce ON address_lookup (il, ilce);
      CREATE INDEX IF NOT EXISTS idx_address_semt ON address_lookup (il, ilce, semt);
    `,
  },
  {
    name: 'Enable RLS on address_lookup',
    sql: `ALTER TABLE address_lookup ENABLE ROW LEVEL SECURITY;`,
  },
  {
    name: 'Create address_lookup public read policy',
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'address_lookup' AND policyname = 'Address lookup is public.') THEN
        CREATE POLICY "Address lookup is public." ON address_lookup FOR SELECT USING (true);
      END IF;
    END $$;`,
  },
];

async function main() {
  if (!process.env.DB_PASSWORD && !process.env.DB_URL) {
    console.error('❌ Set DB_PASSWORD env var with your Supabase database password.');
    console.error('   Find it: Supabase Dashboard -> Settings -> Database -> Database password');
    process.exit(1);
  }

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  
  console.log('🔌 Connecting to Supabase Postgres...');
  await client.connect();
  console.log('✅ Connected!\n');

  for (const migration of MIGRATIONS) {
    try {
      process.stdout.write(`🔧 ${migration.name}... `);
      await client.query(migration.sql);
      console.log('✅');
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
  }

  await client.end();
  console.log('\n🎉 Migrations complete!');
}

main().catch(err => { console.error(err); process.exit(1); });
