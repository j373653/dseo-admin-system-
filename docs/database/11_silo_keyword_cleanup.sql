-- ============================================================================
-- D-SEO: Diagnóstico y Limpieza de Páginas Duplicadas
-- Fecha: 2026-02-23
-- Problema: Keywords asignadas a páginas que no aparecen en la UI
-- Causa: Páginas duplicadas con mismo main_keyword en diferentes categorías
-- ============================================================================

-- ============================================================================
-- FASE 1: DIAGNÓSTICO
-- ============================================================================

-- Query 1: Estado general de páginas
SELECT 
  COUNT(*) as total_pages,
  COUNT(DISTINCT main_keyword) as unique_keywords,
  COUNT(DISTINCT category_id) as unique_categories
FROM d_seo_admin_pages;

-- Query 2: Páginas duplicadas por (main_keyword, category_id)
SELECT 
  main_keyword,
  category_id,
  COUNT(*) as count,
  MAX(created_at) as latest,
  MIN(created_at) as oldest
FROM d_seo_admin_pages
GROUP BY main_keyword, category_id
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;

-- Query 3: Estado de asignaciones
SELECT 
  COUNT(*) as total_assignments,
  COUNT(DISTINCT page_id) as pages_with_assignments,
  COUNT(DISTINCT keyword_id) as assigned_keywords
FROM d_seo_admin_keyword_assignments;

-- Query 4: Verificar si hay asignaciones huérfanas (page_id no existe)
SELECT a.id, a.page_id 
FROM d_seo_admin_keyword_assignments a
LEFT JOIN d_seo_admin_pages p ON a.page_id = p.id
WHERE p.id IS NULL;


-- ============================================================================
-- FASE 2: LIMPIEZA DE DATOS
-- ============================================================================

-- ============================================================================
-- 2.1: Identificar la página correcta para cada main_keyword duplicado
-- Para cada (main_keyword, category_id), nos quedamos con la más reciente
-- ============================================================================

-- Crear tabla temporal con páginas a mantener (la más reciente de cada grupo)
CREATE TEMP TABLE pages_to_keep AS
SELECT p.id, p.main_keyword, p.category_id, p.created_at
FROM d_seo_admin_pages p
INNER JOIN (
  SELECT main_keyword, category_id, MAX(created_at) as max_created
  FROM d_seo_admin_pages
  GROUP BY main_keyword, category_id
) latest ON p.main_keyword = latest.main_keyword 
  AND p.category_id = latest.category_id 
  AND p.created_at = latest.max_created;

-- Verificar páginas a mantener
SELECT * FROM pages_to_keep LIMIT 20;

-- ============================================================================
-- 2.2: Actualizar asignaciones para apuntar a la página correcta
-- Para cada main_keyword, actualizar todas las keywords a la página más reciente
-- ============================================================================

-- Obtener el mapping: keyword_id -> página correcta (la más reciente con ese main_keyword)
-- Esta query actualiza las asignaciones para que apunten a la página correcta
UPDATE d_seo_admin_keyword_assignments a
SET page_id = ptk.id
FROM pages_to_keep ptk
INNER JOIN d_seo_admin_raw_keywords kw ON kw.id = a.keyword_id
WHERE LOWER(kw.keyword) = LOWER(ptk.main_keyword)
  AND ptk.category_id = (
    SELECT category_id 
    FROM d_seo_admin_pages 
    WHERE id = a.page_id
  );

-- Verificar resultado
SELECT 
  COUNT(*) as total_assignments,
  COUNT(DISTINCT page_id) as unique_pages
FROM d_seo_admin_keyword_assignments;


-- ============================================================================
-- 2.3: Eliminar páginas duplicadas huérfanas
-- Eliminar páginas que NO están en pages_to_keep Y NO tienen asignaciones
-- ============================================================================

-- Pages candidatas a eliminar (las antiguas, no la más reciente)
CREATE TEMP TABLE pages_to_delete AS
SELECT p.id, p.main_keyword, p.category_id
FROM d_seo_admin_pages p
LEFT JOIN pages_to_keep ptk ON p.id = ptk.id
WHERE ptk.id IS NULL
  AND p.id NOT IN (
    SELECT DISTINCT page_id FROM d_seo_admin_keyword_assignments
  );

-- Verificar cuántas se eliminarán
SELECT COUNT(*) as pages_to_delete FROM pages_to_delete;

-- Eliminar páginas huérfanas
DELETE FROM d_seo_admin_pages 
WHERE id IN (SELECT id FROM pages_to_delete);

-- Verificar resultado final
SELECT COUNT(*) as total_pages FROM d_seo_admin_pages;


-- ============================================================================
-- FASE 3: PREVENCIÓN - Añadir constraints e índices
-- ============================================================================

-- ============================================================================
-- 3.1: Crear índice único para evitar duplicados futuros
-- Este índice evita crear páginas con mismo main_keyword en misma categoría
-- ============================================================================

-- Primero verificar si existe
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'd_seo_admin_pages' 
  AND indexname = 'unique_page_per_category_keyword';

-- Crear índice único (si ya hay duplicados, esto fallará -先去 limpiar)
-- Descomenta después de limpiar:
-- CREATE UNIQUE INDEX IF NOT EXISTS unique_page_per_category_keyword 
-- ON d_seo_admin_pages (LOWER(main_keyword), category_id);

-- ============================================================================
-- 3.2: Crear índice para mejorar búsquedas de páginas
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pages_category_id ON d_seo_admin_pages(category_id);
CREATE INDEX IF NOT EXISTS idx_pages_main_keyword_lower ON d_seo_admin_pages(LOWER(main_keyword));
CREATE INDEX IF NOT EXISTS idx_assignments_page_id ON d_seo_admin_keyword_assignments(page_id);
CREATE INDEX IF NOT EXISTS idx_assignments_keyword_id ON d_seo_admin_keyword_assignments(keyword_id);


-- ============================================================================
-- FASE 4: VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que no hay duplicados
SELECT main_keyword, category_id, COUNT(*) as count
FROM d_seo_admin_pages
GROUP BY main_keyword, category_id
HAVING COUNT(*) > 1;

-- Verificar que las asignaciones ahora tienen page_ids válidos
SELECT 
  a.id,
  a.keyword_id,
  a.page_id,
  p.main_keyword as page_keyword,
  kw.keyword as keyword_text
FROM d_seo_admin_keyword_assignments a
LEFT JOIN d_seo_admin_pages p ON a.page_id = p.id
LEFT JOIN d_seo_admin_raw_keywords kw ON a.keyword_id = kw.id
LIMIT 10;

-- Contar keywords por página
SELECT 
  p.id,
  p.main_keyword,
  COUNT(a.id) as keyword_count
FROM d_seo_admin_pages p
LEFT JOIN d_seo_admin_keyword_assignments a ON p.id = a.page_id
GROUP BY p.id, p.main_keyword
ORDER BY keyword_count DESC
LIMIT 20;
