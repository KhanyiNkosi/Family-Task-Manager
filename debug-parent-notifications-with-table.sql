-- ============================================================================
-- DEBUG: Parent Notifications with Debug Table
-- ============================================================================
-- Creates a debug table to capture trigger execution details at runtime
-- ============================================================================

-- ============================================================================
-- STEP 1: Create debug table
-- ============================================================================

DROP TABLE IF EXISTS notification_debug CASCADE;

CREATE TABLE notification_debug (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  checkpoint TEXT NOT NULL,
  redemption_id UUID,
  old_status TEXT,
  new_status TEXT,
  old_approved_at TIMESTAMPTZ,
  new_approved_at TIMESTAMPTZ,
  condition_met BOOLEAN,
  reward_id UUID,
  reward_title TEXT,
  reward_points INTEGER,
  family_id TEXT,
  child_id UUID,
  child_name TEXT,
  parent_id UUID,
  notification_type TEXT,
  notes TEXT
);

-- ============================================================================
-- STEP 2: Update function with debug logging
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_reward_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_reward_title TEXT;
  v_points INTEGER;
  v_parent_id UUID;
  v_child_name TEXT;
  v_condition_met BOOLEAN;
BEGIN
  -- Debug: Function entry
  INSERT INTO notification_debug (checkpoint, redemption_id, old_status, new_status, old_approved_at, new_approved_at, notes)
  VALUES (
    'FUNCTION_ENTRY',
    NEW.id,
    OLD.status,
    NEW.status,
    OLD.approved_at,
    NEW.approved_at,
    'Trigger fired on reward_redemptions UPDATE'
  );
  
  -- Check condition
  v_condition_met := NEW.status IN ('approved', 'rejected') AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.approved_at IS NULL);
  
  INSERT INTO notification_debug (checkpoint, redemption_id, old_status, new_status, condition_met, notes)
  VALUES (
    'CONDITION_CHECK',
    NEW.id,
    OLD.status,
    NEW.status,
    v_condition_met,
    'Checked: NEW.status IN (' || COALESCE(NEW.status, 'NULL') || ') AND (OLD.status IS DISTINCT FROM NEW.status [' ||
    CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'TRUE' ELSE 'FALSE' END || '] OR OLD.approved_at IS NULL [' ||
    CASE WHEN OLD.approved_at IS NULL THEN 'TRUE' ELSE 'FALSE' END || '])'
  );
  
  IF v_condition_met THEN
    
    -- Get reward details
    SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
    FROM rewards
    WHERE id = NEW.reward_id;
    
    INSERT INTO notification_debug (checkpoint, redemption_id, reward_id, reward_title, reward_points, family_id, notes)
    VALUES (
      'REWARD_LOOKUP',
      NEW.id,
      NEW.reward_id,
      v_reward_title,
      v_points,
      v_family_id,
      'Fetched reward details from rewards table'
    );
    
    -- Get child's name
    SELECT full_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    INSERT INTO notification_debug (checkpoint, redemption_id, child_id, child_name, notes)
    VALUES (
      'CHILD_LOOKUP',
      NEW.id,
      NEW.user_id,
      v_child_name,
      'Fetched child name from profiles'
    );
    
    -- Find parent in the family
    SELECT p.id INTO v_parent_id
    FROM profiles p
    JOIN user_profiles up ON up.id = p.id
    WHERE p.family_id = v_family_id
      AND up.role = 'parent'
    LIMIT 1;
    
    INSERT INTO notification_debug (checkpoint, redemption_id, family_id, parent_id, notes)
    VALUES (
      'PARENT_LOOKUP',
      NEW.id,
      v_family_id,
      v_parent_id,
      CASE WHEN v_parent_id IS NOT NULL 
        THEN 'Found parent in family' 
        ELSE 'WARNING: Parent not found for family' 
      END
    );
    
    -- Create notifications based on status
    IF NEW.status = 'approved' THEN
      
      -- Child notification
      INSERT INTO notification_debug (checkpoint, redemption_id, child_id, notification_type, notes)
      VALUES (
        'BEFORE_INSERT_CHILD_NOTIFICATION',
        NEW.id,
        NEW.user_id,
        'approved_child',
        'About to insert child approval notification'
      );
      
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
      
      INSERT INTO notification_debug (checkpoint, redemption_id, child_id, notification_type, notes)
      VALUES (
        'AFTER_INSERT_CHILD_NOTIFICATION',
        NEW.id,
        NEW.user_id,
        'approved_child',
        'Successfully inserted child approval notification'
      );
      
      -- Parent notification (if parent exists)
      IF v_parent_id IS NOT NULL THEN
        INSERT INTO notification_debug (checkpoint, redemption_id, parent_id, notification_type, notes)
        VALUES (
          'BEFORE_INSERT_PARENT_NOTIFICATION',
          NEW.id,
          v_parent_id,
          'approved_parent',
          'About to insert parent approval notification'
        );
        
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
        
        INSERT INTO notification_debug (checkpoint, redemption_id, parent_id, notification_type, notes)
        VALUES (
          'AFTER_INSERT_PARENT_NOTIFICATION',
          NEW.id,
          v_parent_id,
          'approved_parent',
          'Successfully inserted parent approval notification'
        );
      END IF;
      
    ELSIF NEW.status = 'rejected' THEN
      
      -- Child notification
      INSERT INTO notification_debug (checkpoint, redemption_id, child_id, notification_type, notes)
      VALUES (
        'BEFORE_INSERT_CHILD_NOTIFICATION',
        NEW.id,
        NEW.user_id,
        'rejected_child',
        'About to insert child rejection notification'
      );
      
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
      
      INSERT INTO notification_debug (checkpoint, redemption_id, child_id, notification_type, notes)
      VALUES (
        'AFTER_INSERT_CHILD_NOTIFICATION',
        NEW.id,
        NEW.user_id,
        'rejected_child',
        'Successfully inserted child rejection notification'
      );
      
      -- Parent notification (if parent exists)
      IF v_parent_id IS NOT NULL THEN
        INSERT INTO notification_debug (checkpoint, redemption_id, parent_id, notification_type, notes)
        VALUES (
          'BEFORE_INSERT_PARENT_NOTIFICATION',
          NEW.id,
          v_parent_id,
          'rejected_parent',
          'About to insert parent rejection notification'
        );
        
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
        
        INSERT INTO notification_debug (checkpoint, redemption_id, parent_id, notification_type, notes)
        VALUES (
          'AFTER_INSERT_PARENT_NOTIFICATION',
          NEW.id,
          v_parent_id,
          'rejected_parent',
          'Successfully inserted parent rejection notification'
        );
      END IF;
      
    END IF;
    
    INSERT INTO notification_debug (checkpoint, redemption_id, notes)
    VALUES (
      'FUNCTION_END_SUCCESS',
      NEW.id,
      'Condition met, all notifications processed'
    );
    
  ELSE
    -- Condition not met
    INSERT INTO notification_debug (checkpoint, redemption_id, notes)
    VALUES (
      'FUNCTION_END_SKIPPED',
      NEW.id,
      'Condition not met, no notifications created'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Capture any errors
  INSERT INTO notification_debug (checkpoint, redemption_id, notes)
  VALUES (
    'FUNCTION_ERROR',
    NEW.id,
    'ERROR: ' || SQLERRM
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Ensure trigger is attached
-- ============================================================================

DROP TRIGGER IF EXISTS reward_status_notification ON reward_redemptions;
CREATE TRIGGER reward_status_notification
  AFTER UPDATE ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_status_changed();

-- ============================================================================
-- STEP 4: Run test update
-- ============================================================================

DO $$
DECLARE
  v_test_redemption RECORD;
BEGIN
  -- Clear previous debug data
  DELETE FROM notification_debug;
  
  -- Find a recent approved redemption
  SELECT * INTO v_test_redemption
  FROM reward_redemptions
  WHERE status = 'approved'
    AND approved_at IS NOT NULL
  ORDER BY approved_at DESC
  LIMIT 1;
  
  IF v_test_redemption.id IS NOT NULL THEN
    RAISE NOTICE '🧪 Testing with redemption: %', v_test_redemption.id;
    RAISE NOTICE '   Status: %, User: %, Reward: %', 
      v_test_redemption.status, 
      v_test_redemption.user_id,
      v_test_redemption.reward_id;
    
    -- Force trigger by updating updated_at
    UPDATE reward_redemptions
    SET updated_at = NOW()
    WHERE id = v_test_redemption.id;
    
    RAISE NOTICE '✅ Test update executed';
  ELSE
    RAISE NOTICE '⚠️  No approved redemptions found';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Display results
-- ============================================================================

SELECT 
  '=== DEBUG TABLE: EXECUTION FLOW ===' as section;

SELECT 
  id,
  TO_CHAR(created_at, 'HH24:MI:SS.MS') as time,
  checkpoint,
  redemption_id,
  old_status,
  new_status,
  condition_met,
  reward_title,
  family_id,
  child_id,
  child_name,
  parent_id,
  notification_type,
  notes
FROM notification_debug
ORDER BY id;

SELECT 
  '=== NOTIFICATIONS CREATED IN LAST 5 MINUTES ===' as section;

SELECT 
  n.id,
  TO_CHAR(n.created_at, 'HH24:MI:SS.MS') as time,
  n.user_id,
  n.title,
  n.message,
  p.full_name as recipient_name,
  p.role as recipient_role
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY n.created_at DESC;

SELECT 
  '=== SUMMARY ===' as section;

SELECT 
  COUNT(*) FILTER (WHERE checkpoint = 'FUNCTION_ENTRY') as trigger_executions,
  COUNT(*) FILTER (WHERE checkpoint = 'CONDITION_CHECK' AND condition_met = true) as conditions_met,
  COUNT(*) FILTER (WHERE checkpoint = 'CONDITION_CHECK' AND condition_met = false) as conditions_not_met,
  COUNT(*) FILTER (WHERE checkpoint LIKE 'AFTER_INSERT%') as notifications_inserted,
  COUNT(*) FILTER (WHERE checkpoint = 'FUNCTION_ERROR') as errors
FROM notification_debug;

-- ============================================================================
-- ANALYSIS
-- ============================================================================

DO $$
DECLARE
  v_entry_count INTEGER;
  v_condition_met INTEGER;
  v_condition_not_met INTEGER;
  v_notifications_inserted INTEGER;
  v_actual_notifications INTEGER;
  v_errors INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE checkpoint = 'FUNCTION_ENTRY'),
    COUNT(*) FILTER (WHERE checkpoint = 'CONDITION_CHECK' AND condition_met = true),
    COUNT(*) FILTER (WHERE checkpoint = 'CONDITION_CHECK' AND condition_met = false),
    COUNT(*) FILTER (WHERE checkpoint LIKE 'AFTER_INSERT%'),
    COUNT(*) FILTER (WHERE checkpoint = 'FUNCTION_ERROR')
  INTO v_entry_count, v_condition_met, v_condition_not_met, v_notifications_inserted, v_errors
  FROM notification_debug;
  
  SELECT COUNT(*) INTO v_actual_notifications
  FROM notifications
  WHERE created_at > NOW() - INTERVAL '5 minutes';
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║              DEBUG ANALYSIS COMPLETE                           ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Trigger Execution:';
  RAISE NOTICE '  • Function entries: %', v_entry_count;
  RAISE NOTICE '  • Conditions met: %', v_condition_met;
  RAISE NOTICE '  • Conditions NOT met: %', v_condition_not_met;
  RAISE NOTICE '  • Errors: %', v_errors;
  RAISE NOTICE '';
  RAISE NOTICE '📬 Notifications:';
  RAISE NOTICE '  • Debug tracked insertions: %', v_notifications_inserted;
  RAISE NOTICE '  • Actual notifications in DB: %', v_actual_notifications;
  RAISE NOTICE '';
  
  IF v_entry_count = 0 THEN
    RAISE NOTICE '❌ TRIGGER DID NOT FIRE';
    RAISE NOTICE '   → Check that trigger exists and is enabled';
  ELSIF v_condition_not_met > 0 THEN
    RAISE NOTICE '❌ CONDITION NOT MET';
    RAISE NOTICE '   → Check debug table CONDITION_CHECK row for details';
    RAISE NOTICE '   → OLD.status and NEW.status may be the same';
  ELSIF v_errors > 0 THEN
    RAISE NOTICE '❌ FUNCTION ERROR OCCURRED';
    RAISE NOTICE '   → Check debug table FUNCTION_ERROR row for details';
  ELSIF v_notifications_inserted > 0 AND v_actual_notifications = 0 THEN
    RAISE NOTICE '❌ NOTIFICATIONS INSERTED BUT DISAPPEARED';
    RAISE NOTICE '   → Check for RLS policies blocking reads';
    RAISE NOTICE '   → Check for triggers on notifications that delete rows';
  ELSIF v_notifications_inserted > 0 AND v_actual_notifications > 0 THEN
    RAISE NOTICE '✅ SUCCESS! Notifications created and visible';
  ELSE
    RAISE NOTICE '⚠️  UNEXPECTED STATE - Review debug table above';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- After reviewing the debug output:
-- 1. If successful, run: DROP TABLE notification_debug CASCADE;
-- 2. Replace the function with the original (non-debug) version
-- 3. If unsuccessful, analyze the debug table rows to identify the issue
-- ============================================================================
