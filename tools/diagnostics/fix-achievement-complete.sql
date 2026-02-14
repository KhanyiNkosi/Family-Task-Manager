-- ============================================================================
-- COMPLETE FIX: Eliminate ALL ambiguity by using local variables
-- ============================================================================

DROP FUNCTION IF EXISTS check_and_unlock_achievements(UUID);

CREATE FUNCTION check_and_unlock_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id INTEGER, achievement_title TEXT)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_tasks INTEGER;
  v_total_points INTEGER;
  v_current_streak INTEGER;
  v_achievement RECORD;
  v_unlocked_id INTEGER;
  v_unlocked_title TEXT;
BEGIN
  SELECT 
    COUNT(CASE WHEN completed = true AND approved = true THEN 1 END),
    COALESCE(SUM(CASE WHEN completed = true AND approved = true THEN points ELSE 0 END), 0)
  INTO v_completed_tasks, v_total_points
  FROM tasks
  WHERE assigned_to = p_user_id;
  
  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  FOR v_achievement IN 
    SELECT a.id AS ach_id, a.title AS ach_title, a.description, a.requirement_type, a.requirement_value
    FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id AND ua.is_earned = true
    )
  LOOP
    IF (v_achievement.requirement_type = 'task_count' AND v_completed_tasks >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'points_earned' AND v_total_points >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'streak_days' AND v_current_streak >= v_achievement.requirement_value) THEN
      
      INSERT INTO user_achievements (user_id, achievement_id, is_earned, progress)
      VALUES (p_user_id, v_achievement.ach_id, true, v_achievement.requirement_value)
      ON CONFLICT (user_id, achievement_id) 
      DO UPDATE SET is_earned = true, earned_at = NOW();
      
      -- Use local variables to avoid ambiguity
      v_unlocked_id := v_achievement.ach_id;
      v_unlocked_title := v_achievement.ach_title;
      
      -- Assign to OUT parameters
      achievement_id := v_unlocked_id;
      achievement_title := v_unlocked_title;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Test it
SELECT '✅ check_and_unlock_achievements recreated with aliased columns' as status;
