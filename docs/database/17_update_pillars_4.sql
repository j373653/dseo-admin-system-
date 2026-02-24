-- Script para consultar y actualizar categorías según los 4 pilares
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estructura actual de categorías por silo
SELECT 
    s.name as silo,
    c.name as category,
    COUNT(DISTINCT p.id) as pages
FROM d_seo_admin_silos s
LEFT JOIN d_seo_admin_categories c ON c.silo_id = s.id
LEFT JOIN d_seo_admin_pages p ON p.category_id = c.id
GROUP BY s.id, c.id
ORDER BY s.name, pages DESC;

-- 2. Contar total de categorías
SELECT COUNT(*) as total_categories FROM d_seo_admin_categories;

-- 3. Si hay muchas categorías duplicadas, este script las limpia
-- Descomenta las siguientes líneas para ejecutar:

-- DELETE FROM d_seo_admin_categories CASCADE;
-- DELETE FROM d_seo_admin_pages CASCADE;
-- DELETE FROM d_seo_admin_silos CASCADE;

-- 4. Insertar los 4 pilares (descomenta para ejecutar):
/*
INSERT INTO d_seo_admin_silos (name, description, slug, is_pillar) VALUES
('Desarrollo Web & E-commerce', 'Desarrollo de sitios web, tiendas online, WordPress y mantenimiento', 'desarrollo-web-ecommerce', true),
('Aplicaciones & Software', 'Desarrollo de apps móviles, apps de escritorio y PWAs', 'aplicaciones-software', true),
('IA & Automatizaciones', 'Inteligencia artificial, chatbots y automatizaciones', 'ia-automatizaciones', true),
('SEO & Marketing Digital', 'Posicionamiento web, SEO técnico, local y analítica', 'seo-marketing-digital', true);
*/
