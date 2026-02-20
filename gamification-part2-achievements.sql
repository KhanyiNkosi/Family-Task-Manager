-- Part 2: Update user_achievements table (FIXED)
-- Run this second

ALTER TABLE user_achievements 
  ADD COLUMN IF NOT EXISTS achievement_type TEXT,
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Insert default achievements (using correct column names)
INSERT INTO achievements (name, title, description, icon, category, requirement_type, requirement_value, rarity, points_reward)
VALUES 
  ('first_steps', 'First Steps', 'Complete your first task', '🌟', 'tasks', 'tasks_completed', 1, 'common', 10),
  ('task_master', 'Task Master', 'Complete 10 tasks', '⭐', 'tasks', 'tasks_completed', 10, 'rare', 50),
  ('super_star', 'Super Star', 'Complete 50 tasks', '🌠', 'tasks', 'tasks_completed', 50, 'epic', 200),
  ('point_collector', 'Point Collector', 'Earn 100 points', '💰', 'points', 'points_earned', 100, 'rare', 50),
  ('high_achiever', 'High Achiever', 'Earn 500 points', '💎', 'points', 'points_earned', 500, 'epic', 200),
  ('consistency_king', 'Consistency King', 'Maintain a 7-day streak', '🔥', 'streak', 'streak_days', 7, 'legendary', 300)
ON CONFLICT (id) DO NOTHING;
