-- Script: Tablas SEO para schema dseo_admin
-- FASES 3-5: Keywords, Clusters, Search Console, Calendario

-- ============================================
-- FUNCIÓN: update_updated_at_column (si no existe)
-- ============================================
CREATE OR REPLACE FUNCTION dseo_admin.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLA: raw_keywords
-- Almacena keywords importadas desde CSVs
-- ============================================
CREATE TABLE IF NOT EXISTS dseo_admin.raw_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255) NOT NULL,
    search_volume INTEGER,
    keyword_difficulty INTEGER,
    cpc DECIMAL(8,2),
    competition DECIMAL(3,2),
    source_tool VARCHAR(50), -- 'kwfinder', 'ahrefs', 'semrush', etc.
    source_file VARCHAR(100),
    import_batch VARCHAR(50),
    import_date DATE DEFAULT CURRENT_DATE,
    raw_data JSONB, -- Datos crudos del CSV
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_keywords_processed ON dseo_admin.raw_keywords(processed);
CREATE INDEX IF NOT EXISTS idx_raw_keywords_volume ON dseo_admin.raw_keywords(search_volume) WHERE search_volume > 0;
CREATE INDEX IF NOT EXISTS idx_raw_keywords_keyword ON dseo_admin.raw_keywords(keyword);

COMMENT ON TABLE dseo_admin.raw_keywords IS 'Keywords importadas desde CSVs sin procesar';

