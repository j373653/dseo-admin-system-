-- Fase 5: Tabla de páginas del sitemap
-- Almacena las URLs existentes del sitemap con su metadata

CREATE TABLE IF NOT EXISTS public.d_seo_admin_sitemap_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(255) UNIQUE NOT NULL,
    path VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    keywords_target TEXT[],
    status VARCHAR(20) DEFAULT 'protected',
    content_type VARCHAR(20),
    parent_url VARCHAR(255),
    last_analyzed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sitemap_pages_url ON public.d_seo_admin_sitemap_pages(url);
CREATE INDEX IF NOT EXISTS idx_sitemap_pages_type ON public.d_seo_admin_sitemap_pages(content_type);

-- Desactivar RLS
ALTER TABLE public.d_seo_admin_sitemap_pages DISABLE ROW LEVEL SECURITY;

-- Insertar páginas del sitemap actual (18 URLs protegidas)
INSERT INTO public.d_seo_admin_sitemap_pages (url, path, title, content_type, status) VALUES
('https://d-seo.es/', '/', 'D-SEO - Agencia de Marketing Digital', 'home', 'protected'),
('https://d-seo.es/servicios/', '/servicios/', 'Servicios de Desarrollo Web y Marketing Digital', 'service', 'protected'),
('https://d-seo.es/servicios/sitios-web/', '/servicios/sitios-web/', 'Desarrollo de Sitios Web Profesionales', 'service', 'protected'),
('https://d-seo.es/servicios/sitios-web/legal/', '/servicios/sitios-web/legal/', 'Webs Legales y de Despachos', 'service', 'protected'),
('https://d-seo.es/servicios/sitios-web/wordpress/', '/servicios/sitios-web/wordpress/', 'Desarrollo WordPress Profesional', 'service', 'protected'),
('https://d-seo.es/servicios/ecommerce/', '/servicios/ecommerce/', 'Tiendas Online y E-commerce', 'service', 'protected'),
('https://d-seo.es/servicios/ia/', '/servicios/ia/', 'Inteligencia Artificial para Empresas', 'service', 'protected'),
('https://d-seo.es/servicios/apps/', '/servicios/apps/', 'Desarrollo de Aplicaciones Móviles', 'service', 'protected'),
('https://d-seo.es/servicios/seo/', '/servicios/seo/', 'SEO y Posicionamiento Web', 'service', 'protected'),
('https://d-seo.es/servicios/seo/local/', '/servicios/seo/local/', 'SEO Local para Negocios', 'service', 'protected'),
('https://d-seo.es/servicios/seo/ecommerce/', '/servicios/seo/ecommerce/', 'SEO para Tiendas Online', 'service', 'protected'),
('https://d-seo.es/servicios/seo/tecnico/', '/servicios/seo/tecnico/', 'SEO Técnico y Auditorías', 'service', 'protected'),
('https://d-seo.es/servicios/seo/keyword-research/', '/servicios/seo/keyword-research/', 'Keyword Research y Análisis de Palabras Clave', 'service', 'protected'),
('https://d-seo.es/servicios/sectores/', '/servicios/sectores/', 'Soluciones por Sectores', 'service', 'protected'),
('https://d-seo.es/legal/aviso-legal/', '/legal/aviso-legal/', 'Aviso Legal', 'legal', 'protected'),
('https://d-seo.es/legal/privacidad/', '/legal/privacidad/', 'Política de Privacidad', 'legal', 'protected'),
('https://d-seo.es/legal/cookies/', '/legal/cookies/', 'Política de Cookies', 'legal', 'protected')
ON CONFLICT (url) DO NOTHING;

SELECT 'Tabla d_seo_admin_sitemap_pages creada correctamente' as status;
