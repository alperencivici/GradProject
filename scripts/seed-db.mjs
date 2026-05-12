/**
 * Execute seed.sql against Supabase Postgres.
 * Run with: $env:DB_URL="postgresql://postgres.wwcnvydqyaccwfsceqxu:wine-east-owner@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"; node scripts/seed-db.mjs
 */
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_URL = process.env.DB_URL;
if (!DB_URL) {
  console.error('❌ Set DB_URL env var.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const client = await pool.connect();
  console.log('✅ Connected to Supabase Postgres');

  const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  console.log('⏳ Running seed.sql (This will wipe all data and create 3 test accounts)...');
  
  try {
    // Run the whole script. Note: pg library doesn't support multiple statements in one query() 
    // unless they are simple. For complex stuff, we might need to split.
    // However, for TRUNCATE and INSERT it usually works if separated by semicolons.
    await client.query(sql);
    console.log('🎉 Seed successful! Database is now clean with 3 test accounts.');
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
    if (e.message.includes('gen_salt')) {
        console.log('💡 Tip: Make sure pgcrypto extension is enabled in your Supabase DB.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
