-- Script para deduplicar keywords asignadas a múltiples páginas
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- 1. Ver cuántas keywords están duplicadas (asignadas a múltiples páginas)
-- ============================================================
SELECT 
    keyword_id,
    COUNT(DISTINCT page_id) as pages_count,
    COUNT(*) as total_assignments
FROM d_seo_admin_keyword_assignments
GROUP BY keyword_id
HAVING COUNT(DISTINCT page_id) > 1
ORDER BY pages_count DESC
LIMIT 20;

-- Contar total de keywords duplicadas
SELECT 
    COUNT(DISTINCT keyword_id) as total_duplicated_keywords
FROM d_seo_admin_keyword_assignments
GROUP BY keyword_id
HAVING COUNT(DISTINCT page_id) > 1;

-- ============================================================
-- 2. Deduplicar: mantener solo la primera asignación por fecha
-- ============================================================
-- Crear tabla temporal con las asignaciones a eliminar
CREATE TEMP TABLE duplicates_to_remove AS
SELECT ka.id
FROM d_seo_admin_keyword_assignments ka
WHERE EXISTS (
    SELECT 1 FROM d_seo_admin_keyword_assignments ka2
    WHERE ka2.keyword_id = ka.keyword_id
    AND ka2.page_id != ka.page_id
    AND (
        ka2.assigned_at > ka.assigned_at
        OR (ka2.assigned_at = ka.assigned_at AND ka2.id > ka.id)
    )
);

-- Verificar cuántos registros se eliminarán
SELECT COUNT(*) as to_remove FROM duplicates_to_remove;

-- Eliminar las asignaciones duplicadas (mantener la más antigua)
-- DELETE FROM d_seo_admin_keyword_assignments 
-- WHERE id IN (SELECT id FROM duplicates_to_remove);

-- ============================================================
-- 3. Verificar el resultado
-- ============================================================
-- Keywords que siguen asignadas a múltiples páginas después de la limpieza
SELECT 
    COUNT(DISTINCT keyword_id) as still_duplicated
FROM d_seo_admin_keyword_assignments
GROUP BY keyword_id
HAVING COUNT(DISTINCT page_id) > 1;

-- ============================================================
-- NOTA: Descomenta el DELETE cuando estés listo para ejecutar
-- ============================================================
