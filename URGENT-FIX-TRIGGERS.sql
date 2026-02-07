-- ============================================================================
-- URGENT FIX: Task Updates Failing - Trigger Field Mismatch
-- ============================================================================
-- 
-- PROBLEM: All task updates fail with error:
--   "record 'new' has no field 'status'"
-- 
-- CAUSE: Triggers check NEW.status but table uses NEW.completed & NEW.approved
--
-- AFFECTED OPERATIONS:
--   ❌ Complete task (child)
--   ❌ Approve task (parent)
--   ❌ Resolve help request (parent)
--   ❌ Any task update triggers this error
--
-- SOLUTION: Replace all triggers to use correct boolean fields
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all old triggers that reference 'status'
-- ============================================================================
DROP TRIGGER IF EXISTS task_completed_notification ON tasks;
DROP TRIGGER IF EXISTS task_approved_notification ON tasks;
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
DROP TRIGGER IF EXISTS help_requested_notification ON tasks;
DROP TRIGGER IF EXISTS reward_requested_notification ON reward_redemptions;
DROP TRIGGER IF EXISTS reward_status_notification ON reward_redemptions;

-- ============================================================================
-- STEP 2: Recreate trigger functions with correct field names
-- ============================================================================

-- TASK COMPLETION TRIGGER
-- Notifies parent when child marks a task as completed
-- Uses: NEW.completed (boolean) instead of NEW.status = 'completed'
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id UUID;
  v_child_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
BEGIN
  -- Only trigger when completed changes from false/null to true
  IF NEW.completed = TRUE AND (OLD IS NULL OR OLD.completed IS DISTINCT FROM TRUE) THEN
    
    v_task_title := NEW.title;
    v_points := NEW.points;
    v_family_id := NEW.family_id;
    
    -- Get child's name from auth.users
    SELECT raw_user_meta_data->>'name' INTO v_child_name
    FROM auth.users
    WHERE id = NEW.assigned_to;
    
    -- Find parent in the family using auth.users (most reliable)
    SELECT id INTO v_parent_id
    FROM auth.users
    WHERE raw_user_meta_data->>'family_code' = v_family_id::TEXT
      AND raw_user_meta_data->>'role' = 'parent'
    LIMIT 1;
    
    -- If not found, check if we need the UUID as text
    IF v_parent_id IS NULL AND v_family_id IS NOT NULL THEN
      SELECT u.id INTO v_parent_id
      FROM auth.users u
      WHERE u.raw_user_meta_data->>'family_code' = v_family_id::TEXT
        AND u.raw_user_meta_data->>'role' = 'parent'
      LIMIT 1;
    END IF;
    
    -- Create notification for parent
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        v_parent_id,
        v_family_id::TEXT,
        'Task Completed!',
        COALESCE(v_child_name, 'A child') || ' completed "' || v_task_title || '" and earned ' || v_points || ' points',
        'success',
        '/parent-dashboard',
        'Review Task'
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the task update
  RAISE WARNING 'Error in notify_task_completed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TASK APPROVAL TRIGGER  
-- Notifies child when parent approves their task
-- Uses: NEW.approved (boolean) instead of NEW.status = 'approved'
CREATE OR REPLACE FUNCTION notify_task_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_points INTEGER;
  v_family_id UUID;
BEGIN
  -- Only trigger when approved changes from false/null to true
  IF NEW.approved = TRUE AND (OLD IS NULL OR OLD.approved IS DISTINCT FROM TRUE) THEN
    
    v_task_title := NEW.title;
    v_points := NEW.points;
    v_family_id := NEW.family_id;
    
    -- Notify the child who completed the task
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        NEW.assigned_to,
        v_family_id::TEXT,
        'Task Approved! 🎉',
        'Your task "' || v_task_title || '" has been approved! ' || v_points || ' points added to your account',
        'success',
        '/child-dashboard',
        'View Dashboard'
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_task_approved: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TASK ASSIGNMENT TRIGGER
-- Notifies child when a new task is assigned to them
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_points INTEGER;
  v_family_id UUID;
