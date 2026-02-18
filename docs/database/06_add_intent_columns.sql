-- Añadir columna de intención a la tabla de clusters
ALTER TABLE public.d_seo_admin_keyword_clusters 
ADD COLUMN IF NOT EXISTS intent VARCHAR(50);

-- Crear índice para búsquedas por intención
CREATE INDEX IF NOT EXISTS idx_clusters_intent ON public.d_seo_admin_keyword_clusters(intent);

-- Añadir columna de intención a keywords (para análisis futuro)
ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS intent VARCHAR(50);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_keywords_intent ON public.d_seo_admin_raw_keywords(intent);

SELECT 'Columnas de intención añadidas correctamente' as status;
