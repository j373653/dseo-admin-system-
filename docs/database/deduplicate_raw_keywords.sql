-- ============================================================================
-- SCRIPT DE DEDUPLICACIÓN DE KEYWORDS
-- ============================================================================
-- Este script unifica registros duplicados en d_seo_admin_raw_keywords
-- Cada keyword (texto) debería existir una sola vez
-- ============================================================================

BEGIN;

-- ============================================================
-- FASE 1: DIAGNÓSTICO - Ver cuántos duplicados hay
-- ============================================================
SELECT 
    LOWER(TRIM(keyword)) as normalized_keyword,
    COUNT(*) as total_records,
    COUNT(DISTINCT id) as unique_ids,
    COUNT(DISTINCT cluster_id) as unique_clusters,
    ARRAY_AGG(DISTINCT cluster_id) as cluster_ids
FROM public.d_seo_admin_raw_keywords
GROUP BY LOWER(TRIM(keyword))
HAVING COUNT(*) > 1
ORDER BY total_records DESC
LIMIT 20;

-- Contar total de duplicados
SELECT 
    COUNT(*) as duplicate_groups,
    SUM(duplicate_count - 1) as total_duplicate_records
FROM (
    SELECT 
        LOWER(TRIM(keyword)) as normalized_keyword,
        COUNT(*) as duplicate_count
    FROM public.d_seo_admin_raw_keywords
    GROUP BY LOWER(TRIM(keyword))
    HAVING COUNT(*) > 1
) as duplicates;

-- ============================================================
-- FASE 2: IDENTIFICAR REGISTROS "GANADORES"
-- Para cada grupo de duplicados, elegir el que tenga mayor search_volume
-- Si hay empate, elegir el más reciente (mayor created_at)
-- ============================================================

-- Tabla temporal con los registros a eliminar (los no-ganadores)
CREATE TEMP TABLE keywords_to_consolidate AS
WITH ranked_duplicates AS (
    SELECT 
        id,
        keyword,
        search_volume,
        created_at,
        cluster_id,
        status,
        intent,
        LOWER(TRIM(keyword)) as normalized_keyword,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(keyword)) 
            ORDER BY 
                COALESCE(search_volume, 0) DESC,
                created_at DESC
        ) as rank_position
    FROM public.d_seo_admin_raw_keywords
)
SELECT 
    id as duplicate_id,
    keyword as duplicate_keyword,
    normalized_keyword,
    rank_position
FROM ranked_duplicates
WHERE rank_position > 1;

-- Ver qué vamos a eliminar
SELECT * FROM keywords_to_consolidate ORDER BY normalized_keyword LIMIT 20;

-- ============================================================
-- FASE 3: REASIGNAR CLUSTER_ID DE ELIMINADOS A GANADORES
-- ============================================================

-- Para cada keyword duplicada, si el "ganador" no tiene cluster_id pero sí lo tiene el duplicado, transferimos
-- Primero, ver las asignaciones que necesitamos transferir
WITH transfers AS (
    SELECT 
        kdc.duplicate_id,
        kdc.normalized_keyword,
        kw.cluster_id as duplicate_cluster_id,
        kw2.id as winner_id,
        kw2.cluster_id as winner_cluster_id
    FROM keywords_to_consolidate kdc
    JOIN public.d_seo_admin_raw_keywords kw ON kw.id = kdc.duplicate_id
    JOIN public.d_seo_admin_raw_keywords kw2 ON LOWER(TRIM(kw2.keyword)) = kdc.normalized_keyword AND kw2.id != kdc.duplicate_id
    WHERE kw.cluster_id IS NOT NULL 
      AND kw2.cluster_id IS NULL
)
SELECT * FROM transfers;

-- Aplicar las transferencias: actualizar el winner con el cluster_id del duplicado
UPDATE public.d_seo_admin_raw_keywords kw2
SET cluster_id = trans.new_cluster_id
FROM (
    WITH transfers AS (
        SELECT 
            kdc.duplicate_id,
            kdc.normalized_keyword,
            kw.cluster_id as new_cluster_id,
            kw2.id as winner_id
        FROM keywords_to_consolidate kdc
        JOIN public.d_seo_admin_raw_keywords kw ON kw.id = kdc.duplicate_id
        JOIN public.d_seo_admin_raw_keywords kw2 ON LOWER(TRIM(kw2.keyword)) = kdc.normalized_keyword AND kw2.id != kdc.duplicate_id
        WHERE kw.cluster_id IS NOT NULL 
          AND kw2.cluster_id IS NULL
    )
    SELECT winner_id, new_cluster_id FROM transfers
) AS trans
WHERE kw2.id = trans.winner_id;

-- Si el winner ya tiene cluster_id, no hacemos nada (el duplicado simplemente se eliminará)

-- ============================================================
-- FASE 4: ELIMINAR REGISTROS DUPLICADOS (mantener solo winners)
-- ============================================================

-- Verificar cuántos eliminaremos
SELECT COUNT(*) as to_delete FROM keywords_to_consolidate;

-- Eliminar los duplicados (los no-ganadores)
DELETE FROM public.d_seo_admin_raw_keywords
WHERE id IN (SELECT duplicate_id FROM keywords_to_consolidate);

-- ============================================================
-- FASE 5: VERIFICACIÓN
-- ============================================================

-- Verificar que ya no hay duplicados
SELECT 
    LOWER(TRIM(keyword)) as normalized_keyword,
    COUNT(*) as total_records
FROM public.d_seo_admin_raw_keywords
GROUP BY LOWER(TRIM(keyword))
HAVING COUNT(*) > 1
LIMIT 10;

-- Contar keywords sin cluster_id (pendientes)
SELECT status, COUNT(*) 
FROM public.d_seo_admin_raw_keywords 
GROUP BY status;

COMMIT;

-- ============================================================
-- NOTA: Este script debe ejecutarse en Supabase SQL Editor
-- Antes de ejecutar, hacer backup de la tabla:
-- CREATE TABLE public.d_seo_admin_raw_keywords_backup AS SELECT * FROM public.d_seo_admin_raw_keywords;
-- ============================================================
