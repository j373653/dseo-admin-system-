-- D-SEO: SILO-based structure (3 levels)
CREATE TABLE IF NOT EXISTS public.d_seo_admin_silos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_silo_id UUID REFERENCES public.d_seo_admin_silos(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.d_seo_admin_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id UUID NOT NULL REFERENCES public.d_seo_admin_silos(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES public.d_seo_admin_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.d_seo_admin_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id UUID NOT NULL REFERENCES public.d_seo_admin_silos(id),
  category_id UUID NOT NULL REFERENCES public.d_seo_admin_categories(id),
  main_keyword VARCHAR(255) NOT NULL,
  url_target VARCHAR(512),
  title VARCHAR(255),
  is_pillar BOOLEAN DEFAULT false,
  content_type_target VARCHAR(20) CHECK (content_type_target IN ('service','blog','landing','unknown')) DEFAULT 'blog',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asignaciones keyword -> page (muchos a muchos)
CREATE TABLE IF NOT EXISTS public.d_seo_admin_keyword_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES public.d_seo_admin_raw_keywords(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.d_seo_admin_pages(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.d_seo_admin_pages
ADD COLUMN IF NOT EXISTS pillar_data JSONB; -- datos extra para pillar pages

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_pages_silo ON public.d_seo_admin_pages(silo_id);
CREATE INDEX IF NOT EXISTS idx_pages_category ON public.d_seo_admin_pages(category_id);
CREATE INDEX IF NOT EXISTS idx_keyword_assignments ON public.d_seo_admin_keyword_assignments(keyword_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pages_updated_at ON public.d_seo_admin_pages;
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.d_seo_admin_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pages_updated_at();

SELECT 'SILO schema created' AS status;
