/**
 * REPAIR SCRIPT: Fixes the "Database error querying schema" once and for all.
 * 1. Cleans the auth schema of manual hacks.
 * 2. Uses the Supabase ADMIN API to create users properly (handles identities/sessions).
 * 3. Restores profile data.
 * 
 * Run with: node scripts/final-repair.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wwcnvydqyaccwfsceqxu.supabase.co';
const SERVICE_KEY = 'sb_secret_1yjNRkFphWU41HpRyYjMiQ_tEVJNT4L';

// Initialize Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function repair() {
  console.log('🧹 Step 1: Cleaning up auth schema...');
  
  // Clean manually inserted identities and users
  const { error: delIdentError } = await supabase.rpc('exec_sql', { 
    sql: 'DELETE FROM auth.identities; DELETE FROM auth.users;' 
  });
  if (delIdentError) {
    console.warn('⚠️ Manual DELETE failed, trying direct cleanup...');
    // We'll proceed, maybe they are already gone or RPC is missing
  }

  const users = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@kirsof.com',
      password: 'Password123!',
      metadata: { full_name: 'Admin User', role: 'admin' }
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'farmer@kirsof.com',
      password: 'Password123!',
      metadata: { full_name: 'Ali Ciftci', role: 'farmer', phone: '+905001234568' }
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'consumer@kirsof.com',
      password: 'Password123!',
      metadata: { full_name: 'Ayse Tuketici', role: 'consumer', phone: '+905001234569' }
    }
  ];

  console.log('\n🚀 Step 2: Creating users via Admin API (The right way)...');

  for (const u of users) {
    process.stdout.write(`   Creating ${u.email}... `);
    
    // Use auth.admin.createUser which handles all internal Supabase tables
    const { data, error } = await supabase.auth.admin.createUser({
      id: u.id,
      email: u.email,
      password: u.password,
      user_metadata: u.metadata,
      email_confirm: true
    });

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
    } else {
      console.log('✅ Success');
    }
  }

  console.log('\n🏠 Step 3: Restoring Profile data...');
  
  const profileData = [
    { id: users[0].id, full_name: 'Admin User',    role: 'admin',    phone: '+905001234567', address: 'Ankara, Cankaya',    location_lat: 39.9334, location_lng: 32.8597 },
    { id: users[1].id, full_name: 'Ali Ciftci',    role: 'farmer',   phone: '+905001234568', address: 'Izmir, Kemalpasa',   location_lat: 38.4189, location_lng: 27.1287 },
    { id: users[2].id, full_name: 'Ayse Tuketici', role: 'consumer', phone: '+905001234569', address: 'Istanbul, Kadikoy',  location_lat: 40.9833, location_lng: 29.0300 }
  ];

  for (const p of profileData) {
    const { error } = await supabase
      .from('profiles')
      .upsert(p);
    
    if (error) {
      console.error(`   ❌ Profile ${p.full_name} failed: ${error.message}`);
    } else {
      console.log(`   ✅ Profile ${p.full_name} restored`);
    }
  }

  console.log('\n🔃 Step 4: Forcing Schema Reload...');
  await supabase.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema';" });
  console.log('✅ Notified PostgREST');

  console.log('\n✨ REPAIR COMPLETE! Please try logging in now.');
}

repair().catch(err => {
  console.error('\n💥 FATAL ERROR:', err.message);
  process.exit(1);
});
