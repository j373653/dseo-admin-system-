-- ============================================================================
-- Script de recuperación: Verificar y crear tablas necesarias para el sistema
-- Fecha: 2026-02-28
-- ============================================================================

-- 1. Verificar si la tabla de clusters existe
SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'd_seo_admin_keyword_clusters'
    ) as clusters_table_exists;

-- 2. Si no existe, crearla
CREATE TABLE IF NOT EXISTS public.d_seo_admin_keyword_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_cluster_id UUID REFERENCES public.d_seo_admin_keyword_clusters(id),
    search_volume_total INTEGER DEFAULT 0,
    difficulty_avg INTEGER,
    keyword_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    intent VARCHAR(50),
    is_pillar_page BOOLEAN DEFAULT false,
    content_type_target VARCHAR(50),
    entity VARCHAR(255),
    priority_score JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Añadir columnas que faltan si existen las tablas
DO $$
BEGIN
    -- Añadir cluster_id a keywords si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'd_seo_admin_raw_keywords' 
        AND column_name = 'cluster_id'
    ) THEN
        ALTER TABLE public.d_seo_admin_raw_keywords 
        ADD COLUMN cluster_id UUID REFERENCES public.d_seo_admin_keyword_clusters(id);
    END IF;
    
    -- Añadir intent si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'd_seo_admin_raw_keywords' 
        AND column_name = 'intent'
    ) THEN
        ALTER TABLE public.d_seo_admin_raw_keywords 
        ADD COLUMN intent VARCHAR(50);
    END IF;
END $$;

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_clusters_parent ON public.d_seo_admin_keyword_clusters(parent_cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON public.d_seo_admin_keyword_clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_intent ON public.d_seo_admin_keyword_clusters(intent);
CREATE INDEX IF NOT EXISTS idx_keywords_cluster ON public.d_seo_admin_raw_keywords(cluster_id);

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_clusters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clusters_updated_at ON public.d_seo_admin_keyword_clusters;
CREATE TRIGGER update_clusters_updated_at 
    BEFORE UPDATE ON public.d_seo_admin_keyword_clusters 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_clusters_updated_at();

-- 6. Desactivar RLS
ALTER TABLE public.d_seo_admin_keyword_clusters DISABLE ROW LEVEL SECURITY;

-- 7. Verificar tablas de proveedores IA
SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'd_seo_admin_ai_providers'
    ) as ai_providers_exists,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'd_seo_admin_ai_models'
    ) as ai_models_exists;

-- 8. Ver resultado final
SELECT 
    'd_seo_admin_keyword_clusters' as table_name,
    (SELECT COUNT(*) FROM public.d_seo_admin_keyword_clusters) as row_count
UNION ALL
SELECT 
    'd_seo_admin_raw_keywords' as table_name,
    (SELECT COUNT(*) FROM public.d_seo_admin_raw_keywords);
