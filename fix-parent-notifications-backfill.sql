-- ============================================================================
-- BACKFILL: Create Missing Notifications for Past Approvals
-- ============================================================================
-- Creates notifications for all approved/rejected reward_redemptions that
-- don't have corresponding notifications (retroactive notification creation)
-- ============================================================================

-- ============================================================================
-- STEP 1: Preview what will be backfilled
-- ============================================================================

SELECT 
  '=== REDEMPTIONS MISSING NOTIFICATIONS ===' as section;

WITH redemptions_needing_notifications AS (
  SELECT 
    rr.id as redemption_id,
    rr.status,
    rr.user_id as child_id,
    rr.reward_id,
    rr.approved_at,
    rr.approved_by,
    r.title as reward_title,
    r.points_cost,
    r.family_id,
    p.full_name as child_name,
    p.role as child_role
  FROM reward_redemptions rr
  JOIN rewards r ON r.id = rr.reward_id
  JOIN profiles p ON p.id = rr.user_id
  WHERE rr.status IN ('approved', 'rejected')
    AND rr.approved_at IS NOT NULL
    -- No notification exists for this redemption
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.metadata->>'redemption_id' = rr.id::text
    )
  ORDER BY rr.approved_at DESC
)
SELECT 
  redemption_id,
  status,
  TO_CHAR(approved_at, 'YYYY-MM-DD HH24:MI') as approved_time,
  child_name,
  reward_title,
  points_cost,
  family_id
FROM redemptions_needing_notifications;

-- ============================================================================
-- STEP 2: Count redemptions needing backfill
-- ============================================================================

DO $$
DECLARE
  v_approved_missing INTEGER;
  v_rejected_missing INTEGER;
  v_total_missing INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE rr.status = 'approved'),
    COUNT(*) FILTER (WHERE rr.status = 'rejected'),
    COUNT(*)
  INTO v_approved_missing, v_rejected_missing, v_total_missing
  FROM reward_redemptions rr
  WHERE rr.status IN ('approved', 'rejected')
    AND rr.approved_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.metadata->>'redemption_id' = rr.id::text
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║              BACKFILL PREVIEW                                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Redemptions missing notifications:';
  RAISE NOTICE '  • Approved: %', v_approved_missing;
  RAISE NOTICE '  • Rejected: %', v_rejected_missing;
  RAISE NOTICE '  • Total: %', v_total_missing;
  RAISE NOTICE '';
  
  IF v_total_missing > 0 THEN
    RAISE NOTICE '🔄 Will create % notifications (x2 for parent+child)', v_total_missing * 2;
  ELSE
    RAISE NOTICE '✅ No backfill needed - all redemptions have notifications';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 3: Backfill notifications for approved redemptions
-- ============================================================================

