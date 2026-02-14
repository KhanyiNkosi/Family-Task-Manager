-- ============================================================================
-- FINAL FIX: Resolve achievement_id ambiguity in process_task_approval_gamification
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

CREATE OR REPLACE FUNCTION process_task_approval_gamification(
  p_user_id UUID,
  p_task_points INTEGER
)
RETURNS JSONB
SECURITY DEFINER
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
  -- Fixed: Explicitly specify columns instead of SELECT *
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
-- VERIFY THE FIX
-- ============================================================================
SELECT '✅ Function updated - test with:' as status;
SELECT 'SELECT process_task_approval_gamification(''<user_uuid>''::uuid, 10);' as command;
