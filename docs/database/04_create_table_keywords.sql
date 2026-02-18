-- Crear tabla para keywords importadas (Fase 3)
CREATE TABLE IF NOT EXISTS public.d_seo_admin_raw_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255) NOT NULL,
    search_volume INTEGER DEFAULT 0,
    difficulty INTEGER,
    cpc DECIMAL(10,2),
    source VARCHAR(50) DEFAULT 'manual',
    raw_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    cluster_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_raw_keywords_keyword ON public.d_seo_admin_raw_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_raw_keywords_status ON public.d_seo_admin_raw_keywords(status);
CREATE INDEX IF NOT EXISTS idx_raw_keywords_created_at ON public.d_seo_admin_raw_keywords(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_raw_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_raw_keywords_updated_at ON public.d_seo_admin_raw_keywords;
CREATE TRIGGER update_raw_keywords_updated_at 
    BEFORE UPDATE ON public.d_seo_admin_raw_keywords 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_raw_keywords_updated_at();

-- Desactivar RLS para permitir acceso desde API
ALTER TABLE public.d_seo_admin_raw_keywords DISABLE ROW LEVEL SECURITY;

SELECT 'Tabla d_seo_admin_raw_keywords creada correctamente' as status;
