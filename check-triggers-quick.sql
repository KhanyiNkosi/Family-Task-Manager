-- Quick check of trigger definitions on tasks table

SELECT 
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'tasks'
  AND NOT t.tgisinternal
ORDER BY t.tgname;
