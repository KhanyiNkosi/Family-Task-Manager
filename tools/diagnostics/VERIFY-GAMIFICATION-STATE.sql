-- ============================================================================
-- VERIFY GAMIFICATION STATE - Check XP, levels, streaks, achievements
-- ============================================================================

-- Find a child user with approved tasks
WITH child_user AS (
  SELECT p.id, p.full_name, p.role
  FROM profiles p
  WHERE p.role = 'child'
  LIMIT 1
)

-- Display comprehensive gamification data
SELECT 
  '=== USER INFO ===' as section,
  cu.full_name as name,
  cu.id as user_id,
  cu.role
FROM child_user cu

UNION ALL

SELECT 
  '=== POINTS ===' as section,
  COALESCE(SUM(t.points), 0)::text as earned_points,
  NULL,
  NULL
FROM child_user cu
LEFT JOIN tasks t ON t.assigned_to = cu.id AND t.approved = true

UNION ALL

SELECT 
  '=== XP & LEVEL ===' as section,
  COALESCE(ul.total_xp, 0)::text as total_xp,
  COALESCE(ul.current_level, 1)::text as current_level,
  ul.level_title
FROM child_user cu
LEFT JOIN user_levels ul ON ul.user_id = cu.id

UNION ALL

SELECT 
  '=== STREAK ===' as section,
  COALESCE(us.current_streak, 0)::text as current_streak,
  COALESCE(us.longest_streak, 0)::text as longest_streak,
  us.last_completion_date::text
FROM child_user cu
LEFT JOIN user_streaks us ON us.user_id = cu.id

UNION ALL

SELECT 
  '=== ACHIEVEMENTS ===' as section,
  COUNT(ua.id)::text as unlocked_count,
  NULL,
  NULL
FROM child_user cu
LEFT JOIN user_achievements ua ON ua.user_id = cu.id

UNION ALL

SELECT 
  '=== RECENT ACHIEVEMENTS ===' as section,
  a.name,
  a.description,
  ua.earned_at::text
FROM child_user cu
LEFT JOIN user_achievements ua ON ua.user_id = cu.id
LEFT JOIN achievements a ON a.id = ua.achievement_id
ORDER BY ua.earned_at DESC
LIMIT 5;

-- Detailed achievements breakdown
SELECT 
  '📊 ACHIEVEMENT DETAILS' as header,
  a.name,
  a.description,
  a.icon,
  a.requirement_type,
  a.requirement_value,
  CASE WHEN ua.id IS NOT NULL THEN '✅ UNLOCKED' ELSE '🔒 LOCKED' END as status,
  ua.earned_at
FROM achievements a
LEFT JOIN (
  SELECT * FROM user_achievements 
  WHERE user_id = (SELECT id FROM profiles WHERE role = 'child' LIMIT 1)
) ua ON ua.achievement_id = a.id
ORDER BY a.id;

-- Recent activity feed
SELECT 
  '📰 RECENT ACTIVITIES' as header,
  af.activity_type,
  af.title,
  af.metadata->>'task_title' as task_details,
  (af.metadata->>'points_earned')::INTEGER as points,
  af.created_at
FROM activity_feed af
WHERE af.user_id = (SELECT id FROM profiles WHERE role = 'child' LIMIT 1)
ORDER BY af.created_at DESC
LIMIT 10;

-- Task completion statistics
SELECT 
  '📋 TASK STATS' as header,
  COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
  COUNT(*) FILTER (WHERE approved = true) as approved_tasks,
  SUM(points) FILTER (WHERE approved = true) as total_points_earned
FROM tasks
WHERE assigned_to = (SELECT id FROM profiles WHERE role = 'child' LIMIT 1);
