-- Migration 18: Clean duplicate keywords and add constraints
-- Date: 2026-02-22
-- Purpose: Fix duplicate keywords in d_seo_admin_raw_keywords and add unique constraint

BEGIN;

-- Step 1: Show current state
SELECT 'Before cleanup:' as status;
SELECT COUNT(*) as total_keywords FROM d_seo_admin_raw_keywords;
SELECT COUNT(DISTINCT LOWER(keyword)) as unique_keywords FROM d_seo_admin_raw_keywords;

-- Step 2: Create a temporary table with unique keywords (keeping the one with highest search_volume or first id)
CREATE TEMP TABLE unique_keywords AS
SELECT MIN(id) as id, keyword, search_volume, difficulty, cpc, source, status, intent, raw_data, discarded_at, discarded_reason
FROM d_seo_admin_raw_keywords
GROUP BY LOWER(keyword);

-- Step 3: Delete all keywords and re-insert unique ones
TRUNCATE TABLE d_seo_admin_raw_keywords CASCADE;

-- Step 4: Insert unique keywords back
INSERT INTO d_seo_admin_raw_keywords (id, keyword, search_volume, difficulty, cpc, source, status, intent, raw_data, discarded_at, discarded_reason)
SELECT id, keyword, search_volume, difficulty, cpc, source, status, intent, raw_data, discarded_at, discarded_reason
FROM unique_keywords;

-- Step 5: Verify no duplicates remain
SELECT 'After cleanup:' as status;
SELECT COUNT(*) as total_keywords FROM d_seo_admin_raw_keywords;
SELECT keyword, COUNT(*) as total 
FROM d_seo_admin_raw_keywords 
GROUP BY keyword 
HAVING COUNT(*) > 1;

-- Step 6: Add unique constraint on keyword column to prevent future duplicates
ALTER TABLE d_seo_admin_raw_keywords 
ADD CONSTRAINT unique_keyword_lower EXCLUDE (LOWER(keyword) WITH =);

-- Step 7: Add unique constraint on keyword_assignments to prevent duplicate assignments
ALTER TABLE d_seo_admin_keyword_assignments 
ADD CONSTRAINT unique_keyword_page UNIQUE (keyword_id, page_id);

-- Step 8: Verify status distribution
SELECT 'Final status distribution:' as status;
SELECT status, COUNT(*) FROM d_seo_admin_raw_keywords GROUP BY status;

COMMIT;

SELECT 'Migration 18 completed successfully' as result;
