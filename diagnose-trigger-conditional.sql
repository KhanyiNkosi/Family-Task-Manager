-- ============================================================================
-- FINAL DIAGNOSIS: Why reward notifications aren't being created
-- ============================================================================

-- ============================================================================
-- CHECK 1: What are the ACTUAL status values in reward_redemptions?
-- ============================================================================
SELECT 
  '=== ACTUAL STATUS VALUES IN REWARD_REDEMPTIONS ===' as section;

SELECT 
  status,
  COUNT(*) as count,
  array_agg(DISTINCT id ORDER BY id LIMIT 5) as sample_ids
FROM reward_redemptions
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- CHECK 2: Show recent redemptions with their OLD status → NEW status transitions
-- ============================================================================
SELECT 
  '=== RECENT REDEMPTIONS (to understand status transitions) ===' as section;

SELECT 
  rr.id,
  rr.status as current_status,
  rr.user_id as child_id,
  rr.approved_by as parent_id,
  rr.redeemed_at,
  rr.approved_at,
  p_child.full_name as child_name,
  p_parent.full_name as parent_name,
  r.title as reward_title,
  CASE 
    WHEN rr.approved_at IS NULL THEN 'Not yet approved'
    WHEN rr.status = 'approved' THEN '✅ Approved'
    WHEN rr.status = 'rejected' THEN '❌ Rejected'
    ELSE 'Unknown'
  END as approval_status
FROM reward_redemptions rr
LEFT JOIN profiles p_child ON p_child.id = rr.user_id
LEFT JOIN profiles p_parent ON p_parent.id = rr.approved_by
LEFT JOIN rewards r ON r.id = rr.reward_id
ORDER BY COALESCE(rr.approved_at, rr.redeemed_at) DESC
LIMIT 20;

-- ============================================================================
-- CHECK 3: Broadened notification search (look for ANY reward-related notifications)
-- ============================================================================
SELECT 
  '=== BROAD NOTIFICATION SEARCH (Approved, Rejected, reward keywords) ===' as section;

SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at,
  p.full_name as recipient_name,
  p.role as recipient_role
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE 
  n.title ILIKE '%Approved%' 
  OR n.title ILIKE '%Rejected%' 
  OR n.title ILIKE '%Denied%'
  OR n.message ILIKE '%reward%'
  OR n.title ILIKE '%🎁%'
  OR n.title ILIKE '%Reward%'
ORDER BY n.created_at DESC
LIMIT 100;

-- ============================================================================
-- CHECK 4: Test the trigger conditional with actual data
-- ============================================================================
SELECT 
  '=== TRIGGER CONDITIONAL TEST (simulate the IF check) ===' as section;

-- Simulate what happens when the trigger runs
WITH recent_redemptions AS (
  SELECT 
    id,
    status,
    approved_at,
    CASE 
      WHEN status IN ('approved', 'rejected') THEN 'NEW.status matches (approved/rejected)'
      ELSE 'NEW.status does NOT match'
    END as new_status_check,
    CASE 
      WHEN status = 'pending' THEN '✅ Would match: OLD.status = pending'
      WHEN status = 'requested' THEN '✅ Would match: OLD.status = requested'
      ELSE '❌ Would NOT match: OLD.status is "' || status || '"'
    END as old_status_check
  FROM reward_redemptions
  WHERE approved_at IS NOT NULL
  ORDER BY approved_at DESC
  LIMIT 10
)
SELECT 
  id,
  status,
  new_status_check,
  old_status_check,
  CASE 
    WHEN status IN ('approved', 'rejected') 
      AND (status = 'pending' OR status = 'requested')
    THEN '✅ Trigger would fire'
    ELSE '❌ Trigger would NOT fire'
  END as trigger_would_fire
FROM recent_redemptions;

-- ============================================================================
-- CHECK 5: Verify the trigger function conditional logic
-- ============================================================================
SELECT 
  '=== TRIGGER FUNCTION CONDITIONAL ===' as section;

SELECT 
  'The trigger checks: (OLD.status = ''pending'' OR OLD.status = ''requested'') AND NEW.status IN (''approved'', ''rejected'')' as trigger_condition,
  'This means notifications only fire when status changes FROM pending/requested TO approved/rejected' as explanation;

