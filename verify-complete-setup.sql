-- Final Verification Query for Notification System
-- Copy and paste this into Supabase SQL Editor to verify everything is set up

-- ============================================================================
-- 1. Check notifications table exists with all columns
-- ============================================================================
SELECT 
  'Notifications Table' as check_name,
  COUNT(*) as column_count,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
GROUP BY table_name;

-- ============================================================================
-- 2. Check trigger functions exist
-- ============================================================================
SELECT 
  'Trigger Functions' as check_name,
  routine_name as function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'notify_%'
ORDER BY routine_name;

-- ============================================================================
-- 3. Check triggers on tasks table
-- ============================================================================
SELECT 
  'Tasks Table Triggers' as check_name,
  trigger_name,
  event_manipulation as event_type,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'tasks'
ORDER BY trigger_name;

-- ============================================================================
-- 4. Check triggers on reward_redemptions table
-- ============================================================================
SELECT 
  'Reward Redemptions Triggers' as check_name,
  trigger_name,
  event_manipulation as event_type,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'reward_redemptions'
ORDER BY trigger_name;

-- ============================================================================
-- 5. Check RLS policies on notifications table
-- ============================================================================
SELECT 
  'RLS Policies' as check_name,
  policyname as policy_name,
  cmd as command_type,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notifications'
ORDER BY policyname;

-- ============================================================================
-- 6. Check helper functions exist
-- ============================================================================
SELECT 
  'Helper Functions' as check_name,
  routine_name as function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_notification',
    'mark_notification_read',
    'mark_all_notifications_read',
    'cleanup_old_notifications'
  )
ORDER BY routine_name;

-- ============================================================================
-- 7. Current notification count
-- ============================================================================
SELECT 
  'Current Data' as check_name,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE is_read = true) as read_count
FROM notifications;

-- ============================================================================
-- Summary message
-- ============================================================================
DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_trigger_count INTEGER;
  v_function_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO v_table_exists;
  
  -- Count triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
    AND event_object_table IN ('tasks', 'reward_redemptions');
  
  -- Count functions
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name LIKE 'notify_%';
  
  -- Count policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'notifications';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTIFICATION SYSTEM VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF v_table_exists THEN
    RAISE NOTICE '✅ Notifications table: EXISTS';
  ELSE
    RAISE NOTICE '❌ Notifications table: MISSING';
  END IF;
  
  RAISE NOTICE '📊 Trigger functions: % found', v_function_count;
  RAISE NOTICE '🔔 Active triggers: % found', v_trigger_count;
  RAISE NOTICE '🔒 RLS policies: % found', v_policy_count;
  RAISE NOTICE '';
  
  IF v_table_exists AND v_trigger_count >= 6 AND v_function_count >= 6 AND v_policy_count >= 4 THEN
    RAISE NOTICE '🎉 SUCCESS! Notification system is fully set up!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create a family (parent + child accounts)';
    RAISE NOTICE '2. Assign a task to the child';
    RAISE NOTICE '3. Have child complete the task';
    RAISE NOTICE '4. Approve the task as parent';
    RAISE NOTICE '5. Check notifications table for new entries';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Setup incomplete!';
    IF NOT v_table_exists THEN
      RAISE NOTICE '   - Run create-notifications-table.sql';
    END IF;
    IF v_trigger_count < 6 THEN
      RAISE NOTICE '   - Run create-notification-triggers.sql';
    END IF;
    IF v_policy_count < 4 THEN
      RAISE NOTICE '   - Check RLS policies on notifications table';
    END IF;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
