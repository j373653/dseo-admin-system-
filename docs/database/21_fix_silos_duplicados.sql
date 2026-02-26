-- ============================================================================
-- FIX: Eliminar silo duplicado "Desarrollo Web" (v2)
-- Fecha: 2026-02-26
-- ============================================================================

-- 1. Ver estado actual de silos
SELECT '=== ESTADO ACTUAL DE SILOS ===' as info;
SELECT id, name FROM d_seo_admin_silos ORDER BY name;

-- 2. Obtener IDs de los silos relevantes
SELECT '=== OBTENIENDO IDs ===' as info;
SELECT id, name FROM d_seo_admin_silos 
WHERE name LIKE 'Desarrollo Web%' OR name = 'Desarrollo Web';

-- 3. Ver páginas que tienen silo_id directo
SELECT '=== PÁGINAS CON SILO_ID DIRECTO ===' as info;
SELECT p.id, p.main_keyword, p.silo_id, s.name as silo_name
FROM d_seo_admin_pages p
JOIN d_seo_admin_silos s ON p.silo_id = s.id
WHERE s.name = 'Desarrollo Web'
OR s.name LIKE 'Desarrollo Web%';

-- 4. Obtener IDs necesarios
DO $$
DECLARE
    dw_silo_id UUID;
    dwecom_silo_id UUID;
    dw_cat_id UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO dw_silo_id FROM d_seo_admin_silos WHERE name = 'Desarrollo Web';
    SELECT id INTO dwecom_silo_id FROM d_seo_admin_silos WHERE name = 'Desarrollo Web & E-commerce';
    
    RAISE NOTICE 'Desarrollo Web ID: %', dw_silo_id;
    RAISE NOTICE 'Desarrollo Web & E-commerce ID: %', dwecom_silo_id;
    
    IF dw_silo_id IS NOT NULL AND dwecom_silo_id IS NOT NULL THEN
        -- 4.1 Migrar páginas con silo_id directo
        UPDATE d_seo_admin_pages 
        SET silo_id = dwecom_silo_id
        WHERE silo_id = dw_silo_id;
        RAISE NOTICE 'Páginas migradas';
        
        -- 4.2 Migrar categorías (esto también migrará sus páginas por FK)
        UPDATE d_seo_admin_categories 
        SET silo_id = dwecom_silo_id
        WHERE silo_id = dw_silo_id;
        RAISE NOTICE 'Categorías migradas';
        
        -- 4.3 Eliminar silo duplicado
        DELETE FROM d_seo_admin_silos WHERE id = dw_silo_id;
        RAISE NOTICE 'Silo duplicado eliminado';
    ELSE
        RAISE NOTICE 'No se encontró alguno de los silos';
    END IF;
END $$;

-- 5. Verificar resultado final
SELECT '=== ESTADO FINAL DE SILOS ===' as info;
SELECT id, name FROM d_seo_admin_silos ORDER BY name;

-- 6. Verificar conteo de keywords por silo
SELECT '=== CONTEO POR SILO ===' as info;
SELECT 
    s.name as silo,
    COUNT(DISTINCT c.id) as categorias,
    COUNT(DISTINCT p.id) as paginas,
    COUNT(DISTINCT ka.keyword_id) as keywords_asignadas
FROM d_seo_admin_silos s
LEFT JOIN d_seo_admin_categories c ON c.silo_id = s.id
LEFT JOIN d_seo_admin_pages p ON p.category_id = c.id OR p.silo_id = s.id
LEFT JOIN d_seo_admin_keyword_assignments ka ON ka.page_id = p.id
GROUP BY s.id, s.name
ORDER BY s.name;

SELECT '=== FIX COMPLETADO ===' as info;
