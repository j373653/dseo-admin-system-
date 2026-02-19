-- Migración Fase 2A: Tabla de Páginas de Contenido
-- Fecha: 2026-02-19

-- ============================================
-- TABLA: Páginas de Contenido
-- ============================================

CREATE TABLE IF NOT EXISTS public.d_seo_admin_content_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES public.d_seo_admin_keyword_clusters(id) ON DELETE CASCADE,
    
    -- URLs
    suggested_url VARCHAR(500),
    final_url VARCHAR(500) UNIQUE,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published')),
    
    -- Contenido (JSONB con estructura de la página)
    content_data JSONB DEFAULT '{}'::jsonb,
    
    -- Metadatos SEO
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    h1 VARCHAR(200),
    
    -- Versionado
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES public.d_seo_admin_content_pages(id),
    
    -- Fechas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Notas internas
    notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_content_pages_cluster ON public.d_seo_admin_content_pages(cluster_id);
CREATE INDEX IF NOT EXISTS idx_content_pages_status ON public.d_seo_admin_content_pages(status);
CREATE INDEX IF NOT EXISTS idx_content_pages_final_url ON public.d_seo_admin_content_pages(final_url);

-- ============================================
-- TABLA: Versiones de Contenido (para rollback)
-- ============================================

CREATE TABLE IF NOT EXISTS public.d_seo_admin_content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES public.d_seo_admin_content_pages(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content_data JSONB NOT NULL,
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    h1 VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_content_versions_page ON public.d_seo_admin_content_versions(page_id);

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION public.update_content_page_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_page_timestamp ON public.d_seo_admin_content_pages;
CREATE TRIGGER trigger_content_page_timestamp
    BEFORE UPDATE ON public.d_seo_admin_content_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_content_page_timestamp();

-- ============================================
-- FUNCIÓN: Guardar versión antes de actualizar
-- ============================================

CREATE OR REPLACE FUNCTION public.save_content_version()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content_data IS DISTINCT FROM NEW.content_data OR 
       OLD.meta_title IS DISTINCT FROM NEW.meta_title OR
       OLD.meta_description IS DISTINCT FROM NEW.meta_description OR
       OLD.h1 IS DISTINCT FROM NEW.h1 THEN
        
        INSERT INTO public.d_seo_admin_content_versions 
            (page_id, version_number, content_data, meta_title, meta_description, h1)
        VALUES (
            OLD.id,
            OLD.version,
            OLD.content_data,
            OLD.meta_title,
            OLD.meta_description,
            OLD.h1
        );
        
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_save_content_version ON public.d_seo_admin_content_pages;
CREATE TRIGGER trigger_save_content_version
    BEFORE UPDATE ON public.d_seo_admin_content_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.save_content_version();

-- ============================================
-- MENSAJE DE ÉXITO
-- ============================================

SELECT 'Fase 2A: Tablas de contenido creadas correctamente' as status;
