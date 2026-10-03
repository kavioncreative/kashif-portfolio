-- Create site_settings table
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  hero_image_url text null,
  updated_at timestamptz not null default now(),
  constraint site_settings_owner_id_key unique (owner_id)
);

-- Enable RLS (Best Practice)
alter table public.site_settings enable row level security;

-- Policies
create policy "Public Read Site Settings"
  on public.site_settings for select
  using (true);

create policy "Owner Update Site Settings"
  on public.site_settings for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "Owner Insert Site Settings"
  on public.site_settings for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- Create updated_at function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add Trigger
create trigger handle_site_settings_updated_at
  before update on public.site_settings
  for each row
  execute procedure public.handle_updated_at();