-- ============================================================================
-- CHECK 6: Check for any notifications created today
-- ============================================================================
SELECT 
  '=== ALL NOTIFICATIONS CREATED TODAY ===' as section;

SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.created_at,
  p.full_name as recipient,
  p.role
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE DATE(n.created_at) = CURRENT_DATE
ORDER BY n.created_at DESC;

-- ============================================================================
-- CHECK 7: Check the reward_redemptions table schema
-- ============================================================================
SELECT 
  '=== REWARD_REDEMPTIONS TABLE STRUCTURE ===' as section;

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reward_redemptions'
ORDER BY ordinal_position;

-- ============================================================================
-- DIAGNOSIS SUMMARY
-- ============================================================================
DO $$
DECLARE
  v_total_redemptions INTEGER;
  v_approved_redemptions INTEGER;
  v_pending_redemptions INTEGER;
  v_reward_notifications INTEGER;
  v_status_values TEXT;
BEGIN
  -- Count redemptions
  SELECT COUNT(*) INTO v_total_redemptions FROM reward_redemptions;
  SELECT COUNT(*) INTO v_approved_redemptions FROM reward_redemptions WHERE status = 'approved';
  SELECT COUNT(*) INTO v_pending_redemptions FROM reward_redemptions WHERE status = 'pending';
  
  -- Count reward notifications
  SELECT COUNT(*) INTO v_reward_notifications
  FROM notifications
  WHERE title ILIKE '%reward%' OR message ILIKE '%reward%';
  
  -- Get distinct status values
  SELECT string_agg(DISTINCT status, ', ' ORDER BY status) INTO v_status_values
  FROM reward_redemptions;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         REWARD NOTIFICATION TRIGGER DIAGNOSIS                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 REWARD REDEMPTIONS:';
  RAISE NOTICE '  • Total redemptions: %', v_total_redemptions;
  RAISE NOTICE '  • Approved redemptions: %', v_approved_redemptions;
  RAISE NOTICE '  • Pending redemptions: %', v_pending_redemptions;
  RAISE NOTICE '  • Status values in table: %', v_status_values;
  RAISE NOTICE '';
  RAISE NOTICE '📧 NOTIFICATIONS:';
  RAISE NOTICE '  • Reward-related notifications: %', v_reward_notifications;
  RAISE NOTICE '';
  
  -- Diagnosis
  IF v_reward_notifications = 0 AND v_approved_redemptions > 0 THEN
    RAISE NOTICE '🔴 PROBLEM CONFIRMED: Approvals exist but NO notifications created!';
    RAISE NOTICE '';
    RAISE NOTICE '   Possible causes:';
    RAISE NOTICE '   1️⃣  Status transitions dont match trigger conditional';
    RAISE NOTICE '      → Check if status goes directly to "approved" without being "pending" first';
    RAISE NOTICE '      → The trigger only fires on UPDATE when OLD.status was pending/requested';
    RAISE NOTICE '';
    RAISE NOTICE '   2️⃣  Parent lookup (v_parent_id) is failing/returning NULL';
    RAISE NOTICE '      → Function tries to find parent but cant, so skips INSERT';
    RAISE NOTICE '';
    RAISE NOTICE '   3️⃣  Trigger fires but conditional evaluates FALSE';
    RAISE NOTICE '      → Status might be "pending" before AND after approval (not changing)';
    RAISE NOTICE '';
  ELSIF v_reward_notifications > 0 THEN
    RAISE NOTICE '✅ Reward notifications ARE being created';
    RAISE NOTICE '   → Problem may be client-side filtering or RLS';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 RECOMMENDED FIX:';
  RAISE NOTICE '   If status doesnt transition from pending→approved,';
  RAISE NOTICE '   modify the trigger to fire on ANY status = approved/rejected:';
  RAISE NOTICE '';
  RAISE NOTICE '   Change from:';
  RAISE NOTICE '     IF (OLD.status = pending OR OLD.status = requested)';
  RAISE NOTICE '        AND NEW.status IN (approved, rejected) THEN';
  RAISE NOTICE '';
  RAISE NOTICE '   Change to:';
  RAISE NOTICE '     IF NEW.status IN (approved, rejected)';
  RAISE NOTICE '        AND (OLD.status != NEW.status OR OLD.approved_at IS NULL)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
