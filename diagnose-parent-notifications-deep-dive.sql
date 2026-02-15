-- ============================================================================
-- DEEP DIVE: PARENT NOTIFICATIONS ISSUE
-- ============================================================================
-- Running all critical checks to identify the exact problem

-- ============================================================================
-- CHECK 1: Show parent-targeted reward notifications
-- ============================================================================
SELECT 
  '=== PARENT REWARD NOTIFICATIONS ===' as section;

SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at,
  p.full_name as recipient_name,
  p.role as recipient_role,
  p.email as recipient_email
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE n.title ILIKE '%Reward%'
ORDER BY n.created_at DESC
LIMIT 50;

-- ============================================================================
-- CHECK 2: Notifications count grouped by user role
-- ============================================================================
SELECT 
  '=== NOTIFICATION COUNT BY ROLE ===' as section;

SELECT 
  COALESCE(p.role, 'NO ROLE/NULL') as user_role,
  COUNT(*) as notification_count,
  SUM(CASE WHEN n.read = false THEN 1 ELSE 0 END) as unread_count
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
GROUP BY p.role
ORDER BY notification_count DESC;

-- ============================================================================
-- CHECK 3: Show ALL RLS policies for notifications (full detail)
-- ============================================================================
SELECT 
  '=== NOTIFICATIONS RLS POLICIES ===' as section;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- ============================================================================
-- CHECK 4: Verify parent lookup in user_profiles table
-- ============================================================================
SELECT 
  '=== PARENT LOOKUP IN USER_PROFILES ===' as section;

SELECT 
  up.id as user_profile_id,
  up.role as user_profile_role,
  p.id AS profile_id,
  p.full_name,
  p.role as profile_role,
  p.family_id,
  p.email
FROM user_profiles up
JOIN profiles p ON p.id = up.id
WHERE up.role = 'parent'
LIMIT 50;

-- ============================================================================
-- CHECK 5: Check for notifications with NULL user_id
-- ============================================================================
SELECT 
  '=== NOTIFICATIONS WITH NULL USER_ID ===' as section;

SELECT 
  n.id,
  n.user_id,
  n.family_id,
  n.title,
  n.message,
  n.created_at
FROM notifications n
WHERE n.user_id IS NULL
LIMIT 50;

-- ============================================================================
-- CHECK 6: Recent reward redemption approvals (should trigger parent notifications)
-- ============================================================================
SELECT 
  '=== RECENT REWARD REDEMPTIONS (SHOULD TRIGGER NOTIFICATIONS) ===' as section;

SELECT 
  rr.id,
  rr.user_id as child_id,
  rr.reward_id,
  rr.status,
  rr.approved_by as parent_id,
  rr.approved_at,
  rr.redeemed_at,
  p_child.full_name as child_name,
  p_parent.full_name as parent_name,
  r.title as reward_title
FROM reward_redemptions rr
LEFT JOIN profiles p_child ON p_child.id = rr.user_id
LEFT JOIN profiles p_parent ON p_parent.id = rr.approved_by
LEFT JOIN rewards r ON r.id = rr.reward_id
WHERE rr.status IN ('approved', 'rejected')
ORDER BY COALESCE(rr.approved_at, rr.redeemed_at) DESC
LIMIT 20;

-- ============================================================================
-- CHECK 7: Test the parent lookup query used in notify_reward_status_changed()
-- ============================================================================
SELECT 
  '=== TEST PARENT LOOKUP QUERY (from trigger function) ===' as section;

-- Simulate what the trigger does: find parent for a specific family
WITH test_families AS (
  SELECT DISTINCT family_id 
  FROM profiles 
  WHERE family_id IS NOT NULL 
  LIMIT 5
)
SELECT 
  tf.family_id,
  p.id as parent_id,
  p.full_name as parent_name,
  p.role as profile_role,
  up.role as user_profile_role
FROM test_families tf
LEFT JOIN profiles p ON p.family_id = tf.family_id
LEFT JOIN user_profiles up ON up.id = p.id AND up.role = 'parent'
WHERE up.role = 'parent'
ORDER BY tf.family_id;

-- ============================================================================
-- CHECK 8: Cross-check profiles.role vs user_profiles.role
-- ============================================================================
SELECT 
  '=== ROLE MISMATCH CHECK ===' as section;

SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role as profiles_role,
  up.role as user_profiles_role,
  CASE 
    WHEN p.role IS NULL THEN '❌ profiles.role is NULL'
    WHEN up.role IS NULL THEN '❌ user_profiles.role is NULL'
    WHEN p.role != up.role THEN '⚠️ MISMATCH'
    ELSE '✅ Match'
  END as role_status
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
-- CHECK 9: Show notification trigger function source code
-- ============================================================================
SELECT 
  '=== REWARD NOTIFICATION TRIGGER FUNCTION ===' as section;

SELECT 
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'notify_reward_status_changed'
  AND n.nspname = 'public';

-- ============================================================================
-- CHECK 10: Show recent task completions (should also notify parents)
-- ============================================================================
SELECT 
  '=== RECENT TASK COMPLETIONS (SHOULD TRIGGER NOTIFICATIONS) ===' as section;

SELECT 
  t.id,
  t.title,
  t.assigned_to as child_id,
  t.completed_at,
  t.approved,
  p_child.full_name as child_name,
  p_child.family_id
FROM tasks t
LEFT JOIN profiles p_child ON p_child.id = t.assigned_to
WHERE t.completed_at IS NOT NULL
ORDER BY t.completed_at DESC
LIMIT 20;

-- ============================================================================
-- FINAL SUMMARY WITH RECOMMENDATIONS
-- ============================================================================
DO $$
DECLARE
  v_total_notifications INTEGER;
  v_parent_notifications INTEGER;
  v_child_notifications INTEGER;
  v_null_user_notifications INTEGER;
  v_parent_count INTEGER;
  v_reward_notifications INTEGER;
BEGIN
  -- Counts
  SELECT COUNT(*) INTO v_total_notifications FROM notifications;
  
  SELECT COUNT(*) INTO v_parent_notifications
  FROM notifications n
  JOIN profiles p ON p.id = n.user_id
  WHERE p.role = 'parent';
  
  SELECT COUNT(*) INTO v_child_notifications
  FROM notifications n
  JOIN profiles p ON p.id = n.user_id
  WHERE p.role = 'child';
  
  SELECT COUNT(*) INTO v_null_user_notifications
  FROM notifications
  WHERE user_id IS NULL;
  
  SELECT COUNT(*) INTO v_parent_count
  FROM profiles
  WHERE role = 'parent';
  
  SELECT COUNT(*) INTO v_reward_notifications
  FROM notifications
  WHERE title ILIKE '%Reward%';
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         PARENT NOTIFICATIONS DIAGNOSTIC SUMMARY                ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTICS:';
  RAISE NOTICE '  • Total notifications: %', v_total_notifications;
  RAISE NOTICE '  • Notifications for parents: %', v_parent_notifications;
  RAISE NOTICE '  • Notifications for children: %', v_child_notifications;
  RAISE NOTICE '  • Notifications with NULL user_id: %', v_null_user_notifications;
  RAISE NOTICE '  • Reward-related notifications: %', v_reward_notifications;
  RAISE NOTICE '  • Number of parent users: %', v_parent_count;
  RAISE NOTICE '';
  
  -- Diagnosis
  IF v_parent_notifications = 0 AND v_child_notifications > 0 THEN
    RAISE NOTICE '🔴 PROBLEM IDENTIFIED: Notifications are only going to children!';
    RAISE NOTICE '';
    RAISE NOTICE '   Root cause: Trigger functions are likely NOT inserting parent notifications';
    RAISE NOTICE '';
    RAISE NOTICE '   Solutions needed:';
    RAISE NOTICE '   1️⃣  Fix notify_reward_status_changed() - it should INSERT for parent_id too';
    RAISE NOTICE '   2️⃣  Fix notify_task_completed() - should notify parent';
    RAISE NOTICE '   3️⃣  Fix notify_task_approved() - should notify child';
    RAISE NOTICE '   4️⃣  Check other trigger functions';
    RAISE NOTICE '';
  ELSIF v_null_user_notifications > 0 THEN
    RAISE NOTICE '🟡 WARNING: Some notifications have NULL user_id';
    RAISE NOTICE '   → Check trigger functions for proper parent lookup';
  ELSE
    RAISE NOTICE '✅ Notifications are being created for parents';
    RAISE NOTICE '   → Problem may be RLS policies or client-side filtering';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT ACTIONS:';
  RAISE NOTICE '  1. Review the query results above';
  RAISE NOTICE '  2. Check if parent_id was found in notification triggers';
  RAISE NOTICE '  3. Verify RLS policies allow parents to read notifications';
  RAISE NOTICE '  4. Check useNotifications hook is fetching correctly';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
