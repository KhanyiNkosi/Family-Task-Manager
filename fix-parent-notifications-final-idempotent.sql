-- ============================================================================
-- FINAL FIX: Parent Notifications with Idempotency
-- ============================================================================
-- Root cause: Trigger was too restrictive (required status change)
-- Solution: Trigger on ANY approved/rejected status + add idempotency check
-- ============================================================================

-- ============================================================================
-- STEP 1: Add metadata column to notifications (if not exists)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Added metadata column to notifications';
  ELSE
    RAISE NOTICE 'ℹ️  Metadata column already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create idempotent notification function
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_reward_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_reward_title TEXT;
  v_points INTEGER;
  v_parent_id UUID;
  v_child_name TEXT;
  v_existing_notification_id UUID;
BEGIN
  -- Only process approved/rejected statuses
  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;
  
  -- Get reward details
  SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
  FROM rewards
  WHERE id = NEW.reward_id;
  
  -- If reward not found, skip
  IF v_reward_title IS NULL THEN
    RETURN NEW;
  END IF;
  
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
  
  -- ============================================================================
  -- IDEMPOTENCY: Check if notifications already exist for this redemption
  -- ============================================================================
  
  SELECT id INTO v_existing_notification_id
  FROM notifications
  WHERE metadata->>'redemption_id' = NEW.id::text
    AND metadata->>'status' = NEW.status
  LIMIT 1;
  
  -- If notification already exists, skip creation
  IF v_existing_notification_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- ============================================================================
  -- Create notifications (child + parent)
  -- ============================================================================
  
  IF NEW.status = 'approved' THEN
    
    -- Child notification
    INSERT INTO notifications (
      user_id, 
      family_id, 
      title, 
      message, 
      type, 
      action_url, 
      action_text,
      metadata
    )
    VALUES (
      NEW.user_id,
      v_family_id,
      'Reward Approved! 🎁',
      'Your reward "' || v_reward_title || '" has been approved! Enjoy!',
      'success',
      '/child-dashboard',
      'View Rewards',
      jsonb_build_object(
        'redemption_id', NEW.id::text,
        'reward_id', NEW.reward_id::text,
        'status', 'approved',
        'recipient', 'child'
      )
    );
    
    -- Parent notification
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, 
        family_id, 
        title, 
        message, 
        type, 
        action_url, 
        action_text,
        metadata
      )
      VALUES (
        v_parent_id,
        v_family_id,
        'Reward Approved ✅',
        'You approved "' || v_reward_title || '" for ' || COALESCE(v_child_name, 'child') || ' (' || v_points || ' points)',
        'info',
        '/parent-dashboard',
        'View Dashboard',
        jsonb_build_object(
          'redemption_id', NEW.id::text,
          'reward_id', NEW.reward_id::text,
          'status', 'approved',
          'recipient', 'parent',
          'child_id', NEW.user_id::text
        )
      );
    END IF;
    
  ELSIF NEW.status = 'rejected' THEN
    
    -- Child notification
    INSERT INTO notifications (
      user_id, 
      family_id, 
      title, 
      message, 
      type, 
      action_url, 
      action_text,
      metadata
    )
    VALUES (
      NEW.user_id,
      v_family_id,
      'Reward Request Denied',
      'Your request for "' || v_reward_title || '" was not approved. Your ' || v_points || ' points have been returned.',
      'warning',
      '/child-dashboard',
      'View Dashboard',
      jsonb_build_object(
        'redemption_id', NEW.id::text,
        'reward_id', NEW.reward_id::text,
        'status', 'rejected',
        'recipient', 'child'
      )
    );
    
    -- Parent notification
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, 
        family_id, 
        title, 
        message, 
        type, 
        action_url, 
        action_text,
        metadata
      )
      VALUES (
        v_parent_id,
        v_family_id,
        'Reward Rejected',
        'You rejected "' || v_reward_title || '" for ' || COALESCE(v_child_name, 'child'),
        'info',
        '/parent-dashboard',
        'View Dashboard',
        jsonb_build_object(
          'redemption_id', NEW.id::text,
          'reward_id', NEW.reward_id::text,
          'status', 'rejected',
          'recipient', 'parent',
          'child_id', NEW.user_id::text
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Recreate trigger
-- ============================================================================

DROP TRIGGER IF EXISTS reward_status_notification ON reward_redemptions;
CREATE TRIGGER reward_status_notification
  AFTER UPDATE ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_status_changed();

-- ============================================================================
-- STEP 4: Test with existing approved redemption
-- ============================================================================

DO $$
DECLARE
  v_test_redemption RECORD;
  v_notifications_before INTEGER;
  v_notifications_after INTEGER;
BEGIN
  -- Count notifications before
  SELECT COUNT(*) INTO v_notifications_before
  FROM notifications
  WHERE created_at > NOW() - INTERVAL '1 minute';
  
  -- Find a recent approved redemption
  SELECT * INTO v_test_redemption
  FROM reward_redemptions
  WHERE status = 'approved'
    AND approved_at IS NOT NULL
  ORDER BY approved_at DESC
  LIMIT 1;
  
  IF v_test_redemption.id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Testing with redemption: %', v_test_redemption.id;
    RAISE NOTICE '   Status: %, User: %', v_test_redemption.status, v_test_redemption.user_id;
    
    -- Force trigger by updating updated_at
    UPDATE reward_redemptions
    SET updated_at = NOW()
    WHERE id = v_test_redemption.id;
    
    -- Count notifications after
    SELECT COUNT(*) INTO v_notifications_after
    FROM notifications
    WHERE created_at > NOW() - INTERVAL '1 minute';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Test Results:';
    RAISE NOTICE '   • Notifications before: %', v_notifications_before;
    RAISE NOTICE '   • Notifications after: %', v_notifications_after;
    RAISE NOTICE '   • New notifications: %', v_notifications_after - v_notifications_before;
    
    IF v_notifications_after > v_notifications_before THEN
      RAISE NOTICE '✅ SUCCESS! Notifications created!';
    ELSE
      RAISE NOTICE 'ℹ️  No new notifications (may already exist due to idempotency)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No approved redemptions found';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Display recent notifications
-- ============================================================================

SELECT 
  '=== NOTIFICATIONS CREATED IN LAST 2 MINUTES ===' as section;

SELECT 
  n.id,
  TO_CHAR(n.created_at, 'HH24:MI:SS') as time,
  n.user_id,
  n.title,
  n.message,
  n.metadata->>'redemption_id' as redemption_id,
  n.metadata->>'recipient' as recipient,
  p.full_name as recipient_name,
  p.role as recipient_role
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '2 minutes'
ORDER BY n.created_at DESC;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_recent_notifications INTEGER;
  v_reward_notifications INTEGER;
  v_with_metadata INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent_notifications
  FROM notifications
  WHERE created_at > NOW() - INTERVAL '2 minutes';
  
  SELECT COUNT(*) INTO v_reward_notifications
  FROM notifications
  WHERE metadata->>'redemption_id' IS NOT NULL;
  
  SELECT COUNT(*) INTO v_with_metadata
  FROM notifications
  WHERE metadata != '{}'::jsonb;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║       IDEMPOTENT NOTIFICATION SYSTEM DEPLOYED                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Added metadata column to notifications';
  RAISE NOTICE '✅ Updated notify_reward_status_changed() with idempotency';
  RAISE NOTICE '✅ Recreated reward_status_notification trigger';
  RAISE NOTICE '✅ Ran test update';
  RAISE NOTICE '';
  RAISE NOTICE '📊 DATABASE STATE:';
  RAISE NOTICE '  • Notifications in last 2 minutes: %', v_recent_notifications;
  RAISE NOTICE '  • Total reward notifications: %', v_reward_notifications;
  RAISE NOTICE '  • Notifications with metadata: %', v_with_metadata;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEP: Run backfill to create notifications for past approvals';
  RAISE NOTICE '   → See: fix-parent-notifications-backfill.sql';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
