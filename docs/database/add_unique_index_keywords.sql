-- ============================================================================
-- SCRIPT PARA AÑADIR ÍNDICE ÚNICO EN KEYWORDS
-- ============================================================================
-- Este script evita que se inserten keywords duplicadas en el futuro
-- IMPORTANTE: Ejecutar DESPUÉS de deduplicate_raw_keywords.sql
-- ============================================================================

BEGIN;

-- ============================================================
-- FASE 1: Verificar si ya existe el índice único
-- ============================================================

-- Verificar si hay duplicados antes de crear el índice
SELECT 
    LOWER(TRIM(keyword)) as normalized_keyword,
    COUNT(*) as total
FROM public.d_seo_admin_raw_keywords
GROUP BY LOWER(TRIM(keyword))
HAVING COUNT(*) > 1
LIMIT 10;

-- ============================================================
-- FASE 2: Crear índice único (solo si no hay duplicados)
-- El índice es en LOWER(TRIM(keyword)) para ser case-insensitive
-- ============================================================

-- Opción A: Índice único funcional (calculado)
-- Nota: PostgreSQL no permite índices únicos en expresiones directamente
-- sin crear una columna adicional o usar una constraint

-- Crear columna normalizada para el índice (si no existe)
ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS keyword_normalized TEXT;

-- Actualizar la columna con el valor normalizado
UPDATE public.d_seo_admin_raw_keywords 
SET keyword_normalized = LOWER(TRIM(keyword));

-- Crear índice único en la columna normalizada
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_keywords_unique 
ON public.d_seo_admin_raw_keywords (keyword_normalized);

-- Hacer que la columna sea NOT NULL (después de populate)
ALTER TABLE public.d_seo_admin_raw_keywords 
ALTER COLUMN keyword_normalized SET NOT NULL;

-- ============================================================
-- FASE 3: Trigger para mantener la columna normalizada al insertar/actualizar
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_keyword()
RETURNS TRIGGER AS $$
BEGIN
  NEW.keyword_normalized = LOWER(TRIM(NEW.keyword));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_keyword ON public.d_seo_admin_raw_keywords;
CREATE TRIGGER trigger_normalize_keyword
  BEFORE INSERT OR UPDATE ON public.d_seo_admin_raw_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_keyword();

COMMIT;

SELECT 'Índice único creado correctamente' as status;
