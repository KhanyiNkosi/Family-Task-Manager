-- ============================================================================
-- List ALL Triggers by Table
-- ============================================================================

SELECT 
  c.relname AS table_name,
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
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY c.relname, t.tgname;

-- Which tables have which columns
SELECT 
  table_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_name IN ('tasks', 'notifications', 'activity_feed', 'profiles', 'families')
  AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
