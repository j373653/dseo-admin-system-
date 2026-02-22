-- Add slug column to d_seo_admin_pages table
ALTER TABLE public.d_seo_admin_pages 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.d_seo_admin_pages(slug);
