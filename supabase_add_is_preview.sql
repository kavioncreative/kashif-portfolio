
-- Add is_preview column to portfolio_images
ALTER TABLE portfolio_images ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT false;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_images_is_preview ON portfolio_images(portfolio_id, is_preview);

-- Ensure only one preview image per portfolio (Optional but recommended)
-- This requires a unique partial index which might be tricky with existing data, 
-- but we'll handle the "only one" logic in the application.
