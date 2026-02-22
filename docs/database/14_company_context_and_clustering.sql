-- Migración 14: Company Context + Semantic Clustering
-- Fecha: 2026-02-22

-- 1. Tabla de contexto empresarial
CREATE TABLE IF NOT EXISTS d_seo_admin_company_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Añadir campos para clustering semántico a raw_keywords
ALTER TABLE d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS semantic_cluster_id UUID,
ADD COLUMN IF NOT EXISTS clustering_confidence FLOAT,
ADD COLUMN IF NOT EXISTS clustering_step VARCHAR(20),
ADD COLUMN IF NOT EXISTS discard_reason TEXT;

-- 3. Insertar datos iniciales de contexto
INSERT INTO d_seo_admin_company_context (key, value) VALUES
('theme', '"Desarrollo Web, SEO, Marketing Digital, Apps, IA"'),
('services', '[
  "Creación sitios web (WordPress y a medida)",
  "Tiendas online (WooCommerce y custom)",
  "Mantenimiento y optimización web",
  "SEO (general, local, ecommerce, técnico)",
  "Keyword Research",
  "Apps móviles y PWAs",
  "Inteligencia Artificial y Chatbots",
  "Cumplimiento RGPD/LSSI"
]'),
('target_companies', '["PYMEs", "Autónomos", "Startups"]'),
('sitemap_urls', '[
  "https://d-seo.es/",
  "https://d-seo.es/servicios/",
  "https://d-seo.es/servicios/sitios-web/",
  "https://d-seo.es/servicios/sitios-web/legal/",
  "https://d-seo.es/servicios/sitios-web/wordpress/",
  "https://d-seo.es/servicios/ecommerce/",
  "https://d-seo.es/servicios/ia/",
  "https://d-seo.es/servicios/apps/",
  "https://d-seo.es/servicios/seo/",
  "https://d-seo.es/servicios/seo/local/",
  "https://d-seo.es/servicios/seo/ecommerce/",
  "https://d-seo.es/servicios/seo/tecnico/",
  "https://d-seo.es/servicios/seo/keyword-research/",
  "https://d-seo.es/servicios/sectores/"
]'),
('discard_topics', '[
  "redes sociales",
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "ads",
  "google ads",
  "publicidad",
  "marketing social",
  "hosting",
  "dominios",
  "fotografía",
  "diseño gráfico",
  "community manager",
  "sem",
  "ppc"
]')
ON CONFLICT (key) DO NOTHING;

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_raw_keywords_clustering_step 
ON d_seo_admin_raw_keywords(clustering_step);

CREATE INDEX IF NOT EXISTS idx_raw_keywords_semantic_cluster 
ON d_seo_admin_raw_keywords(semantic_cluster_id);

-- 5. Disable RLS for development (re-enable in production)
ALTER TABLE d_seo_admin_company_context DISABLE ROW LEVEL SECURITY;
