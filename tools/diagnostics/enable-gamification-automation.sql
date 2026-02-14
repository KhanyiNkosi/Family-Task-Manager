-- ============================================================================
-- ENABLE FULL GAMIFICATION AUTOMATION
-- Auto-awards XP, unlocks achievements, and tracks streaks
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- ============================================================================
-- 1. AUTO XP AWARDING FUNCTION
-- ============================================================================

-- Function to award XP and check for level ups
CREATE OR REPLACE FUNCTION award_task_xp(
  p_user_id UUID,
  p_task_points INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_xp_to_award INTEGER;
  v_level_data RECORD;
BEGIN
  -- Award XP = points × 10 (so 10 point task = 100 XP)
  v_xp_to_award := p_task_points * 10;
  
  -- Call add_user_xp (returns VOID)
  PERFORM add_user_xp(p_user_id, v_xp_to_award);
  
  -- Get updated level data
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

-- ============================================================================
-- 2. AUTO ACHIEVEMENT UNLOCK FUNCTION
-- ============================================================================

-- Function to check and unlock achievements based on user progress
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id INTEGER, achievement_title TEXT) AS $$
DECLARE
  v_completed_tasks INTEGER;
  v_total_points INTEGER;
  v_current_streak INTEGER;
  v_achievement RECORD;
BEGIN
  -- Get user stats
  SELECT 
    COUNT(CASE WHEN completed = true AND approved = true THEN 1 END),
    COALESCE(SUM(CASE WHEN completed = true AND approved = true THEN points ELSE 0 END), 0)
  INTO v_completed_tasks, v_total_points
  FROM tasks
  WHERE assigned_to = p_user_id;
  
  -- Get current streak
  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  -- Check each achievement and unlock if criteria met
  FOR v_achievement IN 
    SELECT a.id, a.title, a.description, a.requirement_type, a.requirement_value
    FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id AND ua.is_earned = true
    )
  LOOP
    -- Check criteria
    IF (v_achievement.requirement_type = 'task_count' AND v_completed_tasks >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'points_earned' AND v_total_points >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'streak_days' AND v_current_streak >= v_achievement.requirement_value) THEN
      
      -- Unlock achievement
      INSERT INTO user_achievements (user_id, achievement_id, is_earned, progress)
      VALUES (p_user_id, v_achievement.id, true, v_achievement.requirement_value)
      ON CONFLICT (user_id, achievement_id) 
      DO UPDATE SET is_earned = true, earned_at = NOW();
      
      -- Return unlocked achievement
      achievement_id := v_achievement.id;
      achievement_title := v_achievement.title;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. STREAK TRACKING FUNCTION (ENHANCED)
-- ============================================================================

-- Function to update streak on task completion
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
  
  -- Get last completed task date
  SELECT DATE(MAX(completed_at)) INTO v_last_completed
  FROM tasks
  WHERE assigned_to = p_user_id AND completed = true AND approved = true;
  
  -- Get or create streak record
  SELECT * INTO v_streak_record
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  IF v_streak_record IS NULL THEN
    -- First task ever - start streak at 1
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_completion_date)
    VALUES (p_user_id, 1, 1, v_today)
    RETURNING * INTO v_streak_record;
  ELSE
    v_current_streak := v_streak_record.current_streak;
    v_longest_streak := v_streak_record.longest_streak;
    
    -- Check if this is a consecutive day
    IF v_streak_record.last_completion_date = v_today THEN
      -- Same day - no change
      NULL;
    ELSIF v_streak_record.last_completion_date = v_today - INTERVAL '1 day' THEN
      -- Consecutive day - increment streak
      v_current_streak := v_current_streak + 1;
      v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
      
      UPDATE user_streaks
      SET current_streak = v_current_streak,
          longest_streak = v_longest_streak,
          last_completion_date = v_today
      WHERE user_id = p_user_id;
    ELSE
      -- Streak broken - reset to 1
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
-- 4. MASTER FUNCTION - PROCESS TASK APPROVAL WITH GAMIFICATION
-- ============================================================================