DO $$
DECLARE
  v_redemption RECORD;
  v_parent_id UUID;
  v_notifications_created INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Starting backfill for approved redemptions...';
  RAISE NOTICE '';
  
  FOR v_redemption IN (
    SELECT 
      rr.id as redemption_id,
      rr.status,
      rr.user_id as child_id,
      rr.reward_id,
      rr.approved_at,
      r.title as reward_title,
      r.points_cost,
      r.family_id,
      p.full_name as child_name
    FROM reward_redemptions rr
    JOIN rewards r ON r.id = rr.reward_id
    JOIN profiles p ON p.id = rr.user_id
    WHERE rr.status = 'approved'
      AND rr.approved_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.metadata->>'redemption_id' = rr.id::text
      )
    ORDER BY rr.approved_at ASC
  )
  LOOP
    -- Find parent for this family
    SELECT p.id INTO v_parent_id
    FROM profiles p
    JOIN user_profiles up ON up.id = p.id
    WHERE p.family_id = v_redemption.family_id
      AND up.role = 'parent'
    LIMIT 1;
    
    -- Create child notification
    INSERT INTO notifications (
      user_id, 
      family_id, 
      title, 
      message, 
      type, 
      action_url, 
      action_text,
      metadata,
      created_at
    )
    VALUES (
      v_redemption.child_id,
      v_redemption.family_id,
      'Reward Approved! 🎁',
      'Your reward "' || v_redemption.reward_title || '" has been approved! Enjoy!',
      'success',
      '/child-dashboard',
      'View Rewards',
      jsonb_build_object(
        'redemption_id', v_redemption.redemption_id::text,
        'reward_id', v_redemption.reward_id::text,
        'status', 'approved',
        'recipient', 'child',
        'backfilled', true
      ),
      v_redemption.approved_at  -- Use original approval time
    );
    
    v_notifications_created := v_notifications_created + 1;
    
    -- Create parent notification (if parent exists)
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, 
        family_id, 
        title, 
        message, 
        type, 
        action_url, 
        action_text,
        metadata,
        created_at
      )
      VALUES (
        v_parent_id,
        v_redemption.family_id,
        'Reward Approved ✅',
        'You approved "' || v_redemption.reward_title || '" for ' || COALESCE(v_redemption.child_name, 'child') || ' (' || v_redemption.points_cost || ' points)',
        'info',
        '/parent-dashboard',
        'View Dashboard',
        jsonb_build_object(
          'redemption_id', v_redemption.redemption_id::text,
          'reward_id', v_redemption.reward_id::text,
          'status', 'approved',
          'recipient', 'parent',
          'child_id', v_redemption.child_id::text,
          'backfilled', true
        ),
        v_redemption.approved_at  -- Use original approval time
      );
      
      v_notifications_created := v_notifications_created + 1;
    END IF;
    
    IF v_notifications_created % 10 = 0 THEN
      RAISE NOTICE '  ✓ Created % notifications...', v_notifications_created;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Backfill complete for approved redemptions';
  RAISE NOTICE '   Created % notifications', v_notifications_created;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 4: Backfill notifications for rejected redemptions
-- ============================================================================

DO $$
DECLARE
  v_redemption RECORD;
  v_parent_id UUID;
  v_notifications_created INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Starting backfill for rejected redemptions...';
  RAISE NOTICE '';
  
  FOR v_redemption IN (
    SELECT 
      rr.id as redemption_id,
      rr.status,
      rr.user_id as child_id,
      rr.reward_id,
      rr.approved_at,
      r.title as reward_title,
      r.points_cost,
      r.family_id,
      p.full_name as child_name
    FROM reward_redemptions rr
    JOIN rewards r ON r.id = rr.reward_id
    JOIN profiles p ON p.id = rr.user_id
    WHERE rr.status = 'rejected'
      AND rr.approved_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.metadata->>'redemption_id' = rr.id::text
      )
    ORDER BY rr.approved_at ASC
  )
  LOOP
    -- Find parent for this family
    SELECT p.id INTO v_parent_id
    FROM profiles p
    JOIN user_profiles up ON up.id = p.id
    WHERE p.family_id = v_redemption.family_id
      AND up.role = 'parent'
    LIMIT 1;
    
    -- Create child notification
    INSERT INTO notifications (
      user_id, 
      family_id, 
      title, 
      message, 
      type, 
      action_url, 
      action_text,
      metadata,
      created_at
    )
    VALUES (
      v_redemption.child_id,
      v_redemption.family_id,
      'Reward Request Denied',
      'Your request for "' || v_redemption.reward_title || '" was not approved. Your ' || v_redemption.points_cost || ' points have been returned.',
      'warning',
      '/child-dashboard',
      'View Dashboard',
      jsonb_build_object(
        'redemption_id', v_redemption.redemption_id::text,
        'reward_id', v_redemption.reward_id::text,
        'status', 'rejected',
        'recipient', 'child',
        'backfilled', true
      ),
      v_redemption.approved_at  -- Use original approval time
    );
    
    v_notifications_created := v_notifications_created + 1;
    
    -- Create parent notification (if parent exists)
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, 
        family_id, 
        title, 
        message, 
        type, 
        action_url, 
        action_text,
        metadata,
        created_at
      )
      VALUES (
        v_parent_id,
        v_redemption.family_id,
        'Reward Rejected',
        'You rejected "' || v_redemption.reward_title || '" for ' || COALESCE(v_redemption.child_name, 'child'),
        'info',
        '/parent-dashboard',
        'View Dashboard',
        jsonb_build_object(
          'redemption_id', v_redemption.redemption_id::text,
          'reward_id', v_redemption.reward_id::text,
          'status', 'rejected',
          'recipient', 'parent',
          'child_id', v_redemption.child_id::text,
          'backfilled', true
        ),
        v_redemption.approved_at  -- Use original approval time
      );
      
      v_notifications_created := v_notifications_created + 1;
    END IF;
    
    IF v_notifications_created % 10 = 0 THEN
      RAISE NOTICE '  ✓ Created % notifications...', v_notifications_created;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Backfill complete for rejected redemptions';
  RAISE NOTICE '   Created % notifications', v_notifications_created;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 5: Verify backfill results
