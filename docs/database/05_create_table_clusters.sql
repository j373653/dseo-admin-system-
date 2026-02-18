-- Crear tabla para clusters de keywords
CREATE TABLE IF NOT EXISTS public.d_seo_admin_keyword_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_cluster_id UUID REFERENCES public.d_seo_admin_keyword_clusters(id),
    search_volume_total INTEGER DEFAULT 0,
    difficulty_avg INTEGER,
    keyword_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir foreign key a keywords
ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES public.d_seo_admin_keyword_clusters(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clusters_parent ON public.d_seo_admin_keyword_clusters(parent_cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON public.d_seo_admin_keyword_clusters(status);

-- Trigger para updated_at
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

-- Desactivar RLS
ALTER TABLE public.d_seo_admin_keyword_clusters DISABLE ROW LEVEL SECURITY;

SELECT 'Tabla d_seo_admin_keyword_clusters creada correctamente' as status;
