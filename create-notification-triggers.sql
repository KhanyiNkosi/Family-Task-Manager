-- Notification Trigger Functions
-- Run in Supabase SQL Editor after creating notifications table

-- ============================================================================
-- TASK COMPLETION TRIGGER
-- Notifies parent when child marks a task as completed
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id TEXT;
  v_child_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get task details
    v_task_title := NEW.title;
    v_points := NEW.points;
    v_family_id := NEW.family_id;
    
    -- Get child's name
    SELECT raw_user_meta_data->>'name' INTO v_child_name
    FROM auth.users
    WHERE id = NEW.assigned_to;
    
    -- Find parent in the family
    SELECT id INTO v_parent_id
    FROM auth.users
    WHERE raw_user_meta_data->>'family_code' = v_family_id
      AND raw_user_meta_data->>'role' = 'parent'
    LIMIT 1;
    
    -- Create notification for parent if found
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        v_parent_id,
        v_family_id,
        'Task Completed!',
        COALESCE(v_child_name, 'A child') || ' completed "' || v_task_title || '" and earned ' || v_points || ' points',
        'success',
        '/parent-dashboard',
        'Review Task'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task completion
DROP TRIGGER IF EXISTS task_completed_notification ON tasks;
CREATE TRIGGER task_completed_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

-- ============================================================================
-- TASK APPROVAL TRIGGER  
-- Notifies child when parent approves their task
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_task_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_points INTEGER;
  v_family_id TEXT;
BEGIN
  -- Only trigger when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    v_task_title := NEW.title;
    v_points := NEW.points;
    v_family_id := NEW.family_id;
    
    -- Notify the child
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        NEW.assigned_to,
        v_family_id,
        'Task Approved! 🎉',
        'Your task "' || v_task_title || '" has been approved! ' || v_points || ' points added to your account',
        'success',
        '/child-dashboard',
        'View Dashboard'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task approval
DROP TRIGGER IF EXISTS task_approved_notification ON tasks;
CREATE TRIGGER task_approved_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_approved();

-- ============================================================================
-- TASK ASSIGNMENT TRIGGER
-- Notifies child when a new task is assigned to them
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_points INTEGER;
  v_family_id TEXT;
BEGIN
  -- Only trigger on new task creation
  IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
    
    v_task_title := NEW.title;
    v_points := NEW.points;
    v_family_id := NEW.family_id;
    
    -- Notify the assigned child
    INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
    VALUES (
      NEW.assigned_to,
      v_family_id,
      'New Task Assigned',
      'You have been assigned "' || v_task_title || '" worth ' || v_points || ' points',
      'task',
      '/child-dashboard',
      'View Task'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task assignment
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
CREATE TRIGGER task_assigned_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- ============================================================================
-- HELP REQUEST TRIGGER
-- Notifies parent when child requests help on a task
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_help_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id TEXT;
  v_child_name TEXT;
  v_task_title TEXT;
  v_help_message TEXT;
BEGIN
  -- Only trigger when help_requested changes from false to true
  IF NEW.help_requested = TRUE AND (OLD.help_requested IS NULL OR OLD.help_requested = FALSE) THEN
    
    v_task_title := NEW.title;
    v_family_id := NEW.family_id;
    v_help_message := NEW.help_message;
    
    -- Get child's name
    SELECT raw_user_meta_data->>'name' INTO v_child_name
    FROM auth.users
    WHERE id = NEW.assigned_to;
    
    -- Find parent in the family
    SELECT id INTO v_parent_id
    FROM auth.users
    WHERE raw_user_meta_data->>'family_code' = v_family_id
      AND raw_user_meta_data->>'role' = 'parent'
    LIMIT 1;
    
    -- Create notification for parent
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        v_parent_id,
        v_family_id,
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for help requests
DROP TRIGGER IF EXISTS help_requested_notification ON tasks;
CREATE TRIGGER help_requested_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_help_requested();

-- ============================================================================
-- REWARD REQUEST TRIGGER (for reward_redemptions table)
-- Notifies parent when child requests a reward
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
  -- Only trigger on new reward redemption with 'pending' status
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    
    -- Get reward details
    SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
    FROM rewards
    WHERE id = NEW.reward_id;
    
    -- Get child's name
    SELECT raw_user_meta_data->>'name' INTO v_child_name
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Find parent in the family
    SELECT id INTO v_parent_id
    FROM auth.users
    WHERE raw_user_meta_data->>'family_code' = v_family_id
      AND raw_user_meta_data->>'role' = 'parent'
    LIMIT 1;
    
    -- Create notification for parent
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reward requests (if reward_redemptions table exists)
DROP TRIGGER IF EXISTS reward_requested_notification ON reward_redemptions;
CREATE TRIGGER reward_requested_notification
  AFTER INSERT ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_requested();

-- ============================================================================
-- REWARD APPROVAL/DENIAL TRIGGER
-- Notifies child when parent approves or denies their reward request
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_reward_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_reward_title TEXT;
  v_points INTEGER;
BEGIN
  -- Only trigger when status changes from 'pending' to 'approved' or 'denied'
  IF (OLD.status = 'pending' OR OLD.status = 'requested') AND NEW.status IN ('approved', 'denied') THEN
    
    -- Get reward details
    SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
    FROM rewards
    WHERE id = NEW.reward_id;
    
    -- Create notification for child
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reward status changes
DROP TRIGGER IF EXISTS reward_status_notification ON reward_redemptions;
CREATE TRIGGER reward_status_notification
  AFTER UPDATE ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_status_changed();

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Notification triggers created successfully!';
  RAISE NOTICE 'The following triggers are now active:';
  RAISE NOTICE '  - Task completion notifications';
  RAISE NOTICE '  - Task approval notifications';
  RAISE NOTICE '  - Task assignment notifications';
  RAISE NOTICE '  - Help request notifications';
  RAISE NOTICE '  - Reward request notifications';
  RAISE NOTICE '  - Reward approval/denial notifications';
END $$;
