-- ============================================================================
-- CHECK NOTIFICATIONS SYSTEM
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose notification issues

-- 1. Check if notifications table exists
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE tablename = 'notifications';

-- 2. Check notifications table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 3. Check RLS policies on notifications table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications';

-- 4. Check if trigger functions exist
SELECT 
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname LIKE 'notify_%';

-- 5. Check if triggers are attached to tasks table
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'tasks'::regclass
ORDER BY tgname;

-- 6. Check current notifications (if any)
SELECT 
  id,
  user_id,
  family_id,
  title,
  message,
  type,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- 7. Test if we can insert a notification manually
DO $$
DECLARE
  test_user_id uuid;
  test_family_id uuid;
BEGIN
  -- Get a user and family to test with
  SELECT id INTO test_user_id FROM profiles LIMIT 1;
  SELECT id INTO test_family_id FROM families LIMIT 1;
  
  IF test_user_id IS NOT NULL AND test_family_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, family_id, title, message, type, read)
    VALUES (
      test_user_id,
      test_family_id,
      'Test Notification',
      'This is a test notification to verify the system works',
      'info',
      false
    );
    RAISE NOTICE 'Test notification created successfully for user %', test_user_id;
  ELSE
    RAISE NOTICE 'No users or families found to test with';
  END IF;
END $$;
