-- ============================================================================
-- Check Activity Feed Triggers
-- ============================================================================

-- Check triggers on activity_feed table
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  TRIM(
    CASE WHEN (t.tgtype >> 2) & 1 = 1 THEN 'INSERT ' ELSE '' END ||
    CASE WHEN (t.tgtype >> 4) & 1 = 1 THEN 'UPDATE ' ELSE '' END ||
    CASE WHEN (t.tgtype >> 3) & 1 = 1 THEN 'DELETE ' ELSE '' END
  ) AS events,
  pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'activity_feed'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Get function source for activity feed functions
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_source
FROM pg_proc p
WHERE p.proname LIKE '%activity%'
  AND pg_get_functiondef(p.oid) LIKE '%NEW.status%';
