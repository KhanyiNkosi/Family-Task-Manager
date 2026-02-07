-- ============================================================================
-- FIXED NOTIFICATION TRIGGER FUNCTIONS
-- Run in Supabase SQL Editor to fix notification issues
-- ============================================================================
-- These are updated to match your actual database structure using:
-- - completed (boolean) instead of status = 'completed'
-- - approved (boolean) instead of status = 'approved'
-- - full_name from profiles table (not name)
-- - role from user_profiles table (not profiles)

-- ============================================================================
-- TASK COMPLETION TRIGGER (FIXED)
-- Notifies parent when child marks a task as completed
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id UUID;
  v_child_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
BEGIN
  -- Only trigger when completed changes from false to true
  IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
    
    -- Get task details
    v_task_title := NEW.title;
    v_points := NEW.points;
    v_family_id := NEW.family_id;
    
    -- Get child's name from profiles table
    SELECT full_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.assigned_to;
    
    -- Find parent in the family from profiles and user_profiles tables
    SELECT p.id INTO v_parent_id
    FROM profiles p
    JOIN user_profiles up ON p.id = up.id
    WHERE p.family_id = v_family_id
      AND up.role = 'parent'
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
      
      RAISE NOTICE 'Notification created for parent % about task completion', v_parent_id;
    ELSE
      RAISE WARNING 'No parent found for family %', v_family_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TASK APPROVAL TRIGGER (FIXED)
-- Notifies child when parent approves their task
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_task_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_points INTEGER;
  v_family_id UUID;
BEGIN
  -- Only trigger when approved changes from false to true
  IF NEW.approved = TRUE AND (OLD.approved IS NULL OR OLD.approved = FALSE) THEN
    
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
      
      RAISE NOTICE 'Notification created for child % about task approval', NEW.assigned_to;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TASK ASSIGNMENT TRIGGER (NO CHANGES NEEDED)
-- Notifies child when a new task is assigned to them
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_points INTEGER;
  v_family_id UUID;
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
    
    RAISE NOTICE 'Notification created for child % about new task', NEW.assigned_to;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELP REQUEST TRIGGER (FIXED)
-- Notifies parent when child requests help on a task
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_help_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id UUID;
  v_child_name TEXT;
  v_task_title TEXT;
  v_help_message TEXT;
BEGIN
  -- Only trigger when help_requested changes from false to true
  IF NEW.help_requested = TRUE AND (OLD.help_requested IS NULL OR OLD.help_requested = FALSE) THEN
    
    v_task_title := NEW.title;
    v_family_id := NEW.family_id;
    v_help_message := NEW.help_message;
    
    -- Get child's name from profiles table
    SELECT full_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.assigned_to;
    
    -- Find parent in the family from profiles and user_profiles tables
    SELECT p.id INTO v_parent_id
    FROM profiles p
    JOIN user_profiles up ON p.id = up.id
    WHERE p.family_id = v_family_id
      AND up.role = 'parent'
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
      
      RAISE NOTICE 'Notification created for parent % about help request', v_parent_id;
    ELSE
      RAISE WARNING 'No parent found for family %', v_family_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DROP AND RECREATE ALL TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS task_completed_notification ON tasks;
DROP TRIGGER IF EXISTS task_approved_notification ON tasks;
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
DROP TRIGGER IF EXISTS help_requested_notification ON tasks;

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
-- VERIFY TRIGGERS CREATED
-- ============================================================================
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'tasks'::regclass
ORDER BY tgname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ NOTIFICATION TRIGGERS FIXED AND RECREATED!';
  RAISE NOTICE '';
  RAISE NOTICE 'All 4 triggers have been updated to use the correct columns:';
  RAISE NOTICE '  • task_completed_notification (uses completed boolean)';
  RAISE NOTICE '  • task_approved_notification (uses approved boolean)';
  RAISE NOTICE '  • task_assigned_notification (for new tasks)';
  RAISE NOTICE '  • help_requested_notification (uses help_requested boolean)';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed to use:';
  RAISE NOTICE '  • profiles.full_name (not name)';
  RAISE NOTICE '  • user_profiles.role (not profiles.role)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST IT:';
  RAISE NOTICE '   1. Complete a task in the app (child marks it done)';
  RAISE NOTICE '   2. Check notifications table for parent notification';
  RAISE NOTICE '   3. Approve the task (parent approves it)';
  RAISE NOTICE '   4. Check notifications table for child notification';
  RAISE NOTICE '';
END $$;
