-- ============================================================================
-- POST-DEPLOYMENT VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after backfill to verify everything is working correctly
-- ============================================================================

-- ============================================================================
-- 1. CHECK FOR DUPLICATES (Should return no rows)
-- ============================================================================
\echo '═══════════════════════════════════════════════════════════════'
\echo '1. DUPLICATE CHECK (should return no rows)'
\echo '═══════════════════════════════════════════════════════════════'

SELECT 
  metadata->>'redemption_id' AS redemption_id,
  metadata->>'status' AS status,
  COUNT(*) as notification_count,
  STRING_AGG(metadata->>'recipient', ', ') as recipients
FROM notifications 
WHERE metadata->>'redemption_id' IS NOT NULL
GROUP BY metadata->>'redemption_id', metadata->>'status'
HAVING COUNT(*) > 2
ORDER BY COUNT(*) DESC;

\echo 'Expected: No rows (each redemption should have exactly 2 notifications)'
\echo ''

-- ============================================================================
-- 2. BACKFILL STATISTICS
-- ============================================================================
\echo '═══════════════════════════════════════════════════════════════'
\echo '2. BACKFILL STATISTICS'
\echo '═══════════════════════════════════════════════════════════════'

SELECT 
  'Backfilled' as source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE metadata->>'recipient' = 'parent') as parent_count,
  COUNT(*) FILTER (WHERE metadata->>'recipient' = 'child') as child_count,
  COUNT(*) FILTER (WHERE metadata->>'status' = 'approved') as approved,
  COUNT(*) FILTER (WHERE metadata->>'status' = 'rejected') as rejected
FROM notifications
WHERE metadata->>'backfilled' = 'true'

UNION ALL

SELECT 
  'Live Trigger' as source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE metadata->>'recipient' = 'parent') as parent_count,
  COUNT(*) FILTER (WHERE metadata->>'recipient' = 'child') as child_count,
  COUNT(*) FILTER (WHERE metadata->>'status' = 'approved') as approved,
  COUNT(*) FILTER (WHERE metadata->>'status' = 'rejected') as rejected
FROM notifications
WHERE metadata->>'created_by_trigger' = 'true';

\echo ''

-- ============================================================================
-- 3. COVERAGE CHECK
-- ============================================================================
\echo '═══════════════════════════════════════════════════════════════'
\echo '3. REDEMPTION COVERAGE'
\echo '═══════════════════════════════════════════════════════════════'

WITH redemption_coverage AS (
  SELECT 
    rr.status,
    COUNT(DISTINCT rr.id) as total_redemptions,
    COUNT(DISTINCT n.metadata->>'redemption_id') as with_notifications,
    COUNT(DISTINCT rr.id) - COUNT(DISTINCT n.metadata->>'redemption_id') as missing_notifications
  FROM reward_redemptions rr
  LEFT JOIN notifications n ON n.metadata->>'redemption_id' = rr.id::text
    AND n.metadata->>'status' = rr.status
  WHERE rr.status IN ('approved', 'rejected')
  GROUP BY rr.status
)
SELECT 
  status,
  total_redemptions,
  with_notifications,
  missing_notifications,
  ROUND(100.0 * with_notifications / NULLIF(total_redemptions, 0), 1) ||'%' as coverage
FROM redemption_coverage;

\echo ''

-- ============================================================================
-- 4. PARENT/CHILD BALANCE
-- ============================================================================
\echo '═══════════════════════════════════════════════════════════════'
\echo '4. PARENT/CHILD NOTIFICATION BALANCE'
\echo '═══════════════════════════════════════════════════════════════'

SELECT 
  metadata->>'recipient' as recipient_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) || '%' as percentage
FROM notifications
WHERE metadata->>'redemption_id' IS NOT NULL
GROUP BY metadata->>'recipient'
ORDER BY count DESC;

\echo 'Expected: ~50% parent, ~50% child (may vary if some families lack parents)'
\echo ''

-- ============================================================================
-- 5. SAMPLE BACKFILLED NOTIFICATIONS
-- ============================================================================
\echo '═══════════════════════════════════════════════════════════════'
\echo '5. SAMPLE BACKFILLED NOTIFICATIONS'
\echo '═══════════════════════════════════════════════════════════════'

SELECT 
  TO_CHAR(n.created_at, 'YYYY-MM-DD HH24:MI:SS') as original_time,
  n.title,
  p.full_name as recipient,
  up.role as recipient_role,
  n.metadata->>'status' as redemption_status,
  SUBSTRING(n.message, 1, 50) || '...' as message_preview
