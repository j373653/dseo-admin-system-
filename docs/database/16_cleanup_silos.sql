-- Script para limpiar silos existentes y empezar de cero
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estructura actual
SELECT s.name, COUNT(DISTINCT c.id) as categorias, COUNT(DISTINCT p.id) as paginas
FROM d_seo_admin_silos s
LEFT JOIN d_seo_admin_categories c ON c.silo_id = s.id
LEFT JOIN d_seo_admin_pages p ON p.silo_id = s.id
GROUP BY s.id
ORDER BY paginas DESC
LIMIT 20;

-- 2. Eliminar todas las asignaciones de keywords
TRUNCATE d_seo_admin_keyword_assignments CASCADE;

-- 3. Eliminar todas las páginas
TRUNCATE d_seo_admin_pages CASCADE;

-- 4. Eliminar todas las categorías
TRUNCATE d_seo_admin_categories CASCADE;

-- 5. Eliminar todos los silos
TRUNCATE d_seo_admin_silos CASCADE;

-- 6. Verificar que se borró todo
SELECT 'silos' as tabla, COUNT(*) as total FROM d_seo_admin_silos
UNION ALL
SELECT 'categorias', COUNT(*) FROM d_seo_admin_categories
UNION ALL
SELECT 'paginas', COUNT(*) FROM d_seo_admin_pages
UNION ALL
SELECT 'assignments', COUNT(*) FROM d_seo_admin_keyword_assignments;
