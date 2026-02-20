-- Query 3: Test gamification manually
DO $$
DECLARE
  v_test_user_id UUID;
  v_test_points INTEGER;
  v_result JSONB;
BEGIN
  SELECT assigned_to, points INTO v_test_user_id, v_test_points
  FROM tasks
  WHERE approved = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing gamification for user: %, points: %', v_test_user_id, v_test_points;
    
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
