-- Script de emergencia: Desactivar RLS y verificar estructura
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. DESACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================

-- Tablas principales de keywords
ALTER TABLE public.d_seo_admin_raw_keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.d_seo_admin_keyword_clusters DISABLE ROW LEVEL SECURITY;

-- Tablas de SILO
ALTER TABLE public.d_seo_admin_silos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.d_seo_admin_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.d_seo_admin_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.d_seo_admin_keyword_assignments DISABLE ROW LEVEL SECURITY;

-- Otras tablas
ALTER TABLE public.d_seo_admin_sitemap_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.d_seo_admin_leads DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. AÑADIR COLUMNAS FALTANTES A KEYWORDS
-- ============================================

-- Columnas para tracking de descartadas
ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS discarded_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS discarded_reason TEXT;

ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS intent VARCHAR(50);

-- ============================================
-- 3. CREAR ÍNDICES FALTANTES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_keywords_discarded_at ON public.d_seo_admin_raw_keywords(discarded_at);
CREATE INDEX IF NOT EXISTS idx_keywords_intent ON public.d_seo_admin_raw_keywords(intent);
CREATE INDEX IF NOT EXISTS idx_keywords_pending_status ON public.d_seo_admin_raw_keywords(status) WHERE status = 'pending';

-- ============================================
-- 4. VERIFICAR ESTRUCTURA
-- ============================================

SELECT 
    table_name,
    rowsecurity
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'd_seo_admin_raw_keywords',
    'd_seo_admin_keyword_clusters',
    'd_seo_admin_silos',
    'd_seo_admin_categories',
    'd_seo_admin_pages',
    'd_seo_admin_keyword_assignments'
);

SELECT 'Verificación completada. RLS debería mostrar "off" en todas las tablas.' AS resultado;
