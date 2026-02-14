-- ============================================================================
-- FIX GAMIFICATION COLUMN NAMES - Quick Fix
-- Run this if you already deployed and got column name errors
-- ============================================================================

-- Fix award_task_xp function to use correct column names
CREATE OR REPLACE FUNCTION award_task_xp(
  p_user_id UUID,
  p_task_points INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_xp_to_award INTEGER;
  v_level_data RECORD;
BEGIN
  v_xp_to_award := p_task_points * 10;
  
  -- Call add_user_xp (returns VOID)
  PERFORM add_user_xp(p_user_id, v_xp_to_award);
  
  -- Get updated level data using correct column names
  SELECT current_level, total_xp, xp_for_next_level
  INTO v_level_data
  FROM user_levels
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'xp_awarded', v_xp_to_award,
    'current_level', COALESCE(v_level_data.current_level, 1),
    'total_xp', COALESCE(v_level_data.total_xp, 0),
    'xp_for_next_level', COALESCE(v_level_data.xp_for_next_level, 100)
  );
END;
$$ LANGUAGE plpgsql;

-- Fix get_user_gamification_stats function to use correct column names
CREATE OR REPLACE FUNCTION get_user_gamification_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_level_info RECORD;
  v_streak_info RECORD;
  v_achievement_count INTEGER;
  v_total_achievements INTEGER;
  v_completed_tasks INTEGER;
  v_total_points INTEGER;
BEGIN
  SELECT * INTO v_level_info FROM user_levels WHERE user_id = p_user_id;
  SELECT * INTO v_streak_info FROM user_streaks WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_achievement_count
  FROM user_achievements WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_total_achievements FROM achievements;
  
  SELECT 
    COUNT(CASE WHEN completed = true AND approved = true THEN 1 END),
    COALESCE(SUM(CASE WHEN completed = true AND approved = true THEN points ELSE 0 END), 0)
  INTO v_completed_tasks, v_total_points
  FROM tasks WHERE assigned_to = p_user_id;
  
  RETURN jsonb_build_object(
    'level', COALESCE(v_level_info.current_level, 1),
    'xp', COALESCE(v_level_info.total_xp, 0),
    'xp_to_next_level', COALESCE(v_level_info.xp_for_next_level, 100),
    'current_streak', COALESCE(v_streak_info.current_streak, 0),
    'longest_streak', COALESCE(v_streak_info.longest_streak, 0),
    'achievements_unlocked', v_achievement_count,
    'total_achievements', v_total_achievements,
    'completed_tasks', v_completed_tasks,
    'total_points', v_total_points
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Gamification functions updated with correct column names';
  RAISE NOTICE '';
  RAISE NOTICE 'Column name fixes:';
  RAISE NOTICE '  • current_xp → total_xp';
  RAISE NOTICE '  • xp_to_next_level → xp_for_next_level';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions fixed:';
  RAISE NOTICE '  • award_task_xp()';
  RAISE NOTICE '  • get_user_gamification_stats()';
  RAISE NOTICE '';
  RAISE NOTICE 'Now run FUNCTIONAL-TEST.sql to verify everything works!';
END $$;
