-- ============================================================================
-- DIAGNOSTIC CHECK - See what data exists in the database
-- ============================================================================

-- 1. Check if there are ANY users
SELECT 
  '👥 USERS' as "Check",
  COUNT(*) as "Total",
  COUNT(*) FILTER (WHERE role = 'parent') as "Parents",
  COUNT(*) FILTER (WHERE role = 'child') as "Children"
FROM profiles;

-- 2. Check if there are ANY families
SELECT 
  '👨‍👩‍👧‍👦 FAMILIES' as "Check",
  COUNT(*) as "Total Families"
FROM families;

-- 3. Check if there are ANY tasks
SELECT 
  '📋 TASKS' as "Check",
  COUNT(*) as "Total",
  COUNT(*) FILTER (WHERE completed = true) as "Completed",
  COUNT(*) FILTER (WHERE approved = true) as "Approved"
FROM tasks;

-- 4. Check gamification tables
SELECT 
  '🎮 GAMIFICATION' as "Check",
  (SELECT COUNT(*) FROM achievements) as "Achievements Defined",
  (SELECT COUNT(*) FROM user_levels) as "User Levels Created",
  (SELECT COUNT(*) FROM user_streaks) as "User Streaks Created",
  (SELECT COUNT(*) FROM user_achievements) as "Achievements Unlocked";

-- 5. Check activity feed
SELECT 
  '📰 ACTIVITY FEED' as "Check",
  COUNT(*) as "Total Entries",
  COUNT(*) FILTER (WHERE activity_type = 'task_completed') as "Task Completions",
  COUNT(*) FILTER (WHERE activity_type = 'task_approved') as "Task Approvals"
FROM activity_feed;

-- 6. List all child users (if any)
SELECT 
  '👶 CHILD USERS' as "Type",
  p.full_name as "Name",
  p.id as "User ID",
  p.family_id as "Family ID"
FROM profiles p
WHERE p.role = 'child';

-- 7. If there are children, show their task status
SELECT 
  '📊 CHILD TASK STATUS' as "Report",
  p.full_name as "Child Name",
  COUNT(t.id) as "Total Tasks",
  COUNT(*) FILTER (WHERE t.completed = true) as "Completed",
  COUNT(*) FILTER (WHERE t.approved = true) as "Approved",
  COALESCE(SUM(t.points) FILTER (WHERE t.approved = true), 0) as "Points Earned"
FROM profiles p
LEFT JOIN tasks t ON t.assigned_to = p.id
WHERE p.role = 'child'
GROUP BY p.id, p.full_name;

-- ============================================================================
-- RECOMMENDATION:
-- 
-- If all counts are ZERO or no children exist:
--   → You need to test manually in the browser:
--      1. Create parent account (sign up)
--      2. Create child account (via Add Child)
--      3. Create a task (10 points)
--      4. Login as child and complete it
--      5. Login as parent and approve it
--      6. Re-run CHECK-GAMIFICATION.sql
-- 
-- If children exist but no approved tasks:
--   → Complete and approve at least one task
--   → Then re-run CHECK-GAMIFICATION.sql
-- ============================================================================
