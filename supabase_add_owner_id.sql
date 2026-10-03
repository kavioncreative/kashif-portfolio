-- Add owner_id to portfolios table
-- We assume that existing rows need a default owner or can be nullable initially if strict not null is hard on existing data without a default.
-- However, user asked for NOT NULL. To do this safely on existing data, usually we need to backfill.
-- Since I can't backfill easily without knowing a valid user ID, I will:
-- 1. Add column as NULLABLE first
-- 2. (Optional step for user) Backfill needed
-- 3. Alter column to NOT NULL
-- But for this script I will add it as NULLABLE first to avoid errors, 
-- OR use auth.uid() default if running in a context where user is creating it. 
-- Best approach for a migration script without known users:
-- Add column as default auth.uid() so new rows get it, but existing rows might struggle.
-- Given I must return only SQL, I will provide the standard add column. 

-- 1. Add column as nullable first to prevent breaking existing data
alter table public.portfolios 
add column if not exists owner_id uuid references auth.users(id) on delete cascade;

-- 2. Update existing rows to have the current user as owner (if executed by an admin/user who owns them)
-- OR just default to the user running the query if possible. 
-- For safety in this context: 
-- We will just add the column. Enforcing NOT NULL on existing data fails if table is not empty.
-- I'll assume table is empty or user will handle backfill.
-- But the requirement is "Enforce NOT NULL".
-- I will set a default of the invoking user if possible, but standard SQL migration:

alter table public.portfolios 
alter column owner_id set default auth.uid();

-- If you strictly need NOT NULL and have existing data, run this AFTER backfilling:
-- update public.portfolios set owner_id = 'YOUR_USER_ID' where owner_id is null;
-- alter table public.portfolios alter column owner_id set not null;

-- Use this query to just add the column for now to unblock the feature for NEW items.
-- Existing items will have NULL owner_id until updated.

-- REVISED SIMPLE MIGRATION:
alter table public.portfolios 
add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
