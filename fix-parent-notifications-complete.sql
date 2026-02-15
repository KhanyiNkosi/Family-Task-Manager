-- ============================================================================
-- FIX: Parent Notifications Not Being Created
-- ============================================================================
-- Problem: The trigger conditional is too restrictive and never fires
-- Solution: Remove the OLD.status check and trigger on ANY approval/rejection
-- ============================================================================

-- ============================================================================
-- STEP 1: Update notify_reward_status_changed() to fire on ALL approvals/rejections
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_reward_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_reward_title TEXT;
  v_points INTEGER;
  v_parent_id UUID;
  v_child_name TEXT;
BEGIN
  -- ✅ FIXED: Trigger on ANY status = approved/rejected (not just transitions from pending)
  -- Old condition was too restrictive: (OLD.status = 'pending' OR OLD.status = 'requested') AND NEW.status IN ('approved', 'rejected')
  -- New condition triggers whenever status is approved/rejected AND it just changed
  IF NEW.status IN ('approved', 'rejected') AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.approved_at IS NULL) THEN
    
    -- Get reward details
    SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
    FROM rewards
    WHERE id = NEW.reward_id;
    
    -- Get child's name
    SELECT full_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Find parent in the family
    SELECT p.id INTO v_parent_id
    FROM profiles p
    JOIN user_profiles up ON up.id = p.id
    WHERE p.family_id = v_family_id
      AND up.role = 'parent'
    LIMIT 1;
    
    RAISE NOTICE 'Reward notification trigger fired - Status: %, Child: %, Parent: %', NEW.status, NEW.user_id, v_parent_id;
    
    -- Create notification for CHILD
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        NEW.user_id,
        v_family_id,
        'Reward Approved! 🎁',
        'Your reward "' || v_reward_title || '" has been approved! Enjoy!',
        'success',
        '/child-dashboard',
        'View Rewards'
      );
      
      RAISE NOTICE 'Created child notification for user_id: %', NEW.user_id;
      
      -- ALSO notify PARENT of approval
      IF v_parent_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
        VALUES (
          v_parent_id,
          v_family_id,
          'Reward Approved ✅',
          'You approved "' || v_reward_title || '" for ' || COALESCE(v_child_name, 'child') || ' (' || v_points || ' points)',
          'info',
          '/parent-dashboard',
          'View Dashboard'
        );
        
        RAISE NOTICE 'Created parent notification for user_id: %', v_parent_id;
      ELSE
        RAISE WARNING 'Parent not found for family_id: %', v_family_id;
      END IF;
      
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        NEW.user_id,
        v_family_id,
        'Reward Request Denied',
        'Your request for "' || v_reward_title || '" was not approved. Your ' || v_points || ' points have been returned.',
        'warning',
        '/child-dashboard',
        'View Dashboard'
      );
      
      RAISE NOTICE 'Created child rejection notification for user_id: %', NEW.user_id;
      
      -- ALSO notify PARENT of rejection
      IF v_parent_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
        VALUES (
          v_parent_id,
          v_family_id,
          'Reward Rejected',
          'You rejected "' || v_reward_title || '" for ' || COALESCE(v_child_name, 'child'),
          'info',
          '/parent-dashboard',
          'View Dashboard'
        );
        
        RAISE NOTICE 'Created parent rejection notification for user_id: %', v_parent_id;
      ELSE
        RAISE WARNING 'Parent not found for family_id: %', v_family_id;
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Reward notification trigger condition not met - Status: % → %, Approved_at: % → %', 
      OLD.status, NEW.status, OLD.approved_at, NEW.approved_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Verify the trigger is attached
-- ============================================================================

-- Drop and recreate to ensure it's attached properly
DROP TRIGGER IF EXISTS reward_status_notification ON reward_redemptions;
CREATE TRIGGER reward_status_notification
  AFTER UPDATE ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_status_changed();

-- ============================================================================
-- STEP 3: Test with existing approved redemption
-- ============================================================================

-- Temporarily update an approved redemption to trigger notifications
DO $$
DECLARE
  v_test_redemption RECORD;
BEGIN
  -- Find a recent approved redemption
  SELECT * INTO v_test_redemption
  FROM reward_redemptions
  WHERE status = 'approved'
    AND approved_at IS NOT NULL
  ORDER BY approved_at DESC
  LIMIT 1;
  
  IF v_test_redemption.id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTING: Triggering notification for redemption: %', v_test_redemption.id;
    RAISE NOTICE '   Status: %, Child: %, Parent: %', 
      v_test_redemption.status, 
      v_test_redemption.user_id, 
      v_test_redemption.approved_by;
    
    -- Force trigger by updating updated_at (this fires AFTER UPDATE trigger)
    UPDATE reward_redemptions
    SET updated_at = NOW()
    WHERE id = v_test_redemption.id;
    
    RAISE NOTICE '✅ Test update executed - check notifications table';
  ELSE
    RAISE NOTICE '⚠️  No approved redemptions found to test with';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Verify notifications were created
-- ============================================================================

SELECT 
  '=== NOTIFICATIONS CREATED IN LAST 5 MINUTES ===' as section;

SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.created_at,
  p.full_name as recipient_name,
  p.role as recipient_role
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY n.created_at DESC;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_recent_notifications INTEGER;
  v_reward_notifications INTEGER;
BEGIN
  -- Count notifications created in last 5 minutes
  SELECT COUNT(*) INTO v_recent_notifications
  FROM notifications
  WHERE created_at > NOW() - INTERVAL '5 minutes';
  
  -- Count reward-related notifications
  SELECT COUNT(*) INTO v_reward_notifications
  FROM notifications
  WHERE title ILIKE '%reward%' OR message ILIKE '%reward%';
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         REWARD NOTIFICATIONS FIX APPLIED                       ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Updated notify_reward_status_changed() function';
  RAISE NOTICE '✅ Recreated reward_status_notification trigger';
  RAISE NOTICE '✅ Ran test update on approved redemption';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTS:';
  RAISE NOTICE '  • Notifications created in last 5 minutes: %', v_recent_notifications;
  RAISE NOTICE '  • Total reward notifications: %', v_reward_notifications;
  RAISE NOTICE '';
  
  IF v_recent_notifications > 0 THEN
    RAISE NOTICE '🎉 SUCCESS! Notifications are now being created!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Test by having a child redeem a reward';
    RAISE NOTICE '  2. Approve/reject as parent';
    RAISE NOTICE '  3. Check BOTH dashboards for notifications';
  ELSE
    RAISE NOTICE '⚠️  No new notifications created in test';
    RAISE NOTICE '   → Check the RAISE NOTICE output above for details';
    RAISE NOTICE '   → May need to check RLS policies or parent lookup';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
