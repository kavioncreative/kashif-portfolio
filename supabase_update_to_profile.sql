-- Update site_settings table to support Profile Picture and Introduction Text
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS intro_text TEXT NULL;

-- Keep hero_image_url for now to avoid breaking existing data during migration
-- but it will be ignored by the application code.

COMMENT ON COLUMN public.site_settings.profile_image_url IS 'Public URL of the user profile picture';
COMMENT ON COLUMN public.site_settings.intro_text IS 'Global introduction or bio text displayed on all portfolio pages';
