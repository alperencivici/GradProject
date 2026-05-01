/**
 * Import Turkish address data from data.txt into Supabase address_lookup table.
 * Run with: node scripts/import-address-data.mjs
 * 
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (use service role to bypass RLS for bulk insert)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  env.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const DATA_FILE = path.join(__dirname, '..', 'data.txt');
const BATCH_SIZE = 500;

function trim(s) {
  return s ? s.trim() : '';
}

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/(?:^|[\s\-])(\S)/g, c => c.toUpperCase())
    .trim();
}

async function main() {
  console.log('📂 Reading data.txt...');
  const content = fs.readFileSync(DATA_FILE, 'utf-8');

  console.log('🔍 Parsing SQL INSERT statements...');
  // Match VALUES blocks: ('IL', 'ILCE', 'SEMT', 'MAHALLE', PK)
  const regex = /VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*[\d.]+\s*\)/g;
  
  const rows = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const il = toTitleCase(trim(match[1]));
    const ilce = toTitleCase(trim(match[2]));
    const semt = toTitleCase(trim(match[3]));
    const mahalle = toTitleCase(trim(match[4]));
    rows.push({ il, ilce, semt, mahalle });
  }

  console.log(`✅ Parsed ${rows.length} address records`);

  // Clear existing data
  console.log('🗑️  Clearing existing address_lookup data...');
  const { error: delError } = await supabase.from('address_lookup').delete().gte('id', 0);
  if (delError) {
    console.warn('⚠️  Could not clear table (may be empty):', delError.message);
  }

  // Insert in batches
  console.log(`📤 Uploading in batches of ${BATCH_SIZE}...`);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('address_lookup').insert(batch);
    if (error) {
      console.error(`❌ Error at batch ${i / BATCH_SIZE + 1}:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r   Progress: ${inserted}/${rows.length} rows`);
  }

  console.log(`\n\n🎉 Done! Imported ${inserted} address records into address_lookup.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
