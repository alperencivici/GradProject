-- Fresh Kirsof seed data. This intentionally wipes app/auth data.
-- Password for all accounts: Password123!

TRUNCATE TABLE public.reviews RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.products RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.address_lookup RESTART IDENTITY CASCADE;
DELETE FROM auth.users;

INSERT INTO public.address_lookup (il, ilce, semt, mahalle)
VALUES
  ('Ankara', 'Cankaya', 'Kizilay', 'Mesrutiyet'),
  ('Ankara', 'Cankaya', 'Bahcelievler', 'Emek'),
  ('Istanbul', 'Kadikoy', 'Moda', 'Caferaga'),
  ('Istanbul', 'Kadikoy', 'Fenerbahce', 'Fenerbahce'),
  ('Izmir', 'Kemalpasa', 'Merkez', 'Ataturk'),
  ('Izmir', 'Kemalpasa', 'Armutlu', 'Armutlu');

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@kirsof.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name":"Admin User","role":"admin","phone":"+905001234567","address":"Ankara, Cankaya","location_lat":"39.9334","location_lng":"32.8597"}'::jsonb,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'farmer@kirsof.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name":"Ali Farmer","role":"farmer","phone":"+905001234568","address":"Izmir, Kemalpasa","location_lat":"38.4189","location_lng":"27.1287"}'::jsonb,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'consumer@kirsof.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name":"Ayse Consumer","role":"consumer","phone":"+905001234569","address":"Istanbul, Kadikoy","location_lat":"40.9833","location_lng":"29.0300"}'::jsonb,
    false
  );

INSERT INTO public.products (farmer_id, name, description, price, stock_quantity, category, image_url)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Organic Tomatoes', 'Fresh greenhouse tomatoes harvested this week.', 35.00, 80, 'vegetables', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Village Eggs', 'Free range eggs from a small family farm.', 70.00, 40, 'eggs', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Raw Honey', 'Unfiltered local flower honey.', 180.00, 25, 'honey', NULL);
