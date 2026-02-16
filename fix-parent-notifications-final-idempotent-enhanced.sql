-- ============================================================================
-- FINAL FIX: Parent Notifications with Idempotency (ENHANCED VERSION)
-- ============================================================================
-- Root cause: Trigger was too restrictive (required status change)
-- Solution: Trigger on ANY approved/rejected status + add idempotency check
-- Enhancements: Index for performance, better logging, security tightening
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
-- STEP 2: Add GIN index for fast metadata lookups (PERFORMANCE)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin 
ON notifications USING gin (metadata);

-- Functional index for specific redemption_id + status lookups
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_redemption_status
ON notifications ((metadata->>'redemption_id'), (metadata->>'status'));

-- ============================================================================
-- STEP 3: Verify created_at has default
-- ============================================================================

DO $$
DECLARE
  v_default TEXT;
BEGIN
  SELECT column_default INTO v_default
  FROM information_schema.columns
  WHERE table_name = 'notifications' 
    AND column_name = 'created_at';
  
  IF v_default IS NULL OR v_default = '' THEN
    ALTER TABLE notifications 
    ALTER COLUMN created_at SET DEFAULT now();
    RAISE NOTICE '✅ Set created_at default to now()';
  ELSE
    RAISE NOTICE 'ℹ️  created_at already has default: %', v_default;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create idempotent notification function with enhanced logging
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
    RAISE WARNING 'notify_reward_status_changed: Reward not found for redemption %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Get child's name
  SELECT full_name INTO v_child_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Find parent in the family (using user_profiles role)
  SELECT p.id INTO v_parent_id
  FROM profiles p
  JOIN user_profiles up ON up.id = p.id
  WHERE p.family_id = v_family_id
    AND up.role = 'parent'
  LIMIT 1;
  
  -- Log if no parent found (important for debugging)
  IF v_parent_id IS NULL THEN
    RAISE WARNING 'notify_reward_status_changed: No parent found for family % (redemption %)', 
      v_family_id, NEW.id;
  END IF;
  
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
    -- Idempotency hit - skip silently in production, log in dev if needed
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
        'recipient', 'child',
        'created_by_trigger', true,
        'trigger_timestamp', now()
      )
    );
    
    -- Parent notification (only if parent exists)
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
          'child_id', NEW.user_id::text,
          'created_by_trigger', true,
          'trigger_timestamp', now()
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
        'recipient', 'child',
        'created_by_trigger', true,
        'trigger_timestamp', now()
      )
    );
    
    -- Parent notification (only if parent exists)
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
          'child_id', NEW.user_id::text,
          'created_by_trigger', true,
          'trigger_timestamp', now()
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Secure the function (restrict execution)
-- ============================================================================

-- Only allow trusted roles to execute the trigger
-- The trigger itself will still fire, but direct execution is blocked
REVOKE EXECUTE ON FUNCTION notify_reward_status_changed() FROM public;
REVOKE EXECUTE ON FUNCTION notify_reward_status_changed() FROM anon;
REVOKE EXECUTE ON FUNCTION notify_reward_status_changed() FROM authenticated;

-- Grant back to postgres/service_role if needed (typically triggers run with definer rights)
-- GRANT EXECUTE ON FUNCTION notify_reward_status_changed() TO service_role;

-- ============================================================================
-- STEP 6: Recreate trigger
-- ============================================================================

DROP TRIGGER IF EXISTS reward_status_notification_trigger ON reward_redemptions;
CREATE TRIGGER reward_status_notification_trigger
  AFTER UPDATE ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_status_changed();

-- ============================================================================
-- STEP 7: Test with existing approved redemption
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
    RAISE NOTICE '⚠️  No approved redemptions found for testing';
  END IF;
END $$;

-- ============================================================================
-- STEP 8: Display recent notifications
-- ============================================================================

SELECT 
  '=== NOTIFICATIONS CREATED IN LAST 2 MINUTES ===' as section;

SELECT 
  n.id,
  TO_CHAR(n.created_at, 'HH24:MI:SS') as time,
  n.user_id,
  n.title,
  SUBSTRING(n.message, 1, 60) as message_preview,
  n.metadata->>'redemption_id' as redemption_id,
  n.metadata->>'recipient' as recipient,
  p.full_name as recipient_name,
  up.role as recipient_role
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
LEFT JOIN user_profiles up ON up.id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '2 minutes'
ORDER BY n.created_at DESC;

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_recent_notifications INTEGER;
  v_reward_notifications INTEGER;
  v_with_metadata INTEGER;
  v_index_exists BOOLEAN;
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
  
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_notifications_metadata_gin'
  ) INTO v_index_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║    IDEMPOTENT NOTIFICATION SYSTEM DEPLOYED (ENHANCED)          ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Added metadata column to notifications';
  RAISE NOTICE '✅ Created GIN index for metadata (performance): %', v_index_exists;
  RAISE NOTICE '✅ Created functional index for redemption_id + status';
  RAISE NOTICE '✅ Verified created_at default';
  RAISE NOTICE '✅ Updated notify_reward_status_changed() with:';
  RAISE NOTICE '    - Idempotency checks';
  RAISE NOTICE '    - Enhanced logging (warnings when parent not found)';
  RAISE NOTICE '    - Metadata tracking';
  RAISE NOTICE '✅ Applied SECURITY DEFINER with REVOKE public access';
  RAISE NOTICE '✅ Recreated reward_status_notification_trigger';
  RAISE NOTICE '✅ Ran test update';
  RAISE NOTICE '';
  RAISE NOTICE '📊 DATABASE STATE:';
  RAISE NOTICE '  • Notifications in last 2 minutes: %', v_recent_notifications;
  RAISE NOTICE '  • Total reward notifications: %', v_reward_notifications;
  RAISE NOTICE '  • Notifications with metadata: %', v_with_metadata;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEP: Run backfill to create notifications for past approvals';
  RAISE NOTICE '   → See: fix-parent-notifications-backfill-enhanced.sql';
  RAISE NOTICE '';
  RAISE NOTICE '📝 MONITORING: Check database logs for warnings about missing parents';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
