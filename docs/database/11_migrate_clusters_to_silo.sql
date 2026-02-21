-- Migrate existing Gemini clusters to SILO structure (Silo -> Categories -> Pages)
-- Note: This is a data migration script. Run after creating SILO tables.
-- It creates a single SILO 'Cluster IA', one Category per existing cluster, and a Page per cluster
-- with the cluster keywords stored as main/secondary keywords. Keyword-to-page mappings are stored in assignments.

DO $$ DECLARE
  silo_id UUID;
  cat_id UUID;
  page_id UUID;
  cl RECORD;
  kw RECORD;
  slug TEXT;
BEGIN
  -- Create the SILO for all clusters
  INSERT INTO public.d_seo_admin_silos (name, description) VALUES ('Cluster IA', 'Migrated clusters to SILO structure') RETURNING id INTO silo_id;

  -- Iterate clusters
  FOR cl IN SELECT id, name FROM public.d_seo_admin_keyword_clusters LOOP
    -- Create a category per cluster
    INSERT INTO public.d_seo_admin_categories (silo_id, name, description) VALUES (silo_id, cl.name, 'Migrated cluster') RETURNING id INTO cat_id;

    -- Slug for URL target based on cluster name
    slug := regexp_replace(lower(cl.name), '[^a-z0-9]+', '-', 'g');

    -- Reset page_id for this cluster
    page_id := NULL;

    -- Iterate all keywords belonging to this cluster
    FOR kw IN SELECT id, keyword FROM public.d_seo_admin_raw_keywords WHERE cluster_id = cl.id ORDER BY created_at LOOP
      -- Create page on first keyword, others will be assigned to the same page
      IF page_id IS NULL THEN
        INSERT INTO public.d_seo_admin_pages (
          silo_id, category_id, main_keyword, url_target, title, is_pillar, content_type_target, notes, pillar_data
        ) VALUES (
          silo_id,
          cat_id,
          kw.keyword,
          '/servicios/seo/' || slug,
          cl.name,
          false,
          'blog',
          'Migrated page from cluster',
          '{}'::jsonb
        ) RETURNING id INTO page_id;
      END IF;

      -- Map keyword to the page
      INSERT INTO public.d_seo_admin_keyword_assignments (keyword_id, page_id, assigned_at) VALUES (kw.id, page_id, NOW());
    END LOOP;
  END LOOP;
END $$ LANGUAGE plpgsql;

SELECT 'Migration to SILO tables completed' AS status;
