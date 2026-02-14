-- ============================================================================
-- Check Trigger Definitions - Find Misconfigured Triggers
-- ============================================================================

SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name,
  CASE t.tgtype & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END AS level,
  CASE t.tgtype & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  ARRAY(
    SELECT 
      CASE 
        WHEN (t.tgtype >> 2) & 1 = 1 THEN 'INSERT'
        ELSE NULL
      END
    UNION ALL
    SELECT 
      CASE 
        WHEN (t.tgtype >> 3) & 1 = 1 THEN 'DELETE'
        ELSE NULL
      END
    UNION ALL
    SELECT 
      CASE 
        WHEN (t.tgtype >> 4) & 1 = 1 THEN 'UPDATE'
        ELSE NULL
      END
  )::text[] AS events,
  pg_get_triggerdef(t.oid) AS full_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'tasks'
  AND NOT t.tgisinternal
ORDER BY t.tgname;
