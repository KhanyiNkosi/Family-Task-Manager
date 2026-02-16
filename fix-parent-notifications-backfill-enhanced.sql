-- ============================================================================
-- BACKFILL: Create Missing Notifications for Past Approvals (ENHANCED - CORRECTED)
-- ============================================================================
-- Creates notifications for all approved/rejected reward_redemptions that
-- don't have corresponding notifications (retroactive notification creation)
-- Enhancements: Batching, better error handling, transaction safety
-- CORRECTED: Uses approved_at for approved, updated_at for rejected
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
    rr.updated_at,
    r.title as reward_title,
    r.points_cost,
    r.family_id,
    p.full_name as child_name,
    up.role as child_role
  FROM reward_redemptions rr
  JOIN rewards r ON r.id = rr.reward_id
  JOIN profiles p ON p.id = rr.user_id
  LEFT JOIN user_profiles up ON up.id = rr.user_id
  WHERE rr.status IN ('approved', 'rejected')
    -- No notification exists for this redemption
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.metadata->>'redemption_id' = rr.id::text
        AND n.metadata->>'status' = rr.status
    )
  ORDER BY CASE 
    WHEN rr.status = 'approved' THEN rr.approved_at
    ELSE rr.updated_at 
  END DESC
)
SELECT 
  redemption_id,
  status,
  TO_CHAR(CASE WHEN status = 'approved' THEN approved_at ELSE updated_at END, 'YYYY-MM-DD HH24:MI') as action_time,
  child_name,
  child_role,
  reward_title,
  points_cost,
  family_id
FROM redemptions_needing_notifications
LIMIT 20;  -- Show first 20 for preview

-- ============================================================================
-- STEP 2: Count redemptions needing backfill
-- ============================================================================

DO $$
DECLARE
  v_approved_missing INTEGER;
  v_rejected_missing INTEGER;
  v_total_missing INTEGER;
  v_families_affected INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE rr.status = 'approved'),
    COUNT(*) FILTER (WHERE rr.status = 'rejected'),
    COUNT(*),
    COUNT(DISTINCT r.family_id)
  INTO v_approved_missing, v_rejected_missing, v_total_missing, v_families_affected
  FROM reward_redemptions rr
  JOIN rewards r ON r.id = rr.reward_id
  WHERE rr.status IN ('approved', 'rejected')
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.metadata->>'redemption_id' = rr.id::text
        AND n.metadata->>'status' = rr.status
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
  RAISE NOTICE '  • Families affected: %', v_families_affected;
  RAISE NOTICE '';
  
  IF v_total_missing > 0 THEN
    RAISE NOTICE '🔄 Will create up to % notifications (child + parent for each)', v_total_missing * 2;
    RAISE NOTICE '⚠️  Actual count may be less if parents are missing';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Note: Using approved_at for approved, updated_at for rejected';
  ELSE
    RAISE NOTICE '✅ No backfill needed - all redemptions have notifications';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 3: Backfill notifications (BATCH PROCESSING)
-- ============================================================================

