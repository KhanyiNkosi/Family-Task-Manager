-- ============================================================================
-- VERIFY DEPLOYMENT - Check All Dependencies
-- Run this to confirm everything is set up correctly
-- ============================================================================

-- Check for required tables
DO $$
DECLARE
  v_missing_tables TEXT[] := ARRAY[]::TEXT[];
  v_table_name TEXT;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 VERIFYING DEPLOYMENT...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check each required table
  FOREACH v_table_name IN ARRAY ARRAY['tasks', 'profiles', 'families', 'achievements', 'user_achievements', 'user_levels', 'user_streaks', 'activity_feed', 'activity_reactions', 'activity_comments']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = v_table_name) THEN
      v_missing_tables := array_append(v_missing_tables, v_table_name);
      RAISE NOTICE '❌ Table missing: %', v_table_name;
    ELSE
      RAISE NOTICE '✅ Table exists: %', v_table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  
  -- Check for required columns on tasks table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'photo_url') THEN
    RAISE NOTICE '❌ Column missing: tasks.photo_url';
  ELSE
    RAISE NOTICE '✅ Column exists: tasks.photo_url';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'photo_uploaded_at') THEN
    RAISE NOTICE '❌ Column missing: tasks.photo_uploaded_at';
  ELSE
    RAISE NOTICE '✅ Column exists: tasks.photo_uploaded_at';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at') THEN
    RAISE NOTICE '❌ Column missing: tasks.completed_at';
  ELSE
    RAISE NOTICE '✅ Column exists: tasks.completed_at';
  END IF;
  
  RAISE NOTICE '';
  
  -- Check for required functions
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_user_xp') THEN
    RAISE NOTICE '❌ Function missing: add_user_xp';
  ELSE
    RAISE NOTICE '✅ Function exists: add_user_xp';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_task_approval_gamification') THEN
    RAISE NOTICE '❌ Function missing: process_task_approval_gamification';
  ELSE
    RAISE NOTICE '✅ Function exists: process_task_approval_gamification';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_unlock_achievements') THEN
    RAISE NOTICE '❌ Function missing: check_and_unlock_achievements';
  ELSE
    RAISE NOTICE '✅ Function exists: check_and_unlock_achievements';
  END IF;
  
  RAISE NOTICE '';
  
  -- Check for required triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'task_approval_gamification_trigger') THEN
    RAISE NOTICE '❌ Trigger missing: task_approval_gamification_trigger';
  ELSE
    RAISE NOTICE '✅ Trigger exists: task_approval_gamification_trigger';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'task_completion_activity_trigger') THEN
    RAISE NOTICE '❌ Trigger missing: task_completion_activity_trigger';
  ELSE
    RAISE NOTICE '✅ Trigger exists: task_completion_activity_trigger';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'task_approval_activity_trigger') THEN
    RAISE NOTICE '❌ Trigger missing: task_approval_activity_trigger';
  ELSE
    RAISE NOTICE '✅ Trigger exists: task_approval_activity_trigger';
  END IF;
  
  RAISE NOTICE '';
  
  -- Check achievements data
  IF (SELECT COUNT(*) FROM achievements) = 0 THEN
    RAISE NOTICE '⚠️  Warning: No achievements found in database';
    RAISE NOTICE '   → Run create-gamification-system.sql to insert achievement data';
  ELSE
    RAISE NOTICE '✅ Achievements populated: % badges found', (SELECT COUNT(*) FROM achievements);
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  IF array_length(v_missing_tables, 1) > 0 THEN
    RAISE NOTICE '❌ DEPLOYMENT INCOMPLETE';
    RAISE NOTICE '';
    RAISE NOTICE 'Missing dependencies detected. Run these SQL files first:';
    RAISE NOTICE '  1. create-gamification-system.sql (creates achievements, user_achievements, user_levels, user_streaks)';
    RAISE NOTICE '  2. create-activity-feed-system-v2.sql (creates activity_feed, reactions, comments)';
    RAISE NOTICE '  3. Then re-run COMPLETE-DEPLOYMENT.sql';
  ELSE
    RAISE NOTICE '✅ DEPLOYMENT VERIFIED - ALL DEPENDENCIES PRESENT';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to test:';
    RAISE NOTICE '  • Complete a task as child';
    RAISE NOTICE '  • Approve task as parent';
    RAISE NOTICE '  • Check achievements unlocked';
    RAISE NOTICE '  • Check activity feed populated';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
