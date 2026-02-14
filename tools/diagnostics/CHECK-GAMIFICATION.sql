-- ============================================================================
-- CHECK GAMIFICATION STATUS - Simple queries to verify system is working
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. USER INFO - Find test child
SELECT 
  '👤 USER' as "Info",
  p.full_name as "Name",
  p.id as "User ID"
FROM profiles p
WHERE p.role = 'child'
LIMIT 1;

-- 2. POINTS & XP - Current totals
SELECT 
  '⭐ POINTS/XP' as "Category",
  COALESCE(SUM(t.points), 0) as "Points from Tasks",
  COALESCE(ul.total_xp, 0) as "Total XP",
  COALESCE(ul.current_level, 1) as "Level",
  COALESCE(ul.level_title, 'Beginner') as "Level Title"
FROM profiles p
LEFT JOIN tasks t ON t.assigned_to = p.id AND t.approved = true
LEFT JOIN user_levels ul ON ul.user_id = p.id
WHERE p.role = 'child'
GROUP BY p.id, ul.total_xp, ul.current_level, ul.level_title;

-- 3. STREAK - Daily completion tracking
SELECT 
  '🔥 STREAK' as "Category",
  COALESCE(us.current_streak, 0) as "Current (days)",
  COALESCE(us.longest_streak, 0) as "Longest Ever",
  us.last_completion_date as "Last Task"
FROM profiles p
LEFT JOIN user_streaks us ON us.user_id = p.id
WHERE p.role = 'child';

-- 4. ACHIEVEMENTS - Unlocked badges
SELECT 
  '🏆 UNLOCKED' as "Status",
  a.name as "Achievement",
  a.icon as "Icon",
  ua.earned_at as "When"
FROM profiles p
JOIN user_achievements ua ON ua.user_id = p.id
JOIN achievements a ON a.id = ua.achievement_id
WHERE p.role = 'child'
ORDER BY ua.earned_at DESC;

-- 5. ACTIVITY FEED - Recent gamification events
SELECT 
  '📰 ACTIVITY' as "Feed",
  af.activity_type as "Type",
  af.title as "Title",
  af.metadata->>'task_title' as "Details",
  (af.metadata->>'points_earned')::INTEGER as "Points",
  af.created_at as "Time"
FROM profiles p
JOIN activity_feed af ON af.user_id = p.id
WHERE p.role = 'child'
ORDER BY af.created_at DESC
LIMIT 5;

-- ============================================================================
-- EXPECTED RESULTS (after approving first task):
-- 
-- - Points: 10 (or whatever task value was)
-- - XP: 100 (points × 10)
-- - Level: 1 (Beginner)
-- - Streak: 1 day
-- - Achievement: "Getting Started" (unlocked at 25+ points)
-- - Activity: Task completion + Achievement unlock entries
-- ============================================================================