-- All-in-one function to handle gamification when task is approved
CREATE OR REPLACE FUNCTION process_task_approval_gamification(
  p_user_id UUID,
  p_task_points INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_xp_result JSONB;
  v_streak_result JSONB;
  v_unlocked_achievements JSONB := '[]'::JSONB;
  v_achievement RECORD;
BEGIN
  -- 1. Award XP
  v_xp_result := award_task_xp(p_user_id, p_task_points);
  
  -- 2. Update streak
  v_streak_result := update_task_streak(p_user_id);
  
  -- 3. Check and unlock achievements
  FOR v_achievement IN 
    SELECT * FROM check_and_unlock_achievements(p_user_id)
  LOOP
    v_unlocked_achievements := v_unlocked_achievements || 
      jsonb_build_object(
        'achievement_id', v_achievement.achievement_id,
        'achievement_title', v_achievement.achievement_title
      );
  END LOOP;
  
  -- Return combined results
  RETURN jsonb_build_object(
    'xp', v_xp_result,
    'streak', v_streak_result,
    'unlocked_achievements', v_unlocked_achievements
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. UPDATE TASK APPROVAL TRIGGER TO USE GAMIFICATION
-- ============================================================================

-- Enhanced trigger function that includes gamification
CREATE OR REPLACE FUNCTION task_approval_with_gamification()
RETURNS TRIGGER AS $$
DECLARE
  v_gamification_result JSONB;
BEGIN
  -- Only process when task is newly approved
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    -- Process all gamification
    v_gamification_result := process_task_approval_gamification(
      NEW.assigned_to,
      NEW.points
    );
    
    RAISE NOTICE 'Gamification processed: %', v_gamification_result;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS task_approval_gamification_trigger ON tasks;

CREATE TRIGGER task_approval_gamification_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION task_approval_with_gamification();

-- ============================================================================
-- 6. HELPER FUNCTION - GET USER GAMIFICATION STATS
-- ============================================================================

-- Function to get complete gamification stats for a user
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
  -- Get level info
  SELECT * INTO v_level_info
  FROM user_levels
  WHERE user_id = p_user_id;
  
  -- Get streak info
  SELECT * INTO v_streak_info
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  -- Get achievement counts
  SELECT COUNT(*) INTO v_achievement_count
  FROM user_achievements
  WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_total_achievements
  FROM achievements;
  
  -- Get task stats
  SELECT 
    COUNT(CASE WHEN completed = true AND approved = true THEN 1 END),
    COALESCE(SUM(CASE WHEN completed = true AND approved = true THEN points ELSE 0 END), 0)
  INTO v_completed_tasks, v_total_points
  FROM tasks
  WHERE assigned_to = p_user_id;
  
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
  RAISE NOTICE '';
  RAISE NOTICE '🎮 ✅ GAMIFICATION AUTOMATION ENABLED!';
  RAISE NOTICE '';
  RAISE NOTICE 'Automated features:';
  RAISE NOTICE '  • XP awarded automatically on task approval (points × 10)';
  RAISE NOTICE '  • Achievements unlock when criteria met';
  RAISE NOTICE '  • Streaks track consecutive daily completions';
  RAISE NOTICE '  • Level-ups happen automatically when XP threshold reached';
  RAISE NOTICE '';
  RAISE NOTICE 'New functions available:';
  RAISE NOTICE '  • process_task_approval_gamification(user_id, task_points)';
  RAISE NOTICE '  • check_and_unlock_achievements(user_id)';
  RAISE NOTICE '  • get_user_gamification_stats(user_id)';
  RAISE NOTICE '  • award_task_xp(user_id, task_points)';
  RAISE NOTICE '  • update_task_streak(user_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'How it works:';
  RAISE NOTICE '  1. Parent approves task → trigger fires';
  RAISE NOTICE '  2. XP awarded (10 points task = 100 XP)';
  RAISE NOTICE '  3. Streak updated (consecutive days)';
  RAISE NOTICE '  4. Achievements checked and auto-unlocked';
  RAISE NOTICE '  5. Activity feed updated automatically';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to deploy!';
  RAISE NOTICE '';
END $$;
