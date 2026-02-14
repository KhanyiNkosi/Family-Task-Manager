-- ============================================================================
-- Check for Triggers on Tasks Table
-- ============================================================================

SELECT 
  'Triggers on tasks' as check,
  tgname as trigger_name,
  tgrelid::regclass as on_table,
  proname as function_name,
  tgenabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Enabled'
    WHEN tgenabled = 'D' THEN '❌ Disabled'
    ELSE '? Status: ' || tgenabled
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'tasks'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- Show function bodies that might have type issues
SELECT 
  'Function Definitions' as check,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'tasks'::regclass
  AND NOT tgisinternal;
