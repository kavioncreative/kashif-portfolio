-- Add preview_settings to portfolio_images table
alter table portfolio_images 
add column if not exists preview_settings jsonb default '{"zoom": 1, "x": 0, "y": 0}';
