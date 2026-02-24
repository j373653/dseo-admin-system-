-- =====================================================
-- CONSOLIDACIÓN DE SILOS - Script de Reorganización
-- =====================================================
-- Este script consolida los 71 silos actuales en una estructura optimizada
-- Ejecutar en orden: 1) Crear nuevos silos 2) Migrar categorías 3) Eliminar duplicados
-- =====================================================

-- =====================================================
-- FASE 1: CREAR SILOS PRINCIPALES (si no existen)
-- =====================================================

-- Verificar silos principales que deben existir
-- Silo 1: Desarrollo Web (ya existe con ID: 68e7754c-752e-4638-86a1-f0ff3bac98ff)
-- Silo 2: SEO (ya existe con ID: bf2f9491-3608-48c8-b2d7-c6ce9e973203)
-- Silo 3: Inteligencia Artificial (ya existe con ID: 67761fc3-660a-4246-9900-2efc7fda6574)
-- Silo 4: Marketing Digital (ya existe con ID: d49fda15-6215-4e05-808a-2b2fb3bf3edb)

-- =====================================================
-- FASE 2: MOVER CATEGORÍAS A SILOS CORRECTOS
-- =====================================================

-- --- WORDPRESS → Desarrollo Web ---
UPDATE d_seo_admin_categories 
SET silo_id = '68e7754c-752e-4638-86a1-f0ff3bac98ff'
WHERE silo_id IN (
    SELECT id FROM d_seo_admin_silos 
    WHERE name LIKE '%WordPress%' OR name LIKE '%wordpress%'
);

-- --- SEO: Consolidar todos los silos de SEO en uno solo ---
UPDATE d_seo_admin_categories 
SET silo_id = 'bf2f9491-3608-48c8-b2d7-c6ce9e973203'
WHERE silo_id IN (
    '36b6ed7c-e6fa-4591-b533-e1906b90c9a8', -- Servicios SEO y Marketing Digital
    '26f61e78-d1c2-4ae9-be32-6fba98bf9b39', -- Servicios de Posicionamiento SEO
    'a796c91d-7950-48e2-88bd-75d66ad3efe6', -- Servicios SEO
    'deaa3bea-3bfc-465c-91a2-cf9ddb8ecaa1', -- Servicios SEO Avanzados
    'b70ba06d-49dc-4519-8762-73d4f6c095ee', -- SEO para Plataformas
    '8b32e187-dc6d-4e41-aa89-0d060a83218b', -- Posicionamiento SEO
    'f8349777-3ace-46a6-9c19-dc42e050b3b2', -- Posicionamiento SEO Profesional
    '05096ab4-9a52-441c-9b2c-fd7d16cb9380', -- SEO y Marketing Digital
    '8bb0cbd0-5a8b-45f0-91c6-2879a5d1af38'  -- Conocimiento SEO y Web
);

-- --- BLOG/RECURSOS → Blog (nuevo o existente) ---
-- Primero verificamos si existe el silo Blog
-- UPDATE d_seo_admin_categories 
-- SET silo_id = (SELECT id FROM d_seo_admin_silos WHERE name = 'Blog' LIMIT 1)
-- WHERE silo_id IN (
--     SELECT id FROM d_seo_admin_silos WHERE name LIKE '%Blog%'
-- );

-- =====================================================
-- FASE 3: ELIMINAR SILOS DUPLICADOS/ÓRFANOS
-- =====================================================

-- Lista de silos a eliminar (duplicados o muy específicos)
-- Estos silos ya han tenido sus categorías migradas

DELETE FROM d_seo_admin_silos WHERE name LIKE '%WordPress%' AND id != '053e47e4-af2f-4f4d-ba0f-a743442d94e4';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog Técnico de WordPress';
DELETE FROM d_seo_admin_silos WHERE name = 'Guía WordPress (Blog)';
DELETE FROM d_seo_admin_silos WHERE name = 'Guía de WordPress (Blog)';
DELETE FROM d_seo_admin_silos WHERE name = 'Guías WordPress';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog de WordPress';
DELETE FROM d_seo_admin_silos WHERE name = 'WordPress Avanzado';
DELETE FROM d_seo_admin_silos WHERE name = 'Soporte y Guías WordPress';

DELETE FROM d_seo_admin_silos WHERE name = 'Servicios SEO y Marketing Digital';
DELETE FROM d_seo_admin_silos WHERE name = 'Servicios de Posicionamiento SEO';
DELETE FROM d_seo_admin_silos WHERE name = 'Servicios SEO';
DELETE FROM d_seo_admin_silos WHERE name = 'Servicios SEO Avanzados';
DELETE FROM d_seo_admin_silos WHERE name = 'SEO para Plataformas';
DELETE FROM d_seo_admin_silos WHERE name = 'Posicionamiento SEO';
DELETE FROM d_seo_admin_silos WHERE name = 'Posicionamiento SEO Profesional';
DELETE FROM d_seo_admin_silos WHERE name = 'SEO y Marketing Digital';
DELETE FROM d_seo_admin_silos WHERE name = 'Conocimiento SEO y Web';

DELETE FROM d_seo_admin_silos WHERE name = 'Blog de Marketing Digital';
DELETE FROM d_seo_admin_silos WHERE name = 'Marketing Digital para Pymes';

DELETE FROM d_seo_admin_silos WHERE name = 'Blog de Diseño Web';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog de Diseño y Desarrollo Web';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog y Recursos';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog y Recursos Web';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog de Analítica Web';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog de SEO';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog de Marketing y Diseño Web';
DELETE FROM d_seo_admin_silos WHERE name = 'Recursos y Blog';
DELETE FROM d_seo_admin_silos WHERE name = 'Recursos y Blog SEO';
DELETE FROM d_seo_admin_silos WHERE name = 'Blog y Recursos de Aprendizaje';

-- =====================================================
-- FASE 4: VERIFICACIÓN
-- =====================================================

-- Contar silos restantes
SELECT 'Silos restantes:' as info, COUNT(*) as total FROM d_seo_admin_silos;

-- Contar categorías por silo
SELECT s.name as silo, COUNT(c.id) as categorias 
FROM d_seo_admin_silos s 
LEFT JOIN d_seo_admin_categories c ON c.silo_id = s.id 
GROUP BY s.name 
ORDER BY categorias DESC;
