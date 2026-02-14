-- ============================================================================
-- FIX GAMIFICATION FUNCTIONS: ADD SECURITY DEFINER
-- ============================================================================
-- This allows gamification functions to bypass RLS and write to child records
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 0. FIX add_user_xp - ADD SECURITY DEFINER (CRITICAL - called by award_task_xp)
-- ============================================================================
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp_amount INTEGER)
RETURNS VOID
SECURITY DEFINER  -- ⚡ ADDED - Runs with function owner's privileges
SET search_path = public
AS $$
DECLARE
  v_current_level INTEGER;
  v_total_xp INTEGER;
  v_xp_needed INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current level data or create if doesn't exist
  SELECT current_level, total_xp, xp_for_next_level
  INTO v_current_level, v_total_xp, v_xp_needed
  FROM user_levels
  WHERE user_id = p_user_id;

  -- If no level record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_levels (user_id, current_level, total_xp, xp_for_next_level, level_title)
    VALUES (p_user_id, 1, p_xp_amount, calculate_xp_for_level(1), get_level_title(1));
    RETURN;
  END IF;

  -- Add XP
  v_total_xp := v_total_xp + p_xp_amount;
  v_new_level := v_current_level;

  -- Check for level ups
  WHILE v_total_xp >= v_xp_needed AND v_new_level < 100 LOOP
    v_new_level := v_new_level + 1;
    v_xp_needed := calculate_xp_for_level(v_new_level);
  END LOOP;

  -- Update level record
  UPDATE user_levels
  SET current_level = v_new_level,
      total_xp = v_total_xp,
      xp_for_next_level = v_xp_needed,
      level_title = get_level_title(v_new_level),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. FIX award_task_xp - ADD SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION award_task_xp(
  p_user_id UUID,
  p_task_points INTEGER
)
RETURNS JSONB 
SECURITY DEFINER  -- ⚡ ADDED - Runs with function owner's privileges
SET search_path = public
AS $$
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
-- 2. FIX update_task_streak - ADD SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_task_streak(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER  -- ⚡ ADDED - Runs with function owner's privileges
SET search_path = public
AS $$
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
-- 3. FIX check_and_unlock_achievements - ADD SECURITY DEFINER
-- ============================================================================
-- Must DROP first due to return type signature change
DROP FUNCTION IF EXISTS check_and_unlock_achievements(UUID);

CREATE FUNCTION check_and_unlock_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id INTEGER, achievement_title TEXT)
SECURITY DEFINER  -- ⚡ ADDED - Runs with function owner's privileges
SET search_path = public
AS $$
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
      
      -- Return unlocked achievement (use OUT parameters explicitly)
      check_and_unlock_achievements.achievement_id := v_achievement.id;
      check_and_unlock_achievements.achievement_title := v_achievement.title;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. FIX process_task_approval_gamification - ADD SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION process_task_approval_gamification(
  p_user_id UUID,
  p_task_points INTEGER
)
RETURNS JSONB
SECURITY DEFINER  -- ⚡ ADDED - Runs with function owner's privileges
SET search_path = public
AS $$
DECLARE
  v_xp_result JSONB;
  v_streak_result JSONB;
  v_unlocked_achievements JSONB := '[]'::JSONB;
  v_achievement_id INTEGER;
  v_achievement_title TEXT;
BEGIN
  -- 1. Award XP
  v_xp_result := award_task_xp(p_user_id, p_task_points);
  
  -- 2. Update streak
  v_streak_result := update_task_streak(p_user_id);
  
  -- 3. Check and unlock achievements
  -- Fixed: Explicitly specify columns to avoid ambiguity
  FOR v_achievement_id, v_achievement_title IN 
    SELECT achievement_id, achievement_title 
    FROM check_and_unlock_achievements(p_user_id)
  LOOP
    v_unlocked_achievements := v_unlocked_achievements || 
      jsonb_build_object(
        'achievement_id', v_achievement_id,
        'achievement_title', v_achievement_title
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
-- 5. FIX task_approval_with_gamification (trigger) - ADD SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION task_approval_with_gamification()
RETURNS TRIGGER
SECURITY DEFINER  -- ⚡ ADDED - Runs with function owner's privileges
SET search_path = public
AS $$
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

-- ============================================================================
-- VERIFICATION QUERY - Check SECURITY DEFINER status
-- ============================================================================
SELECT 
  p.proname as "Function",
  CASE p.prosecdef 
    WHEN true THEN '✅ SECURITY DEFINER' 
    ELSE '❌ SECURITY INVOKER' 
  END as "Security Mode"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'add_user_xp',
    'award_task_xp',
    'update_task_streak',
    'check_and_unlock_achievements',
    'process_task_approval_gamification',
    'task_approval_with_gamification'
  )
ORDER BY p.proname;

-- ============================================================================
-- ✅ After running this, all gamification functions will bypass RLS
-- ✅ Test by approving a task and checking if XP/streaks are awarded
-- ============================================================================
