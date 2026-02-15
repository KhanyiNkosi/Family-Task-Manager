-- ============================================================================
-- DIAGNOSE PARENT NOTIFICATIONS ISSUE
-- ============================================================================
-- This script checks why parents might not be receiving notifications

-- Step 1: Check if notifications table exists and has data
SELECT 
  'Total notifications in system:' as check_type,
  COUNT(*) as count
FROM notifications;

-- Step 2: Check notifications table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Step 3: Check RLS policies on notifications
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
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- Step 4: Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'notifications';

-- Step 5: Check parent profiles (find users with 'parent' role)
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.family_id,
  p.email
FROM profiles p
WHERE p.role = 'parent'
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 6: Check notifications sent to parents
SELECT 
  n.id,
  n.user_id,
  n.family_id,
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at,
  p.full_name as recipient_name,
  p.role as recipient_role
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE p.role = 'parent'
ORDER BY n.created_at DESC
LIMIT 20;

-- Step 7: Check if there are any notifications where recipient is a parent
SELECT 
  'Notifications for parents:' as check_type,
  COUNT(*) as count
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE p.role = 'parent';

-- Step 8: Check recent notifications (all users)
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.type,
  n.read,
  n.created_at,
  p.full_name as recipient_name,
  p.role as recipient_role,
  p.email as recipient_email
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 30;

-- Step 9: Check user_profiles table (role information)
SELECT 
  up.id,
  up.role,
  p.full_name,
  p.email,
  p.family_id
FROM user_profiles up
JOIN profiles p ON p.id = up.id
WHERE up.role = 'parent'
LIMIT 10;

-- Step 10: Check if parent email matches test accounts
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.family_id,
  up.role as user_profile_role
FROM profiles p
LEFT JOIN user_profiles up ON up.id = p.id
WHERE p.email IN (
  'mvaleliso.mdluli@gmail.com',
  'nqobileoctavia24@gmail.com',
  'emeldahlatshwayo59@gmail.com',
  'hlatshwayonoluthando02@gmail.com',
  'kometsilwandle@gmail.com',
  'nkosik8@gmail.com'
)
ORDER BY p.email;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
DECLARE
  v_total_notifications INTEGER;
  v_parent_notifications INTEGER;
  v_parent_count INTEGER;
  v_rls_enabled BOOLEAN;
BEGIN
  -- Count total notifications
  SELECT COUNT(*) INTO v_total_notifications FROM notifications;
  
  -- Count parent notifications
  SELECT COUNT(*) INTO v_parent_notifications
  FROM notifications n
  JOIN profiles p ON p.id = n.user_id
  WHERE p.role = 'parent';
  
  -- Count parents
  SELECT COUNT(*) INTO v_parent_count
  FROM profiles
  WHERE role = 'parent';
  
  -- Check RLS
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE tablename = 'notifications';
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'PARENT NOTIFICATIONS DIAGNOSTIC';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total notifications in system: %', v_total_notifications;
  RAISE NOTICE 'Notifications for parents: %', v_parent_notifications;
  RAISE NOTICE 'Number of parent users: %', v_parent_count;
  RAISE NOTICE 'RLS enabled on notifications: %', v_rls_enabled;
  RAISE NOTICE '';
  
  IF v_parent_count = 0 THEN
    RAISE NOTICE '⚠️  WARNING: No parent profiles found!';
    RAISE NOTICE '   → Check if profiles.role is set correctly';
    RAISE NOTICE '   → Check user_profiles table';
  END IF;
  
  IF v_parent_notifications = 0 AND v_total_notifications > 0 THEN
    RAISE NOTICE '⚠️  WARNING: No notifications are being sent to parents!';
    RAISE NOTICE '   → Check notification trigger functions';
    RAISE NOTICE '   → Verify parent user_id is used in INSERT statements';
  END IF;
  
  IF NOT v_rls_enabled THEN
    RAISE NOTICE '⚠️  WARNING: RLS is disabled on notifications table!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Check the query results above for details.';
  RAISE NOTICE '====================================';
END $$;
