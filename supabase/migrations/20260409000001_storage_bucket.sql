-- SQL to securely deploy "images" storage bucket in Supabase

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- 3. Policy: Allow public to VIEW (SELECT) objects in the "images" bucket
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- 4. Policy: Allow ONLY Authenticated users to INSERT objects into the "images" bucket
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'images' );
