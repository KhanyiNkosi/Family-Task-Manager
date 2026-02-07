-- Verification script for notification system
-- Run this in Supabase SQL Editor to check if everything is properly set up

-- Check if notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
) AS notifications_table_exists;

-- List all columns in notifications table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check RLS policies on notifications table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notifications';

-- Check if triggers exist
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
AND event_object_table IN ('tasks', 'reward_redemptions')
ORDER BY event_object_table, trigger_name;

-- Check if trigger functions exist
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notif%'
ORDER BY routine_name;

-- Test notification creation (manual test)
-- Uncomment and modify with real IDs to test
/*
SELECT create_notification(
  'USER_ID_HERE'::uuid,  -- Replace with real user ID
  'FAMILY_CODE_HERE',    -- Replace with real family code
  'Test Notification',
  'This is a test notification',
  'info',
  NULL,
  NULL
);
*/

-- Count existing notifications
SELECT COUNT(*) as notification_count FROM notifications;

-- Show recent notifications (if any)
SELECT id, user_id, title, message, type, read, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
