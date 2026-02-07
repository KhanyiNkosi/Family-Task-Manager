-- ============================================================================
-- CHECK AND FIX APPROVED TASKS
-- Run in Supabase SQL Editor to identify and fix tasks that should be approved
-- ============================================================================

-- Step 1: Check for tasks that are completed but not marked as approved
SELECT 
  id,
  title,
  assigned_to,
  completed,
  approved,
  completed_at,
  created_at
FROM tasks
WHERE completed = true
  AND (approved IS NULL OR approved = false)
ORDER BY completed_at DESC;

-- Step 2: If you see tasks above that should be approved (old completed tasks),
-- uncomment and run this to mark them as approved:

/*
UPDATE tasks
SET approved = true
WHERE completed = true
  AND (approved IS NULL OR approved = false)
  AND completed_at < NOW() - INTERVAL '1 hour';  -- Only approve tasks completed more than 1 hour ago
*/

-- Step 3: Verify the fix - should return no rows
SELECT 
  id,
  title,
  completed,
  approved
FROM tasks
WHERE completed = true
  AND (approved IS NULL OR approved = false);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ TASK APPROVAL CHECK COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE 'Check the results above:';
  RAISE NOTICE '  • If you see tasks, they need to be approved';
  RAISE NOTICE '  • Uncomment the UPDATE statement to mark them as approved';
  RAISE NOTICE '  • Or manually approve them from the parent dashboard';
  RAISE NOTICE '';
END $$;
