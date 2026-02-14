-- ============================================================================
-- Find Trigger Mismatches: Functions checking status on wrong tables
-- ============================================================================

-- List all triggers with their table and function details
WITH trigger_info AS (
  SELECT 
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    TRIM(
      CASE WHEN (t.tgtype >> 2) & 1 = 1 THEN 'INSERT ' ELSE '' END ||
      CASE WHEN (t.tgtype >> 4) & 1 = 1 THEN 'UPDATE ' ELSE '' END ||
      CASE WHEN (t.tgtype >> 3) & 1 = 1 THEN 'DELETE ' ELSE '' END
    ) AS events,
    pg_get_functiondef(p.oid) AS function_source,
    CASE WHEN pg_get_functiondef(p.oid) LIKE '%NEW.status%' OR pg_get_functiondef(p.oid) LIKE '%OLD.status%'
      THEN true 
      ELSE false 
    END AS references_status
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_proc p ON t.tgfoid = p.oid
  WHERE NOT t.tgisinternal
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
),
tables_with_status AS (
  SELECT DISTINCT table_name
  FROM information_schema.columns
  WHERE column_name = 'status'
    AND table_schema = 'public'
)
SELECT 
  ti.table_name,
  ti.trigger_name,
  ti.function_name,
  ti.events,
  ti.references_status,
  CASE WHEN tws.table_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS table_has_status_column,
  CASE 
    WHEN ti.references_status = true AND tws.table_name IS NULL THEN '❌ MISMATCH - Function checks status but table has no status column!'
    WHEN ti.references_status = true AND tws.table_name IS NOT NULL THEN '✅ OK'
    ELSE '✅ OK (no status check)'
  END AS validation
FROM trigger_info ti
LEFT JOIN tables_with_status tws ON ti.table_name = tws.table_name
WHERE ti.references_status = true OR ti.table_name IN ('tasks', 'notifications', 'activity_feed')
ORDER BY 
  CASE WHEN ti.references_status = true AND tws.table_name IS NULL THEN 0 ELSE 1 END,
  ti.table_name, 
  ti.trigger_name;