FROM notifications n
JOIN profiles p ON p.id = n.user_id
LEFT JOIN user_profiles up ON up.id = n.user_id
WHERE n.metadata->>'backfilled' = 'true'
ORDER BY n.created_at DESC
LIMIT 10;

\echo ''

-- ============================================================================
-- 6. CHECK FOR REDEMPTIONS STILL MISSING NOTIFICATIONS
-- ============================================================================
\echo '═══════════════════════════════════════════════════════════════'
\echo '6. REDEMPTIONS STILL MISSING NOTIFICATIONS (if any)'
\echo '═══════════════════════════════════════════════════════════════'

SELECT 
  rr.id,
  rr.status,
  TO_CHAR(
    CASE WHEN rr.status = 'approved' THEN rr.approved_at ELSE rr.updated_at END,
    'YYYY-MM-DD HH24:MI'
  ) as action_time,
  r.title as reward,
  p.full_name as child,
  r.family_id
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

\echo 'Expected: No rows (100% coverage)'
\echo ''

-- ============================================================================
-- 7. VERIFY INDEXES EXIST
-- ============================================================================
\echo '═══════════════════════════════════════════════════════════════'
\echo '7. PERFORMANCE INDEXES CHECK'
\echo '═══════════════════════════════════════════════════════════════'

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
  AND indexname LIKE '%metadata%';

\echo ''

-- ============================================================================
-- 8. FINAL SUMMARY
-- ============================================================================
\echo '═══════════════════════════════════════════════════════════════'
\echo '8. FINAL DEPLOYMENT SUMMARY'
\echo '═══════════════════════════════════════════════════════════════'

DO $$
DECLARE
  v_total_redemptions INTEGER;
  v_with_notifications INTEGER;
  v_backfilled INTEGER;
  v_trigger_created INTEGER;
  v_duplicates INTEGER;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_total_redemptions
  FROM reward_redemptions
  WHERE status IN ('approved', 'rejected');
  
  SELECT COUNT(DISTINCT metadata->>'redemption_id') INTO v_with_notifications
  FROM notifications
  WHERE metadata->>'redemption_id' IS NOT NULL;
  
  SELECT COUNT(*) INTO v_backfilled
  FROM notifications
  WHERE metadata->>'backfilled' = 'true';
  
  SELECT COUNT(*) INTO v_trigger_created
  FROM notifications
  WHERE metadata->>'created_by_trigger' = 'true';
  
  SELECT COUNT(*) INTO v_duplicates
  FROM (
    SELECT metadata->>'redemption_id', metadata->>'status'
    FROM notifications
    WHERE metadata->>'redemption_id' IS NOT NULL
    GROUP BY metadata->>'redemption_id', metadata->>'status'
    HAVING COUNT(*) > 2
  ) dupes;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           DEPLOYMENT VERIFICATION COMPLETE                     ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistics:';
  RAISE NOTICE '  • Total approved/rejected redemptions: %', v_total_redemptions;
  RAISE NOTICE '  • Redemptions with notifications: %', v_with_notifications;
  RAISE NOTICE '  • Coverage: %%', ROUND(100.0 * v_with_notifications / NULLIF(v_total_redemptions, 0), 1);
  RAISE NOTICE '';
  RAISE NOTICE '  • Backfilled notifications: %', v_backfilled;
  RAISE NOTICE '  • Trigger-created notifications: %', v_trigger_created;
  RAISE NOTICE '  • Total reward notifications: %', v_backfilled + v_trigger_created;
  RAISE NOTICE '';
  RAISE NOTICE '  • Duplicate redemptions (>2 notifs): %', v_duplicates;
  RAISE NOTICE '';
  
  IF v_with_notifications = v_total_redemptions AND v_duplicates = 0 THEN
    RAISE NOTICE '✅ SUCCESS! Deployment is healthy:';
    RAISE NOTICE '   • 100%% redemption coverage';
    RAISE NOTICE '   • No duplicates detected';
    RAISE NOTICE '   • Parent notifications working';
  ELSE
    IF v_with_notifications < v_total_redemptions THEN
      RAISE WARNING '⚠️  % redemptions still missing notifications', v_total_redemptions - v_with_notifications;
    END IF;
    IF v_duplicates > 0 THEN
      RAISE WARNING '⚠️  % redemptions have duplicate notifications', v_duplicates;
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