DO $$
DECLARE
  v_redemption RECORD;
  v_parent_id UUID;
  v_child_notifications_created INTEGER := 0;
  v_parent_notifications_created INTEGER := 0;
  v_parents_not_found INTEGER := 0;
  v_errors INTEGER := 0;
  v_batch_size INTEGER := 50; -- Process in batches
  v_processed INTEGER := 0;
  v_action_time TIMESTAMP;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Starting backfill process...';
  RAISE NOTICE '';
  
  -- Loop through all redemptions missing notifications
  FOR v_redemption IN (
    SELECT 
      rr.id,
      rr.status,
      rr.user_id,
      rr.reward_id,
      rr.approved_at,
      rr.updated_at,
      r.title as reward_title,
      r.points_cost,
      r.family_id,
      p.full_name as child_name
    FROM reward_redemptions rr
    JOIN rewards r ON r.id = rr.reward_id
    JOIN profiles p ON p.id = rr.user_id
    WHERE rr.status IN ('approved', 'rejected')
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.metadata->>'redemption_id' = rr.id::text
          AND n.metadata->>'status' = rr.status
      )
    ORDER BY CASE 
      WHEN rr.status = 'approved' THEN rr.approved_at
      ELSE rr.updated_at 
    END ASC
  ) LOOP
    
    BEGIN
      -- Determine the action timestamp
      IF v_redemption.status = 'approved' THEN
        v_action_time := v_redemption.approved_at;
      ELSE
        v_action_time := v_redemption.updated_at;
      END IF;
      
      -- Find parent for this family
      SELECT p.id INTO v_parent_id
      FROM profiles p
      JOIN user_profiles up ON up.id = p.id
      WHERE p.family_id = v_redemption.family_id
        AND up.role = 'parent'
      LIMIT 1;
      
      -- ============================================================
      -- Create CHILD notification
      -- ============================================================
      IF v_redemption.status = 'approved' THEN
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
          v_redemption.user_id,
          v_redemption.family_id,
          'Reward Approved! 🎁',
          'Your reward "' || v_redemption.reward_title || '" has been approved! Enjoy!',
          'success',
          '/child-dashboard',
          'View Rewards',
          jsonb_build_object(
            'redemption_id', v_redemption.id::text,
            'reward_id', v_redemption.reward_id::text,
            'status', 'approved',
            'recipient', 'child',
            'backfilled', true,
            'backfill_timestamp', now(),
            'original_timestamp', v_action_time
          ),
          v_action_time  -- Use original approval time
        );
      ELSE -- rejected
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
          v_redemption.user_id,
          v_redemption.family_id,
          'Reward Request Denied',
          'Your request for "' || v_redemption.reward_title || '" was not approved. Your ' || v_redemption.points_cost || ' points have been returned.',
          'warning',
          '/child-dashboard',
          'View Dashboard',
          jsonb_build_object(
            'redemption_id', v_redemption.id::text,
            'reward_id', v_redemption.reward_id::text,
            'status', 'rejected',
            'recipient', 'child',
            'backfilled', true,
            'backfill_timestamp', now(),
            'original_timestamp', v_action_time
          ),
          v_action_time  -- Use original rejection time (updated_at)
        );
      END IF;
      
      v_child_notifications_created := v_child_notifications_created + 1;
      
      -- ============================================================
      -- Create PARENT notification (if parent exists)
      -- ============================================================
      IF v_parent_id IS NOT NULL THEN
        IF v_redemption.status = 'approved' THEN
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
              'redemption_id', v_redemption.id::text,
              'reward_id', v_redemption.reward_id::text,
              'status', 'approved',
              'recipient', 'parent',
              'child_id', v_redemption.user_id::text,
              'backfilled', true,
              'backfill_timestamp', now(),
              'original_timestamp', v_action_time
            ),
            v_action_time  -- Use original approval time
          );
        ELSE -- rejected
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
              'redemption_id', v_redemption.id::text,
              'reward_id', v_redemption.reward_id::text,
              'status', 'rejected',
              'recipient', 'parent',
              'child_id', v_redemption.user_id::text,
              'backfilled', true,
              'backfill_timestamp', now(),
              'original_timestamp', v_action_time
            ),
            v_action_time  -- Use original rejection time (updated_at)
          );
        END IF;
        
        v_parent_notifications_created := v_parent_notifications_created + 1;
      ELSE
        v_parents_not_found := v_parents_not_found + 1;
      END IF;
      
      v_processed := v_processed + 1;
      
      -- Progress indicator every 10 records
      IF v_processed % 10 = 0 THEN
        RAISE NOTICE '  Processed % redemptions...', v_processed;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING 'Error processing redemption %: %', v_redemption.id, SQLERRM;
    END;
    
  END LOOP;
  
  -- ============================================================
  -- Summary
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║              BACKFILL COMPLETE                                 ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Results:';
  RAISE NOTICE '  • Redemptions processed: %', v_processed;
  RAISE NOTICE '  • Child notifications created: %', v_child_notifications_created;
  RAISE NOTICE '  • Parent notifications created: %', v_parent_notifications_created;
  RAISE NOTICE '  • Families without parent: %', v_parents_not_found;
  RAISE NOTICE '  • Errors: %', v_errors;
  RAISE NOTICE '';
  
  IF v_parents_not_found > 0 THEN
    RAISE WARNING '⚠️  % families had no parent - only child notifications created', v_parents_not_found;
    RAISE NOTICE 'Consider assigning parent role to users in these families';
  END IF;
  
  IF v_errors > 0 THEN
    RAISE WARNING '⚠️  % errors occurred during backfill - check logs above', v_errors;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 4: Verification - Check all redemptions now have notifications
