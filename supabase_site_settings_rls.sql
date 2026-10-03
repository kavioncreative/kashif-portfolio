-- Enable Row Level Security
alter table public.site_settings enable row level security;

-- Policy 1: Public can SELECT
-- Any user (anon or authenticated) can read site settings
create policy "Public Read Site Settings"
  on public.site_settings for select
  using (true);

-- Policy 2: Authenticated owner can INSERT
-- Ensures a user can only insert a row where the owner_id matches their own ID
create policy "Owner Insert Site Settings"
  on public.site_settings for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- Policy 3: Authenticated owner can UPDATE
-- Ensures a user can only update rows where they are the owner
create policy "Owner Update Site Settings"
  on public.site_settings for update
  to authenticated
  using (auth.uid() = owner_id);
