-- 1. Create the bucket 'site-assets' if it doesn't exist
-- We use insert ... on conflict to handle idempotency.
-- 'public' = true allows public URLs to work without signed tokens.
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

-- 2. Enable RLS on objects (usually enabled by default, but good to be sure)
-- (No command needed, applied to table storage.objects)

-- 3. Policy: Public Read Access
-- Allow anyone (anon + authenticated) to SELECT objects in 'site-assets'
create policy "Public Read Site Assets"
on storage.objects for select
using ( bucket_id = 'site-assets' );

-- 4. Policy: Authenticated Upload/Upsert Access
-- Allow any authenticated user to INSERT (upload) objects to 'site-assets'
create policy "Authenticated Upload Site Assets"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'site-assets' );

-- 5. Policy: Authenticated Update Access (for overwrites/upserts)
create policy "Authenticated Update Site Assets"
on storage.objects for update
to authenticated
using ( bucket_id = 'site-assets' );

-- 6. Policy: Authenticated Delete (optional, but useful for cleanup)
create policy "Authenticated Delete Site Assets"
on storage.objects for delete
to authenticated
using ( bucket_id = 'site-assets' );
