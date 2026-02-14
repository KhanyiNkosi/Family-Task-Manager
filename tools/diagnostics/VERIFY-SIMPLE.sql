-- ============================================================================
-- SIMPLE VERIFICATION - Returns actual query results
-- ============================================================================

-- 1. Check all required tables exist
SELECT 
  'Tables Check' as check_type,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') as tasks_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') as profiles_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'families') as families_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') as achievements_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') as user_achievements_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_levels') as user_levels_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_streaks') as user_streaks_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_feed') as activity_feed_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_reactions') as activity_reactions_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_comments') as activity_comments_exists;

-- 2. Check required columns on tasks table
SELECT 
  'Tasks Columns' as check_type,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'photo_url') as photo_url_exists,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'photo_uploaded_at') as photo_uploaded_at_exists,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at') as completed_at_exists,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'approved') as approved_exists;

-- 3. Check required functions exist
SELECT 
  'Functions Check' as check_type,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_user_xp') as add_user_xp_exists,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_task_approval_gamification') as process_gamification_exists,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_unlock_achievements') as check_achievements_exists,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'award_task_xp') as award_task_xp_exists,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_task_streak') as update_task_streak_exists,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_gamification_stats') as get_stats_exists;

-- 4. Check required triggers exist
SELECT 
  'Triggers Check' as check_type,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'task_approval_gamification_trigger') as gamification_trigger_exists,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'task_completion_activity_trigger') as completion_activity_trigger_exists,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'task_approval_activity_trigger') as approval_activity_trigger_exists,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'achievement_earned_activity_trigger') as achievement_activity_trigger_exists;

-- 5. Check achievements populated
SELECT 
  'Achievements Data' as check_type,
  COUNT(*) as total_achievements,
  COUNT(CASE WHEN requirement_type = 'task_count' THEN 1 END) as task_count_achievements,
  COUNT(CASE WHEN requirement_type = 'streak_days' THEN 1 END) as streak_achievements,
  COUNT(CASE WHEN requirement_type = 'points_earned' THEN 1 END) as points_achievements
FROM achievements;

-- 6. Final summary
SELECT 
  CASE 
    WHEN (
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') AND
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_user_xp') AND
      EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'task_approval_gamification_trigger') AND
      (SELECT COUNT(*) FROM achievements) > 0
    ) THEN '✅ READY TO DEPLOY'
    ELSE '❌ MISSING DEPENDENCIES'
  END as deployment_status,
  (SELECT COUNT(*) FROM achievements) as achievements_count,
  (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%gamification%') as gamification_functions_count,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%activity%' OR tgname LIKE '%gamification%') as trigger_count;
