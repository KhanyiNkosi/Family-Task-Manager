-- Check if parent can see reminder notifications
-- Run this to debug the reminder feature

-- 1. Check all notifications in the system
SELECT 
  '=== All Notifications ===' as info,
  id,
  user_id,
  type,
  title,
  message,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check notifications for the parent user
-- Replace 'PARENT-USER-ID' with actual parent ID from profiles table
SELECT 
  '=== Parent Notifications ===' as info,
  n.id,
  n.type,
  n.title,
  n.message,
  n.read,
  n.created_at,
  p.full_name as parent_name
FROM notifications n
JOIN profiles p ON n.user_id = p.id
WHERE p.role = 'parent'
ORDER BY n.created_at DESC;

-- 3. Check if there are any reminder notifications
SELECT 
  '=== Reminder Notifications ===' as info,
  n.id,
  n.type,
  n.title,
  n.message,
  n.user_id,
  p.full_name as recipient_name,
  p.role as recipient_role,
  n.created_at
FROM notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.type IN ('task', 'reward')
ORDER BY n.created_at DESC;

-- 4. Check RLS policies on notifications table
SELECT 
  '=== Notifications RLS Policies ===' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'notifications';

-- 5. Test if parent can read notifications
-- This will return a count of readable notifications for the current user
SELECT 
  '=== Current User Can Read ===' as info,
  COUNT(*) as notification_count
FROM notifications;
