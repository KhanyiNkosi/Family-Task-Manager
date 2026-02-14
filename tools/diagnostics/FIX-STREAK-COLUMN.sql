-- ============================================================================
-- FIX STREAK TRACKING - Update to use correct column name
-- Run this if you already ran COMPLETE-DEPLOYMENT.sql
-- ============================================================================

-- Update the streak tracking function to use correct column: last_completion_date
CREATE OR REPLACE FUNCTION update_task_streak(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_last_completed DATE;
  v_today DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_streak_record RECORD;
BEGIN
  v_today := CURRENT_DATE;
  
  SELECT DATE(MAX(completed_at)) INTO v_last_completed
  FROM tasks
  WHERE assigned_to = p_user_id AND completed = true AND approved = true;
  
  SELECT * INTO v_streak_record
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  IF v_streak_record IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_completion_date)
    VALUES (p_user_id, 1, 1, v_today)
    RETURNING * INTO v_streak_record;
  ELSE
    v_current_streak := v_streak_record.current_streak;
    v_longest_streak := v_streak_record.longest_streak;
    
    IF v_streak_record.last_completion_date = v_today THEN
      NULL;
    ELSIF v_streak_record.last_completion_date = v_today - INTERVAL '1 day' THEN
      v_current_streak := v_current_streak + 1;
      v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
      
      UPDATE user_streaks
      SET current_streak = v_current_streak,
          longest_streak = v_longest_streak,
          last_completion_date = v_today
      WHERE user_id = p_user_id;
    ELSE
      v_current_streak := 1;
      
      UPDATE user_streaks
      SET current_streak = 1,
          last_completion_date = v_today
      WHERE user_id = p_user_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'current_streak', COALESCE(v_current_streak, 1),
    'longest_streak', COALESCE(v_longest_streak, 1),
    'last_completed', v_today
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Streak tracking function updated with correct column name';
  RAISE NOTICE '   Changed: last_completed_date → last_completion_date';
  RAISE NOTICE '';
  RAISE NOTICE 'Streak tracking will now work correctly when tasks are approved.';
END $$;
