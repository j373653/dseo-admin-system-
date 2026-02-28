-- ============================================================================
-- Eliminar datos del sistema SILO (usar solo si elegiste Opción A: Solo Clusters)
-- Fecha: 2026-02-28
-- ============================================================================

-- ADVERTENCIA: Esto eliminará todos los datos de SILO, categorías y páginas
-- Las keywords pasarán a estado 'pending'

-- 1. Eliminar asignaciones de keywords
TRUNCATE d_seo_admin_keyword_assignments CASCADE;

-- 2. Eliminar páginas
TRUNCATE d_seo_admin_pages CASCADE;

-- 3. Eliminar categorías  
TRUNCATE d_seo_admin_categories CASCADE;

-- 4. Eliminar silos
TRUNCATE d_seo_admin_silos CASCADE;

-- 5. Actualizar keywords a pending (las que estaban asignadas a SILO)
UPDATE d_seo_admin_raw_keywords 
SET status = 'pending', cluster_id = NULL 
WHERE status = 'clustered';

-- Verificar resultados
SELECT 
  (SELECT COUNT(*) FROM d_seo_admin_raw_keywords WHERE status = 'pending') as keywords_pending,
  (SELECT COUNT(*) FROM d_seo_admin_silos) as silos_count,
  (SELECT COUNT(*) FROM d_seo_admin_categories) as categories_count,
  (SELECT COUNT(*) FROM d_seo_admin_pages) as pages_count;
