
-- Run this in your Supabase SQL Editor

-- 1. Create Tables
create table if not exists portfolios (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  thumbnail_settings jsonb default '{"zoom": 1, "x": 0, "y": 0}',
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists portfolio_images (
  id uuid default gen_random_uuid() primary key,
  portfolio_id uuid references portfolios(id) on delete cascade not null,
  url text not null,
  width int,
  height int,
  sort_order int default 0,
  is_preview boolean default false,
  preview_image_url text,
  preview_settings jsonb default '{}'::jsonb,
  thumbnail_settings jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table portfolios enable row level security;
alter table portfolio_images enable row level security;

-- 3. Create Policies (SECURE)
-- Portfolios
create policy "Public Read Portfolios" on portfolios for select using (true);
create policy "Auth Write Portfolios" on portfolios for insert to authenticated with check (true);
create policy "Auth Update Portfolios" on portfolios for update to authenticated using (true);
create policy "Auth Delete Portfolios" on portfolios for delete to authenticated using (true);

-- Portfolio Images
create policy "Public Read Images" on portfolio_images for select using (true);
create policy "Auth Write Images" on portfolio_images for insert to authenticated with check (true);
create policy "Auth Update Images" on portfolio_images for update to authenticated using (true);
create policy "Auth Delete Images" on portfolio_images for delete to authenticated using (true);

-- 4. Storage Bucket & Policies (SECURE)
-- Create buckets if needed
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('portfolio-previews', 'portfolio-previews', true)
on conflict (id) do nothing;


-- Storage Policies
-- Allow public read access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'portfolio-images' );

-- Allow authenticated upload
create policy "Auth Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'portfolio-images' );

-- Allow authenticated update
create policy "Auth Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'portfolio-images' );

-- Allow authenticated delete
create policy "Auth Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'portfolio-images' );

-- Enable RLS on objects (Usually enabled by default. If not, you might need superuser permissions)
-- alter table storage.objects enable row level security;

-- Policies for 'portfolio-images' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'portfolio-images' );

create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'portfolio-images' );

create policy "Public Update"
on storage.objects for update
using ( bucket_id = 'portfolio-images' );

create policy "Public Delete"
on storage.objects for delete
using ( bucket_id = 'portfolio-images' );
