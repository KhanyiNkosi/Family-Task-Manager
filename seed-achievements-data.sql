-- SEED ACHIEVEMENTS DATA
-- Populate achievements table with 20+ achievement badges

-- Clear existing achievements (if any)
TRUNCATE TABLE user_achievements CASCADE;
DELETE FROM achievements;

-- Insert achievement badges
INSERT INTO achievements (name, title, description, icon, category, requirement_type, requirement_value, rarity, points_reward) VALUES
-- Task Completion Achievements (Common)
('first_task', 'First Steps', 'Complete your very first task!', 'fas fa-star', 'tasks', 'tasks_completed', 1, 'common', 10),
('task_master_5', 'Getting Started', 'Complete 5 tasks', 'fas fa-check-circle', 'tasks', 'tasks_completed', 5, 'common', 25),
('task_master_10', 'Task Warrior', 'Complete 10 tasks', 'fas fa-fire', 'tasks', 'tasks_completed', 10, 'common', 50),

-- Task Completion Achievements (Rare)
('task_master_25', 'Task Champion', 'Complete 25 tasks', 'fas fa-trophy', 'tasks', 'tasks_completed', 25, 'rare', 100),
('task_master_50', 'Task Legend', 'Complete 50 tasks', 'fas fa-crown', 'tasks', 'tasks_completed', 50, 'rare', 200),
('task_master_100', 'Century Club', 'Complete 100 tasks', 'fas fa-gem', 'tasks', 'tasks_completed', 100, 'rare', 500),

-- Streak Achievements (Common)
('streak_3', 'On Fire!', 'Maintain a 3-day completion streak', 'fas fa-fire', 'streaks', 'current_streak', 3, 'common', 20),
('streak_7', 'Week Warrior', 'Maintain a 7-day completion streak', 'fas fa-fire-alt', 'streaks', 'current_streak', 7, 'common', 75),

-- Streak Achievements (Rare)
('streak_14', 'Two Week Titan', 'Maintain a 14-day completion streak', 'fas fa-bolt', 'streaks', 'current_streak', 14, 'rare', 150),
('streak_30', 'Month Master', 'Maintain a 30-day completion streak', 'fas fa-medal', 'streaks', 'current_streak', 30, 'rare', 300),

-- Streak Achievements (Epic)
('streak_60', 'Unstoppable', 'Maintain a 60-day completion streak', 'fas fa-rocket', 'streaks', 'current_streak', 60, 'epic', 600),
('streak_100', 'Legendary Streak', 'Maintain a 100-day completion streak', 'fas fa-infinity', 'streaks', 'current_streak', 100, 'epic', 1000),

-- Level Achievements (Rare)
('level_5', 'Rising Star', 'Reach level 5', 'fas fa-star-half-alt', 'levels', 'current_level', 5, 'rare', 50),
('level_10', 'Power Player', 'Reach level 10', 'fas fa-award', 'levels', 'current_level', 10, 'rare', 150),

-- Level Achievements (Epic)
('level_20', 'Elite Member', 'Reach level 20', 'fas fa-crown', 'levels', 'current_level', 20, 'epic', 400),
('level_50', 'Grandmaster', 'Reach level 50', 'fas fa-chess-king', 'levels', 'current_level', 50, 'epic', 1000),

-- Points Achievements (Rare)
('points_500', 'Point Collector', 'Earn 500 total points', 'fas fa-coins', 'points', 'total_points', 500, 'rare', 100),
('points_1000', 'Point Accumulator', 'Earn 1000 total points', 'fas fa-sack-dollar', 'points', 'total_points', 1000, 'rare', 250),

-- Points Achievements (Epic)
('points_5000', 'Point Hoarder', 'Earn 5000 total points', 'fas fa-treasure-chest', 'points', 'total_points', 5000, 'epic', 750),
('points_10000', 'Point Legend', 'Earn 10,000 total points', 'fas fa-gem', 'points', 'total_points', 10000, 'epic', 1500),

-- Special Achievements (Legendary)
('perfect_week', 'Perfect Week', 'Complete all assigned tasks for 7 days straight', 'fas fa-certificate', 'special', 'perfect_days', 7, 'legendary', 1000),
('early_bird', 'Early Bird', 'Complete 10 tasks before noon', 'fas fa-sun', 'special', 'early_completions', 10, 'legendary', 500),
('night_owl', 'Night Owl', 'Complete 10 tasks after 8 PM', 'fas fa-moon', 'special', 'late_completions', 10, 'legendary', 500),
('speed_demon', 'Speed Demon', 'Complete 5 tasks within 1 hour of assignment', 'fas fa-tachometer-alt', 'special', 'fast_completions', 5, 'legendary', 750);

-- Verify insert
SELECT 
  COUNT(*) as total_achievements,
  COUNT(CASE WHEN rarity = 'common' THEN 1 END) as common,
  COUNT(CASE WHEN rarity = 'rare' THEN 1 END) as rare,
  COUNT(CASE WHEN rarity = 'epic' THEN 1 END) as epic,
  COUNT(CASE WHEN rarity = 'legendary' THEN 1 END) as legendary
FROM achievements;

-- Show sample badges
SELECT 
  title,
  description,
  rarity,
  requirement_type,
  requirement_value,
  icon
FROM achievements
ORDER BY 
  CASE rarity 
    WHEN 'common' THEN 1 
    WHEN 'rare' THEN 2 
    WHEN 'epic' THEN 3 
    WHEN 'legendary' THEN 4 
  END,
  requirement_value
LIMIT 10;
