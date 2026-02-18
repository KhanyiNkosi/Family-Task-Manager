-- ============================================================================
-- CHECK AND ENABLE BADGE/ACHIEVEMENT UPDATES ON TASK APPROVAL
-- ============================================================================
-- This script checks if gamification functions and triggers exist
-- If not, it creates them to enable automatic badge updates

-- ============================================================================
-- STEP 1: Check if gamification functions exist
-- ============================================================================

SELECT 
  'Checking gamification functions...' as status;

SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as exists
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname IN ('process_task_approval_gamification', 'award_task_xp', 'update_task_streak', 'check_and_unlock_achievements')
ORDER BY p.proname;

-- ============================================================================
-- STEP 2: Check if task_approval_with_gamification trigger exists
-- ============================================================================

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'tasks'
AND trigger_name LIKE '%gamification%';

-- ============================================================================
-- STEP 3: If functions don't exist, create them
-- ============================================================================

-- Note: If the SELECT queries above return no rows, you need to run one of these SQL files:
-- - tools/diagnostics/COMPLETE-DEPLOYMENT.sql (comprehensive setup)
-- - tools/diagnostics/enable-gamification-automation.sql (gamification only)
-- - tools/diagnostics/FIX-GAMIFICATION-SECURITY-DEFINER.sql (fixes with SECURITY DEFINER)

-- ============================================================================
-- QUICK FIX: Create simple trigger to call gamification on task approval
-- ============================================================================

-- This simplified version calls the gamification function if it exists
-- If the function doesn't exist, this will fail and you'll need to run the full setup

DO $$
BEGIN
  -- Check if process_task_approval_gamification function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname = 'process_task_approval_gamification'
  ) THEN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS task_approval_with_gamification ON tasks;
    
    -- Create trigger function that calls gamification
    CREATE OR REPLACE FUNCTION trigger_task_approval_gamification()
    RETURNS TRIGGER
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
    AS $func$
    DECLARE
      v_result JSONB;
    BEGIN
      -- Only process when task is approved
      IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
        -- Call gamification function
        v_result := process_task_approval_gamification(
          NEW.assigned_to,
          NEW.points
        );
        
        RAISE NOTICE '🎮 Gamification processed: %', v_result;
      END IF;
      
      RETURN NEW;
    END;
    $func$;
    
    -- Create trigger
    CREATE TRIGGER task_approval_with_gamification
      AFTER UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION trigger_task_approval_gamification();
    
    RAISE NOTICE '✅ Gamification trigger created successfully!';
  ELSE
    RAISE NOTICE '⚠️ Gamification function does not exist. Please run COMPLETE-DEPLOYMENT.sql first.';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Verify the setup
-- ============================================================================

-- Check triggers again
SELECT 
  '✅ Current triggers on tasks table:' as status;

SELECT 
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tasks'
ORDER BY trigger_name;

-- ============================================================================
-- STEP 5: Test the gamification (optional)
-- ============================================================================

-- Uncomment and replace <user_id> with an actual user UUID to test
-- SELECT process_task_approval_gamification('<user_id>'::uuid, 10);

-- Final status message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'BADGE UPDATE CHECK COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If gamification function exists: ✅ Trigger created';
  RAISE NOTICE 'If not: Run tools/diagnostics/COMPLETE-DEPLOYMENT.sql';
  RAISE NOTICE '';
END $$;
