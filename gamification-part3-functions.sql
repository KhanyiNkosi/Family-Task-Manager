-- Part 3: Create Functions
-- Run this third

-- Function to ensure user has gamification records
CREATE OR REPLACE FUNCTION ensure_user_gamification_records(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_levels (user_id, current_level, total_xp, xp_for_next_level)
  VALUES (p_user_id, 1, 0, 100)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO task_streaks (user_id, current_streak, longest_streak)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function first to avoid parameter name conflict
DROP FUNCTION IF EXISTS add_user_xp(UUID, INTEGER);

-- Function to add XP
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_xp_for_next INTEGER;
BEGIN
  PERFORM ensure_user_gamification_records(p_user_id);
  
  UPDATE user_levels
  SET total_xp = total_xp + p_xp, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING total_xp INTO v_new_xp;
  
  v_new_level := FLOOR(v_new_xp / 100.0) + 1;
  v_xp_for_next := v_new_level * 100;
  
  UPDATE user_levels
  SET current_level = v_new_level, xp_for_next_level = v_xp_for_next, updated_at = NOW()
  WHERE user_id = p_user_id AND current_level < v_new_level;
END;
$$ LANGUAGE plpgsql;
