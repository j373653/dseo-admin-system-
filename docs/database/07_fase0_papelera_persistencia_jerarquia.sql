-- Migración Fase 0: Papelera, Persistencia Gemini y Jerarquía de Clusters
-- Fecha: 2026-02-19

-- ============================================
-- 1. PAPELERA (Soft Delete) para Keywords
-- ============================================

ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_reason VARCHAR(50); -- 'user_deleted', 'irrelevant', 'duplicate'

-- Índice para queries de papelera (optimización)
CREATE INDEX IF NOT EXISTS idx_keywords_deleted_at ON public.d_seo_admin_raw_keywords(deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_keywords_deleted_at_only ON public.d_seo_admin_raw_keywords(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- ============================================
-- 2. PERSISTENCIA ANÁLISIS GEMINI
-- ============================================

ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_analysis_data JSONB; -- Guarda: cluster, intent, confidence, contentType, reasoning

-- Índice para encontrar keywords ya analizadas
CREATE INDEX IF NOT EXISTS idx_keywords_ai_analyzed ON public.d_seo_admin_raw_keywords(ai_analyzed_at) 
WHERE ai_analyzed_at IS NOT NULL;

-- ============================================
-- 3. JERARQUÍA DE CLUSTERS (Preparación Fase 2)
-- ============================================

-- Self-reference para jerarquía padre-hijo
ALTER TABLE public.d_seo_admin_keyword_clusters 
ADD COLUMN IF NOT EXISTS parent_cluster_id UUID REFERENCES public.d_seo_admin_keyword_clusters(id),
ADD COLUMN IF NOT EXISTS is_pillar_page BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pillar_content_data JSONB; -- {url, title, status, notes, targetPublishDate}

-- Índices para jerarquía
CREATE INDEX IF NOT EXISTS idx_clusters_parent ON public.d_seo_admin_keyword_clusters(parent_cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_pillar ON public.d_seo_admin_keyword_clusters(is_pillar_page);

-- ============================================
-- 4. ÍNDICE ÚNICO PARA PREVENIR DUPLICADOS
-- ============================================

-- NOTA: Descomentar después de limpiar duplicados existentes
-- Ver archivo: 07b_limpiar_duplicados_clusters.sql

-- Prevenir clusters con el mismo nombre (case insensitive)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_clusters_name_unique 
-- ON public.d_seo_admin_keyword_clusters(LOWER(name));

-- ============================================
-- 5. VIEW PARA KEYWORDS ACTIVAS (excluye papelera)
-- ============================================

CREATE OR REPLACE VIEW public.v_active_keywords AS
SELECT * FROM public.d_seo_admin_raw_keywords
WHERE deleted_at IS NULL;

-- ============================================
-- 6. VIEW PARA KEYWORDS EN PAPELERA
-- ============================================

CREATE OR REPLACE VIEW public.v_deleted_keywords AS
SELECT * FROM public.d_seo_admin_raw_keywords
WHERE deleted_at IS NOT NULL;

-- ============================================
-- 7. FUNCIÓN PARA RESTAURAR KEYWORD DE PAPELERA
-- ============================================

CREATE OR REPLACE FUNCTION public.restore_keyword(keyword_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.d_seo_admin_raw_keywords
    SET deleted_at = NULL,
        deleted_reason = NULL,
        updated_at = NOW()
    WHERE id = keyword_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNCIÓN PARA ELIMINAR PERMANENTEMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.permanently_delete_keyword(keyword_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.d_seo_admin_raw_keywords
    WHERE id = keyword_id AND deleted_at IS NOT NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGER PARA ACTUALIZAR CONTADOR DE KEYWORDS EN CLUSTER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_cluster_keyword_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se asigna a un cluster
    IF NEW.cluster_id IS NOT NULL AND (OLD.cluster_id IS NULL OR OLD.cluster_id != NEW.cluster_id) THEN
        UPDATE public.d_seo_admin_keyword_clusters
        SET keyword_count = keyword_count + 1,
            updated_at = NOW()
        WHERE id = NEW.cluster_id;
    END IF;
    
    -- Si se remueve de un cluster
    IF OLD.cluster_id IS NOT NULL AND (NEW.cluster_id IS NULL OR OLD.cluster_id != NEW.cluster_id) THEN
        UPDATE public.d_seo_admin_keyword_clusters
        SET keyword_count = GREATEST(keyword_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.cluster_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_update_cluster_count ON public.d_seo_admin_raw_keywords;

-- Crear trigger
CREATE TRIGGER trigger_update_cluster_count
    AFTER UPDATE OF cluster_id ON public.d_seo_admin_raw_keywords
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cluster_keyword_count();

-- ============================================
-- MENSAJE DE ÉXITO
-- ============================================

SELECT 'Fase 0: Migraciones aplicadas correctamente' as status;
