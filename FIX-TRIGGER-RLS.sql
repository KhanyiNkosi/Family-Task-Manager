-- ============================================================================
-- FIX: Trigger Cannot Insert Notifications (RLS/Permission Issue)
-- ============================================================================
-- 
-- PROBLEM: Triggers are installed but notifications aren't being created
-- CAUSE: Even with SECURITY DEFINER, triggers may not have permission to:
--   1. INSERT into notifications table (blocked by RLS)
--   2. Access auth.users table directly
--
-- SOLUTION: Create a secure helper function that bypasses RLS for notifications
-- ============================================================================

-- ============================================================================
-- STEP 1: Create secure notification insert helper
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_family_id TEXT,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_text TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    family_id,
    title,
    message,
    type,
    action_url,
    action_text
  ) VALUES (
    p_user_id,
    p_family_id,
    p_title,
    p_message,
    p_type,
    p_action_url,
    p_action_text
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Grant execute to authenticated users (needed for triggers)
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO service_role;

-- ============================================================================
-- STEP 2: Update trigger functions to use helper
-- ============================================================================

-- TASK COMPLETION TRIGGER (Updated)
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id UUID;
  v_child_name TEXT;
BEGIN
  -- Only trigger when completed changes from false/null to true
  IF NEW.completed = TRUE AND (OLD IS NULL OR OLD.completed IS DISTINCT FROM TRUE) THEN
    
    v_family_id := NEW.family_id;
    
    -- Get child's name from auth.users
    SELECT raw_user_meta_data->>'name' INTO v_child_name
    FROM auth.users
    WHERE id = NEW.assigned_to;
    
    -- Find parent in the family
    SELECT id INTO v_parent_id
    FROM auth.users
    WHERE raw_user_meta_data->>'family_code' = v_family_id::TEXT
      AND raw_user_meta_data->>'role' = 'parent'
    LIMIT 1;
    
    -- Create notification using helper function
    IF v_parent_id IS NOT NULL THEN
      PERFORM create_notification(
        v_parent_id,
        v_family_id::TEXT,
        'Task Completed!',
        COALESCE(v_child_name, 'A child') || ' completed "' || NEW.title || '" and earned ' || NEW.points || ' points',
        'success',
        '/parent-dashboard',
        'Review Task'
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_task_completed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- TASK APPROVAL TRIGGER (Updated)
CREATE OR REPLACE FUNCTION notify_task_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when approved changes from false/null to true
  IF NEW.approved = TRUE AND (OLD IS NULL OR OLD.approved IS DISTINCT FROM TRUE) THEN
    
    -- Notify the child using helper function
    IF NEW.assigned_to IS NOT NULL THEN
      PERFORM create_notification(
        NEW.assigned_to,
        NEW.family_id::TEXT,
        'Task Approved! 🎉',
        'Your task "' || NEW.title || '" has been approved! ' || NEW.points || ' points added to your account',
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- TASK ASSIGNMENT TRIGGER (Updated)
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on INSERT with assigned_to set
  IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
    
    PERFORM create_notification(
      NEW.assigned_to,
      NEW.family_id::TEXT,
      'New Task Assigned',
      'You have been assigned "' || NEW.title || '" worth ' || NEW.points || ' points',
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- HELP REQUEST TRIGGER (Updated)
CREATE OR REPLACE FUNCTION notify_help_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_child_name TEXT;
BEGIN
  -- Only trigger when help_requested changes from false/null to true
  IF NEW.help_requested = TRUE AND (OLD IS NULL OR OLD.help_requested IS DISTINCT FROM TRUE) THEN
    
    -- Get child's name
    SELECT raw_user_meta_data->>'name' INTO v_child_name
    FROM auth.users
    WHERE id = NEW.assigned_to;
    
    -- Find parent in the family
    SELECT id INTO v_parent_id
    FROM auth.users
    WHERE raw_user_meta_data->>'family_code' = NEW.family_id::TEXT
      AND raw_user_meta_data->>'role' = 'parent'
    LIMIT 1;
    
    -- Create notification using helper
    IF v_parent_id IS NOT NULL THEN
      PERFORM create_notification(
        v_parent_id,
        NEW.family_id::TEXT,
        'Help Requested',
        COALESCE(v_child_name, 'A child') || ' needs help with "' || NEW.title || '"' ||
        CASE 
          WHEN NEW.help_message IS NOT NULL AND NEW.help_message != '' THEN ': ' || NEW.help_message
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- REWARD REQUEST TRIGGER (Updated)
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
      PERFORM create_notification(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- REWARD STATUS CHANGE TRIGGER (Updated)
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
      PERFORM create_notification(
        NEW.user_id,
        v_family_id,
        'Reward Approved! 🎁',
        'Your reward "' || v_reward_title || '" has been approved! Enjoy!',
        'success',
        '/child-dashboard',
        'View Rewards'
      );
    ELSIF NEW.status = 'denied' THEN
      PERFORM create_notification(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ NOTIFICATION HELPER FIX APPLIED!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  ✅ Created create_notification helper function';
  RAISE NOTICE '  ✅ Updated all 6 trigger functions to use helper';
  RAISE NOTICE '  ✅ Added SET search_path = public for security';
  RAISE NOTICE '';
  RAISE NOTICE 'This fix ensures triggers can bypass RLS and create notifications.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test task completion and approval in your app!';
  RAISE NOTICE '';
END $$;
