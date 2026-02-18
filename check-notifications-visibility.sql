-- ============================================================================
-- Final check: Ensure all policies needed for parent dashboard are in place
-- ============================================================================

-- Check what SELECT policies exist for notifications
SELECT 
  'notifications' as table_name,
  policyname,
  cmd,
  '📋 Policy' as type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notifications'
  AND cmd = 'SELECT';

-- Check suggestions: Verify notifications with reward suggestions exist
SELECT 
  COUNT(*) as suggestion_count,
  user_id,
  'Suggestions in DB' as type
FROM notifications
WHERE action_url = '/rewards-store'
GROUP BY user_id;
