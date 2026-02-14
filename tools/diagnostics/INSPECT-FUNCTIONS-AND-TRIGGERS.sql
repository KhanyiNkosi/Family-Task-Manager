-- ============================================================================
-- INSPECT FUNCTION SIGNATURES AND TRIGGERS
-- ============================================================================

-- 1. Get detailed function signatures for all gamification functions
SELECT 
  '⚙️ FUNCTION SIGNATURES' as "Type",
  p.proname as "Function Name",
  pg_get_function_arguments(p.oid) as "Arguments",
  pg_get_function_result(p.oid) as "Returns",
  pg_get_functiondef(p.oid) as "Full Definition"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_user_gamification_stats',
    'process_task_approval_gamification',
    'task_approval_with_gamification'
  )
ORDER BY p.proname;

-- 2. Check if ANY triggers exist on tasks table
SELECT 
  '🔧 TRIGGERS ON TASKS TABLE' as "Info",
  t.tgname as "Trigger Name",
  pg_get_triggerdef(t.oid) as "Full Definition"
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'tasks'
  AND NOT t.tgisinternal  -- Exclude internal triggers
ORDER BY t.tgname;

-- 3. Alternative view of trigger information
SELECT 
  event_object_table as "Table",
  trigger_name as "Trigger Name",
  event_manipulation as "Event",
  action_timing as "Timing",
  action_orientation as "Level",
  action_statement as "Action"
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'tasks'
ORDER BY trigger_name;

-- ============================================================================
-- This will show:
-- 1. Exact function signatures (what arguments they expect)
-- 2. What each function returns
-- 3. Full function definitions (so we can see how they work)
-- 4. Whether ANY triggers exist on the tasks table
-- 5. If triggers exist, exactly how they're configured
-- ============================================================================