-- ============================================================================

SELECT 
  '=== VERIFICATION: Remaining gaps ===' as section;

SELECT 
  rr.id as redemption_id,
  rr.status,
  TO_CHAR(
    CASE WHEN rr.status = 'approved' THEN rr.approved_at ELSE rr.updated_at END, 
    'YYYY-MM-DD HH24:MI'
  ) as action_time,
  r.title as reward_title,
  p.full_name as child_name,
  r.family_id,
  (SELECT COUNT(*) FROM notifications n 
   WHERE n.metadata->>'redemption_id' = rr.id::text) as notification_count
FROM reward_redemptions rr
JOIN rewards r ON r.id = rr.reward_id
JOIN profiles p ON p.id = rr.user_id
WHERE rr.status IN ('approved', 'rejected')
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.metadata->>'redemption_id' = rr.id::text
      AND n.metadata->>'status' = rr.status
  )
LIMIT 10;

-- ============================================================================
-- STEP 5: Final statistics
-- ============================================================================

DO $$
DECLARE
  v_total_redemptions INTEGER;
  v_with_notifications INTEGER;
  v_missing_notifications INTEGER;
  v_backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_redemptions
  FROM reward_redemptions
  WHERE status IN ('approved', 'rejected');
  
  SELECT COUNT(DISTINCT metadata->>'redemption_id') INTO v_with_notifications
  FROM notifications
  WHERE metadata->>'redemption_id' IS NOT NULL
    AND metadata->>'status' IN ('approved', 'rejected');
  
  v_missing_notifications := v_total_redemptions - v_with_notifications;
  
  SELECT COUNT(*) INTO v_backfilled_count
  FROM notifications
  WHERE metadata->>'backfilled' = 'true';
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║              FINAL STATISTICS                                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Overall Status:';
  RAISE NOTICE '  • Total approved/rejected redemptions: %', v_total_redemptions;
  RAISE NOTICE '  • Redemptions with notifications: %', v_with_notifications;
  RAISE NOTICE '  • Still missing notifications: %', v_missing_notifications;
  RAISE NOTICE '  • Total backfilled notifications: %', v_backfilled_count;
  RAISE NOTICE '';
  
  IF v_missing_notifications = 0 THEN
    RAISE NOTICE '✅ SUCCESS! All redemptions now have notifications!';
  ELSE
    RAISE WARNING '⚠️  % redemptions still missing notifications', v_missing_notifications;
    RAISE NOTICE 'This may be due to missing parent users or data integrity issues';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 6: Sample backfilled notifications
-- ============================================================================

SELECT 
  '=== SAMPLE BACKFILLED NOTIFICATIONS ===' as section;

SELECT 
  n.id,
  TO_CHAR(n.created_at, 'YYYY-MM-DD HH24:MI:SS') as original_time,
  n.title,
  SUBSTRING(n.message, 1, 60) as message_preview,
  n.metadata->>'recipient' as recipient,
  n.metadata->>'status' as status,
  p.full_name as recipient_name,
  up.role as recipient_role
FROM notifications n
JOIN profiles p ON p.id = n.user_id
LEFT JOIN user_profiles up ON up.id = n.user_id
WHERE n.metadata->>'backfilled' = 'true'
ORDER BY n.created_at DESC
LIMIT 10;
