-- Create Gamification System for FamilyTask
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. ACHIEVEMENTS TABLE (Badge Definitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- FontAwesome icon class
  category TEXT NOT NULL, -- 'milestone', 'streak', 'special', 'seasonal'
  requirement_type TEXT NOT NULL, -- 'task_count', 'streak_days', 'points_earned', 'special_event'
  requirement_value INTEGER, -- e.g., 10 tasks, 7 days streak, 500 points
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  points_reward INTEGER DEFAULT 0, -- Bonus points for earning this achievement
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view achievements
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- Insert starter achievements
INSERT INTO achievements (name, title, description, icon, category, requirement_type, requirement_value, rarity, points_reward) VALUES
  ('first_task', 'Getting Started', 'Complete your very first task', 'fas fa-star', 'milestone', 'task_count', 1, 'common', 10),
  ('task_master_10', 'Task Master', 'Complete 10 tasks', 'fas fa-trophy', 'milestone', 'task_count', 10, 'common', 25),
  ('task_master_50', 'Task Champion', 'Complete 50 tasks', 'fas fa-crown', 'milestone', 'task_count', 50, 'rare', 100),
  ('task_master_100', 'Task Legend', 'Complete 100 tasks', 'fas fa-fire', 'milestone', 'task_count', 100, 'epic', 250),
  
  ('streak_3', 'Three\'s a Charm', 'Complete tasks 3 days in a row', 'fas fa-calendar-check', 'streak', 'streak_days', 3, 'common', 15),
  ('streak_7', 'Week Warrior', 'Complete tasks 7 days in a row', 'fas fa-calendar-week', 'streak', 'streak_days', 7, 'rare', 50),
  ('streak_30', 'Monthly Master', 'Complete tasks 30 days in a row', 'fas fa-calendar-alt', 'streak', 'streak_days', 30, 'epic', 200),
  
  ('points_100', 'Point Collector', 'Earn 100 points', 'fas fa-coins', 'milestone', 'points_earned', 100, 'common', 20),
  ('points_500', 'Point Hoarder', 'Earn 500 points', 'fas fa-gem', 'milestone', 'points_earned', 500, 'rare', 75),
  ('points_1000', 'Point Millionaire', 'Earn 1000 points', 'fas fa-diamond', 'milestone', 'points_earned', 1000, 'epic', 150),
  
  ('early_bird', 'Early Bird', 'Complete a task before 8 AM', 'fas fa-sunrise', 'special', 'special_event', null, 'common', 15),
  ('night_owl', 'Night Owl', 'Complete a task after 8 PM', 'fas fa-moon', 'special', 'special_event', null, 'common', 15),
  ('weekend_warrior', 'Weekend Warrior', 'Complete 5 tasks on a weekend', 'fas fa-mountain', 'special', 'special_event', 5, 'rare', 50),
  ('helping_hand', 'Helping Hand', 'Help a sibling with a task', 'fas fa-hands-helping', 'special', 'special_event', null, 'rare', 30)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. USER_ACHIEVEMENTS TABLE (Earned Badges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- Current progress toward achievement (if not yet earned)
  is_earned BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own achievements
CREATE POLICY "Users view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Parents can view all family achievements
CREATE POLICY "Parents view all achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Policy: System can insert achievements (authenticated users)
CREATE POLICY "Users earn achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: System can update achievement progress
CREATE POLICY "Users update achievement progress"
  ON user_achievements FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. USER_STREAKS TABLE (Track Consecutive Task Completion)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  streak_start_date DATE,
  total_tasks_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own streaks
CREATE POLICY "Users view own streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Parents can view all family streaks
CREATE POLICY "Parents view all streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Policy: Users can insert their own streak record
CREATE POLICY "Users create own streaks"
  ON user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own streaks
CREATE POLICY "Users update own streaks"
  ON user_streaks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. USER_LEVELS TABLE (Level System)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0, -- Total experience points
  xp_for_next_level INTEGER DEFAULT 100, -- XP needed for next level
  level_title TEXT DEFAULT 'Beginner', -- 'Beginner', 'Novice', 'Expert', 'Master', 'Legend'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own level
CREATE POLICY "Users view own levels"
  ON user_levels FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Parents can view all family levels
CREATE POLICY "Parents view all levels"
  ON user_levels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Policy: Users can insert their own level record
CREATE POLICY "Users create own levels"
  ON user_levels FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own level
CREATE POLICY "Users update own levels"
  ON user_levels FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate XP needed for next level (exponential scaling)
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Formula: level * 100 * 1.2^(level-1)
  -- Level 1: 100 XP
  -- Level 2: 240 XP
  -- Level 3: 432 XP
  -- Level 5: 932 XP
  -- Level 10: ~6,192 XP
  RETURN FLOOR(level * 100 * POWER(1.2, level - 1));
END;
$$ LANGUAGE plpgsql;

-- Function to get level title based on level number
CREATE OR REPLACE FUNCTION get_level_title(level INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN level >= 50 THEN 'Legend'
    WHEN level >= 30 THEN 'Master'
    WHEN level >= 20 THEN 'Expert'
    WHEN level >= 10 THEN 'Advanced'
    WHEN level >= 5 THEN 'Novice'
    ELSE 'Beginner'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak when task is completed
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Get current streak data
  SELECT last_completion_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM user_streaks
  WHERE user_id = p_user_id;

  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_completion_date, streak_start_date, total_tasks_completed)
    VALUES (p_user_id, 1, 1, v_today, v_today, 1);
    RETURN;
  END IF;

  -- If completed today already, just increment task count
  IF v_last_date = v_today THEN
    UPDATE user_streaks
    SET total_tasks_completed = total_tasks_completed + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- If completed yesterday, increment streak
  IF v_last_date = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    
    -- Update longest streak if current exceeds it
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;

    UPDATE user_streaks
    SET current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_completion_date = v_today,
        total_tasks_completed = total_tasks_completed + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken, start new streak
    UPDATE user_streaks
    SET current_streak = 1,
        last_completion_date = v_today,
        streak_start_date = v_today,
        total_tasks_completed = total_tasks_completed + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add XP and level up
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp_amount INTEGER)
RETURNS VOID AS $$
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
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(is_earned);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '🎮 Gamification system created successfully!';
  RAISE NOTICE '✅ Created tables: achievements, user_achievements, user_streaks, user_levels';
  RAISE NOTICE '🏆 Inserted 14 starter achievements';
  RAISE NOTICE '🔒 RLS policies configured for all tables';
  RAISE NOTICE '⚡ Helper functions created for streaks, XP, and levels';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Initialize user_streaks and user_levels for existing users';
  RAISE NOTICE '2. Hook up task completion to update_user_streak() and add_user_xp()';
  RAISE NOTICE '3. Build achievement checking logic in your app';
END $$;
