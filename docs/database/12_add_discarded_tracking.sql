-- Añadir columnas para tracking de keywords descartadas
-- Estas columnas permiten:
-- - discarded_at: saber cuándo fue descartada
-- - discarded_reason: explicar por qué se sugirió descartar (para el usuario)

ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS discarded_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS discarded_reason TEXT;

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_keywords_discarded_at ON public.d_seo_admin_raw_keywords(discarded_at);

-- Crear índice compuesto para filtrar keywords pendientes (excluyendo descartadas)
CREATE INDEX IF NOT EXISTS idx_keywords_pending_status ON public.d_seo_admin_raw_keywords(status) 
WHERE status = 'pending';

SELECT 'Columnas de tracking de descartadas añadidas correctamente' as status;
