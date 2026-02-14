-- ============================================================================
-- Diagnose ALL Triggers That Reference 'status'
-- ============================================================================

-- Check all triggers and their source code
SELECT 
  c.relname AS table_name,
  t.tgname AS trigger_name,
  p.proname AS function_name,
  TRIM(
    CASE WHEN (t.tgtype >> 2) & 1 = 1 THEN 'INSERT ' ELSE '' END ||
    CASE WHEN (t.tgtype >> 4) & 1 = 1 THEN 'UPDATE ' ELSE '' END ||
    CASE WHEN (t.tgtype >> 3) & 1 = 1 THEN 'DELETE ' ELSE '' END
  ) AS events,
  pg_get_functiondef(p.oid) AS function_source
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
  AND pg_get_functiondef(p.oid) LIKE '%status%'
ORDER BY c.relname, t.tgname;

-- Also check which tables have a status column
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = 'status'
  AND table_schema = 'public'
ORDER BY table_name;
