-- ============================================================================
-- INVESTIGATE MISSING GAMIFICATION - Why didn't triggers fire?
-- ============================================================================

-- 1. Check the child profile
SELECT 
  '👤 CHILD PROFILE' as "Info",
  p.id as "User ID",
  p.full_name as "Name",
  p.email as "Email",
  p.role as "Role",
  p.family_id as "Family ID",
  p.created_at as "Created At"
FROM profiles p
WHERE p.id = '17eb2a70-6fef-4f01-8303-03883c92e705';

-- 2. Check approved tasks for this child
SELECT 
  '✅ APPROVED TASKS' as "Status",
  t.id as "Task ID",
  t.title as "Task",
  t.points as "Points",
  t.approved as "Approved",
  t.completed_at as "Completed At",
  t.assigned_to as "Assigned To"
FROM tasks t
WHERE t.assigned_to = '17eb2a70-6fef-4f01-8303-03883c92e705'
  AND t.approved = true
ORDER BY t.completed_at;

-- 3. Check if triggers exist on tasks table
SELECT 
  '🔧 TRIGGERS ON TASKS' as "Info",
  trigger_name as "Trigger Name",
  event_manipulation as "Event",
  action_timing as "Timing",
  action_statement as "Function Called"
FROM information_schema.triggers
WHERE event_object_table = 'tasks'
ORDER BY trigger_name;

-- 4. Check if gamification functions exist
SELECT 
  '⚙️ FUNCTIONS' as "Type",
  routine_name as "Function Name",
  routine_type as "Type"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'process_task_approval_gamification',
    'award_task_xp',
    'check_and_unlock_achievements',
    'update_task_streak'
  )
ORDER BY routine_name;

-- 5. Check if gamification tables have ANY data
SELECT 
  '📊 GAMIFICATION DATA' as "Check",
  (SELECT COUNT(*) FROM user_levels WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705') as "User Levels",
  (SELECT COUNT(*) FROM user_streaks WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705') as "User Streaks",
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705') as "Achievements",
  (SELECT COUNT(*) FROM activity_feed WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705') as "Activity Feed";

-- 6. Try to manually run the gamification function for this user
SELECT 
  '🎮 MANUAL TEST' as "Action",
  'Running process_task_approval_gamification...' as "Status";

-- Call the function manually to test
SELECT process_task_approval_gamification('17eb2a70-6fef-4f01-8303-03883c92e705'::uuid);

-- 7. Check results after manual run
SELECT 
  '📊 AFTER MANUAL RUN' as "Check",
  (SELECT COUNT(*) FROM user_levels WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705') as "User Levels",
  (SELECT COUNT(*) FROM user_streaks WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705') as "User Streaks",
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705') as "Achievements",
  (SELECT COUNT(*) FROM activity_feed WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705') as "Activity Feed";

-- 8. Show XP and achievements if created
SELECT 
  '⭐ GAMIFICATION RESULTS' as "Type",
  ul.total_xp as "Total XP",
  ul.current_level as "Level",
  ul.level_title as "Title"
FROM user_levels ul
WHERE ul.user_id = '17eb2a70-6fef-4f01-8303-03883c92e705';

SELECT 
  '🏆 ACHIEVEMENTS UNLOCKED' as "Status",
  a.name as "Achievement",
  a.title as "Title",
  ua.earned_at as "When"
FROM user_achievements ua
JOIN achievements a ON a.id = ua.achievement_id
WHERE ua.user_id = '17eb2a70-6fef-4f01-8303-03883c92e705'
ORDER BY ua.earned_at;

-- ============================================================================
-- DIAGNOSIS:
-- 
-- If triggers don't exist:
--   → Run COMPLETE-DEPLOYMENT.sql to create them
-- 
-- If functions don't exist:
--   → Run COMPLETE-DEPLOYMENT.sql to create them
-- 
-- If manual function call works:
--   → Triggers aren't firing automatically when tasks are approved
--   → Need to create/fix the trigger on tasks table
-- 
-- If manual function call fails:
--   → Check the error message
--   → Might be RLS policy issue (run FIX-GAMIFICATION-RLS.sql)
-- ============================================================================
