-- ============================================================================
-- Check Triggers on Notifications Table
-- ============================================================================

SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  CASE t.tgtype & 66
    WHEN 2 THEN 'BEFORE'
    ELSE 'AFTER'
  END AS timing,
  TRIM(
    CASE WHEN (t.tgtype >> 2) & 1 = 1 THEN 'INSERT ' ELSE '' END ||
    CASE WHEN (t.tgtype >> 4) & 1 = 1 THEN 'UPDATE ' ELSE '' END ||
    CASE WHEN (t.tgtype >> 3) & 1 = 1 THEN 'DELETE ' ELSE '' END
  ) AS events,
  pg_get_functiondef(p.oid) AS function_source
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'notifications'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Check if notifications table has a status column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
  AND table_schema = 'public'
ORDER BY ordinal_position;
