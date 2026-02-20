-- Test if trigger fires by checking recent approved tasks
-- and seeing if there are corresponding gamification entries

-- 1. Get the most recent approved task
SELECT 
  id,
  title,
  assigned_to,
  points,
  completed,
  approved,
  created_at
FROM tasks
WHERE approved = true
ORDER BY created_at DESC
LIMIT 1;

-- 2. Now let's check if the user has profile data
SELECT 
  id,
  full_name,
  total_xp,
  level,
  task_streak
FROM profiles
WHERE id = (SELECT assigned_to FROM tasks WHERE approved = true ORDER BY created_at DESC LIMIT 1);

-- 3. Check recent achievements
SELECT 
  user_id,
  achievement_type,
  unlocked_at,
  metadata
FROM user_achievements
WHERE user_id = (SELECT assigned_to FROM tasks WHERE approved = true ORDER BY created_at DESC LIMIT 1)
ORDER BY unlocked_at DESC
LIMIT 5;
