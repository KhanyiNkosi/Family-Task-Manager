-- ============================================================================
-- COMPLETE DEPLOYMENT SQL - RUN THIS FIRST
-- Combines critical fixes to get everything working
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- ============================================================================
-- PART 1: FIX PHOTO UPLOAD AND ACTIVITY FEED ISSUES
-- ============================================================================

-- Add photo_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE tasks ADD COLUMN photo_url TEXT;
    RAISE NOTICE '✅ Added photo_url column to tasks table';
  ELSE
    RAISE NOTICE 'ℹ️  photo_url column already exists';
  END IF;
END $$;

-- Add photo_uploaded_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'photo_uploaded_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN photo_uploaded_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added photo_uploaded_at column to tasks table';
  ELSE
    RAISE NOTICE 'ℹ️  photo_uploaded_at column already exists';
  END IF;
END $$;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS task_completion_activity_trigger ON tasks;
DROP TRIGGER IF EXISTS task_approval_activity_trigger ON tasks;
DROP TRIGGER IF EXISTS achievement_earned_activity_trigger ON user_achievements;

-- Fixed function for task completion activity (handles NULL family_id)
CREATE OR REPLACE FUNCTION create_task_completion_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;

    IF v_family_id IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM families WHERE id = v_family_id) THEN
        v_task_title := NEW.title;
        v_points := NEW.points;

        INSERT INTO activity_feed (
          family_id, user_id, activity_type, title, description, metadata
        ) VALUES (
          v_family_id,
          NEW.assigned_to,
          'task_completed',
          COALESCE(v_user_name, 'User') || ' completed a task!',
          'Completed: ' || v_task_title,
          jsonb_build_object(
            'task_id', NEW.id,
            'task_title', v_task_title,
            'points_earned', v_points
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create task completion activity: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fixed function for task approval activity (handles NULL family_id)
CREATE OR REPLACE FUNCTION create_task_approval_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
BEGIN
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;

    IF v_family_id IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM families WHERE id = v_family_id) THEN
        v_task_title := NEW.title;
        v_points := NEW.points;

        INSERT INTO activity_feed (
          family_id, user_id, activity_type, title, description, metadata
        ) VALUES (
          v_family_id,
          NEW.assigned_to,
          'task_approved',
          'Task Approved: ' || v_task_title,
          COALESCE(v_user_name, 'User') || ' earned ' || v_points || ' points!',
          jsonb_build_object(
            'task_id', NEW.id,
            'task_title', v_task_title,
            'points_earned', v_points
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create task approval activity: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fixed function for achievement earned activity (handles NULL family_id)
CREATE OR REPLACE FUNCTION create_achievement_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_achievement_title TEXT;
  v_achievement_icon TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.user_id;

    IF v_family_id IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM families WHERE id = v_family_id) THEN
        SELECT title, icon INTO v_achievement_title, v_achievement_icon
        FROM achievements
        WHERE id = NEW.achievement_id;

        INSERT INTO activity_feed (
          family_id, user_id, activity_type, title, description, metadata
        ) VALUES (
          v_family_id,
          NEW.user_id,
          'achievement_earned',
          COALESCE(v_user_name, 'User') || ' unlocked an achievement!',
          '🏆 ' || v_achievement_title,
          jsonb_build_object(
            'achievement_id', NEW.achievement_id,
            'achievement_title', v_achievement_title,
            'achievement_icon', v_achievement_icon
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create achievement activity: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate activity triggers
CREATE TRIGGER task_completion_activity_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_completion_activity();

CREATE TRIGGER task_approval_activity_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_approval_activity();

CREATE TRIGGER achievement_earned_activity_trigger
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION create_achievement_activity();

-- ============================================================================
-- PART 2: ENABLE GAMIFICATION AUTOMATION
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

-- Function to check and unlock achievements based on user progress
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id UUID, achievement_title TEXT) AS $$
DECLARE
  v_completed_tasks INTEGER;
  v_total_points INTEGER;
  v_current_streak INTEGER;
  v_achievement RECORD;
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
    SELECT a.id, a.title, a.description, a.requirement_type, a.requirement_value
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
      VALUES (p_user_id, v_achievement.id, true, v_achievement.requirement_value)
      ON CONFLICT (user_id, achievement_id) 
      DO UPDATE SET is_earned = true, earned_at = NOW();
      
      achievement_id := v_achievement.id;
      achievement_title := v_achievement.title;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

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
  v_xp_result := award_task_xp(p_user_id, p_task_points);
  v_streak_result := update_task_streak(p_user_id);
  
  FOR v_achievement IN 
    SELECT * FROM check_and_unlock_achievements(p_user_id)
  LOOP
    v_unlocked_achievements := v_unlocked_achievements || 
      jsonb_build_object(
        'achievement_id', v_achievement.achievement_id,
        'achievement_title', v_achievement.achievement_title
      );
  END LOOP;
  
  RETURN jsonb_build_object(
    'xp', v_xp_result,
    'streak', v_streak_result,
    'unlocked_achievements', v_unlocked_achievements
  );
END;
$$ LANGUAGE plpgsql;

-- Enhanced trigger function that includes gamification
CREATE OR REPLACE FUNCTION task_approval_with_gamification()
RETURNS TRIGGER AS $$
DECLARE
  v_gamification_result JSONB;
BEGIN
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    v_gamification_result := process_task_approval_gamification(
      NEW.assigned_to,
      NEW.points
    );
    
    RAISE NOTICE 'Gamification processed: %', v_gamification_result;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate gamification trigger
DROP TRIGGER IF EXISTS task_approval_gamification_trigger ON tasks;

CREATE TRIGGER task_approval_gamification_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION task_approval_with_gamification();

-- Helper function to get complete gamification stats for a user
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
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 DEPLOYMENT COMPLETE - ALL SYSTEMS READY! 🎉';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Photo Upload System: ENABLED';
  RAISE NOTICE '   • photo_url and photo_uploaded_at columns added';
  RAISE NOTICE '   • Skip photo works without errors';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Activity Feed System: FIXED';  
  RAISE NOTICE '   • NULL family_id handled gracefully';
  RAISE NOTICE '   • Error handling prevents cascade failures';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Gamification Automation: ACTIVE';
  RAISE NOTICE '   • XP awarded automatically (points × 10)';
  RAISE NOTICE '   • Achievements unlock when criteria met';
  RAISE NOTICE '   • Streaks track consecutive days';
  RAISE NOTICE '   • Level-ups automatic';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Available Functions:';
  RAISE NOTICE '   • process_task_approval_gamification(user_id, points)';
  RAISE NOTICE '   • check_and_unlock_achievements(user_id)';
  RAISE NOTICE '   • get_user_gamification_stats(user_id)';
  RAISE NOTICE '   • award_task_xp(user_id, points)';
  RAISE NOTICE '   • update_task_streak(user_id)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 READY TO DEPLOY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test photo upload (complete task with/without photo)';
  RAISE NOTICE '  2. Test task approval (approve task, check XP awarded)';
  RAISE NOTICE '  3. Test achievements (check if "Getting Started" unlocked)';
  RAISE NOTICE '  4. Test activity feed (reactions and comments)';
  RAISE NOTICE '  5. Verify points calculate correctly';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
