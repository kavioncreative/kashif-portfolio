
-- ==========================================
-- CREATE PORTFOLIO-PREVIEWS BUCKET
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-previews', 'portfolio-previews', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Storage Policies for the new bucket
-- These match the security model of the portfolio-images bucket

-- Allow public to VIEW preview images
CREATE POLICY "Public Access Previews"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolio-previews' );

-- Allow authenticated users to UPLOAD previews
CREATE POLICY "Auth Upload Previews"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'portfolio-previews' );

-- Allow authenticated users to UPDATE previews
CREATE POLICY "Auth Update Previews"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'portfolio-previews' );

-- Allow authenticated users to DELETE previews
CREATE POLICY "Auth Delete Previews"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'portfolio-previews' );
