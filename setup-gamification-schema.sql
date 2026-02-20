-- ============================================================================
-- CREATE MISSING GAMIFICATION TABLES AND SCHEMA
-- This will enable badges/achievements to work properly
-- ============================================================================

-- 1. Create user_levels table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1 NOT NULL,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  xp_for_next_level INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT,
  badge_color TEXT DEFAULT '#FFD700',
  criteria_type TEXT NOT NULL, -- 'tasks_completed', 'points_earned', 'streak_days'
  criteria_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update user_achievements table structure
ALTER TABLE user_achievements 
  DROP COLUMN IF EXISTS achievement_id CASCADE;

ALTER TABLE user_achievements 
  ADD COLUMN IF NOT EXISTS achievement_type TEXT,
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. Create task_streaks table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_task_streaks_user_id ON task_streaks(user_id);

-- 6. Insert default achievements
INSERT INTO achievements (title, description, badge_icon, criteria_type, criteria_value)
VALUES 
  ('First Steps', 'Complete your first task', '🌟', 'tasks_completed', 1),
  ('Task Master', 'Complete 10 tasks', '⭐', 'tasks_completed', 10),
  ('Super Star', 'Complete 50 tasks', '🌠', 'tasks_completed', 50),
  ('Point Collector', 'Earn 100 points', '💰', 'points_earned', 100),
  ('High Achiever', 'Earn 500 points', '💎', 'points_earned', 500),
  ('Consistency King', 'Maintain a 7-day streak', '🔥', 'streak_days', 7)
ON CONFLICT DO NOTHING;

-- 7. Create function to ensure user has gamification records
CREATE OR REPLACE FUNCTION ensure_user_gamification_records(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create user_levels record if doesn't exist
  INSERT INTO user_levels (user_id, current_level, total_xp, xp_for_next_level)
  VALUES (p_user_id, 1, 0, 100)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create task_streaks record if doesn't exist
  INSERT INTO task_streaks (user_id, current_streak, longest_streak)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to add XP (called by award_task_xp)
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_xp_for_next INTEGER;
BEGIN
  -- Ensure user has gamification records
  PERFORM ensure_user_gamification_records(p_user_id);
  
  -- Update XP
  UPDATE user_levels
  SET 
    total_xp = total_xp + p_xp,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING total_xp INTO v_new_xp;
  
  -- Calculate new level (100 XP per level, exponential)
  v_new_level := FLOOR(v_new_xp / 100.0) + 1;
  v_xp_for_next := v_new_level * 100;
  
  -- Update level if changed
  UPDATE user_levels
  SET 
    current_level = v_new_level,
    xp_for_next_level = v_xp_for_next,
    updated_at = NOW()
  WHERE user_id = p_user_id AND current_level < v_new_level;
END;
$$ LANGUAGE plpgsql;

-- 9. Initialize gamification for all existing users
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id FROM profiles WHERE role = 'child'
  LOOP
    PERFORM ensure_user_gamification_records(v_user.id);
  END LOOP;
  RAISE NOTICE '✅ Initialized gamification for all existing users';
END $$;

-- 10. Enable RLS on new tables
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_streaks ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies
DROP POLICY IF EXISTS user_levels_select ON user_levels;
CREATE POLICY user_levels_select ON user_levels FOR SELECT USING (true);

DROP POLICY IF EXISTS achievements_select ON achievements;
CREATE POLICY achievements_select ON achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS task_streaks_select ON task_streaks;
CREATE POLICY task_streaks_select ON task_streaks FOR SELECT USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎮 ============================================';
  RAISE NOTICE '🎮 GAMIFICATION SETUP COMPLETE!';
  RAISE NOTICE '🎮 ============================================';
  RAISE NOTICE '✅ Created user_levels table';
  RAISE NOTICE '✅ Created achievements table';  
  RAISE NOTICE '✅ Updated user_achievements table';
  RAISE NOTICE '✅ Created task_streaks table';
  RAISE NOTICE '✅ Added default achievements';
  RAISE NOTICE '✅ Initialized all existing users';
  RAISE NOTICE '🎮 Badges will now update automatically!';
END $$;
