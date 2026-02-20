-- Check if the badge trigger exists and is working

-- 1. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'task_approval_with_gamification';

-- 2. Check if the trigger function exists
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'trigger_task_approval_gamification';

-- 3. Check recent task approvals (to see if trigger should have fired)
SELECT 
  id,
  title,
  assigned_to,
  points,
  completed,
  approved,
  created_at
FROM tasks
WHERE approved = true
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if the main gamification function exists
SELECT 
  proname as function_name,
  proargtypes,
  prorettype
FROM pg_proc
WHERE proname = 'process_task_approval_gamification';

-- 5. Test trigger manually on a recent approval
-- This will show if there are any errors
DO $$
DECLARE
  v_test_user_id UUID;
  v_test_points INTEGER;
  v_result JSONB;
BEGIN
  -- Get a recent approved task
  SELECT assigned_to, points INTO v_test_user_id, v_test_points
  FROM tasks
  WHERE approved = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing gamification for user: %, points: %', v_test_user_id, v_test_points;
    
    -- Try to call the gamification function directly
    BEGIN
      v_result := process_task_approval_gamification(v_test_user_id, v_test_points);
      RAISE NOTICE 'Gamification result: %', v_result;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'ERROR calling gamification: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'No approved tasks found to test';
  END IF;
END $$;
