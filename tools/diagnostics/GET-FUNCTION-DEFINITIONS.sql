-- ============================================================================
-- GET COMPLETE FUNCTION DEFINITIONS
-- ============================================================================

-- Get the full definition of task_approval_with_gamification()
SELECT 
  '🎮 TRIGGER FUNCTION' as "Type",
  'task_approval_with_gamification' as "Function",
  pg_get_functiondef(p.oid) as "Complete Definition"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'task_approval_with_gamification';

-- Get the full definition of process_task_approval_gamification()
SELECT 
  '⚙️ PROCESSING FUNCTION' as "Type",
  'process_task_approval_gamification' as "Function",
  pg_get_functiondef(p.oid) as "Complete Definition"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'process_task_approval_gamification';

-- Get the full definition of get_user_gamification_stats()
SELECT 
  '📊 STATS FUNCTION' as "Type",
  'get_user_gamification_stats' as "Function",
  pg_get_functiondef(p.oid) as "Complete Definition"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_gamification_stats';

-- ============================================================================
-- This will show:
-- 1. Complete CREATE FUNCTION statements
-- 2. Function arguments and return types
-- 3. Whether they're SECURITY DEFINER or SECURITY INVOKER
-- 4. The complete logic inside each function
-- 5. Any error handling or conditional logic
-- ============================================================================
