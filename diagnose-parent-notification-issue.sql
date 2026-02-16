-- ============================================================================
-- Diagnose Parent Notification Issues
-- ============================================================================

\echo '============================================================================'
\echo 'DIAGNOSTIC 1: Check if metadata column exists'
\echo '============================================================================'

SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND column_name = 'metadata';

\echo ''
\echo '============================================================================'
\echo 'DIAGNOSTIC 2: Check current trigger function definition'
\echo '============================================================================'

SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'notify_reward_status_changed'
  AND routine_type = 'FUNCTION';

\echo ''
\echo '============================================================================'
\echo 'DIAGNOSTIC 3: Check if trigger exists and is enabled'
\echo '============================================================================'

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE trigger_name = 'reward_status_notification_trigger';

\echo ''
\echo '============================================================================'
\echo 'DIAGNOSTIC 4: Check recent reward redemptions'
\echo '============================================================================'

SELECT 
  rr.id,
  rr.status,
  rr.approved_at,
  rr.rejected_at,
  r.title as reward_title,
  p.full_name as child_name,
  rr.created_at
FROM reward_redemptions rr
JOIN rewards r ON r.id = rr.reward_id
JOIN profiles p ON p.id = rr.user_id
ORDER BY rr.created_at DESC
LIMIT 5;

\echo ''
\echo '============================================================================'
\echo 'DIAGNOSTIC 5: Check notifications for recent redemptions'
\echo '============================================================================'

WITH recent_redemptions AS (
  SELECT id, status, created_at
  FROM reward_redemptions
  ORDER BY created_at DESC
  LIMIT 5
)
SELECT 
  rr.id as redemption_id,
  rr.status as redemption_status,
  COUNT(n.id) as notification_count,
  STRING_AGG(DISTINCT n.type, ', ') as notification_types,
  STRING_AGG(DISTINCT up.role, ', ') as recipient_roles
FROM recent_redemptions rr
LEFT JOIN notifications n ON n.metadata->>'redemption_id' = rr.id::text
LEFT JOIN user_profiles up ON up.id = n.user_id
GROUP BY rr.id, rr.status, rr.created_at
ORDER BY rr.created_at DESC;

\echo ''
\echo '============================================================================'
\echo 'DIAGNOSTIC 6: Check for approved/rejected redemptions without parent notifications'
\echo '============================================================================'

SELECT 
  rr.id as redemption_id,
  rr.status,
  r.title as reward_title,
  p.full_name as child_name,
  rr.approved_at,
  rr.rejected_at,
  (SELECT COUNT(*) 
   FROM notifications n 
   WHERE n.metadata->>'redemption_id' = rr.id::text) as total_notifications,
  (SELECT COUNT(*) 
   FROM notifications n 
   JOIN user_profiles up ON up.id = n.user_id
   WHERE n.metadata->>'redemption_id' = rr.id::text 
     AND up.role = 'parent') as parent_notifications
FROM reward_redemptions rr
JOIN rewards r ON r.id = rr.reward_id
JOIN profiles p ON p.id = rr.user_id
WHERE rr.status IN ('approved', 'rejected')
ORDER BY COALESCE(rr.approved_at, rr.rejected_at) DESC
LIMIT 10;

\echo ''
\echo '============================================================================'
\echo 'DIAGNOSTIC 7: Check if there are any parents in families'
\echo '============================================================================'

SELECT 
  p.family_id,
  COUNT(*) as parent_count,
  STRING_AGG(p.full_name, ', ') as parent_names
FROM profiles p
JOIN user_profiles up ON up.id = p.id
WHERE up.role = 'parent'
  AND p.family_id IS NOT NULL
GROUP BY p.family_id;

\echo ''
\echo '============================================================================'
\echo 'DIAGNOSTIC 8: Test trigger manually (if safe)'
\echo '============================================================================'

\echo 'To manually test, run: UPDATE reward_redemptions SET updated_at = NOW() WHERE status = ''approved'' LIMIT 1;'

\echo ''
\echo '============================================================================'
\echo 'SUMMARY'
\echo '============================================================================'
\echo 'Check the results above to identify the issue:'
\echo '1. If metadata column is missing → Run fix-parent-notifications-final-idempotent.sql'
\echo '2. If trigger function is old → Run fix-parent-notifications-final-idempotent.sql'
\echo '3. If notifications exist but not for parents → Check parent role assignment'
\echo '4. If no notifications at all → Trigger might not be firing'
\echo '5. If no parents found → Need to assign parent role to users'
\echo '============================================================================'
