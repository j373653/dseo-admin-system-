-- Script para limpiar clusters duplicados antes de aplicar índice único
-- Ejecutar ANTES de descomentar el índice único en 07_fase0_papelera_persistencia_jerarquia.sql

-- ============================================
-- 1. IDENTIFICAR DUPLICADOS
-- ============================================

-- Ver clusters duplicados (ignorando mayúsculas/minúsculas)
SELECT 
    LOWER(name) as normalized_name,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(name) as names,
    ARRAY_AGG(id) as ids
FROM public.d_seo_admin_keyword_clusters
GROUP BY LOWER(name)
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================
-- 2. VER DETALLE DE DUPLICADOS ESPECÍFICOS
-- ============================================

-- Ejemplo: Si "cortisa" está duplicado, ver detalles:
-- SELECT * FROM public.d_seo_admin_keyword_clusters 
-- WHERE LOWER(name) = 'cortisa';

-- ============================================
-- 3. ESTRATEGIAS PARA LIMPIAR
-- ============================================

-- Opción A: Mantener el cluster más reciente, eliminar el resto
-- (Recomendada si los duplicados son exactamente iguales)

-- Opción B: Fusionar keywords de clusters duplicados en uno solo
-- (Recomendada si ambos clusters tienen keywords asignadas)

-- Opción C: Renombrar uno de los duplicados
-- (Ej: "cortisa" → "cortisa (2)")

-- ============================================
-- 4. SCRIPT DE LIMPIEZA AUTOMÁTICA (OPCIÓN A)
-- ============================================

-- DESCOMENTAR Y EJECUTAR CON PRECAUCIÓN
-- Esta opción mantiene el cluster más reciente y elimina los duplicados antiguos

/*
WITH duplicates AS (
    SELECT 
        LOWER(name) as normalized_name,
        ARRAY_AGG(id ORDER BY created_at DESC) as ids,
        ARRAY_AGG(created_at ORDER BY created_at DESC) as dates
    FROM public.d_seo_admin_keyword_clusters
    GROUP BY LOWER(name)
    HAVING COUNT(*) > 1
),
ids_to_delete AS (
    SELECT unnest(ids[2:array_length(ids, 1)]) as id_to_delete
    FROM duplicates
)
-- Primero, mover las keywords de los clusters a eliminar al cluster que se mantiene
UPDATE public.d_seo_admin_raw_keywords
SET cluster_id = (
    SELECT ids[1] 
    FROM duplicates d 
    WHERE d.normalized_name = LOWER((
        SELECT name 
        FROM public.d_seo_admin_keyword_clusters 
        WHERE id = public.d_seo_admin_raw_keywords.cluster_id
    ))
)
WHERE cluster_id IN (SELECT id_to_delete FROM ids_to_delete);

-- Luego eliminar los clusters duplicados
DELETE FROM public.d_seo_admin_keyword_clusters
WHERE id IN (
    WITH duplicates AS (
        SELECT 
            LOWER(name) as normalized_name,
            ARRAY_AGG(id ORDER BY created_at DESC) as ids
        FROM public.d_seo_admin_keyword_clusters
        GROUP BY LOWER(name)
        HAVING COUNT(*) > 1
    )
    SELECT unnest(ids[2:array_length(ids, 1)]) as id_to_delete
    FROM duplicates
);
*/

-- ============================================
-- 5. VERIFICAR QUE NO HAY DUPLICADOS
-- ============================================

-- Verificar que ya no hay duplicados
SELECT 
    LOWER(name) as normalized_name,
    COUNT(*) as count
FROM public.d_seo_admin_keyword_clusters
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;

-- Si el resultado está vacío, proceder a crear el índice único:
-- CREATE UNIQUE INDEX idx_clusters_name_unique 
-- ON public.d_seo_admin_keyword_clusters(LOWER(name));

-- ============================================
-- 6. ALTERNATIVA: RENOMBRAR DUPLICADOS (OPCIÓN C)
-- ============================================

-- Si prefieres mantener ambos clusters pero con nombres diferentes:
/*
WITH duplicates AS (
    SELECT 
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at) as rn
    FROM public.d_seo_admin_keyword_clusters
)
UPDATE public.d_seo_admin_keyword_clusters
SET name = name || ' (' || rn || ')'
FROM duplicates
WHERE public.d_seo_admin_keyword_clusters.id = duplicates.id
AND duplicates.rn > 1;
*/

SELECT 'Revisa los duplicados y elige una estrategia de limpieza' as status;
