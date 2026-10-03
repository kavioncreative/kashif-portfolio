-- Add thumbnail_settings to portfolios table
alter table portfolios 
add column if not exists thumbnail_settings jsonb default '{"zoom": 1, "x": 0, "y": 0}';

-- Update RLS policies to allow update of this column
-- (Existing "Auth Update Portfolios" policy covers this as it allows update on all columns)
