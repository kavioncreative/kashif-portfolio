-- Add JSONB column for flexible preview settings (crop, zoom, etc.)
-- Using JSONB allows us to store the percentage-based crop object directly.
-- 'if not exists' prevents errors if run multiple times.
alter table public.portfolio_images 
add column if not exists preview_settings jsonb default '{}'::jsonb;