-- ============================================================================

SELECT 
  '=== BACKFILLED NOTIFICATIONS ===' as section;

SELECT 
  n.id,
  TO_CHAR(n.created_at, 'YYYY-MM-DD HH24:MI') as notification_time,
  n.title,
  n.metadata->>'redemption_id' as redemption_id,
  n.metadata->>'status' as status,
  n.metadata->>'recipient' as recipient,
  p.full_name as recipient_name,
  p.role as recipient_role
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE n.metadata->>'backfilled' = 'true'
ORDER BY n.created_at DESC;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_total_reward_notifications INTEGER;
  v_backfilled_notifications INTEGER;
  v_parent_notifications INTEGER;
  v_child_notifications INTEGER;
  v_still_missing INTEGER;
BEGIN
  -- Count total reward notifications
  SELECT COUNT(*) INTO v_total_reward_notifications
  FROM notifications
  WHERE metadata->>'redemption_id' IS NOT NULL;
  
  -- Count backfilled notifications
  SELECT COUNT(*) INTO v_backfilled_notifications
  FROM notifications
  WHERE metadata->>'backfilled' = 'true';
  
  -- Count parent notifications
  SELECT COUNT(*) INTO v_parent_notifications
  FROM notifications
  WHERE metadata->>'redemption_id' IS NOT NULL
    AND metadata->>'recipient' = 'parent';
  
  -- Count child notifications
  SELECT COUNT(*) INTO v_child_notifications
  FROM notifications
  WHERE metadata->>'redemption_id' IS NOT NULL
    AND metadata->>'recipient' = 'child';
  
  -- Check if any redemptions still missing notifications
  SELECT COUNT(*) INTO v_still_missing
  FROM reward_redemptions rr
  WHERE rr.status IN ('approved', 'rejected')
    AND rr.approved_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.metadata->>'redemption_id' = rr.id::text
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║              BACKFILL COMPLETE                                 ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 NOTIFICATION STATISTICS:';
  RAISE NOTICE '  • Total reward notifications: %', v_total_reward_notifications;
  RAISE NOTICE '  • Backfilled notifications: %', v_backfilled_notifications;
  RAISE NOTICE '  • Parent notifications: %', v_parent_notifications;
  RAISE NOTICE '  • Child notifications: %', v_child_notifications;
  RAISE NOTICE '';
  
  IF v_still_missing = 0 THEN
    RAISE NOTICE '✅ SUCCESS! All redemptions now have notifications';
  ELSE
    RAISE NOTICE '⚠️  % redemptions still missing notifications', v_still_missing;
    RAISE NOTICE '   → Review redemptions_needing_notifications query above';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '  1. Check parent dashboard for notifications';
  RAISE NOTICE '  2. Check child dashboard for notifications';
  RAISE NOTICE '  3. Test new reward approvals to verify trigger works';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
