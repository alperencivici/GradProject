-- ============================================================
-- KIRSTOF SEED FILE (RUN LAST — WIPES ALL EXISTING DATA)
-- ============================================================
-- Step 1: Run this in Supabase SQL Editor
-- Step 2: It will TRUNCATE all data tables
-- Step 3: Insert 3 test accounts via auth.users + profiles
-- Password for all 3 accounts: Password123!
-- ============================================================

-- Wipe all application data (in correct FK order)
TRUNCATE TABLE reviews RESTART IDENTITY CASCADE;
TRUNCATE TABLE order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;
TRUNCATE TABLE profiles RESTART IDENTITY CASCADE;
DELETE FROM auth.users;

-- ============================================================
-- Insert test users into auth.users
-- ============================================================

-- 1) Admin
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@kirsof.com',crypt('Password123!', gen_salt('bf')),NOW(),NOW(),NOW(),'{"full_name":"Admin User","role":"admin"}'::jsonb,false,'','','');

-- 2) Farmer
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new)
VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','farmer@kirsof.com',crypt('Password123!', gen_salt('bf')),NOW(),NOW(),NOW(),'{"full_name":"Ali Ciftci","role":"farmer"}'::jsonb,false,'','','');

-- 3) Consumer
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new)
VALUES ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','consumer@kirsof.com',crypt('Password123!', gen_salt('bf')),NOW(),NOW(),NOW(),'{"full_name":"Ayse Tuketici","role":"consumer"}'::jsonb,false,'','','');

-- ============================================================
-- Insert matching public profiles
-- ============================================================
INSERT INTO public.profiles (id, full_name, role, phone, address, location_lat, location_lng, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User',    'admin',    '+905001234567', 'Ankara, Cankaya',    39.9334, 32.8597, NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Ali Ciftci',    'farmer',   '+905001234568', 'Izmir, Kemalpasa',   38.4189, 27.1287, NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Ayse Tuketici', 'consumer', '+905001234569', 'Istanbul, Kadikoy',  40.9833, 29.0300, NOW());
