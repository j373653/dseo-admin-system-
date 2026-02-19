-- Migración Fase 3: Embeddings + Content Strategy
-- Fecha: 2026-02-19

-- Habilitar extensión vector (si no existe)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. EMBEDDINGS DE KEYWORDS
-- ============================================

ALTER TABLE public.d_seo_admin_raw_keywords 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_keywords_embedding 
ON public.d_seo_admin_raw_keywords USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- 2. TABLA DE RELACIONES ENTRE CLUSTERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.d_seo_admin_cluster_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_cluster_id UUID REFERENCES public.d_seo_admin_keyword_clusters(id) ON DELETE CASCADE,
    target_cluster_id UUID REFERENCES public.d_seo_admin_keyword_clusters(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    relation_type VARCHAR(20) NOT NULL CHECK (relation_type IN ('sibling', 'parent', 'child', 'related', 'canibalization', 'internal_link')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cluster_relations_source ON public.d_seo_admin_cluster_relations(source_cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_relations_target ON public.d_seo_admin_cluster_relations(target_cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_relations_type ON public.d_seo_admin_cluster_relations(relation_type);

-- ============================================
-- 3. CONTENT STRATEGY EN CLUSTERS
-- ============================================

ALTER TABLE public.d_seo_admin_keyword_clusters 
ADD COLUMN IF NOT EXISTS content_type_target VARCHAR(20) CHECK (content_type_target IN ('service', 'blog', 'landing', 'unknown')),
ADD COLUMN IF NOT EXISTS priority_score JSONB DEFAULT '{"seo_score": 0, "business_value": 0, "difficulty_score": 0, "volume_score": 0, "final_priority": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_clusters_content_type ON public.d_seo_admin_keyword_clusters(content_type_target);
CREATE INDEX IF NOT EXISTS idx_clusters_priority ON public.d_seo_admin_keyword_clusters(((priority_score->>'final_priority')::int));

-- ============================================
-- 4. CENTROIDE DE CLUSTER (para comparaciones)
-- ============================================

ALTER TABLE public.d_seo_admin_keyword_clusters 
ADD COLUMN IF NOT EXISTS centroid_embedding vector(1536),
ADD COLUMN IF NOT EXISTS keywords_with_embedding INTEGER DEFAULT 0;

-- ============================================
-- 5. FUNCIÓN: Calcular priority score
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_cluster_priority(cluster_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_volume INTEGER;
    avg_difficulty NUMERIC;
    keyword_count INTEGER;
    volume_score INTEGER;
    difficulty_score INTEGER;
    business_value INTEGER;
    final_priority INTEGER;
BEGIN
    -- Obtener métricas del cluster
    SELECT 
        COALESCE(search_volume_total, 0),
        COALESCE(difficulty_avg, 50),
        COALESCE(keyword_count, 0)
    INTO total_volume, avg_difficulty, keyword_count
    FROM public.d_seo_admin_keyword_clusters
    WHERE id = cluster_id;

    -- Calcular scores (0-100)
    -- Volume: normalizar a 0-100 (asumiendo max 50000)
    volume_score = LEAST(100, (total_volume::float / 50000 * 100))::int;
    
    -- Difficulty: menor es mejor
    difficulty_score = 100 - LEAST(100, avg_difficulty::int);
    
    -- Business value: basado en volumen y count
    business_value = LEAST(100, (keyword_count * 2 + volume_score / 2)::int);
    
    -- Priority final: weighted average
    final_priority = (
        (volume_score * 0.30) + 
        (difficulty_score * 0.20) + 
        (business_value * 0.30) + 
        (keyword_count * 2)::int
    )::int;

    RETURN jsonb_build_object(
        'seo_score', volume_score,
        'difficulty_score', difficulty_score,
        'business_value', business_value,
        'keyword_count', keyword_count,
        'final_priority', LEAST(100, final_priority)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FUNCIÓN: Sugerir content type basado en intención
-- ============================================

CREATE OR REPLACE FUNCTION public.suggest_content_type(p_intent VARCHAR, p_content_type VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    -- Mapeo de intent + contentType a content_type_target
    IF p_intent = 'transactional' THEN
        RETURN 'service';
    ELSIF p_intent = 'commercial' AND p_content_type IN ('comparativa', 'review') THEN
        RETURN 'blog';
    ELSIF p_intent = 'informational' AND p_content_type IN ('guia', 'howto', 'definicion') THEN
        RETURN 'blog';
    ELSIF p_intent = 'commercial' AND p_content_type IN ('producto', 'servicio') THEN
        RETURN 'landing';
    ELSIF p_content_type = 'landing' THEN
        RETURN 'landing';
    END IF;
    
    RETURN 'unknown';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FUNCIÓN: Detectar canibalizaciones
-- ============================================

CREATE OR REPLACE FUNCTION public.detect_canibalizations()
RETURNS TABLE (
    source_cluster_id UUID,
    target_cluster_id UUID,
    similarity_score FLOAT,
    source_name VARCHAR,
    target_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.source_cluster_id,
        cr.target_cluster_id,
        cr.similarity_score,
        c1.name as source_name,
        c2.name as target_name
    FROM public.d_seo_admin_cluster_relations cr
    JOIN public.d_seo_admin_keyword_clusters c1 ON c1.id = cr.source_cluster_id
    JOIN public.d_seo_admin_keyword_clusters c2 ON c2.id = cr.target_cluster_id
    WHERE cr.relation_type = 'canibalization'
    ORDER BY cr.similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. VIEW: Dashboard de Estrategia
-- ============================================

CREATE OR REPLACE VIEW public.v_cluster_strategy AS
SELECT 
    c.id,
    c.name,
    c.intent,
    c.keyword_count,
    c.search_volume_total,
    c.difficulty_avg,
    c.is_pillar_page,
    c.content_type_target,
    c.priority_score->>'final_priority' as priority_score,
    c.recommendations,
    COUNT(DISTINCT cr.id) as related_clusters,
    COUNT(DISTINCT CASE WHEN cr.relation_type = 'canibalization' THEN cr.id END) as cannibalization_count
FROM public.d_seo_admin_keyword_clusters c
LEFT JOIN public.d_seo_admin_cluster_relations cr ON cr.source_cluster_id = c.id OR cr.target_cluster_id = c.id
GROUP BY c.id;

-- ============================================
-- MENSAJE DE ÉXITO
-- ============================================

SELECT 'Fase 3: Embeddings + Content Strategy migraciones aplicadas correctamente' as status;
