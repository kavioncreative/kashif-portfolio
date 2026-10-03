-- 1. Enforce owner_id cannot be null
-- (Requires backfilling existing nulls first if data exists)
-- update public.portfolios set owner_id = auth.uid() where owner_id is null; -- This query works if run by user. 
-- For migration safety assuming table is empty or backfilled:
alter table public.portfolios 
alter column owner_id set not null;

-- 2. Confirm default is removed (optional, strictness)
-- Removing default ensures the frontend/API MUST explicitly provide the owner_id,
-- preventing accidental "auth.uid()" usage if logic is flawed. 
-- However, having default auth.uid() is actually safer for RLS. 
-- Recommendation: Keep default auth.uid() as fallback, but rely on frontend to send it.

-- 3. Prevent Anonymous Inserts via RLS
-- Existing policy "Auth Write Portfolios" allows "authenticated" role.
-- Ensure we enforce owner_id matches auth.uid() on insert.
drop policy if exists "Auth Write Portfolios" on public.portfolios;

create policy "Auth Insert Portfolios"
on public.portfolios for insert
to authenticated
with check (
  auth.uid() = owner_id
);

-- 4. Ensure foreign key exists (idempotent)
-- (Already added in previous step, but for completeness)
-- alter table public.portfolios 
-- add constraint portfolios_owner_id_fkey 
-- foreign key (owner_id) references auth.users(id) on delete cascade;
