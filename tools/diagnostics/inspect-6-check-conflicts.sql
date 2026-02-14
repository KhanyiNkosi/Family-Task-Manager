-- ============================================================================
-- QUERY 6: Check for Conflicting Tables
-- Verify no existing gamification/activity feed tables before creating new ones
-- ============================================================================

-- Check for gamification tables
SELECT 
  'GAMIFICATION TABLES' as category,
  tablename as table_name,
  CASE 
    WHEN tablename IN ('achievements', 'user_achievements', 'user_streaks', 'user_levels')
    THEN '⚠️ EXISTS - May conflict'
    ELSE 'OK'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('achievements', 'user_achievements', 'user_streaks', 'user_levels');

-- Check for activity feed tables
SELECT 
  'ACTIVITY FEED TABLES' as category,
  tablename as table_name,
  CASE 
    WHEN tablename IN ('activity_feed', 'activity_reactions', 'activity_comments')
    THEN '⚠️ EXISTS - May conflict'
    ELSE 'OK'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('activity_feed', 'activity_reactions', 'activity_comments');

-- If no results appear, that means those tables don't exist yet (GOOD!)
-- Result should be empty if we're safe to proceed