-- ============================================
-- TABLA: keyword_clusters
-- Agrupaciones semánticas de keywords
-- ============================================
CREATE TABLE IF NOT EXISTS dseo_admin.keyword_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_name VARCHAR(100) NOT NULL,
    main_keyword VARCHAR(255),
    search_volume_total INTEGER DEFAULT 0,
    difficulty_avg INTEGER,
    content_strategy TEXT,
    pillar_url VARCHAR(255),
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clusters_priority ON dseo_admin.keyword_clusters(priority DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON dseo_admin.keyword_clusters(status);

COMMENT ON TABLE dseo_admin.keyword_clusters IS 'Clusters de keywords temáticamente relacionadas';

-- ============================================
-- TABLA: keywords_enriched
-- Keywords procesadas con análisis de intención
-- ============================================
CREATE TABLE IF NOT EXISTS dseo_admin.keywords_enriched (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_keyword_id UUID REFERENCES dseo_admin.raw_keywords(id),
    keyword VARCHAR(255) UNIQUE NOT NULL,
    search_volume INTEGER,
    keyword_difficulty INTEGER,
    cpc DECIMAL(8,2),
    
    -- Análisis de intención
    search_intent VARCHAR(20) CHECK (search_intent IN ('informational', 'commercial', 'transactional', 'navigational', 'unknown')),
    intent_confidence DECIMAL(3,2),
    
    -- Clustering
    cluster_id UUID REFERENCES dseo_admin.keyword_clusters(id),
    cluster_main BOOLEAN DEFAULT FALSE,
    
    -- Estrategia de contenido
    content_type VARCHAR(20) CHECK (content_type IN ('pillar', 'supporting', 'service_page', 'landing_local', 'comparison', 'blog')),
    priority_score DECIMAL(5,2),
    
    -- Tracking de posiciones
    assigned_url VARCHAR(255),
    content_status VARCHAR(20) DEFAULT 'pending',
    current_position DECIMAL(4,1),
    current_clicks INTEGER,
    current_impressions INTEGER,
    current_ctr DECIMAL(4,3),
    
    -- Metadatos
    source_tool VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keywords_enriched_cluster ON dseo_admin.keywords_enriched(cluster_id);
CREATE INDEX IF NOT EXISTS idx_keywords_enriched_status ON dseo_admin.keywords_enriched(content_status);
CREATE INDEX IF NOT EXISTS idx_keywords_enriched_priority ON dseo_admin.keywords_enriched(priority_score DESC) WHERE content_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_keywords_enriched_intent ON dseo_admin.keywords_enriched(search_intent);
CREATE INDEX IF NOT EXISTS idx_keywords_enriched_type ON dseo_admin.keywords_enriched(content_type);

COMMENT ON TABLE dseo_admin.keywords_enriched IS 'Keywords procesadas con intención, cluster y estrategia';

-- ============================================
-- TABLA: search_console_data
-- Datos de Google Search Console
-- ============================================
CREATE TABLE IF NOT EXISTS dseo_admin.search_console_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    query VARCHAR(255) NOT NULL,
    page VARCHAR(255),
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr DECIMAL(5,4),
    position DECIMAL(4,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, query, page)
);

CREATE INDEX IF NOT EXISTS idx_sc_data_date ON dseo_admin.search_console_data(date);
CREATE INDEX IF NOT EXISTS idx_sc_data_query ON dseo_admin.search_console_data(query);
CREATE INDEX IF NOT EXISTS idx_sc_data_page ON dseo_admin.search_console_data(page);
CREATE INDEX IF NOT EXISTS idx_sc_data_date_query ON dseo_admin.search_console_data(date, query);

COMMENT ON TABLE dseo_admin.search_console_data IS 'Datos de rendimiento de Google Search Console';

-- ============================================
-- TABLA: content_calendar
-- Calendario editorial
-- ============================================
CREATE TABLE IF NOT EXISTS dseo_admin.content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_id UUID REFERENCES dseo_admin.keywords_enriched(id),
    content_type VARCHAR(20),
    title VARCHAR(255),
    outline JSONB,
    assigned_writer VARCHAR(100),
    due_date DATE,
    publish_date DATE,
    status VARCHAR(20) DEFAULT 'planned',
    url_published VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_status ON dseo_admin.content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_calendar_due_date ON dseo_admin.content_calendar(due_date);
CREATE INDEX IF NOT EXISTS idx_calendar_publish_date ON dseo_admin.content_calendar(publish_date);

COMMENT ON TABLE dseo_admin.content_calendar IS 'Calendario editorial de contenidos';

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
-- Primero eliminamos si existen (para evitar duplicados)
DROP TRIGGER IF EXISTS update_keywords_enriched_updated_at ON dseo_admin.keywords_enriched;
DROP TRIGGER IF EXISTS update_keyword_clusters_updated_at ON dseo_admin.keyword_clusters;
DROP TRIGGER IF EXISTS update_content_calendar_updated_at ON dseo_admin.content_calendar;

-- Luego creamos los triggers
CREATE TRIGGER update_keywords_enriched_updated_at 
    BEFORE UPDATE ON dseo_admin.keywords_enriched 
    FOR EACH ROW 
    EXECUTE FUNCTION dseo_admin.update_updated_at_column();

CREATE TRIGGER update_keyword_clusters_updated_at 
    BEFORE UPDATE ON dseo_admin.keyword_clusters 
    FOR EACH ROW 
    EXECUTE FUNCTION dseo_admin.update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at 
    BEFORE UPDATE ON dseo_admin.content_calendar 
    FOR EACH ROW 
    EXECUTE FUNCTION dseo_admin.update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE dseo_admin.raw_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE dseo_admin.keyword_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE dseo_admin.keywords_enriched ENABLE ROW LEVEL SECURITY;
ALTER TABLE dseo_admin.search_console_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE dseo_admin.content_calendar ENABLE ROW LEVEL SECURITY;

-- Permitir acceso completo a usuarios autenticados
CREATE POLICY "Allow authenticated users full access" ON dseo_admin.raw_keywords
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access" ON dseo_admin.keyword_clusters
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access" ON dseo_admin.keywords_enriched
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access" ON dseo_admin.search_console_data
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access" ON dseo_admin.content_calendar
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Confirmación
SELECT 'Tablas SEO creadas correctamente' as status;
