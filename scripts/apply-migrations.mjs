/**
 * Apply Kirsof DB migrations using Supabase credentials from the environment.
 * Run with: node scripts/apply-migrations.mjs
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

function requireEnv(names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  console.error(`Missing required environment variable: ${names.join(' or ')}`);
  process.exit(1);
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

const SUPABASE_URL = requireEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']);
const SERVICE_KEY = requireEnv(['SUPABASE_SERVICE_ROLE_KEY']);

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
