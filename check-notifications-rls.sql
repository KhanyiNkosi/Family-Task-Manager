-- CHECK NOTIFICATIONS TABLE RLS POLICIES
-- This will show all RLS policies for the notifications table

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

-- Also check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'notifications';

-- Test query: Can parent select notifications?
-- (Replace USER_ID with actual parent ID to test)
SELECT COUNT(*), user_id, type
FROM notifications
GROUP BY user_id, type
ORDER BY COUNT(*) DESC;