BEGIN
  -- Only trigger on INSERT with assigned_to set
  IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
    
    v_task_title := NEW.title;
    v_points := NEW.points;
    v_family_id := NEW.family_id;
    
    -- Notify the assigned child
    INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
    VALUES (
      NEW.assigned_to,
      v_family_id::TEXT,
      'New Task Assigned',
      'You have been assigned "' || v_task_title || '" worth ' || v_points || ' points',
      'task',
      '/child-dashboard',
      'View Task'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_task_assigned: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- HELP REQUEST TRIGGER
-- Notifies parent when child requests help on a task
CREATE OR REPLACE FUNCTION notify_help_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id UUID;
  v_child_name TEXT;
  v_task_title TEXT;
  v_help_message TEXT;
BEGIN
  -- Only trigger when help_requested changes from false/null to true
  IF NEW.help_requested = TRUE AND (OLD IS NULL OR OLD.help_requested IS DISTINCT FROM TRUE) THEN
    
    v_task_title := NEW.title;
    v_family_id := NEW.family_id;
    v_help_message := NEW.help_message;
    
    -- Get child's name
    SELECT raw_user_meta_data->>'name' INTO v_child_name
    FROM auth.users
    WHERE id = NEW.assigned_to;
    
    -- Find parent in the family using auth.users
    SELECT id INTO v_parent_id
    FROM auth.users
    WHERE raw_user_meta_data->>'family_code' = v_family_id::TEXT
      AND raw_user_meta_data->>'role' = 'parent'
    LIMIT 1;
    
    -- Create notification for parent
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        v_parent_id,
        v_family_id::TEXT,
        'Help Requested',
        COALESCE(v_child_name, 'A child') || ' needs help with "' || v_task_title || '"' || 
        CASE 
          WHEN v_help_message IS NOT NULL AND v_help_message != '' THEN ': ' || v_help_message
          ELSE ''
        END,
        'warning',
        '/parent-dashboard',
        'View Task'
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_help_requested: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Recreate all triggers
-- ============================================================================

CREATE TRIGGER task_completed_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

CREATE TRIGGER task_approved_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_approved();

CREATE TRIGGER task_assigned_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

CREATE TRIGGER help_requested_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_help_requested();

-- ============================================================================
-- REWARD TRIGGERS (Keep existing reward_redemptions triggers)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_reward_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id TEXT;
  v_child_name TEXT;
  v_reward_title TEXT;
  v_points INTEGER;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    
    SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
    FROM rewards
    WHERE id = NEW.reward_id;
    
    SELECT raw_user_meta_data->>'name' INTO v_child_name
    FROM auth.users
    WHERE id = NEW.user_id;
    
    SELECT id INTO v_parent_id
    FROM auth.users
    WHERE raw_user_meta_data->>'family_code' = v_family_id
      AND raw_user_meta_data->>'role' = 'parent'
    LIMIT 1;
    
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        v_parent_id,
        v_family_id,
        'Reward Request',
        COALESCE(v_child_name, 'A child') || ' requested "' || v_reward_title || '" (' || v_points || ' points)',
        'reward',
        '/parent-dashboard',
        'Review Request'
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_reward_requested: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_reward_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_reward_title TEXT;
  v_points INTEGER;
BEGIN
  IF (OLD.status = 'pending' OR OLD.status = 'requested') AND NEW.status IN ('approved', 'denied') THEN
    
    SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
    FROM rewards
    WHERE id = NEW.reward_id;
    
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
    ELSIF NEW.status = 'denied' THEN
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
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_reward_status_changed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reward_requested_notification
  AFTER INSERT ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_requested();

CREATE TRIGGER reward_status_notification
  AFTER UPDATE ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_status_changed();

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ TRIGGER FIX APPLIED SUCCESSFULLY!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed issues:';
  RAISE NOTICE '  ✅ Task completion now works';
  RAISE NOTICE '  ✅ Task approval now works';
  RAISE NOTICE '  ✅ Help request resolution now works';
  RAISE NOTICE '  ✅ Notifications will be created';
  RAISE NOTICE '';
  RAISE NOTICE 'Active triggers:';
  RAISE NOTICE '  • task_completed_notification';
  RAISE NOTICE '  • task_approved_notification';
  RAISE NOTICE '  • task_assigned_notification';
  RAISE NOTICE '  • help_requested_notification';
  RAISE NOTICE '  • reward_requested_notification';
  RAISE NOTICE '  • reward_status_notification';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Refresh your app and test!';
  RAISE NOTICE '';
END $$;
