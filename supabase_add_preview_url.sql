-- Add preview_image_url column to portfolio_images table
-- This stores the URL of the uploaded cropped preview image
-- The preview_settings column (JSONB) still stores crop percentages for re-editing

ALTER TABLE portfolio_images 
ADD COLUMN IF NOT EXISTS preview_image_url TEXT NULL;

-- Add comment for clarity
COMMENT ON COLUMN portfolio_images.preview_image_url IS 'Public URL of the cropped preview image from Supabase Storage (portfolio-previews bucket)';

-- Note: No RLS policy changes needed - existing "Auth Update Images" policy covers this column
