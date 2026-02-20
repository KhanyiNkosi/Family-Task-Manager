-- Test if badge system is working
-- This simulates approving a task and checking if XP increases

-- 1. Get a child's current XP
SELECT 
  full_name,
  current_level,
  total_xp
FROM profiles p
JOIN user_levels ul ON ul.user_id = p.id
WHERE p.role = 'child'
LIMIT 1;

-- 2. Now approve a task for that child in the UI and run query 1 again
-- The total_xp should increase by (task_points * 10)
