-- ==========================================
-- SECURE AUTH PATCH (FIXED)
-- Run this in Supabase SQL Editor to secure your app
-- ==========================================

-- 1. Drop existing permissive policies (Cleanup)
-- Portfolios
drop policy if exists "Public Read Portfolios" on portfolios;
drop policy if exists "Public Write Portfolios" on portfolios;
drop policy if exists "Public Write Portfolios Update" on portfolios;
drop policy if exists "Public Write Portfolios Delete" on portfolios;

-- Images
drop policy if exists "Public Read Images" on portfolio_images;
drop policy if exists "Public Write Images" on portfolio_images;
drop policy if exists "Public Write Images Update" on portfolio_images;
drop policy if exists "Public Write Images Delete" on portfolio_images;

-- Storage (Drop potential old public policies)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Public Update" on storage.objects;
drop policy if exists "Public Delete" on storage.objects;

-- 2. Create Secure Policies
-- PORTFOLIOS: Public Read, Auth Write
create policy "Public Read Portfolios" on portfolios for select using (true);
create policy "Auth Write Portfolios" on portfolios for insert to authenticated with check (true);
create policy "Auth Update Portfolios" on portfolios for update to authenticated using (true);
create policy "Auth Delete Portfolios" on portfolios for delete to authenticated using (true);

-- PORTFOLIO_IMAGES: Public Read, Auth Write
create policy "Public Read Images" on portfolio_images for select using (true);
create policy "Auth Write Images" on portfolio_images for insert to authenticated with check (true);
create policy "Auth Update Images" on portfolio_images for update to authenticated using (true);
create policy "Auth Delete Images" on portfolio_images for delete to authenticated using (true);

-- STORAGE: Public Read, Auth Write
-- Note: we skip 'alter table storage.objects enable row level security' as it requires superuser

-- Allow public to VIEW images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'portfolio-images' );

-- Allow authenticated users to UPLOAD
create policy "Auth Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'portfolio-images' );

-- Allow authenticated users to UPDATE
create policy "Auth Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'portfolio-images' );

-- Allow authenticated users to DELETE
create policy "Auth Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'portfolio-images' );
