-- ============================================================================
-- FIX: Eliminar silo duplicado "Desarrollo Web"
-- Fecha: 2026-02-26
-- ============================================================================

-- 1. Ver estado actual de silos
SELECT '=== ESTADO ACTUAL DE SILOS ===' as info;
SELECT id, name FROM d_seo_admin_silos ORDER BY name;

-- 2. Ver silos duplicados
SELECT '=== SILOS DUPLICADOS (nombre similar) ===' as info;
SELECT name, COUNT(*) as count 
FROM d_seo_admin_silos 
GROUP BY name 
HAVING COUNT(*) > 1;

-- 3. Obtener IDs de los silos relevantes
SELECT '=== OBTENIENDO IDs ===' as info;
SELECT id, name FROM d_seo_admin_silos 
WHERE name LIKE 'Desarrollo Web%' OR name = 'Desarrollo Web';

-- 4. Migrar categorías de "Desarrollo Web" a "Desarrollo Web & E-commerce"
SELECT '=== MIGRANDO CATEGORÍAS ===' as info;
UPDATE d_seo_admin_categories 
SET silo_id = (SELECT id FROM d_seo_admin_silos WHERE name = 'Desarrollo Web & E-commerce' LIMIT 1)
WHERE silo_id = (SELECT id FROM d_seo_admin_silos WHERE name = 'Desarrollo Web' LIMIT 1)
AND EXISTS (SELECT 1 FROM d_seo_admin_silos WHERE name = 'Desarrollo Web & E-commerce');

-- 5. Verificar categorías migradas
SELECT '=== CATEGORÍAS EN Desarrollo Web & E-commerce ===' as info;
SELECT c.id, c.name, s.name as silo
FROM d_seo_admin_categories c
JOIN d_seo_admin_silos s ON c.silo_id = s.id
WHERE s.name = 'Desarrollo Web & E-commerce';

-- 6. Eliminar silo duplicado "Desarrollo Web"
SELECT '=== ELIMINANDO SILO DUPLICADO ===' as info;
DELETE FROM d_seo_admin_silos WHERE name = 'Desarrollo Web';

-- 7. Verificar resultado final
SELECT '=== ESTADO FINAL DE SILOS ===' as info;
SELECT id, name FROM d_seo_admin_silos ORDER BY name;

-- 8. Verificar conteo de keywords por silo
SELECT '=== CONTEO DE KEYWORDS POR SILO ===' as info;
SELECT 
    s.name as silo,
    COUNT(DISTINCT c.id) as categorias,
    COUNT(DISTINCT p.id) as paginas,
    COUNT(DISTINCT ka.keyword_id) as keywords_asignadas
FROM d_seo_admin_silos s
LEFT JOIN d_seo_admin_categories c ON c.silo_id = s.id
LEFT JOIN d_seo_admin_pages p ON p.category_id = c.id
LEFT JOIN d_seo_admin_keyword_assignments ka ON ka.page_id = p.id
GROUP BY s.id, s.name
ORDER BY s.name;

SELECT '=== FIX COMPLETADO ===' as info;
