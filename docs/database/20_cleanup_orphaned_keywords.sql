-- ============================================================================
-- SCRIPT 20: Cleanup Orphaned Keywords
-- ============================================================================
-- Este script limpia keywords huérfanas que quedaron después de eliminar
-- silos/categorías/páginas sin actualizar su status a 'pending'
-- ============================================================================

-- ============================================================================
-- FASE 1: Diagnóstico - Ver estado actual
-- ============================================================================

SELECT '=== DIAGNÓSTICO: Estado actual de keywords ===' as info;

-- Total de keywords
SELECT COUNT(*) as total_keywords FROM d_seo_admin_raw_keywords;

-- Por status
SELECT status, COUNT(*) as count 
FROM d_seo_admin_raw_keywords 
GROUP BY status 
ORDER BY count DESC;

-- Keywords con assignments a páginas que ya NO existen (huérfanas)
SELECT COUNT(*) as orphaned_assignments
FROM d_seo_admin_keyword_assignments ka
LEFT JOIN d_seo_admin_pages p ON ka.page_id = p.id
WHERE p.id IS NULL;

-- Keywords en clustered SIN assignments válidos
SELECT COUNT(*) as clustered_without_assignments
FROM d_seo_admin_raw_keywords k
WHERE k.status = 'clustered'
AND NOT EXISTS (
  SELECT 1 FROM d_seo_admin_keyword_assignments ka 
  WHERE ka.keyword_id = k.id
);

-- ============================================================================
-- FASE 2: Limpieza - Keywords con assignments huérfanos
-- ============================================================================

SELECT '=== LIMPIEZA: Pasando keywords huérfanas a pending ===' as info;

-- 2.1: Keywords con assignments a páginas inexistentes → pending
UPDATE d_seo_admin_raw_keywords
SET 
  status = 'pending',
  updated_at = NOW()
WHERE id IN (
  SELECT ka.keyword_id 
  FROM d_seo_admin_keyword_assignments ka
  LEFT JOIN d_seo_admin_pages p ON ka.page_id = p.id
  WHERE p.id IS NULL
  AND ka.keyword_id IS NOT NULL
);

-- 2.2: Eliminar assignments huérfanos (a páginas que no existen)
DELETE FROM d_seo_admin_keyword_assignments
WHERE page_id IN (
  SELECT ka.page_id 
  FROM d_seo_admin_keyword_assignments ka
  LEFT JOIN d_seo_admin_pages p ON ka.page_id = p.id
  WHERE p.id IS NULL
);

-- 2.3: Keywords en clustered sin ningún assignment → pending
UPDATE d_seo_admin_raw_keywords
SET 
  status = 'pending',
  updated_at = NOW()
WHERE status = 'clustered'
AND id NOT IN (
  SELECT DISTINCT keyword_id 
  FROM d_seo_admin_keyword_assignments 
  WHERE keyword_id IS NOT NULL
);

-- 2.4: Eliminar assignments sin page_id válido
DELETE FROM d_seo_admin_keyword_assignments
WHERE page_id IS NULL;

-- ============================================================================
-- FASE 3: Verificación - Resultados
-- ============================================================================

SELECT '=== VERIFICACIÓN: Estado después de limpieza ===' as info;

-- Por status después de limpieza
SELECT status, COUNT(*) as count 
FROM d_seo_admin_raw_keywords 
GROUP BY status 
ORDER BY count DESC;

-- Verificar que no hay assignments huérfanos
SELECT COUNT(*) as orphaned_assignments_remaining
FROM d_seo_admin_keyword_assignments ka
LEFT JOIN d_seo_admin_pages p ON ka.page_id = p.id
WHERE p.id IS NULL;

-- Verificar que no hay keywords clustered sin assignments
SELECT COUNT(*) as clustered_without_assignments_remaining
FROM d_seo_admin_raw_keywords k
WHERE k.status = 'clustered'
AND NOT EXISTS (
  SELECT 1 FROM d_seo_admin_keyword_assignments ka 
  WHERE ka.keyword_id = k.id
);

SELECT '=== LIMPIEZA COMPLETADA ===' as info;
