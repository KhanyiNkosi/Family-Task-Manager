-- ============================================================================
-- GET HELPER FUNCTION DEFINITIONS
-- ============================================================================
-- Run this in Supabase SQL Editor to check SECURITY DEFINER status and logic
-- ============================================================================

-- Get the full definition of award_task_xp()
SELECT 
  '🎯 AWARD XP FUNCTION' as "Type",
  'award_task_xp' as "Function",
  pg_get_functiondef(p.oid) as "Complete Definition"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'award_task_xp';

-- Get the full definition of update_task_streak()
SELECT 
  '🔥 STREAK FUNCTION' as "Type",
  'update_task_streak' as "Function",
  pg_get_functiondef(p.oid) as "Complete Definition"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'update_task_streak';

-- Get the full definition of check_and_unlock_achievements()
SELECT 
  '🏆 ACHIEVEMENT FUNCTION' as "Type",
  'check_and_unlock_achievements' as "Function",
  pg_get_functiondef(p.oid) as "Complete Definition"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'check_and_unlock_achievements';

-- ============================================================================
-- KEY THINGS TO CHECK IN THE OUTPUT:
-- ============================================================================
-- 1. ⚡ SECURITY DEFINER vs SECURITY INVOKER
--    - SECURITY DEFINER = runs with function owner's privileges (bypasses RLS)
--    - SECURITY INVOKER = runs with caller's privileges (subject to RLS)
--    - If missing = defaults to SECURITY INVOKER
--
-- 2. 🛡️ Error Handling
--    - Look for: BEGIN...EXCEPTION WHEN...END blocks
--    - Silent failures would prevent rollback
--
-- 3. 📝 Table Writes
--    - Which tables does each function INSERT/UPDATE?
--    - Are those tables protected by RLS?
--
-- 4. 🔐 RLS Bypass
--    - Do functions use SET LOCAL ROLE or other privilege escalation?
-- ============================================================================
